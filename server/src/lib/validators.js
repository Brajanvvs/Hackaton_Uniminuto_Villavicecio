export function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function parseSkillNames(value, { max, label }) {
  if (value == null) return { names: [] };
  if (!Array.isArray(value)) return { error: `${label} debe ser una lista.` };
  const names = [];
  const seen = new Set();
  for (const item of value) {
    const name = cleanText(item);
    if (!name) continue;
    if (name.length > 60) return { error: 'Cada habilidad admite máximo 60 caracteres.' };
    const key = name.toLocaleLowerCase('es');
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }
  if (names.length > max) return { error: `${label}: máximo ${max}.` };
  return { names };
}

export function asTime(value) {
  const match = String(value ?? '').trim().match(/^(\d{2}):(\d{2})/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return `${match[1]}:${match[2]}`;
}

export function minutes(value) {
  const time = asTime(value);
  if (!time) return null;
  const [hours, mins] = time.split(':').map(Number);
  return hours * 60 + mins;
}
