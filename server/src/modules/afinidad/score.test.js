import assert from 'node:assert/strict';
import { bestScheduleOverlap, experienceScore, rankTutors, skillsScore, timeScore } from './score.js';

const weights = { mastery: 35, schedule: 30, experience: 15, time: 10, skills: 10 };

const tutors = [
  {
    id: 1,
    name: 'Laura Gómez',
    experienceLevel: 5,
    experienceSemesters: 6,
    weeklyHours: 8,
    bio: 'Es paciente y explica con muchos ejemplos. Acompaña cálculo desde lo básico hasta parciales.',
    skills: ['Paciencia', 'Ejemplos prácticos', 'Preparación de parciales'],
    subjects: [{ subjectId: 1, mastery: 5 }],
    schedules: [{ dayOfWeek: 2, startTime: '14:00', endTime: '17:00' }],
  },
  {
    id: 2,
    name: 'Andrés Castillo',
    experienceLevel: 3,
    experienceSemesters: 2,
    weeklyHours: 6,
    bio: 'Resuelve ejercicios de cálculo y estadística con foco en resultados.',
    skills: ['Resolución de ejercicios', 'Preparación de parciales'],
    subjects: [{ subjectId: 1, mastery: 4 }],
    schedules: [{ dayOfWeek: 2, startTime: '08:00', endTime: '10:00' }],
  },
  {
    id: 3,
    name: 'Valentina Rojas',
    experienceLevel: 4,
    experienceSemesters: 4,
    weeklyHours: 10,
    bio: 'Prefiere estudiantes avanzados y un ritmo ágil.',
    skills: ['Ritmo ágil', 'Temas avanzados'],
    subjects: [{ subjectId: 1, mastery: 5 }],
    schedules: [{ dayOfWeek: 2, startTime: '15:00', endTime: '18:00' }],
  },
  {
    id: 4,
    name: 'Mariana Duarte',
    experienceLevel: 2,
    experienceSemesters: 1,
    weeklyHours: 4,
    bio: 'Empieza como tutora y se le facilita el inglés conversacional.',
    skills: ['Paciencia', 'Conversación'],
    subjects: [{ subjectId: 1, mastery: 2 }],
    schedules: [{ dayOfWeek: 2, startTime: '14:00', endTime: '16:00' }],
  },
  {
    id: 5,
    name: 'Camilo Herrera',
    experienceLevel: 5,
    experienceSemesters: 7,
    weeklyHours: 12,
    bio: 'Domina programación y explica con proyectos cortos.',
    skills: ['Proyectos prácticos', 'Ejemplos prácticos'],
    subjects: [{ subjectId: 2, mastery: 5 }],
    schedules: [{ dayOfWeek: 1, startTime: '16:00', endTime: '18:00' }],
  },
];

const request = {
  subjectId: 1,
  subjectName: 'Cálculo',
  dayOfWeek: 2,
  startTime: '14:00',
  endTime: '16:00',
  skills: ['Paciencia', 'Ejemplos prácticos'],
  preference: '',
};

// Criterios sueltos
assert.equal(experienceScore(5, 6), 88);
assert.equal(experienceScore(3, 2), 43);
assert.equal(experienceScore(1, 20), 60);
assert.equal(timeScore(8), 80);
assert.equal(timeScore(12), 100);
assert.equal(skillsScore({ skills: [], preference: '' }, tutors[0]).score, 100);
assert.equal(skillsScore({ skills: ['paciencia'], preference: '' }, tutors[0]).score, 100);
assert.equal(skillsScore({ skills: ['Paciencia', 'Ritmo ágil'], preference: '' }, tutors[0]).score, 50);
assert.equal(skillsScore({ skills: [], preference: 'que sea paciente' }, tutors[0]).score, 100);

// Ranking de la demo
const result = rankTutors(request, tutors, weights);
assert.deepEqual(result.ranked.map((item) => item.name), [
  'Laura Gómez',
  'Valentina Rojas',
  'Mariana Duarte',
  'Andrés Castillo',
]);
assert.deepEqual(result.ranked.map((item) => item.score), [96.2, 69.8, 56.9, 40.5]);
assert.deepEqual(result.excluded.map((item) => item.name), ['Camilo Herrera']);
assert.match(result.winner.justification, /96\.2 puntos/);
assert.match(result.winner.justification, /2 horas el martes/);
assert.match(result.winner.justification, /6 semestres como tutor/);
assert.match(result.winner.justification, /8 horas por semana/);
assert.match(result.winner.justification, /cubre Paciencia y Ejemplos prácticos/);
assert.match(result.ranked[1].justification, /no tiene Paciencia ni Ejemplos prácticos/);
assert.match(result.ranked[2].justification, /cubre Paciencia; no tiene Ejemplos prácticos/);

// Horario parcial: toma el bloque con más cruce del mismo día
const partial = bestScheduleOverlap(
  { dayOfWeek: 2, startTime: '14:00', endTime: '16:00' },
  [
    { dayOfWeek: 2, startTime: '08:00', endTime: '09:00' },
    { dayOfWeek: 2, startTime: '15:00', endTime: '18:00' },
    { dayOfWeek: 4, startTime: '14:00', endTime: '16:00' },
  ],
);
assert.equal(partial.minutes, 60);
assert.equal(partial.score, 50);

// Los pesos cambian el ganador
const timeFirst = rankTutors(
  { ...request, skills: [] },
  tutors,
  { mastery: 0, schedule: 0, experience: 0, time: 1, skills: 0 },
);
assert.equal(timeFirst.winner.name, 'Valentina Rojas');

const empty = rankTutors(request, [], weights);
assert.equal(empty.winner, null);

console.log('Algoritmo de afinidad: 5 grupos de pruebas correctos');
