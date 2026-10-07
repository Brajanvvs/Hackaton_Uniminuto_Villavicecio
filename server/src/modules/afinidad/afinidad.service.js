import { getWeights } from '../configuracion/configuracion.repository.js';
import { listTutors } from '../tutores/tutores.repository.js';
import { rankTutors } from './score.js';

export async function matchRequest(request) {
  const [weights, tutors] = await Promise.all([getWeights(), listTutors()]);
  return rankTutors(request, tutors, weights);
}
