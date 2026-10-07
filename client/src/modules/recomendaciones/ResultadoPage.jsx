import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { Aviso, CRITERIA, dayLabel, formatScore, formatWeight } from '../compartido/formato';
import CancelarTutoria from './CancelarTutoria';
import Comprobante from './Comprobante';
import ConfirmarEleccion from './ConfirmarEleccion';

const KNOWN_CRITERIA = [
  ...CRITERIA,
  { key: 'preference', label: 'Preferencias', short: 'Preferencia' },
];

function compatibility(score) {
  if (score >= 85) return { label: 'Muy alta', tone: 'high' };
  if (score >= 70) return { label: 'Alta', tone: 'high' };
  if (score >= 50) return { label: 'Media', tone: 'mid' };
  return { label: 'Baja', tone: 'low' };
}

function OptionCard({ option, rank, criteria, chosen, busy, declined, locked, saving, onChoose }) {
  const level = compatibility(option.score);
  const isChosen = chosen?.tutorId === option.tutorId;
  const isBusy = Boolean(busy) && !isChosen;
  const unavailable = isBusy || Boolean(declined);
  const reasons = option.justification.replace(/^.*?puntos\.\s*/, '');

  return (
    <article className={`option${rank === 1 ? ' is-top' : ''}${isChosen ? ' is-chosen' : ''}${unavailable ? ' is-busy' : ''}`}>
      <div className="option-score">
        <div className="score-dial score-dial-sm" style={{ '--p': option.score }}>
          <span>{formatScore(option.score)}</span>
        </div>
        <span className="level-caption">Compatibilidad</span>
        <span className={`level level-${level.tone}`}>{level.label}</span>
      </div>
      <div className="option-body">
        <div className="option-head">
          <span className="rank">#{rank}</span>
          <h2>{option.name}</h2>
          {rank === 1 ? <span className="badge-good">Más compatible</span> : null}
          {isChosen ? <span className="badge-chosen">Elegido</span> : null}
          {isBusy ? <span className="badge-busy">Hora ocupada</span> : null}
          {declined ? <span className="badge-busy">No puede asistir</span> : null}
        </div>
        {declined ? (
          <p className="busy-note">Canceló esta tutoría porque no puede asistir (comprobante {declined.code}).</p>
        ) : null}
        {isBusy && !declined ? (
          <p className="busy-note">
            Ya tiene una tutoría de {busy.startTime} a {busy.endTime} ese día, así que no puede atenderte en este horario.
          </p>
        ) : null}
        <p className="option-reasons">{reasons}</p>
        <ul className="mini-bars">
          {criteria.map(({ key, short }) => (
            <li key={key}>
              <span>{short}</span>
              <b>{option[key] ?? '—'}</b>
              <div className="bar-track"><div style={{ width: `${option[key] ?? 0}%` }} /></div>
            </li>
          ))}
        </ul>
      </div>
      <div className="option-action">
        {isChosen ? (
          <span className="chosen-mark">✓ Tu tutor</span>
        ) : locked ? null : (
          <button
            type="button"
            className={rank === 1 && !unavailable ? 'button' : 'button-quiet'}
            disabled={saving || unavailable}
            onClick={() => onChoose(option)}
          >
            {declined ? 'No disponible' : isBusy ? 'Ocupado' : 'Elegir'}
          </button>
        )}
      </div>
    </article>
  );
}

export default function ResultadoPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [pending, setPending] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let active = true;
    api.recomendacion(id)
      .then((result) => { if (active) setData(result); })
      .catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [id]);

  async function saveChoice(option) {
    setSaving(true);
    setError('');
    try {
      setData(await api.elegirTutor(id, option.tutorId));
      setPending(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message);
      setPending(null);
      if (err.code === 'HORA_OCUPADA') api.recomendacion(id).then(setData).catch(() => {});
    } finally {
      setSaving(false);
    }
  }

  async function cancelTutoring(body) {
    setSaving(true);
    setError('');
    try {
      setData(await api.cancelarTutoria(id, body));
      setCancelling(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message);
      setCancelling(false);
    } finally {
      setSaving(false);
    }
  }

  function onChoose(option) {
    const best = suggested;
    if (best && option.tutorId !== best.tutorId && option.score < best.score) {
      setPending(option);
      return;
    }
    saveChoice(option);
  }

  if (!data && error) return <div className="page"><Aviso>{error}</Aviso></div>;
  if (!data) return <div className="page"><p className="muted">Cargando recomendaciones…</p></div>;

  const weights = data.breakdown.weights || {};
  const criteria = KNOWN_CRITERIA.filter((item) => item.key in weights);
  const weightSum = criteria.reduce((sum, { key }) => sum + Number(weights[key] || 0), 0);
  const ranked = data.ranking.ranked || [];
  const excluded = data.ranking.excluded || [];
  const visible = showAll ? ranked : ranked.slice(0, 3);
  const request = data.request;
  const choice = data.choice;
  const top = ranked[0];
  const busyById = new Map((data.busy || []).map((item) => [item.tutorId, item]));
  const cancellations = data.cancellations || [];
  const declinedById = new Map(
    cancellations.filter((item) => item.reason === 'tutor').map((item) => [item.tutorId, item]),
  );
  const closed = Boolean(data.closedAt);
  const lastCancel = cancellations[0];
  const isFree = (option) => (!busyById.has(option.tutorId) || choice?.tutorId === option.tutorId)
    && !declinedById.has(option.tutorId);
  const suggested = ranked.find(isFree);
  const slot = `el ${dayLabel(request.dayOfWeek).toLowerCase()} de ${request.startTime} a ${request.endTime}`;
  const firstName = request.studentName.split(' ')[0];
  const receipts = cancellations.length > 0 ? (
    <section className="receipts">
      <div className="section-head">
        <h2>{cancellations.length === 1 ? 'Comprobante de cancelación' : 'Comprobantes de cancelación'}</h2>
        <button type="button" className="button-quiet no-print" onClick={() => window.print()}>Imprimir</button>
      </div>
      {cancellations.map((item) => (
        <Comprobante
          key={item.id}
          item={item}
          request={request}
          slot={`${dayLabel(request.dayOfWeek)}, ${request.startTime} a ${request.endTime}`}
        />
      ))}
    </section>
  ) : null;

  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Tutores recomendados</p>
        <h1>
          {closed
            ? `Solicitud de ${firstName} cancelada`
            : choice
              ? `${request.studentName} eligió a ${choice.name}`
              : `Elige tu tutor, ${firstName}`}
        </h1>
        <p>
          {request.subjectName}, {slot}.
          {request.skills?.length ? ` Necesita: ${request.skills.join(', ')}.` : ''}
          {request.preference ? ` Preferencia: “${request.preference}”.` : ''}
        </p>
      </header>

      <Aviso>{error}</Aviso>

      {closed ? (
        <div className="closed-banner">
          <strong>Tutoría cancelada: {lastCancel?.reasonLabel.toLowerCase()}</strong>
          <span>La solicitud quedó cerrada. Si {firstName} vuelve a necesitar tutoría, puede crear una nueva solicitud.</span>
        </div>
      ) : choice ? (
        <div className="choice-banner">
          <div>
            <strong>Elegiste a {choice.name}</strong>
            <span>
              {choice.rank === 1
                ? `Es el tutor más compatible: ${formatScore(choice.score)} de 100.`
                : `Compatibilidad ${formatScore(choice.score)} de 100, puesto ${choice.rank} del ranking. El más compatible era ${top.name} con ${formatScore(top.score)}.`}
            </span>
            <span className="muted">Puedes cambiar tu elección abajo.</span>
          </div>
          <button type="button" className="button-danger" onClick={() => setCancelling(true)} disabled={saving}>
            Cancelar tutoría
          </button>
        </div>
      ) : ranked.length > 0 ? (
        <>
          {lastCancel?.reason === 'tutor' ? (
            <div className="closed-banner closed-banner-soft">
              <strong>{lastCancel.tutorName} no puede asistir</strong>
              <span>La tutoría se canceló y la solicitud sigue abierta. Elige otro tutor.</span>
            </div>
          ) : null}
          <p className="hint">
            Ordenamos a los tutores por compatibilidad contigo.{' '}
            {!suggested
              ? 'Ningún tutor compatible está disponible a esa hora; prueba con otro horario.'
              : suggested === top
                ? 'Te sugerimos el primero, pero puedes elegir el que prefieras.'
                : `${top.name} no está disponible a esa hora, así que te sugerimos a ${suggested.name}.`}
          </p>
        </>
      ) : null}

      {closed ? receipts : null}

      {ranked.length === 0 ? (
        <div className="panel empty">Ningún tutor registrado domina {request.subjectName}.</div>
      ) : (
        <section className="options">
          {visible.map((option) => (
            <OptionCard
              key={option.tutorId}
              option={option}
              rank={ranked.indexOf(option) + 1}
              criteria={criteria}
              chosen={choice}
              busy={closed ? null : busyById.get(option.tutorId)}
              declined={declinedById.get(option.tutorId)}
              locked={closed}
              saving={saving}
              onChoose={onChoose}
            />
          ))}
          {ranked.length > 3 ? (
            <button type="button" className="link-button show-more" onClick={() => setShowAll(!showAll)}>
              {showAll ? 'Ver solo los 3 primeros' : `Ver los ${ranked.length} tutores compatibles`}
            </button>
          ) : null}
        </section>
      )}

      {weightSum > 0 && ranked.length > 0 ? (
        <details className="panel details">
          <summary>Cómo se calcula la compatibilidad</summary>
          <p className="muted">
            Cada criterio vale de 0 a 100 y se pondera con los pesos que define el coordinador. Para {top.name}:
          </p>
          <p className="formula">
            {formatScore(top.score)} = ({criteria.map(({ key }) => `${top[key] ?? 0}×${formatWeight(weights[key] || 0)}`).join(' + ')}) / {formatWeight(weightSum)}
          </p>
        </details>
      ) : null}

      {excluded.length > 0 ? (
        <section className="panel">
          <h2>Fuera del ranking</h2>
          <ul className="plain-list">
            {excluded.map((item) => <li key={item.tutorId}><strong>{item.name}</strong> · {item.reason}</li>)}
          </ul>
        </section>
      ) : null}

      {!closed ? receipts : null}

      {cancelling && choice ? (
        <CancelarTutoria
          tutorName={choice.name}
          slot={slot}
          saving={saving}
          onSubmit={cancelTutoring}
          onClose={() => setCancelling(false)}
        />
      ) : null}

      {pending ? (
        <ConfirmarEleccion
          option={pending}
          top={suggested}
          criteria={criteria}
          saving={saving}
          onConfirm={() => saveChoice(pending)}
          onChooseTop={() => saveChoice(suggested)}
          onCancel={() => setPending(null)}
        />
      ) : null}

      <div className="actions">
        <Link className="button-quiet" to="/solicitud">Nueva solicitud</Link>
        <Link to="/historial">Ver historial</Link>
      </div>
    </div>
  );
}
