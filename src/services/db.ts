import { open } from 'react-native-quick-sqlite';

export const db = open({ name: 'infracciones.db' });

export const initDB = () => {
  db.execute(`
    CREATE TABLE IF NOT EXISTS infracciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      placa TEXT,
      articulo TEXT,
      fraccion TEXT,
      inciso TEXT,
      descripcion TEXT,
      fotos TEXT,
      lat REAL,
      lon REAL,
      fecha TEXT,
      enviada INTEGER
    );
  `);
};

export const guardarInfraccionDB = (infraccion: any) => {
  db.execute(
    `INSERT INTO infracciones
     (placa, articulo, fraccion, inciso, descripcion, fotos, lat, lon, fecha, enviada)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      infraccion.placa,
      infraccion.articulo,
      infraccion.fraccion,
      infraccion.inciso,
      infraccion.descripcion,
      JSON.stringify(infraccion.fotos),
      infraccion.ubicacion.lat,
      infraccion.ubicacion.lon,
      infraccion.fecha,
      0,
    ]
  );
};
