/**
 * HU012: Registro de arrastre y recepción de evidencias de Grúas
 * Archivo: /api/gruasController.js
 *
 * Contexto:
 * - Este endpoint lo consume la App del operador de grúa.
 * - Recibe datos estructurados del arrastre + checklist + evidencias fotográficas.
 * - Guarda evidencias como BLOB en BD
 *
 * Importante (acuerdo de equipo):
 * - No emitir 400 aquí; el motor de Next.js v8/middleware se encarga de validación HTTP.
 * - Aquí lanzamos errores y hacemos rollback para mantener consistencia.
 */

import { v4 as uuidv4 } from "uuid";
import db from "../config/database.js";
import { notificarSCC } from "../services/srv32.js"; // SRV3.2

import { validarChecklistHU012 } from "../validators/checklistValidator.js";
import { procesarImagenParaEvidencia } from "../services/imageService.js";

import {
  insertarRegistroArrastre,
  vincularArrastreEnInfraccion,
} from "../repositories/arrastreRepository.js";

import {
  insertarEvidenciaBlob,
  insertarAsociacionEvidenciaArrastre,
  insertarEvidenciaArrastre,
} from "../repositories/evidenciaRepository.js";

export const registrarArrastre = async (req, res) => {
  // Iniciamos transacción para asegurar consistencia:
  // - registroArrastre + vínculos + evidencias BLOB y relaciones
  const transaction = await db.startTransaction();

  try {
    // -----------------------------
    // 1) Datos entrantes (estructurados)
    // -----------------------------
    const {
      idInfraccion,
      idUbicacionOrigen,
      idUbicacionDestino,
      idOperadorGrua,
      checklist,
    } = req.body;

    // -----------------------------
    // 2) Evidencias (no estructurado)
    // -----------------------------
    // Asumimos req.files viene de multer (o equivalente)
    // y que Next.js v8/middleware ya validó:
    // - mínimo 1 foto
    // - límites de tamaño/cantidad
    const archivosEvidencia = req.files || [];

    // ID principal del evento arrastre
    const idNuevoRegistroArrastre = uuidv4();

    // -----------------------------
    // 3) Validaciones de integridad (backend)
    // -----------------------------
    // Nota: Aunque upstream valida HTTP, aquí validamos integridad de datos críticos.
    if (!idInfraccion) {
      throw new Error("idInfraccion es requerido para mantener la trazabilidad.");
    }
    if (!idUbicacionOrigen || !idUbicacionDestino) {
      throw new Error("Ubicación origen y destino son requeridas.");
    }
    if (!idOperadorGrua) {
      throw new Error("idOperadorGrua es requerido para vincular evidencias al operador.");
    }

    // Checklist obligatorio HU012
    validarChecklistHU012(checklist);

    // Evidencia mínima (documentada). Si el middleware NO lo garantiza, esto lo protege.
    // OJO: si tu compa insiste que esto va afuera, puedes comentar este bloque y dejarlo como warning.
    if (archivosEvidencia.length < 1) {
      throw new Error("Se requiere al menos 1 foto de evidencia para registrar el arrastre (HU012).");
    }

    // -----------------------------
    // 4) Insert: registroArrastre
    // -----------------------------
    await insertarRegistroArrastre({
      db,
      transaction,
      idRegistroArrastre: idNuevoRegistroArrastre,
      idUbicacionOrigen,
      idUbicacionDestino,
      checklistJson: JSON.stringify(checklist),
    });

    // -----------------------------
    // 5) Vincular con infracción original (infracciones.registroGrua)
    // -----------------------------
    await vincularArrastreEnInfraccion({
      db,
      transaction,
      idInfraccion,
      idRegistroArrastre: idNuevoRegistroArrastre,
    });

    // -----------------------------
    // 6) Guardado de evidencias (BLOB) + relaciones
    // -----------------------------
    // Tablas:
    // - evidencia(evidenciaId, imagen)
    // - asociacionEvidenciaArrastre(idEvidenciaArrastre, idRegistroArrastre)
    // - evidenciaArrastre(idEvidenciaArrastre, idEvidencia, personalGrua)

    for (const file of archivosEvidencia) {
      const evidenciaId = uuidv4();
      const idEvidenciaArrastre = uuidv4(); // ID de relación

      // 6.1 Procesamiento/optimización de la imagen (SOLID: service)
      // - normaliza a jpeg
      // - reduce peso, mantiene calidad razonable
      const bufferOptimizado = await procesarImagenParaEvidencia(file.buffer, file.mimetype);

      // 6.2 Guardar BLOB
      await insertarEvidenciaBlob({
        db,
        transaction,
        evidenciaId,
        imagenBlob: bufferOptimizado,
      });

      // 6.3 Relación arrastre ↔ evidenciaArrastre (ID de relación ↔ registroArrastre)
      await insertarAsociacionEvidenciaArrastre({
        db,
        transaction,
        idEvidenciaArrastre,
        idRegistroArrastre: idNuevoRegistroArrastre,
      });

      // 6.4 Relación evidenciaArrastre ↔ evidencia + operador
      await insertarEvidenciaArrastre({
        db,
        transaction,
        idEvidenciaArrastre,
        idEvidencia: evidenciaId,
        personalGrua: idOperadorGrua,
      });
    }

    // -----------------------------
    // 7) Notificación al SCC (SRV3.2)
    // -----------------------------
    // Criterio: actualizar estatus a “En traslado/Entrada a depósito”.
    // Decisión actual: Si falla la notificación, hacemos rollback.
    // (Nota: en sistemas reales, esto podría ser async con reintentos/cola.)
    await notificarSCC({
      accion: "ACTUALIZAR_ESTATUS",
      nuevoEstado: "EN_TRASLADO",
      referencia: idInfraccion,
    });

    // -----------------------------
    // 8) Commit
    // -----------------------------
    await transaction.commit();

    res.status(201).json({
      ok: true,
      message: "Registro de arrastre completado con éxito.",
      data: { idRegistroArrastre: idNuevoRegistroArrastre },
    });
  } catch (error) {
    // Rollback por consistencia
    if (transaction) await transaction.rollback();

    console.error("Error en registrarArrastre (HU012):", error);

    // Nota: status codes “finos” (400, 422) se delegan al motor/middleware.
    // Aquí devolvemos 500 genérico para que no se considere que el controlador
    // está tomando responsabilidad de validación HTTP.
    res.status(500).json({
      ok: false,
      message: error?.message || "Error inesperado en registro de arrastre.",
    });
  }
};
    