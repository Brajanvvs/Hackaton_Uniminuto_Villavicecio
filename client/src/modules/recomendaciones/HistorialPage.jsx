import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Aviso, formatDate, formatScore } from '../compartido/formato';

function Estado({ item }) {
  if (item.closedAt) return <span className="status status-cancelled" title={item.lastCancelReason}>Cancelada</span>;
  if (!item.chosenName && item.cancellations > 0) {
    return <span className="status status-pending" title={item.lastCancelReason}>Tutor canceló · elegir otro</span>;
  }
  if (!item.chosenName) return <span className="status status-pending">Pendiente</span>;
  if (item.chosenRank === 1) return <span className="status status-top">Eligió al sugerido</span>;
  return <span className="status status-other">Eligió el #{item.chosenRank}</span>;
}

export default function HistorialPage() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.recomendaciones()
      .then((result) => { if (active) setItems(result); })
      .catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, []);

  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Memoria del sistema</p>
        <h1>Historial de solicitudes</h1>
        <p>Cada solicitud guarda a quién recomendó el sistema y a quién eligió el estudiante, con la compatibilidad de ese momento.</p>
      </header>
      <Aviso>{error}</Aviso>
      {items && items.length === 0 ? <div className="panel empty">Todavía no hay solicitudes.</div> : null}
      {items && items.length > 0 ? (
        <section className="panel panel-table">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Estudiante</th>
                  <th>Materia</th>
                  <th>Más compatible</th>
                  <th>Tutor elegido</th>
                  <th>Estado</th>
                  <th className="num"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="muted">{formatDate(item.createdAt)}</td>
                    <td>{item.studentName}</td>
                    <td>{item.subjectName}</td>
                    <td>{item.tutorName ? `${item.tutorName} · ${formatScore(item.score)}` : 'Sin compatible'}</td>
                    <td>{item.chosenName ? <strong>{item.chosenName} · {formatScore(item.chosenScore)}</strong> : '—'}</td>
                    <td><Estado item={item} /></td>
                    <td className="num"><Link to={`/resultado/${item.id}`}>{item.chosenName || item.closedAt ? 'Ver' : 'Elegir'}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
      {!items && !error ? <p className="muted">Cargando…</p> : null}
    </div>
  );
}
