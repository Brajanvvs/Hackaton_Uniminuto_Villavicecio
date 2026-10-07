import { pool } from '../../config/db.js';
import { ensureSkills } from '../habilidades/habilidades.repository.js';

const tutorColumns = 'id, name, email, experience_level, experience_semesters, weekly_hours, bio';

function hhmm(value) {
  return String(value).slice(0, 5);
}

function mapTutor(row, children) {
  return {
    id: row.id,
    name: row.name,
    email: row.email || '',
    experienceLevel: Number(row.experience_level),
    experienceSemesters: Number(row.experience_semesters),
    weeklyHours: Number(row.weekly_hours),
    bio: row.bio || '',
    skills: children.skills
      .filter((item) => item.tutor_id === row.id)
      .map((item) => item.name),
    subjects: children.subjects
      .filter((item) => item.tutor_id === row.id)
      .map((item) => ({
        subjectId: item.subject_id,
        name: item.name,
        mastery: Number(item.mastery),
      })),
    schedules: children.schedules
      .filter((item) => item.tutor_id === row.id)
      .map((item) => ({
        id: item.id,
        dayOfWeek: Number(item.day_of_week),
        startTime: hhmm(item.start_time),
        endTime: hhmm(item.end_time),
      })),
  };
}

async function loadChildren() {
  const [subjects] = await pool.query(`
    SELECT ts.tutor_id, ts.subject_id, ts.mastery, s.name
    FROM tutor_subjects ts
    JOIN subjects s ON s.id = ts.subject_id
    ORDER BY s.name
  `);
  const [schedules] = await pool.query(`
    SELECT id, tutor_id, day_of_week, start_time, end_time
    FROM tutor_schedules
    ORDER BY day_of_week, start_time
  `);
  const [skills] = await pool.query(`
    SELECT ts.tutor_id, s.name
    FROM tutor_skills ts
    JOIN skills s ON s.id = ts.skill_id
    ORDER BY s.name
  `);
  return { subjects, schedules, skills };
}

export async function listTutors() {
  const [tutors] = await pool.query(`SELECT ${tutorColumns} FROM tutors ORDER BY name`);
  const children = await loadChildren();
  return tutors.map((tutor) => mapTutor(tutor, children));
}

export async function getTutor(id) {
  const [tutors] = await pool.query(`SELECT ${tutorColumns} FROM tutors WHERE id = ?`, [id]);
  if (!tutors[0]) return null;
  const children = await loadChildren();
  return mapTutor(tutors[0], children);
}

async function replaceProfile(connection, tutorId, profile) {
  await connection.execute('DELETE FROM tutor_subjects WHERE tutor_id = ?', [tutorId]);
  await connection.execute('DELETE FROM tutor_schedules WHERE tutor_id = ?', [tutorId]);
  await connection.execute('DELETE FROM tutor_skills WHERE tutor_id = ?', [tutorId]);
  for (const subject of profile.subjects) {
    await connection.execute(
      'INSERT INTO tutor_subjects (tutor_id, subject_id, mastery) VALUES (?, ?, ?)',
      [tutorId, subject.subjectId, subject.mastery],
    );
  }
  for (const slot of profile.schedules) {
    await connection.execute(
      'INSERT INTO tutor_schedules (tutor_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)',
      [tutorId, slot.dayOfWeek, slot.startTime, slot.endTime],
    );
  }
  const skillIds = await ensureSkills(connection, profile.skills);
  for (const skillId of skillIds) {
    await connection.execute('INSERT INTO tutor_skills (tutor_id, skill_id) VALUES (?, ?)', [tutorId, skillId]);
  }
}

function tutorValues(tutor) {
  return [
    tutor.name,
    tutor.email || null,
    tutor.experienceLevel,
    tutor.experienceSemesters,
    tutor.weeklyHours,
    tutor.bio || null,
  ];
}

export async function insertTutor(connection, profile) {
  const [result] = await connection.execute(
    `INSERT INTO tutors (name, email, experience_level, experience_semesters, weekly_hours, bio)
     VALUES (?, ?, ?, ?, ?, ?)`,
    tutorValues(profile.tutor),
  );
  await replaceProfile(connection, result.insertId, profile);
  return result.insertId;
}

export async function updateTutor(connection, id, profile) {
  const [result] = await connection.execute(
    `UPDATE tutors
     SET name = ?, email = ?, experience_level = ?, experience_semesters = ?, weekly_hours = ?, bio = ?
     WHERE id = ?`,
    [...tutorValues(profile.tutor), id],
  );
  if (result.affectedRows === 0) return false;
  await replaceProfile(connection, id, profile);
  return true;
}

export async function deleteTutor(id) {
  const [result] = await pool.execute('DELETE FROM tutors WHERE id = ?', [id]);
  return result.affectedRows > 0;
}
