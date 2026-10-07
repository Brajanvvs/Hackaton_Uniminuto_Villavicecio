import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { Aviso, DAYS } from '../compartido/formato';

const emptyForm = {
  studentName: '',
  subjectId: '',
  dayOfWeek: 2,
  startTime: '14:00',
  endTime: '16:00',
  skills: [],
  preference: '',
};

export default function SolicitudPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [materias, setMaterias] = useState([]);
  const [habilidades, setHabilidades] = useState([]);
  const [error, setError] = useState('');
  const [existing, setExisting] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    api.materias()
      .then((result) => { if (active) setMaterias(result); })
      .catch((err) => { if (active) setError(err.message); });
    api.habilidades()
      .then((result) => { if (active) setHabilidades(result.filter((item) => item.tutors > 0)); })
      .catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, []);

  function cargarEjemplo() {
    const calculo = materias.find((materia) => materia.name === 'Cálculo');
    setForm({
      studentName: 'Camila Ríos',
      subjectId: calculo ? String(calculo.id) : '',
      dayOfWeek: 2,
      startTime: '14:00',
      endTime: '16:00',
      skills: ['Paciencia', 'Ejemplos prácticos'].filter((name) => habilidades.some((item) => item.name === name)),
      preference: '',
    });
  }

  function toggleSkill(name) {
    setForm((current) => {
      if (current.skills.includes(name)) {
        return { ...current, skills: current.skills.filter((item) => item !== name) };
      }
      if (current.skills.length >= 8) return current;
      return { ...current, skills: [...current.skills, name] };
    });
  }

  async function onSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setExisting(null);
    try {
      const result = await api.crearSolicitud({
        ...form,
        subjectId: Number(form.subjectId),
        dayOfWeek: Number(form.dayOfWeek),
      });
      navigate(`/resultado/${result.id}`);
    } catch (err) {
      setError(err.message);
      setExisting(err.recommendationId || null);
      setSaving(false);
    }
  }

  return (
    <div className="page page-narrow">
      <header className="page-head page-head-row">
        <div>
          <p className="eyebrow">Módulo de solicitud</p>
          <h1>Solicitud del estudiante</h1>
          <p>Indica la materia, el horario y lo que necesitas. Te mostramos los tutores más compatibles y tú eliges.</p>
        </div>
        <button type="button" className="button-quiet" onClick={cargarEjemplo} disabled={materias.length === 0}>
          Cargar ejemplo
        </button>
      </header>
      <form className="panel form-card stack" onSubmit={onSubmit}>
        {error ? (
          <Aviso>
            {error}
            {existing ? <> <Link to={`/resultado/${existing}`}>Ver esa solicitud</Link></> : null}
          </Aviso>
        ) : null}
        <label className="field">
          <span>Estudiante</span>
          <input
            value={form.studentName}
            placeholder="Nombre completo"
            onChange={(event) => setForm({ ...form, studentName: event.target.value })}
            required
          />
        </label>
        <label className="field">
          <span>Materia</span>
          <select value={form.subjectId} onChange={(event) => setForm({ ...form, subjectId: event.target.value })} required>
            <option value="">Selecciona una materia</option>
            {materias.map((materia) => <option key={materia.id} value={materia.id}>{materia.name}</option>)}
          </select>
        </label>
        <div className="row row-3">
          <label className="field">
            <span>Día</span>
            <select value={form.dayOfWeek} onChange={(event) => setForm({ ...form, dayOfWeek: Number(event.target.value) })}>
              {DAYS.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Desde</span>
            <input type="time" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} required />
          </label>
          <label className="field">
            <span>Hasta</span>
            <input type="time" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} required />
          </label>
        </div>
        <div className="field">
          <span>Habilidades que necesita <span className="muted">(opcional, hasta 8)</span></span>
          <div className="chip-group">
            {habilidades.map((item) => {
              const on = form.skills.includes(item.name);
              return (
                <button
                  type="button"
                  key={item.id}
                  className={on ? 'chip is-on' : 'chip'}
                  aria-pressed={on}
                  onClick={() => toggleSkill(item.name)}
                >
                  {item.name}
                </button>
              );
            })}
          </div>
        </div>
        <label className="field">
          <span>Otra preferencia <span className="muted">(opcional)</span></span>
          <textarea
            value={form.preference}
            maxLength={300}
            rows={2}
            placeholder="Ejemplo: que explique con calma"
            onChange={(event) => setForm({ ...form, preference: event.target.value })}
          />
          <small>Las palabras se buscan en las habilidades y la descripción del tutor. Sin habilidades ni preferencias, ese criterio no cambia el orden.</small>
        </label>
        <button className="button button-block" type="submit" disabled={saving}>
          {saving ? 'Calculando compatibilidad…' : 'Ver tutores recomendados'}
        </button>
      </form>
    </div>
  );
}
