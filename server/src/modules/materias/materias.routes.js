import { Router } from 'express';
import { asyncHandler, httpError } from '../../lib/errors.js';
import { cleanText } from '../../lib/validators.js';
import { insertSubject, listSubjects } from './materias.repository.js';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
  res.json(await listSubjects());
}));

router.post('/', asyncHandler(async (req, res) => {
  const name = cleanText(req.body?.name);
  if (!name || name.length > 100) throw httpError(400, 'El nombre de la materia es obligatorio (máximo 100 caracteres).');
  try {
    res.status(201).json(await insertSubject(name));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') throw httpError(409, 'Esa materia ya existe.');
    throw error;
  }
}));

export default router;
