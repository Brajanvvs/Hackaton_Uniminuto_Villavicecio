import { Router } from 'express';
import { asyncHandler, httpError } from '../../lib/errors.js';
import { CRITERIA } from '../afinidad/score.js';
import { getWeights, saveWeights } from './configuracion.repository.js';

const router = Router();

function parseWeights(body) {
  const weights = {};
  for (const key of CRITERIA) weights[key] = Number(body[key]);
  const values = Object.values(weights);
  if (values.some((value) => !Number.isFinite(value) || value < 0 || value > 1000)) {
    return { error: 'Cada peso debe ser un número entre 0 y 1000.' };
  }
  if (values.reduce((sum, value) => sum + value, 0) <= 0) {
    return { error: 'Al menos un peso debe ser mayor que cero.' };
  }
  return { weights };
}

router.get('/', asyncHandler(async (_req, res) => {
  res.json(await getWeights());
}));

router.put('/', asyncHandler(async (req, res) => {
  const parsed = parseWeights(req.body || {});
  if (parsed.error) throw httpError(400, parsed.error);
  res.json(await saveWeights(parsed.weights));
}));

export default router;
