import { Router } from 'express';
import { pool } from '../../config/db.js';
import { asyncHandler } from '../../lib/errors.js';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
  const [[tutors]] = await pool.query('SELECT COUNT(*) AS total FROM tutors');
  const [[requests]] = await pool.query('SELECT COUNT(*) AS total FROM requests');
  const [[choices]] = await pool.query(`
    SELECT
      COUNT(chosen_tutor_id) AS chosen,
      SUM(chosen_rank = 1) AS top
    FROM recommendations
  `);
  const [latestRows] = await pool.query(`
    SELECT rec.id, rec.score, rec.tutor_name, rec.chosen_tutor_name, rec.chosen_score, rec.created_at,
      req.student_name, sub.name AS subject_name
    FROM recommendations rec
    JOIN requests req ON req.id = rec.request_id
    JOIN subjects sub ON sub.id = req.subject_id
    ORDER BY rec.created_at DESC, rec.id DESC
    LIMIT 1
  `);
  const latest = latestRows[0];

  res.json({
    tutors: Number(tutors.total),
    requests: Number(requests.total),
    chosen: Number(choices.chosen),
    chosenTop: Number(choices.top || 0),
    latest: latest
      ? {
          id: latest.id,
          score: Number(latest.score),
          tutorName: latest.tutor_name,
          chosenName: latest.chosen_tutor_name,
          chosenScore: latest.chosen_score == null ? null : Number(latest.chosen_score),
          studentName: latest.student_name,
          subjectName: latest.subject_name,
          createdAt: latest.created_at,
        }
      : null,
  });
}));

export default router;
