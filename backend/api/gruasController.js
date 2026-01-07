/**
 * HU012: Registro de arrastre y recepción de evidencias de Grúas
 * Archivo: /api/gruasController.js
 * * Contexto: 
 * Este endpoint es consumido por la App unicamente.
 * Recibe los datos del arrastre y las fotos tomadas por el operador.
 * * Dependencias:
 * - Base de datos (con soporte de transacciones).
 * - Librería 'uuid' para generar IDs.
 */

import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js'; 
import { notificarSCC } from '../services/srv32.js'; // Servicio SRV3.2
const S3_BUCKET = process.env.AWS_S3_BUCKET || 'gruas-evidencia';

export const registrarArrastre = async (req, res) => {
    // Iniciamos transacción para asegurar ACID (especialmente por los BLOBs y la consistencia de datos)
    const transaction = await db.startTransaction();

    try {
        const { 
            idInfraccion, 
            idUbicacionOrigen, 
            idUbicacionDestino,
            idOperadorGrua, 
            checklist,
            // AGREGADO: Recibimos el estatus desde la app.
            // Si no viene, asumimos "EN_TRASLADO" por defecto.
            estatusOperativo = "EN_TRASLADO" 
        } = req.body;

        const archivosEvidencia = req.files || []; 

        // Generamos el ID principal de este evento
        const idNuevoRegistroArrastre = uuidv4();

        // 1. Validar vinculación
        if (!idInfraccion) {
            throw new Error("Es necesario el idInfraccion para mantener la trazabilidad del vehículo.");
        }

        /**
         * Basado en el CSV:
         * - idRegistroArrastre (uuid) -> idNuevoRegistroArrastre
         * - fechaArrastre (datetime) -> new Date()
         * - ubicacion (uuid) -> idUbicacionOrigen
         * - destino (uuid) -> idUbicacionDestino
         * * IMPORTANTE: Si la tabla 'registroArrastre' no tiene columna para guardar el JSON del checklist,
         * discutir con DB Admin si se agrega columna 'detallesVehiculo' o se usa tabla auxiliar.
         * Por ahora, asumiremos que se inserta aquí.
         */
        await db.query(
            `INSERT INTO registroArrastre (idRegistroArrastre, fechaArrastre, ubicacion, destino, detallesVehiculo) 
             VALUES ($1, NOW(), $2, $3, $4)`,
            [idNuevoRegistroArrastre, idUbicacionOrigen, idUbicacionDestino, JSON.stringify(checklist)],
            { transaction }
        );

        await db.query(
            `UPDATE infracciones SET registroGrua = $1 WHERE idInfraccion = $2`,
            [idNuevoRegistroArrastre, idInfraccion],
            { transaction }
        );

        /**
         * Criterio: "Enviar notificación al SCC para actualizar estatus a 'En traslado/Entrada a depósito'"
        /**
         * CORRECCIÓN: Notificación dinámica
         * Ahora el 'nuevoEstado' depende de la variable 'estatusOperativo'
         * que viene de la transacción específica en la App.
         */
        
        // Mapeo de seguridad para evitar estatus inválidos
        const estatusValidos = ["EN_TRASLADO", "ENTRADA_DEPOSITO"];
        const estadoFinal = estatusValidos.includes(estatusOperativo) 
                            ? estatusOperativo 
                            : "EN_TRASLADO";

        await notificarSCC({
            accion: "ACTUALIZAR_ESTATUS",
            nuevoEstado: estadoFinal, 
            referencia: idInfraccion,
            // Opcional: pasar el ID del arrastre para que el SCC sepa cuál es
            idRegistroArrastre: idNuevoRegistroArrastre 
        });

        // =================================================================================
        // ÁREA DE TRABAJO: (Manejo de Evidencias y Validación de Inputs)
        // =================================================================================

        /**
         * TODO [fer]: Validar Checklist Manual (Nota 1)
         * Criterio: "Checklist obligatorio: cristales, carrocería, luces y objetos visibles".
         * - Asegurar que el JSON 'checklist' no sea nulo y tenga estas llaves.
         * - Si falta algo, lanzar throw new Error("Checklist incompleto").
         */
        validarEstructuraChecklist(checklist); 

        /**
         * TODO [fer]: Guardar Evidencias (BLOBs)
         * Iterar sobre 'archivosEvidencia'. Para cada archivo:
         * 1. Generar 'evidenciaId'.
         * 2. Insertar en tabla 'evidencia' (campo 'imagen' es largeBlob según CSV).
         * 3. Insertar relación en 'asociacionEvidenciaArrastre' vinculando 'idEvidenciaArrastre' con 'idRegistroArrastre'.
         * 4. Insertar relación 'evidenciaArrastre' si se requiere vincular al personal (idOperadorGrua).
         */
        if (archivosEvidencia.length === 0) {
            console.warn("Advertencia: Se está registrando un arrastre sin fotos de evidencia.");
        }

        for (const file of archivosEvidencia) {
            const idEvidencia = uuidv4();
            const idRelacion = uuidv4();

            // Subir imagen a Amazon S3
            const s3Key = `gruas/${idNuevoRegistroArrastre}/${idEvidencia}.${obtenerExtension(file.mimetype)}`;
            const urlS3 = await subirAS3(file.buffer, s3Key, file.mimetype);

            // Insertar referencia a la imagen en S3 (no el BLOB)
            await db.query(
                `INSERT INTO evidencia (evidenciaId, urlImagen) VALUES ($1, $2)`,
                [idEvidencia, urlS3], 
                { transaction }
            );

            // Relacionar con el arrastre
            await db.query(
                `INSERT INTO asociacionEvidenciaArrastre (idEvidenciaArrastre, idRegistroArrastre) VALUES ($1, $2)`,
                [idRelacion, idNuevoRegistroArrastre],
                { transaction }
            );
            
            // Relacionar evidencia con la tabla 'evidenciaArrastre' para vincular la evidencia real con la relacion
            await db.query(
                `INSERT INTO evidenciaArrastre (idEvidenciaArrastre, idEvidencia, personalGrua) VALUES ($1, $2, $3)`,
                [idRelacion, idEvidencia, idOperadorGrua],
                { transaction }
            );
        }

        // =================================================================================
        // FINALIZACIÓN
        // =================================================================================
        
        await transaction.commit();

        res.status(201).json({
            ok: true,
            message: "Registro de arrastre completado con éxito.",
            data: { idRegistroArrastre: idNuevoRegistroArrastre }
        });

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error("Error en registro de arrastre:", error);
        res.status(500).json({ ok: false, message: error.message });
    }
};

// TODO [fer]: Validar estructura del checklist
function validarEstructuraChecklist(checklist) {
    if (!checklist) throw new Error("El checklist es obligatorio.");
    
    // Validación simple de campos requeridos por HU
    const camposRequeridos = ["estadoCristales", "estadoCarroceria", "estadoLuces", "objetosVisibles"];
    const llaves = Object.keys(checklist);
    
    const faltantes = camposRequeridos.filter(campo => !llaves.includes(campo));
    
    if (faltantes.length > 0) {
        throw new Error(`Faltan campos obligatorios en el checklist: ${faltantes.join(", ")}`);
    }
}

