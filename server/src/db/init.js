import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { dbConfig, pool } from '../config/db.js';

const databaseDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../database');
const migrationsDir = path.join(databaseDir, 'migrations');

function readSql(file) {
  return fs.readFileSync(file, 'utf8');
}

async function runMigrations(connection) {
  const [[lock]] = await connection.query("SELECT GET_LOCK('nexo_migrations', 30) AS acquired");
  if (Number(lock.acquired) !== 1) throw new Error('Otra instancia está aplicando migraciones. Intenta de nuevo.');
  try {
    await applyPending(connection);
  } finally {
    await connection.query("SELECT RELEASE_LOCK('nexo_migrations')");
  }
}

async function applyPending(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(160) PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  const [rows] = await connection.query('SELECT name FROM schema_migrations');
  const applied = new Set(rows.map((row) => row.name));
  const files = fs.existsSync(migrationsDir)
    ? fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.sql')).sort()
    : [];

  for (const file of files) {
    if (applied.has(file)) continue;
    await connection.query(readSql(path.join(migrationsDir, file)));
    await connection.query('INSERT INTO schema_migrations (name) VALUES (?)', [file]);
    console.log(`Migración aplicada: ${file}`);
  }
}

export async function initDatabase() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      multipleStatements: true,
      charset: 'utf8mb4',
    });
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    await connection.query(`USE \`${dbConfig.database}\``);
    await connection.query(readSql(path.join(databaseDir, 'schema.sql')));
    const [rows] = await connection.query('SELECT COUNT(*) AS total FROM tutors');
    if (Number(rows[0].total) === 0) {
      await connection.query(readSql(path.join(databaseDir, 'seed.sql')));
    }
    await runMigrations(connection);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error(`No hay un MySQL escuchando en ${dbConfig.host}:${dbConfig.port}.`);
    }
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      throw new Error('MySQL rechazó el usuario o la contraseña. Edita DB_PASSWORD en server/.env.');
    }
    throw error;
  } finally {
    await connection?.end();
  }
}

const executedDirectly = process.argv[1]?.endsWith('init.js');
if (executedDirectly) {
  try {
    await initDatabase();
    console.log(`Base ${dbConfig.database} lista.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
