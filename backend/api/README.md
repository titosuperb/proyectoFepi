##  README – HU012
Registro de arrastre y recepción de evidencias de Grúas 
### 1. Descripción general

Esta historia de usuario cubre el registro del arrastre de un vehículo por parte de una grúa, incluyendo:

Captura del estado inicial del vehículo mediante un checklist obligatorio

Recepción y almacenamiento de evidencias fotográficas del traslado

Asociación de dichas evidencias con la infracción original

Notificación al sistema central (SCC) para actualizar el estatus de la infracción

El objetivo principal es asegurar la trazabilidad del proceso de arrastre, permitiendo auditoría posterior y respaldo visual del estado del vehículo.

### 2. Alcance de esta implementación
Incluye

Recepción de datos estructurados (IDs, checklist)

Recepción de datos no estructurados (imágenes)

Procesamiento básico de imágenes para optimización

Persistencia en base de datos (BLOB)

Asociación entre arrastre, infracción, evidencias y operador de grúa

### No incluye

Validaciones de entrada a nivel HTTP (handled by Next.js v8)

Construcción del formulario de checklist (frontend)

Autenticación/autorización avanzada

Reintentos o colas asíncronas de notificaciones

### 3. Responsabilidades por capa
Backend (este módulo)

Almacenar evidencias fotográficas (BLOB)

Asociar evidencias con el registro de arrastre

Validar estructura del checklist (no UI)

Procesar imágenes para reducir tamaño sin pérdida significativa

Mantener consistencia mediante transacciones

Frontend / Middleware

Validar que exista al menos una imagen

Construir y enviar el checklist conforme al contrato

Mostrar mensajes de error al usuario

Enviar solicitud como multipart/form-data

### 4. Contrato del endpoint (API Contract)
Endpoint
POST /api/gruas/arrastre

Content-Type
multipart/form-data

Campos estructurados (body)
Campo	Tipo	Obligatorio	Descripción
idInfraccion	uuid	Sí	Identificador de la infracción original
idUbicacionOrigen	uuid	Sí	Ubicación donde inicia el arrastre
idUbicacionDestino	uuid	Sí	Destino del vehículo
idOperadorGrua	uuid	Sí	Operador que realiza el arrastre
checklist	JSON	Sí	Estado inicial del vehículo
Archivos (no estructurados)
Campo	Tipo	Obligatorio
imagenes[]	image/*	Sí (mínimo 1)
### 5. Checklist del estado del vehículo (documentado)

El checklist es obligatorio y debe enviarse como un objeto JSON con la siguiente estructura:

{
  "cristales": {
    "estado": "OK | DAÑADO | ROTO",
    "notas": "opcional"
  },
  "carroceria": {
    "estado": "OK | GOLPES | RAYONES | DAÑO_SEVERO",
    "notas": "opcional"
  },
  "luces": {
    "estado": "OK | FALTANTE | DAÑADA",
    "notas": "opcional"
  },
  "objetosVisibles": {
    "estado": "SIN_OBJETOS | CON_OBJETOS",
    "descripcion": "opcional"
  },
  "observacionesGenerales": "opcional"
}


📌 Nota para frontend:
Este esquema debe reflejarse en el formulario para garantizar consistencia entre UI, backend y auditoría.

### 6. Evidencias fotográficas (datos no estructurados)
Reglas del sistema (documentadas)

Mínimo: 1 imagen obligatoria

Máximo: 10 imágenes

Tamaño máximo por imagen: 5 MB

Tipos permitidos:

image/jpeg

image/png

image/webp (opcional)

📌 La validación de estas reglas se realiza antes de llegar al controlador.

### 7. Procesamiento de imágenes (decisión técnica)

Antes de almacenarse en base de datos, cada imagen sigue el siguiente flujo lógico:

Recepción del archivo

Validación de tipo MIME

Redimensionado (lado mayor máximo: 1280 px)

Compresión controlada (calidad ~70–80%)

Normalización a formato JPEG

Conversión a buffer

Persistencia como BLOB

Justificación:

Reduce peso en base de datos

Mejora rendimiento

Mantiene calidad suficiente para evidencia visual

Facilita auditoría y visualización posterior

### 8. Flujo general del proceso

Operador de grúa captura checklist y evidencias

Frontend valida inputs y envía la solicitud

Backend inicia transacción

Se registra el arrastre

Se procesan y almacenan las evidencias

Se asocian evidencias ↔ arrastre ↔ operador

Se vincula el arrastre con la infracción

Se notifica al SCC para actualizar estatus

Se confirma la transacción

### 9. Manejo de errores
Tipo de error	Acción
Error de entrada	Gestionado por frontend / middleware
Error al guardar evidencia	Rollback total
Error de BD	Rollback total
Error al notificar SCC	Rollback (documentado)
### 10. Pendientes / decisiones fuera de alcance

Implementación de autenticación real (token/session)

Definición del motor de base de datos

Manejo asíncrono de notificaciones

Visualización de evidencias