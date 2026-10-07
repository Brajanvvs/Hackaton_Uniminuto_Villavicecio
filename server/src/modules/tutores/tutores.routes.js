import { Router } from 'express';
import { withTransaction } from '../../config/db.js';
import { asyncHandler, httpError } from '../../lib/errors.js';
import { asTime, cleanText, minutes, parseSkillNames } from '../../lib/validators.js';
import { deleteTutor, getTutor, insertTutor, listTutors, updateTutor } from './tutores.repository.js';

const router = Router();

function parseTutor(body) {
  const name = cleanText(body.name);
  const email = cleanText(body.email);
  const bio = cleanText(body.bio);
  const experienceLevel = Number(body.experienceLevel);
  const experienceSemesters = Number(body.experienceSemesters ?? 0);
  const weeklyHours = Number(body.weeklyHours);

  if (!name || name.length > 120) return { error: 'El nombre del tutor es obligatorio (máximo 120 caracteres).' };
  if (email && (email.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return { error: 'El correo no es válido.' };
  }
  if (bio.length > 500) return { error: 'La descripción admite máximo 500 caracteres.' };
  if (!Number.isInteger(experienceLevel) || experienceLevel < 1 || experienceLevel > 5) {
    return { error: 'El nivel de experiencia va de 1 a 5.' };
  }
  if (!Number.isInteger(experienceSemesters) || experienceSemesters < 0 || experienceSemesters > 20) {
    return { error: 'Los semestres como tutor van de 0 a 20.' };
  }
  if (!Number.isInteger(weeklyHours) || weeklyHours < 1 || weeklyHours > 40) {
    return { error: 'Las horas por semana van de 1 a 40.' };
  }
  const skills = parseSkillNames(body.skills, { max: 12, label: 'Habilidades' });
  if (skills.error) return { error: skills.error };
  if (!Array.isArray(body.subjects) || body.subjects.length === 0) {
    return { error: 'Agrega al menos una materia.' };
  }
  if (!Array.isArray(body.schedules) || body.schedules.length === 0) {
    return { error: 'Agrega al menos un horario.' };
  }

  const subjects = [];
  const seenSubjects = new Set();
  for (const item of body.subjects) {
    const subjectId = Number(item.subjectId);
    const mastery = Number(item.mastery);
    if (!Number.isInteger(subjectId) || subjectId <= 0) return { error: 'Selecciona una materia válida.' };
    if (!Number.isInteger(mastery) || mastery < 1 || mastery > 5) {
      return { error: 'El dominio de cada materia va de 1 a 5.' };
    }
    if (seenSubjects.has(subjectId)) return { error: 'No repitas la misma materia.' };
    seenSubjects.add(subjectId);
    subjects.push({ subjectId, mastery });
  }

  const schedules = [];
  for (const item of body.schedules) {
    const dayOfWeek = Number(item.dayOfWeek);
    const startTime = asTime(item.startTime);
    const endTime = asTime(item.endTime);
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 6) {
      return { error: 'El día del horario no es válido.' };
    }
    if (!startTime || !endTime || minutes(endTime) <= minutes(startTime)) {
      return { error: 'Cada horario necesita una hora de fin posterior a la de inicio.' };
    }
    schedules.push({ dayOfWeek, startTime, endTime });
  }

  return {
    profile: {
      tutor: { name, email, bio, experienceLevel, experienceSemesters, weeklyHours },
      subjects,
      schedules,
      skills: skills.names,
    },
  };
}

function foreignKeyMessage(error) {
  if (error.code === 'ER_NO_REFERENCED_ROW_2') return 'La materia seleccionada no existe.';
  if (error.code === 'ER_ROW_IS_REFERENCED_2') {
    return 'Este tutor ya tiene recomendaciones y no se puede eliminar.';
  }
  return null;
}

router.get('/', asyncHandler(async (_req, res) => {
  res.json(await listTutors());
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const tutor = await getTutor(Number(req.params.id));
  if (!tutor) throw httpError(404, 'No se encontró el tutor.');
  res.json(tutor);
}));

router.post('/', asyncHandler(async (req, res) => {
  const parsed = parseTutor(req.body || {});
  if (parsed.error) throw httpError(400, parsed.error);
  try {
    const id = await withTransaction((connection) => insertTutor(connection, parsed.profile));
    res.status(201).json(await getTutor(id));
  } catch (error) {
    const message = foreignKeyMessage(error);
    if (message) throw httpError(400, message);
    throw error;
  }
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const parsed = parseTutor(req.body || {});
  if (parsed.error) throw httpError(400, parsed.error);
  try {
    const updated = await withTransaction((connection) => updateTutor(connection, id, parsed.profile));
    if (!updated) throw httpError(404, 'No se encontró el tutor.');
    res.json(await getTutor(id));
  } catch (error) {
    if (error.status) throw error;
    const message = foreignKeyMessage(error);
    if (message) throw httpError(400, message);
    throw error;
  }
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  try {
    const removed = await deleteTutor(Number(req.params.id));
    if (!removed) throw httpError(404, 'No se encontró el tutor.');
    res.status(204).end();
  } catch (error) {
    if (error.status) throw error;
    const message = foreignKeyMessage(error);
    if (message) throw httpError(409, message);
    throw error;
  }
}));

export default router;
