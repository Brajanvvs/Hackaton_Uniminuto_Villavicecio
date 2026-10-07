import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Aviso, formatDate, formatScore } from '../compartido/formato';

export default function Inicio() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.resumen()
      .then((result) => { if (active) setData(result); })
      .catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, []);

  return (
    <div className="page">
      <header className="page-head hero">
        <p className="eyebrow">Coordinación de tutorías</p>
        <h1>Cada estudiante elige su tutor, guiado por la compatibilidad.</h1>
        <p>
          Cuando un estudiante pide ayuda, Nexo compara materia, horario, experiencia, tiempo y habilidades de cada tutor.
          Le muestra los más compatibles con el porqué, y el estudiante decide.
        </p>
        <Link className="button" to="/solicitud">Crear solicitud</Link>
      </header>

      <Aviso>{error}</Aviso>

      <section className="stat-grid">
        <article>
          <span>Tutores</span>
          <strong>{data ? data.tutors : '—'}</strong>
        </article>
        <article>
          <span>Solicitudes</span>
          <strong>{data ? data.requests : '—'}</strong>
        </article>
        <article>
          <span>Tutor elegido</span>
          <strong>{data ? data.chosen : '—'}</strong>
          {data && data.chosen > 0 ? (
            <span>{Math.round((data.chosenTop / data.chosen) * 100)}% eligió al más compatible</span>
          ) : null}
        </article>
      </section>

      <section className="panel">
        <h2>Última solicitud</h2>
        {data?.latest ? (
          <div className="latest">
            <div>
              <p className="eyebrow">{data.latest.subjectName} · {formatDate(data.latest.createdAt)}</p>
              <h3>{data.latest.studentName}</h3>
              <p className="muted">
                {data.latest.chosenName
                  ? `Eligió a ${data.latest.chosenName} · compatibilidad ${formatScore(data.latest.chosenScore)}`
                  : data.latest.tutorName
                    ? `Pendiente de elegir · el más compatible es ${data.latest.tutorName} (${formatScore(data.latest.score)})`
                    : 'Sin tutores compatibles'}
              </p>
            </div>
            <Link className="button-quiet" to={`/resultado/${data.latest.id}`}>
              {data.latest.chosenName ? 'Ver detalle' : 'Elegir tutor'}
            </Link>
          </div>
        ) : (
          <p className="muted">{data ? 'Todavía no hay solicitudes.' : 'Cargando…'}</p>
        )}
      </section>
    </div>
  );
}
