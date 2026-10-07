import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Aviso, DAYS, levelLabel } from '../compartido/formato';

const THEMES = ['indigo', 'teal', 'amber', 'rose', 'violet', 'sky'];

function initials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function normalize(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function LevelDots({ value }) {
  return (
    <span className="level-dots" aria-label={`Nivel ${value} de 5`}>
      {[1, 2, 3, 4, 5].map((step) => <i key={step} className={step <= value ? 'is-on' : ''} />)}
    </span>
  );
}

function WeekStrip({ schedules }) {
  return (
    <div className="week-strip">
      {DAYS.map((day) => {
        const slots = schedules.filter((slot) => Number(slot.dayOfWeek) === day.value);
        const title = slots.length
          ? `${day.label}: ${slots.map((slot) => `${slot.startTime}–${slot.endTime}`).join(', ')}`
          : `${day.label}: sin horario`;
        return (
          <span key={day.value} className={slots.length ? 'is-on' : ''} title={title}>
            {day.label.slice(0, 2)}
          </span>
        );
      })}
    </div>
  );
}

function TutorCard({ tutor }) {
  const theme = THEMES[tutor.id % THEMES.length];
  const subjects = [...tutor.subjects].sort((a, b) => b.mastery - a.mastery);

  return (
    <article className={`tutor-card theme-${theme}`}>
      <header className="tutor-hero">
        <span className="tutor-avatar">{initials(tutor.name)}</span>
        <div className="tutor-id">
          <h2>{tutor.name}</h2>
          <div className="tutor-level">
            <LevelDots value={tutor.experienceLevel} />
            <span>{levelLabel(tutor.experienceLevel)}</span>
          </div>
        </div>
        <Link className="tutor-edit" to={`/tutores/${tutor.id}/editar`} aria-label={`Editar a ${tutor.name}`}>
          Editar
        </Link>
      </header>

      <div className="tutor-body">
        <p className="tutor-bio">{tutor.bio || 'Sin descripción.'}</p>

        <dl className="tutor-stats">
          <div><dt>Semestres</dt><dd>{tutor.experienceSemesters}</dd></div>
          <div><dt>h/semana</dt><dd>{tutor.weeklyHours}</dd></div>
          <div><dt>{tutor.subjects.length === 1 ? 'Materia' : 'Materias'}</dt><dd>{tutor.subjects.length}</dd></div>
        </dl>

        <section className="tutor-section">
          <h3>Domina</h3>
          <ul className="mastery-list">
            {subjects.map((subject) => (
              <li key={subject.subjectId}>
                <span>{subject.name}</span>
                <span className="mastery-bar" aria-label={`${subject.mastery} de 5`}>
                  {[1, 2, 3, 4, 5].map((step) => <i key={step} className={step <= subject.mastery ? 'is-on' : ''} />)}
                </span>
                <b>{subject.mastery}/5</b>
              </li>
            ))}
          </ul>
        </section>

        {tutor.skills.length > 0 ? (
          <section className="tutor-section">
            <h3>Habilidades</h3>
            <ul className="tag-list">
              {tutor.skills.map((skill) => <li className="tag-skill" key={skill}>{skill}</li>)}
            </ul>
          </section>
        ) : null}

        <section className="tutor-section tutor-week">
          <h3>Disponibilidad</h3>
          <WeekStrip schedules={tutor.schedules} />
          <p className="tutor-slots">
            {tutor.schedules.length
              ? tutor.schedules
                .map((slot) => `${DAYS.find((day) => day.value === Number(slot.dayOfWeek))?.label.slice(0, 3)} ${slot.startTime}–${slot.endTime}`)
                .join(' · ')
              : 'Sin horarios registrados'}
          </p>
        </section>
      </div>
    </article>
  );
}

export default function TutoresPage() {
  const [tutores, setTutores] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;
    api.tutores()
      .then((result) => { if (active) setTutores(result); })
      .catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, []);

  const visible = useMemo(() => {
    if (!tutores) return [];
    const term = normalize(query.trim());
    if (!term) return tutores;
    return tutores.filter((tutor) => normalize([
      tutor.name,
      tutor.bio || '',
      ...tutor.subjects.map((subject) => subject.name),
      ...tutor.skills,
    ].join(' ')).includes(term));
  }, [tutores, query]);

  return (
    <div className="page">
      <header className="page-head page-head-row">
        <div>
          <p className="eyebrow">Módulo de perfiles</p>
          <h1>Tutores</h1>
          <p>Cada perfil guarda materias, horarios, experiencia, tiempo disponible y habilidades.</p>
        </div>
        <Link className="button" to="/tutores/nuevo">Nuevo tutor</Link>
      </header>
      <Aviso>{error}</Aviso>

      {tutores?.length ? (
        <div className="tutor-toolbar">
          <input
            type="search"
            value={query}
            placeholder="Buscar por nombre, materia o habilidad"
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Buscar tutores"
          />
          <span className="muted">
            {visible.length === tutores.length ? `${tutores.length} tutores` : `${visible.length} de ${tutores.length}`}
          </span>
        </div>
      ) : null}

      <div className="tutor-grid">
        {visible.map((tutor) => <TutorCard key={tutor.id} tutor={tutor} />)}
      </div>
      {tutores?.length > 0 && visible.length === 0 ? (
        <div className="panel empty">Ningún tutor coincide con “{query}”.</div>
      ) : null}
      {tutores?.length === 0 ? <div className="panel empty">Todavía no hay tutores.</div> : null}
      {!tutores && !error ? <p className="muted">Cargando tutores…</p> : null}
    </div>
  );
}
