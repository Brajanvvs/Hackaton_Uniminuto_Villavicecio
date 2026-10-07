import { Router } from 'express';
import { asyncHandler } from '../../lib/errors.js';
import { listSkills } from './habilidades.repository.js';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
  res.json(await listSkills());
}));

export default router;
