/**
 * Repositorio: operaciones de BD para Arrastre + vínculo con Infracción.
 * Responsabilidad única: queries relacionadas a registroArrastre e infracciones.
 */

export async function insertarRegistroArrastre({
  db,
  transaction,
  idRegistroArrastre,
  idUbicacionOrigen,
  idUbicacionDestino,
  checklistJson,
}) {
  await db.query(
    `INSERT INTO registroArrastre (idRegistroArrastre, fechaArrastre, ubicacion, destino, detallesVehiculo)
     VALUES (?, NOW(), ?, ?, ?)`,
    [idRegistroArrastre, idUbicacionOrigen, idUbicacionDestino, checklistJson],
    { transaction }
  );
}

export async function vincularArrastreEnInfraccion({
  db,
  transaction,
  idInfraccion,
  idRegistroArrastre,
}) {
  await db.query(
    `UPDATE infracciones SET registroGrua = ? WHERE idInfraccion = ?`,
    [idRegistroArrastre, idInfraccion],
    { transaction }
  );
}
