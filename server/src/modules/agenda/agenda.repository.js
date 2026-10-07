import { createHash } from 'node:crypto';

const DAYS = ['', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

function hhmm(value) {
  return String(value).slice(0, 5);
}

export function slotText({ dayOfWeek, startTime, endTime }) {
  return `el ${DAYS[Number(dayOfWeek)] || 'día indicado'} de ${hhmm(startTime)} a ${hhmm(endTime)}`;
}

/** Same key MySQL's utf8mb4_unicode_ci considers equal: no case, accents or extra spaces. */
function studentKey(name) {
  return String(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

/** Serializes requests from the same student so a double submit can't slip past the duplicate check. */
export async function lockStudent(connection, studentName) {
  const hash = createHash('sha1').update(studentKey(studentName)).digest('hex');
  const name = `nexo_student_${hash}`;
  const [[row]] = await connection.query('SELECT GET_LOCK(?, 10) AS ok', [name]);
  if (Number(row.ok) !== 1) throw new Error('No se pudo reservar el registro del estudiante.');
  return () => connection.query('SELECT RELEASE_LOCK(?)', [name]);
}

/** Earlier requests of the same student whose time range overlaps the new one. */
export async function findStudentClashes(connection, request) {
  const [rows] = await connection.query(
    `SELECT rec.id AS recommendation_id, req.subject_id, sub.name AS subject_name,
            req.day_of_week, req.start_time, req.end_time, rec.chosen_tutor_name
     FROM requests req
     JOIN recommendations rec ON rec.request_id = req.id
     JOIN subjects sub ON sub.id = req.subject_id
     WHERE req.student_name = ? AND req.day_of_week = ? AND req.start_time < ? AND req.end_time > ?
       AND rec.closed_at IS NULL
     ORDER BY req.subject_id = ? DESC, rec.id DESC`,
    [request.studentName, request.dayOfWeek, request.endTime, request.startTime, request.subjectId],
  );
  return rows.map((row) => ({
    recommendationId: row.recommendation_id,
    sameSubject: Number(row.subject_id) === Number(request.subjectId),
    subjectName: row.subject_name,
    dayOfWeek: Number(row.day_of_week),
    startTime: hhmm(row.start_time),
    endTime: hhmm(row.end_time),
    chosenTutorName: row.chosen_tutor_name,
  }));
}

/** Tutors already chosen by another request on the same day with an overlapping time range. */
export async function findBusyTutors(connection, request, { excludeRecommendationId, tutorId } = {}) {
  const [rows] = await connection.query(
    `SELECT rec.chosen_tutor_id AS tutor_id, req.start_time, req.end_time
     FROM recommendations rec
     JOIN requests req ON req.id = rec.request_id
     WHERE rec.chosen_tutor_id IS NOT NULL AND rec.id <> ?
       AND req.day_of_week = ? AND req.start_time < ? AND req.end_time > ?
       ${tutorId ? 'AND rec.chosen_tutor_id = ?' : ''}
     ORDER BY req.start_time`,
    [
      excludeRecommendationId ?? 0,
      request.dayOfWeek,
      request.endTime,
      request.startTime,
      ...(tutorId ? [tutorId] : []),
    ],
  );
  return rows.map((row) => ({
    tutorId: Number(row.tutor_id),
    dayOfWeek: Number(request.dayOfWeek),
    startTime: hhmm(row.start_time),
    endTime: hhmm(row.end_time),
  }));
}
