import { Children, useEffect, useRef } from 'react';

export const DAYS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
];

export const LEVELS = [
  { value: 1, label: 'Inicial' },
  { value: 2, label: 'Básico' },
  { value: 3, label: 'Intermedio' },
  { value: 4, label: 'Avanzado' },
  { value: 5, label: 'Experto' },
];

export const CRITERIA = [
  { key: 'mastery', label: 'Maestría en la materia', short: 'Materia', hint: 'Qué tan bien domina la materia pedida, de 1 a 5.' },
  { key: 'schedule', label: 'Horario en común', short: 'Horario', hint: 'Cuánto del bloque pedido puede cubrir.' },
  { key: 'experience', label: 'Experiencia', short: 'Experiencia', hint: 'Promedio entre su nivel (1 a 5) y sus semestres como tutor (8 o más cuentan completo).' },
  { key: 'time', label: 'Tiempo disponible', short: 'Tiempo', hint: 'Horas por semana que dedica a tutorías (10 o más cuentan completo).' },
  { key: 'skills', label: 'Habilidades', short: 'Habilidades', hint: 'Habilidades pedidas por el estudiante que el tutor tiene en su perfil.' },
];

export function plural(count, singular, pluralForm) {
  return `${count} ${Number(count) === 1 ? singular : pluralForm}`;
}

export function dayLabel(value) {
  return DAYS.find((day) => day.value === Number(value))?.label || '';
}

export function levelLabel(value) {
  return LEVELS.find((level) => level.value === Number(value))?.label || '';
}

export function formatScore(value) {
  return Number(value).toFixed(1);
}

export function formatWeight(value) {
  const number = Number(value);
  return Number.isInteger(number) ? String(number) : number.toFixed(1);
}

export function formatDate(value) {
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return String(value || '');
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function Aviso({ children, tipo = 'error' }) {
  const ref = useRef(null);
  const parts = Children.toArray(children);
  const text = parts.filter((part) => typeof part === 'string' || typeof part === 'number').join('').trim();
  const empty = parts.length === 0 || (parts.every((part) => typeof part === 'string') && !text);

  useEffect(() => {
    if (!empty && tipo === 'error') ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [text, empty, tipo]);

  if (empty) return null;
  return <p ref={ref} className={`aviso aviso-${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>{children}</p>;
}
