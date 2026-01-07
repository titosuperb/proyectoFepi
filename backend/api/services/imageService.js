/**
 * Servicio de procesamiento de imágenes.
 * Responsabilidad única: convertir/optimizar imágenes antes de guardarlas en BD.
 *
 * Estrategia (documentada):
 * - Validar MIME permitido
 * - Redimensionar (lado mayor <= 1280 px)
 * - Normalizar a JPEG
 * - Calidad 75-80 (equilibrio peso/calidad)
 */

import sharp from "sharp";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIDE_PX = 1280;
const JPEG_QUALITY = 80;

/**
 * Procesa una imagen y regresa Buffer optimizado para guardar como BLOB.
 * @param {Buffer} inputBuffer - archivo original
 * @param {string} mimeType - mimetype del archivo (req.file.mimetype)
 * @returns {Promise<Buffer>} buffer optimizado (jpeg)
 * @throws {Error} si el mime no es permitido o falla el procesamiento
 */
export async function procesarImagenParaEvidencia(inputBuffer, mimeType) {
  if (!inputBuffer || !Buffer.isBuffer(inputBuffer)) {
    throw new Error("Imagen inválida: buffer faltante.");
  }
  if (!ALLOWED_MIME.has(mimeType)) {
    throw new Error(
      `Tipo de imagen no permitido: ${mimeType}. Permitidos: ${[...ALLOWED_MIME].join(", ")}`
    );
  }

  // sharp detecta formato por contenido; convertimos a jpeg por consistencia/peso.
  // resize: fit "inside" para no deformar; withoutEnlargement evita agrandar.
  const out = await sharp(inputBuffer)
    .rotate() // respeta orientación EXIF (fotos de celular)
    .resize({
      width: MAX_SIDE_PX,
      height: MAX_SIDE_PX,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer();

  return out;
}

/**
 * Regla de límites (documentada). OJO: tu compa dijo que Next.js lo valida;
 * aun así dejamos el helper por si lo quieren reutilizar en middleware.
 */
export const EVIDENCIA_LIMITS = {
  maxFotos: 10,
  maxBytesPorFoto: 5 * 1024 * 1024, // 5MB
  allowedMime: [...ALLOWED_MIME],
};
