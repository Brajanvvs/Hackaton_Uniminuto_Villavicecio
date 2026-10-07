import { pool } from '../../config/db.js';

export async function listSkills() {
  const [rows] = await pool.query(`
    SELECT s.id, s.name, COUNT(ts.tutor_id) AS tutors
    FROM skills s
    LEFT JOIN tutor_skills ts ON ts.skill_id = s.id
    GROUP BY s.id, s.name
    ORDER BY s.name
  `);
  return rows.map((row) => ({ id: row.id, name: row.name, tutors: Number(row.tutors) }));
}

export async function ensureSkills(connection, names) {
  const ids = [];
  for (const name of names) {
    await connection.execute('INSERT IGNORE INTO skills (name) VALUES (?)', [name]);
    const [rows] = await connection.execute('SELECT id FROM skills WHERE name = ?', [name]);
    ids.push(rows[0].id);
  }
  return ids;
}
