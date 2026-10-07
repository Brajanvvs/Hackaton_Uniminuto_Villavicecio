import { useEffect, useRef } from 'react';
import { formatScore } from '../compartido/formato';

function listJoin(items) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}

function reasonsOf(option) {
  return option.justification.replace(/^.*?puntos\.\s*/, '');
}

export default function ConfirmarEleccion({ option, top, criteria, saving, onConfirm, onChooseTop, onCancel }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog.open) dialog.showModal();
    return () => dialog.close();
  }, []);

  const gap = top.score - option.score;
  const advantages = criteria.filter(({ key }) => (top[key] ?? 0) > (option[key] ?? 0));

  return (
    <dialog
      ref={dialogRef}
      className="confirm"
      aria-labelledby="confirm-title"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onCancel();
      }}
    >
      <div className="confirm-body">
        <div className="confirm-icon" aria-hidden="true">!</div>
        <h2 id="confirm-title">¿Seguro que quieres elegir a {option.name}?</h2>
        <p className="muted">
          <strong>{top.name}</strong> es más compatible contigo: {formatScore(top.score)} frente a {formatScore(option.score)},
          {' '}{formatScore(gap)} puntos más.
        </p>

        <table className="compare">
          <thead>
            <tr>
              <th>Criterio</th>
              <th className="num">{top.name.split(' ')[0]} <span className="tag-reco">recomendado</span></th>
              <th className="num">{option.name.split(' ')[0]}</th>
            </tr>
          </thead>
          <tbody>
            {criteria.map(({ key, short }) => {
              const a = top[key] ?? 0;
              const b = option[key] ?? 0;
              return (
                <tr key={key}>
                  <td>{short}</td>
                  <td className={`num${a > b ? ' is-better' : ''}`}>{a}</td>
                  <td className={`num${b > a ? ' is-better' : ''}`}>{b}</td>
                </tr>
              );
            })}
            <tr className="compare-total">
              <td>Compatibilidad</td>
              <td className="num is-better">{formatScore(top.score)}</td>
              <td className="num">{formatScore(option.score)}</td>
            </tr>
          </tbody>
        </table>

        <div className="confirm-why">
          <strong>Por qué recomendamos a {top.name}</strong>
          {advantages.length > 0 ? (
            <p>Le supera en {listJoin(advantages.map(({ short }) => short.toLowerCase()))}.</p>
          ) : null}
          <p className="muted">{reasonsOf(top)}</p>
        </div>

        <div className="confirm-actions">
          <button type="button" className="button-quiet" onClick={onCancel} disabled={saving}>Cancelar</button>
          <span className="spacer" />
          <button type="button" className="button-quiet" onClick={onConfirm} disabled={saving}>
            Sí, elegir a {option.name.split(' ')[0]}
          </button>
          <button type="button" className="button" onClick={onChooseTop} disabled={saving} autoFocus>
            Elegir a {top.name.split(' ')[0]}
          </button>
        </div>
      </div>
    </dialog>
  );
}
