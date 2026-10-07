import mysql from 'mysql2/promise';
import { dbConfig, pool } from '../config/db.js';
import { initDatabase } from './init.js';

try {
  const connection = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
  });
  await connection.query(`DROP DATABASE IF EXISTS \`${dbConfig.database}\``);
  await connection.end();
  await initDatabase();
  console.log(`Base ${dbConfig.database} reiniciada con los datos de demostración.`);
} catch (error) {
  if (error.code === 'ECONNREFUSED') console.error(`No hay un MySQL escuchando en ${dbConfig.host}:${dbConfig.port}.`);
  else if (error.code === 'ER_ACCESS_DENIED_ERROR') console.error('MySQL rechazó el usuario o la contraseña. Edita DB_PASSWORD en server/.env.');
  else console.error(error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
