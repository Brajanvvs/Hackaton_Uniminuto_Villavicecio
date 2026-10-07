import { pool } from '../../config/db.js';

export const REASONS = {
  tutor: 'El tutor no puede asistir',
  estudiante: 'El estudiante no puede asistir',
  no_necesita: 'Ya no necesita la tutoría',
};

export function receiptCode(id) {
  return `CAN-${String(id).padStart(5, '0')}`;
}

function mapCancellation(row) {
  return {
    id: row.id,
    code: receiptCode(row.id),
    tutorId: row.tutor_id,
    tutorName: row.tutor_name,
    reason: row.reason,
    reasonLabel: REASONS[row.reason],
    note: row.note || '',
    createdAt: row.created_at,
  };
}

export async function listCancellations(recommendationId, connection = pool) {
  const [rows] = await connection.query(
    'SELECT * FROM cancellations WHERE recommendation_id = ? ORDER BY id DESC',
    [recommendationId],
  );
  return rows.map(mapCancellation);
}

/**
 * Frees the tutor's slot and keeps the cancellation as a receipt.
 * When the tutor is the one who can't attend, the request stays open so the student can choose someone else.
 */
export async function cancelChoice(connection, recommendationId, { reason, note }) {
  const [[row]] = await connection.query(
    'SELECT chosen_tutor_id, chosen_tutor_name, closed_at FROM recommendations WHERE id = ? FOR UPDATE',
    [recommendationId],
  );
  if (!row) return { error: 'missing' };
  if (row.closed_at) return { error: 'closed' };
  if (!row.chosen_tutor_id) return { error: 'no_choice' };

  const [result] = await connection.execute(
    'INSERT INTO cancellations (recommendation_id, tutor_id, tutor_name, reason, note) VALUES (?, ?, ?, ?, ?)',
    [recommendationId, row.chosen_tutor_id, row.chosen_tutor_name, reason, note || null],
  );
  await connection.execute(
    `UPDATE recommendations
     SET chosen_tutor_id = NULL, chosen_tutor_name = NULL, chosen_score = NULL, chosen_rank = NULL, chosen_at = NULL,
         closed_at = ${reason === 'tutor' ? 'NULL' : 'CURRENT_TIMESTAMP'}
     WHERE id = ?`,
    [recommendationId],
  );
  return { id: result.insertId };
}
