import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { Aviso, DAYS, LEVELS } from '../compartido/formato';
import SkillInput from '../compartido/SkillInput';

const emptyForm = {
  name: '',
  email: '',
  experienceLevel: 3,
  experienceSemesters: 0,
  weeklyHours: 4,
  skills: [],
  bio: '',
  subjects: [{ subjectId: '', mastery: 4 }],
  schedules: [{ dayOfWeek: 2, startTime: '14:00', endTime: '16:00' }],
};

export default function TutorFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [materias, setMaterias] = useState([]);
  const [habilidades, setHabilidades] = useState([]);
  const [nuevaMateria, setNuevaMateria] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    api.materias()
      .then((result) => { if (active) setMaterias(result); })
      .catch((err) => { if (active) setError(err.message); });
    api.habilidades()
      .then((result) => { if (active) setHabilidades(result.map((item) => item.name)); })
      .catch((err) => { if (active) setError(err.message); });
    if (id) {
      api.tutor(id)
        .then((tutor) => {
          if (!active) return;
          setForm({
            name: tutor.name,
            email: tutor.email,
            experienceLevel: tutor.experienceLevel,
            experienceSemesters: tutor.experienceSemesters,
            weeklyHours: tutor.weeklyHours,
            skills: tutor.skills,
            bio: tutor.bio,
            subjects: tutor.subjects.map((subject) => ({
              subjectId: String(subject.subjectId),
              mastery: subject.mastery,
            })),
            schedules: tutor.schedules.map((slot) => ({
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime,
            })),
          });
        })
        .catch((err) => { if (active) setError(err.message); });
    }
    return () => { active = false; };
  }, [id]);

  function updateSubject(index, field, value) {
    setForm((current) => ({
      ...current,
      subjects: current.subjects.map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      )),
    }));
  }

  function updateSchedule(index, field, value) {
    setForm((current) => ({
      ...current,
      schedules: current.schedules.map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      )),
    }));
  }

  async function agregarMateria(event) {
    event.preventDefault();
    const name = nuevaMateria.trim();
    if (!name) return;
    try {
      const created = await api.crearMateria(name);
      setMaterias((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name, 'es')));
      setForm((current) => ({
        ...current,
        subjects: [...current.subjects, { subjectId: String(created.id), mastery: 3 }],
      }));
      setNuevaMateria('');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function onSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.guardarTutor({
        ...form,
        experienceSemesters: Number(form.experienceSemesters),
        weeklyHours: Number(form.weeklyHours),
        subjects: form.subjects.map((subject) => ({
          subjectId: Number(subject.subjectId),
          mastery: Number(subject.mastery),
        })),
        schedules: form.schedules.map((slot) => ({
          ...slot,
          dayOfWeek: Number(slot.dayOfWeek),
        })),
      }, id);
      navigate('/tutores');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!window.confirm('¿Eliminar este tutor?')) return;
    try {
      await api.eliminarTutor(id);
      navigate('/tutores');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page page-narrow">
      <header className="page-head">
        <p className="eyebrow">Perfil de tutor</p>
        <h1>{id ? 'Editar tutor' : 'Nuevo tutor'}</h1>
      </header>
      <form className="panel form-card stack" onSubmit={onSubmit}>
        <Aviso>{error}</Aviso>
        <div className="row row-2">
          <label className="field">
            <span>Nombre</span>
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </label>
          <label className="field">
            <span>Correo</span>
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </label>
        </div>
        <fieldset className="field">
          <legend>Nivel de experiencia</legend>
          <div className="level-picker">
            {LEVELS.map((level) => (
              <button
                type="button"
                key={level.value}
                className={form.experienceLevel === level.value ? 'is-selected' : ''}
                onClick={() => setForm({ ...form, experienceLevel: level.value })}
              >
                <strong>{level.value}</strong>
                <span>{level.label}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <div className="row row-2">
          <label className="field">
            <span>Experiencia</span>
            <div className="input-suffix">
              <input
                type="number"
                min="0"
                max="20"
                value={form.experienceSemesters}
                onChange={(event) => setForm({ ...form, experienceSemesters: event.target.value })}
                required
              />
              <span>semestres como tutor</span>
            </div>
          </label>
          <label className="field">
            <span>Tiempo disponible</span>
            <div className="input-suffix">
              <input
                type="number"
                min="1"
                max="40"
                value={form.weeklyHours}
                onChange={(event) => setForm({ ...form, weeklyHours: event.target.value })}
                required
              />
              <span>horas por semana</span>
            </div>
          </label>
        </div>
        <div className="field">
          <span>Habilidades</span>
          <SkillInput
            value={form.skills}
            suggestions={habilidades}
            onChange={(skills) => setForm((current) => ({ ...current, skills }))}
          />
          <small>Por ejemplo: Paciencia, Ejemplos prácticos, Preparación de parciales. El estudiante elige entre estas al pedir ayuda.</small>
        </div>
        <label className="field">
          <span>Descripción</span>
          <textarea
            value={form.bio}
            maxLength={500}
            rows={3}
            onChange={(event) => setForm({ ...form, bio: event.target.value })}
            placeholder="Cómo explica, qué tipo de estudiante acompaña mejor."
          />
          <small>Las palabras de esta descripción se comparan con las preferencias del estudiante.</small>
        </label>

        <section className="form-section">
          <div className="form-section-head">
            <h2>Materias que domina</h2>
            <button
              type="button"
              className="link-button"
              onClick={() => setForm((current) => ({
                ...current,
                subjects: [...current.subjects, { subjectId: '', mastery: 3 }],
              }))}
            >
              + Agregar materia
            </button>
          </div>
          {form.subjects.map((subject, index) => (
            <div className="row row-subject" key={index}>
              <select
                aria-label="Materia"
                value={subject.subjectId}
                onChange={(event) => updateSubject(index, 'subjectId', event.target.value)}
                required
              >
                <option value="">Selecciona una materia</option>
                {materias.map((materia) => (
                  <option key={materia.id} value={materia.id}>{materia.name}</option>
                ))}
              </select>
              <select
                aria-label="Dominio"
                value={subject.mastery}
                onChange={(event) => updateSubject(index, 'mastery', Number(event.target.value))}
              >
                {LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>{level.value} · {level.label}</option>
                ))}
              </select>
              <button
                type="button"
                className="icon-button"
                aria-label="Quitar materia"
                title="Quitar materia"
                onClick={() => setForm((current) => ({
                  ...current,
                  subjects: current.subjects.filter((_, itemIndex) => itemIndex !== index),
                }))}
                disabled={form.subjects.length === 1}
              >
                ×
              </button>
            </div>
          ))}
          <div className="row row-add">
            <input
              value={nuevaMateria}
              placeholder="¿Falta una materia? Escríbela aquí"
              onChange={(event) => setNuevaMateria(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  agregarMateria(event);
                }
              }}
            />
            <button type="button" className="button-quiet" onClick={agregarMateria}>Crear materia</button>
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-head">
            <h2>Horarios disponibles</h2>
            <button
              type="button"
              className="link-button"
              onClick={() => setForm((current) => ({
                ...current,
                schedules: [...current.schedules, { dayOfWeek: 1, startTime: '08:00', endTime: '10:00' }],
              }))}
            >
              + Agregar horario
            </button>
          </div>
          {form.schedules.map((slot, index) => (
            <div className="row row-schedule" key={index}>
              <select
                aria-label="Día"
                value={slot.dayOfWeek}
                onChange={(event) => updateSchedule(index, 'dayOfWeek', Number(event.target.value))}
              >
                {DAYS.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
              </select>
              <input aria-label="Desde" type="time" value={slot.startTime} onChange={(event) => updateSchedule(index, 'startTime', event.target.value)} required />
              <input aria-label="Hasta" type="time" value={slot.endTime} onChange={(event) => updateSchedule(index, 'endTime', event.target.value)} required />
              <button
                type="button"
                className="icon-button"
                aria-label="Quitar horario"
                title="Quitar horario"
                onClick={() => setForm((current) => ({
                  ...current,
                  schedules: current.schedules.filter((_, itemIndex) => itemIndex !== index),
                }))}
                disabled={form.schedules.length === 1}
              >
                ×
              </button>
            </div>
          ))}
        </section>

        <div className="actions form-footer">
          {id ? <button type="button" className="button-danger" onClick={onDelete}>Eliminar</button> : null}
          <span className="spacer" />
          <Link className="button-quiet" to="/tutores">Cancelar</Link>
          <button className="button" type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar tutor'}</button>
        </div>
      </form>
    </div>
  );
}
