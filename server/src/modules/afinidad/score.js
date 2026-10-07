/**
 * Puntaje de afinidad, de 0 a 100.
 * Cada criterio también va de 0 a 100 y el coordinador define su peso.
 *
 * puntaje = Σ(criterio × peso) / Σ(pesos)
 *
 * La materia es un filtro: quien no la domina no entra al ranking.
 */

export const CRITERIA = ['mastery', 'schedule', 'experience', 'time', 'skills'];

export const FULL_SEMESTERS = 8;
export const FULL_WEEKLY_HOURS = 10;

const DAYS = ['', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const LEVELS = ['', 'inicial', 'básica', 'intermedia', 'avanzada', 'experta'];

const STOPWORDS = new Set([
  'para', 'como', 'con', 'una', 'unas', 'unos', 'que', 'del', 'las', 'los', 'por',
  'sus', 'este', 'esta', 'mas', 'muy', 'tutor', 'tutora', 'ayuda', 'sobre', 'desde',
  'hasta', 'porque', 'tambien', 'mejor', 'alguien', 'materia', 'horario', 'quiero',
  'necesito', 'estudiante',
]);

export function timeToMinutes(value) {
  const [hours, minutes] = String(value).slice(0, 5).split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
  return hours * 60 + minutes;
}

export function overlapMinutes(startA, endA, startB, endB) {
  const start = Math.max(timeToMinutes(startA), timeToMinutes(startB));
  const end = Math.min(timeToMinutes(endA), timeToMinutes(endB));
  return Math.max(0, end - start);
}

export function levelScore(level) {
  const value = Math.min(5, Math.max(1, Number(level) || 1));
  return value * 20;
}

export function experienceScore(level, semesters) {
  const tenure = Math.min(FULL_SEMESTERS, Math.max(0, Number(semesters) || 0)) / FULL_SEMESTERS * 100;
  return Math.round((levelScore(level) + tenure) / 2);
}

export function timeScore(weeklyHours) {
  const hours = Math.max(0, Number(weeklyHours) || 0);
  return Math.round(Math.min(FULL_WEEKLY_HOURS, hours) / FULL_WEEKLY_HOURS * 100);
}

export function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim();
}

function words(text) {
  return normalize(text).split(/[^a-z0-9]+/).filter(Boolean);
}

/**
 * Cada habilidad pedida cuenta si el tutor la tiene en su perfil.
 * Cada palabra clave del texto libre cuenta si aparece en sus habilidades o en su descripción.
 * Sin nada pedido, el criterio queda en 100 y no altera el orden.
 */
export function skillsScore(request, tutor) {
  const wanted = [...new Map((request.skills || []).map((name) => [normalize(name), name])).entries()];
  const tutorSkills = new Set((tutor.skills || []).map(normalize));
  const keywords = [...new Set(
    words(request.preference).filter((word) => word.length > 3 && !STOPWORDS.has(word)),
  )];
  const haystack = new Set(words(`${(tutor.skills || []).join(' ')} ${tutor.bio || ''}`));

  const total = wanted.length + keywords.length;
  if (total === 0) {
    return { score: 100, matchedSkills: [], missingSkills: [], matchedKeywords: [], requested: 0 };
  }

  const matchedSkills = wanted.filter(([key]) => tutorSkills.has(key)).map(([, name]) => name);
  const missingSkills = wanted.filter(([key]) => !tutorSkills.has(key)).map(([, name]) => name);
  const matchedKeywords = keywords.filter((word) => haystack.has(word));
  return {
    score: Math.round(((matchedSkills.length + matchedKeywords.length) / total) * 100),
    matchedSkills,
    missingSkills,
    matchedKeywords,
    requested: total,
  };
}

export function bestScheduleOverlap(request, schedules) {
  const sameDay = (schedules || []).filter((slot) => Number(slot.dayOfWeek) === Number(request.dayOfWeek));
  let minutes = 0;
  for (const slot of sameDay) {
    minutes = Math.max(
      minutes,
      overlapMinutes(request.startTime, request.endTime, slot.startTime, slot.endTime),
    );
  }
  const duration = Math.max(1, timeToMinutes(request.endTime) - timeToMinutes(request.startTime));
  return {
    minutes,
    score: Math.round(Math.min(100, (minutes / duration) * 100)),
  };
}

export function weightedTotal(parts, weights) {
  let total = 0;
  let raw = 0;
  for (const key of CRITERIA) {
    const weight = Number(weights[key]) || 0;
    total += weight;
    raw += (Number(parts[key]) || 0) * weight;
  }
  if (total <= 0) return 0;
  return Math.round((raw / total) * 10) / 10;
}

function formatDuration(minutes) {
  if (minutes % 60 === 0 && minutes >= 60) {
    const hours = minutes / 60;
    return hours === 1 ? '1 hora' : `${hours} horas`;
  }
  if (minutes > 60) {
    return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
  }
  return minutes === 1 ? '1 minuto' : `${minutes} minutos`;
}

function listJoin(items, last) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${last} ${items[items.length - 1]}`;
}

function plural(count, singular, pluralForm) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export function buildJustification({ tutor, subjectName, dayOfWeek, masteryLevel, score, overlap, skills }) {
  const day = DAYS[Number(dayOfWeek)] || 'día indicado';
  const reasons = [
    `domina ${subjectName} con maestría ${LEVELS[masteryLevel]} (${masteryLevel}/5)`,
    overlap.minutes > 0 ? `coincide ${formatDuration(overlap.minutes)} el ${day}` : `no tiene horario el ${day}`,
    `tiene experiencia ${LEVELS[tutor.experienceLevel] || ''} (${tutor.experienceLevel}/5) y ${plural(Number(tutor.experienceSemesters) || 0, 'semestre', 'semestres')} como tutor`,
    `dedica ${plural(Number(tutor.weeklyHours) || 0, 'hora', 'horas')} por semana`,
  ];
  if (skills.requested === 0) {
    reasons.push('la solicitud no pidió habilidades');
  } else {
    const matched = [...skills.matchedSkills, ...skills.matchedKeywords];
    if (matched.length > 0) reasons.push(`cubre ${listJoin(matched, 'y')}`);
    if (skills.missingSkills.length > 0) reasons.push(`no tiene ${listJoin(skills.missingSkills, 'ni')}`);
    if (matched.length === 0 && skills.missingSkills.length === 0) reasons.push('no cubre las preferencias indicadas');
  }
  const detail = reasons.join('; ');
  return `${tutor.name} obtiene ${score.toFixed(1)} puntos. ${detail.charAt(0).toUpperCase()}${detail.slice(1)}.`;
}

export function rankTutors(request, tutors, weights) {
  const ranked = [];
  const excluded = [];

  for (const tutor of tutors) {
    const subject = (tutor.subjects || []).find((item) => Number(item.subjectId) === Number(request.subjectId));
    if (!subject) {
      excluded.push({
        tutorId: tutor.id,
        name: tutor.name,
        reason: `No domina ${request.subjectName}`,
      });
      continue;
    }

    const masteryLevel = Number(subject.mastery);
    const overlap = bestScheduleOverlap(request, tutor.schedules);
    const skills = skillsScore(request, tutor);
    const parts = {
      mastery: levelScore(masteryLevel),
      schedule: overlap.score,
      experience: experienceScore(tutor.experienceLevel, tutor.experienceSemesters),
      time: timeScore(tutor.weeklyHours),
      skills: skills.score,
    };
    const score = weightedTotal(parts, weights);
    ranked.push({
      tutorId: tutor.id,
      name: tutor.name,
      score,
      ...parts,
      masteryLevel,
      experienceLevel: Number(tutor.experienceLevel),
      experienceSemesters: Number(tutor.experienceSemesters) || 0,
      weeklyHours: Number(tutor.weeklyHours) || 0,
      overlapMinutes: overlap.minutes,
      matchedSkills: skills.matchedSkills,
      missingSkills: skills.missingSkills,
      matchedKeywords: skills.matchedKeywords,
      justification: buildJustification({
        tutor,
        subjectName: request.subjectName,
        dayOfWeek: request.dayOfWeek,
        masteryLevel,
        score,
        overlap,
        skills,
      }),
    });
  }

  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.experience !== a.experience) return b.experience - a.experience;
    return a.name.localeCompare(b.name, 'es');
  });

  return {
    winner: ranked[0] || null,
    ranked,
    excluded,
    weights,
  };
}
