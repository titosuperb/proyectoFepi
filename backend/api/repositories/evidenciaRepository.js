/**
 * Repositorio: operaciones de BD para Evidencias (BLOB) y relaciones HU012.
 * Tablas:
 * - evidencia(evidenciaId, imagen)
 * - asociacionEvidenciaArrastre(idEvidenciaArrastre, idRegistroArrastre)
 * - evidenciaArrastre(idEvidenciaArrastre, idEvidencia, personalGrua)
 */

export async function insertarEvidenciaBlob({ db, transaction, evidenciaId, imagenBlob }) {
  await db.query(
    `INSERT INTO evidencia (evidenciaId, imagen) VALUES (?, ?)`,
    [evidenciaId, imagenBlob],
    { transaction }
  );
}

export async function insertarAsociacionEvidenciaArrastre({
  db,
  transaction,
  idEvidenciaArrastre,
  idRegistroArrastre,
}) {
  await db.query(
    `INSERT INTO asociacionEvidenciaArrastre (idEvidenciaArrastre, idRegistroArrastre)
     VALUES (?, ?)`,
    [idEvidenciaArrastre, idRegistroArrastre],
    { transaction }
  );
}

export async function insertarEvidenciaArrastre({
  db,
  transaction,
  idEvidenciaArrastre,
  idEvidencia,
  personalGrua,
}) {
  await db.query(
    `INSERT INTO evidenciaArrastre (idEvidenciaArrastre, idEvidencia, personalGrua)
     VALUES (?, ?, ?)`,
    [idEvidenciaArrastre, idEvidencia, personalGrua],
    { transaction }
  );
}
    