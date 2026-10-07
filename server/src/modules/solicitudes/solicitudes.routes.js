import { Router } from 'express';
import { pool, withTransaction } from '../../config/db.js';
import { asyncHandler, httpError } from '../../lib/errors.js';
import { asTime, cleanText, minutes, parseSkillNames } from '../../lib/validators.js';
import { matchRequest } from '../afinidad/afinidad.service.js';
import { findStudentClashes, lockStudent, slotText } from '../agenda/agenda.repository.js';
import { findSubject } from '../materias/materias.repository.js';
import { getRecommendation, insertRecommendation, insertRequest } from '../recomendaciones/recomendaciones.repository.js';

const router = Router();

function parseRequest(body) {
  const studentName = cleanText(body.studentName);
  const subjectId = Number(body.subjectId);
  const dayOfWeek = Number(body.dayOfWeek);
  const startTime = asTime(body.startTime);
  const endTime = asTime(body.endTime);
  const preference = cleanText(body.preference);

  if (!studentName || studentName.length > 120) {
    return { error: 'El nombre del estudiante es obligatorio (máximo 120 caracteres).' };
  }
  if (!Number.isInteger(subjectId) || subjectId <= 0) return { error: 'Selecciona la materia.' };
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 6) return { error: 'Selecciona el día.' };
  if (!startTime || !endTime || minutes(endTime) <= minutes(startTime)) {
    return { error: 'El horario necesita una hora de fin posterior a la de inicio.' };
  }
  if (preference.length > 300) return { error: 'La preferencia admite máximo 300 caracteres.' };
  const skills = parseSkillNames(body.skills, { max: 8, label: 'Habilidades pedidas' });
  if (skills.error) return { error: skills.error };

  return {
    input: { studentName, subjectId, dayOfWeek, startTime, endTime, preference, skills: skills.names },
  };
}

function clashError(studentName, clash) {
  const slot = slotText(clash);
  const tutor = clash.chosenTutorName ? ` con ${clash.chosenTutorName}` : '';
  const message = clash.sameSubject
    ? `${studentName} ya registró una solicitud de ${clash.subjectName} ${slot}${tutor}. No hace falta registrarla dos veces.`
    : `${studentName} ya tiene una solicitud de ${clash.subjectName} ${slot}${tutor}, y se cruza con este horario. Elige otra hora.`;
  return httpError(409, message, {
    code: clash.sameSubject ? 'SOLICITUD_DUPLICADA' : 'CRUCE_DE_HORARIO',
    recommendationId: clash.recommendationId,
  });
}

router.post('/', asyncHandler(async (req, res) => {
  const parsed = parseRequest(req.body || {});
  if (parsed.error) throw httpError(400, parsed.error);

  const subject = await findSubject(parsed.input.subjectId);
  if (!subject) throw httpError(400, 'La materia no existe.');

  const result = await matchRequest({ ...parsed.input, subjectName: subject.name });
  const connection = await pool.getConnection();
  let recommendationId;
  try {
    const release = await lockStudent(connection, parsed.input.studentName);
    try {
      const [clash] = await findStudentClashes(connection, parsed.input);
      if (clash) throw clashError(parsed.input.studentName, clash);
      recommendationId = await withTransaction(async (tx) => {
        const requestId = await insertRequest(tx, parsed.input);
        return insertRecommendation(tx, { requestId, result, subjectName: subject.name });
      });
    } finally {
      await release();
    }
  } finally {
    connection.release();
  }

  res.status(201).json(await getRecommendation(recommendationId));
}));

export default router;
