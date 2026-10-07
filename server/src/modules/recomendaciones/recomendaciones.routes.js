import { Router } from 'express';
import { withTransaction } from '../../config/db.js';
import { asyncHandler, httpError } from '../../lib/errors.js';
import { cleanText } from '../../lib/validators.js';
import { findBusyTutors, slotText } from '../agenda/agenda.repository.js';
import { cancelChoice, REASONS } from '../cancelaciones/cancelaciones.repository.js';
import { getRecommendation, listRecommendations, saveChoice } from './recomendaciones.repository.js';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
  res.json(await listRecommendations());
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const recommendation = await getRecommendation(Number(req.params.id));
  if (!recommendation) throw httpError(404, 'No se encontró la recomendación.');
  res.json(recommendation);
}));

router.put('/:id/eleccion', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const tutorId = Number(req.body?.tutorId);
  if (!Number.isInteger(tutorId) || tutorId <= 0) throw httpError(400, 'Selecciona un tutor.');

  const recommendation = await getRecommendation(id);
  if (!recommendation) throw httpError(404, 'No se encontró la recomendación.');

  const ranked = recommendation.ranking.ranked || [];
  const index = ranked.findIndex((item) => Number(item.tutorId) === tutorId);
  if (index === -1) throw httpError(400, 'Ese tutor no está entre los recomendados para esta solicitud.');
  if (recommendation.choice?.tutorId === tutorId) {
    res.json(recommendation);
    return;
  }

  const option = ranked[index];
  const declined = recommendation.cancellations.find((item) => item.reason === 'tutor' && item.tutorId === tutorId);
  if (declined) {
    throw httpError(409, `${option.name} avisó que no puede asistir a esta tutoría (comprobante ${declined.code}). Elige otro tutor.`);
  }

  await withTransaction(async (connection) => {
    const [[tutor]] = await connection.query('SELECT id FROM tutors WHERE id = ? FOR UPDATE', [tutorId]);
    if (!tutor) throw httpError(409, 'Ese tutor ya no está registrado.');

    const [[current]] = await connection.query('SELECT closed_at FROM recommendations WHERE id = ? FOR UPDATE', [id]);
    if (current.closed_at) throw httpError(409, 'Esta solicitud fue cancelada. Si aún necesitas tutoría, crea una nueva solicitud.');

    const [busy] = await findBusyTutors(connection, recommendation.request, { excludeRecommendationId: id, tutorId });
    if (busy) {
      throw httpError(
        409,
        `Hora ocupada: ${option.name} ya tiene una tutoría ${slotText(busy)}. Elige otro tutor o cambia el horario.`,
        { code: 'HORA_OCUPADA', tutorId },
      );
    }

    await saveChoice(connection, id, { tutorId, name: option.name, score: option.score, rank: index + 1 });
  });
  res.json(await getRecommendation(id));
}));

router.post('/:id/cancelacion', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const reason = String(req.body?.reason || '');
  const note = cleanText(req.body?.note);
  if (!(reason in REASONS)) throw httpError(400, 'Elige el motivo de la cancelación.');
  if (note.length > 300) throw httpError(400, 'El comentario admite máximo 300 caracteres.');

  const result = await withTransaction((connection) => cancelChoice(connection, id, { reason, note }));
  if (result.error === 'missing') throw httpError(404, 'No se encontró la recomendación.');
  if (result.error === 'closed') throw httpError(409, 'Esta solicitud ya estaba cancelada.');
  if (result.error === 'no_choice') throw httpError(409, 'No hay una tutoría elegida para cancelar.');

  res.status(201).json(await getRecommendation(id));
}));

export default router;
