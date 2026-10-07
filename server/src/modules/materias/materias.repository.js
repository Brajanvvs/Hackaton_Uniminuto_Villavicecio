import { pool } from '../../config/db.js';

export async function listSubjects() {
  const [rows] = await pool.query('SELECT id, name FROM subjects ORDER BY name');
  return rows;
}

export async function findSubject(id) {
  const [rows] = await pool.query('SELECT id, name FROM subjects WHERE id = ?', [id]);
  return rows[0] || null;
}

export async function insertSubject(name) {
  const [result] = await pool.execute('INSERT INTO subjects (name) VALUES (?)', [name]);
  return { id: result.insertId, name };
}
