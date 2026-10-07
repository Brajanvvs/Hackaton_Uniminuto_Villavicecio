import { pool } from '../../config/db.js';

export const DEFAULT_WEIGHTS = { mastery: 35, schedule: 30, experience: 15, time: 10, skills: 10 };

export async function getWeights() {
  const [rows] = await pool.query(
    `SELECT weight_mastery, weight_schedule, weight_experience, weight_time, weight_preference
     FROM settings WHERE id = 1`,
  );
  const row = rows[0];
  if (!row) return { ...DEFAULT_WEIGHTS };
  return {
    mastery: Number(row.weight_mastery),
    schedule: Number(row.weight_schedule),
    experience: Number(row.weight_experience),
    time: Number(row.weight_time),
    skills: Number(row.weight_preference),
  };
}

export async function saveWeights(weights) {
  await pool.execute(
    `UPDATE settings
     SET weight_mastery = ?, weight_schedule = ?, weight_experience = ?, weight_time = ?, weight_preference = ?
     WHERE id = 1`,
    [weights.mastery, weights.schedule, weights.experience, weights.time, weights.skills],
  );
  return getWeights();
}
