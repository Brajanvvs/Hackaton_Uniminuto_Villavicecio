import { pool } from '../../config/db.js';
import { parseJson } from '../../lib/json.js';
import { findBusyTutors } from '../agenda/agenda.repository.js';
import { listCancellations, REASONS } from '../cancelaciones/cancelaciones.repository.js';

function hhmm(value) {
  return String(value).slice(0, 5);
}

function mapRecommendation(row) {
  return {
    id: row.id,
    score: Number(row.score),
    justification: row.justification,
    breakdown: parseJson(row.breakdown, {}),
    ranking: parseJson(row.ranking, { ranked: [], excluded: [] }),
    createdAt: row.created_at,
    closedAt: row.closed_at || null,
    choice: row.chosen_tutor_id
      ? {
          tutorId: row.chosen_tutor_id,
          name: row.chosen_tutor_name,
          score: Number(row.chosen_score),
          rank: Number(row.chosen_rank),
          chosenAt: row.chosen_at,
        }
      : null,
    tutor: row.tutor_id
      ? {
          id: row.tutor_id,
          name: row.tutor_name,
          experienceLevel: row.experience_level == null ? null : Number(row.experience_level),
          bio: row.bio || '',
        }
      : null,
    request: {
      id: row.request_id,
      studentName: row.student_name,
      subjectName: row.subject_name,
      dayOfWeek: Number(row.day_of_week),
      startTime: hhmm(row.start_time),
      endTime: hhmm(row.end_time),
      skills: parseJson(row.skills, []),
      preference: row.preference || '',
    },
  };
}

const detailSql = `
  SELECT
    rec.id, rec.score, rec.justification, rec.breakdown, rec.ranking, rec.created_at,
    rec.tutor_id, rec.tutor_name,
    rec.chosen_tutor_id, rec.chosen_tutor_name, rec.chosen_score, rec.chosen_rank, rec.chosen_at, rec.closed_at,
    req.id AS request_id, req.student_name, req.skills, req.preference, req.day_of_week, req.start_time, req.end_time,
    sub.name AS subject_name,
    tut.experience_level, tut.bio
  FROM recommendations rec
  JOIN requests req ON req.id = rec.request_id
  JOIN subjects sub ON sub.id = req.subject_id
  LEFT JOIN tutors tut ON tut.id = rec.tutor_id
`;

export async function insertRequest(connection, input) {
  const [result] = await connection.execute(
    `INSERT INTO requests (student_name, subject_id, day_of_week, start_time, end_time, skills, preference)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.studentName,
      input.subjectId,
      input.dayOfWeek,
      input.startTime,
      input.endTime,
      JSON.stringify(input.skills || []),
      input.preference || null,
    ],
  );
  return result.insertId;
}

export async function insertRecommendation(connection, input) {
  const winner = input.result.winner;
  const [result] = await connection.execute(
    `INSERT INTO recommendations
      (request_id, tutor_id, tutor_name, score, justification, breakdown, ranking)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.requestId,
      winner?.tutorId ?? null,
      winner?.name ?? null,
      winner?.score ?? 0,
      winner?.justification ?? `Ningún tutor disponible domina ${input.subjectName}.`,
      JSON.stringify(winner
        ? {
            mastery: winner.mastery,
            schedule: winner.schedule,
            experience: winner.experience,
            time: winner.time,
            skills: winner.skills,
            masteryLevel: winner.masteryLevel,
            experienceLevel: winner.experienceLevel,
            experienceSemesters: winner.experienceSemesters,
            weeklyHours: winner.weeklyHours,
            overlapMinutes: winner.overlapMinutes,
            matchedSkills: winner.matchedSkills,
            missingSkills: winner.missingSkills,
            weights: input.result.weights,
          }
        : { weights: input.result.weights }),
      JSON.stringify({ ranked: input.result.ranked, excluded: input.result.excluded }),
    ],
  );
  return result.insertId;
}

export async function getRecommendation(id) {
  const [rows] = await pool.query(`${detailSql} WHERE rec.id = ?`, [id]);
  if (!rows[0]) return null;
  const recommendation = mapRecommendation(rows[0]);
  recommendation.busy = await findBusyTutors(pool, recommendation.request, { excludeRecommendationId: id });
  recommendation.cancellations = await listCancellations(id);
  return recommendation;
}

export async function saveChoice(connection, id, choice) {
  const [result] = await connection.execute(
    `UPDATE recommendations
     SET chosen_tutor_id = ?, chosen_tutor_name = ?, chosen_score = ?, chosen_rank = ?, chosen_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [choice.tutorId, choice.name, choice.score, choice.rank, id],
  );
  return result.affectedRows > 0;
}

export async function listRecommendations() {
  const [rows] = await pool.query(`
    SELECT rec.id, rec.score, rec.created_at, rec.tutor_name,
      rec.chosen_tutor_name, rec.chosen_score, rec.chosen_rank, rec.closed_at,
      req.student_name, sub.name AS subject_name,
      (SELECT COUNT(*) FROM cancellations can WHERE can.recommendation_id = rec.id) AS cancellations,
      (SELECT can.reason FROM cancellations can WHERE can.recommendation_id = rec.id ORDER BY can.id DESC LIMIT 1) AS last_reason
    FROM recommendations rec
    JOIN requests req ON req.id = rec.request_id
    JOIN subjects sub ON sub.id = req.subject_id
    ORDER BY rec.created_at DESC, rec.id DESC
  `);
  return rows.map((row) => ({
    id: row.id,
    score: Number(row.score),
    createdAt: row.created_at,
    tutorName: row.tutor_name,
    chosenName: row.chosen_tutor_name,
    chosenScore: row.chosen_score == null ? null : Number(row.chosen_score),
    chosenRank: row.chosen_rank == null ? null : Number(row.chosen_rank),
    studentName: row.student_name,
    subjectName: row.subject_name,
    closedAt: row.closed_at || null,
    cancellations: Number(row.cancellations),
    lastCancelReason: row.last_reason ? REASONS[row.last_reason] : null,
  }));
}
