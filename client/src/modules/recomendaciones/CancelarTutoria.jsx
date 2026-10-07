import { useEffect, useRef, useState } from 'react';

export const CANCEL_REASONS = [
  {
    value: 'tutor',
    label: 'El tutor no puede asistir',
    effect: 'La solicitud sigue abierta y el estudiante puede elegir otro tutor.',
  },
  {
    value: 'estudiante',
    label: 'El estudiante no puede asistir',
    effect: 'La solicitud se cierra. Si luego la necesita, crea una nueva.',
  },
  {
    value: 'no_necesita',
    label: 'Ya no necesita la tutoría',
    effect: 'La solicitud se cierra.',
  },
];

export default function CancelarTutoria({ tutorName, slot, saving, onSubmit, onClose }) {
  const dialogRef = useRef(null);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog.open) dialog.showModal();
    return () => dialog.close();
  }, []);

  function submit(event) {
    event.preventDefault();
    if (reason) onSubmit({ reason, note });
  }

  return (
    <dialog
      ref={dialogRef}
      className="confirm"
      aria-labelledby="cancel-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!saving) onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current && !saving) onClose();
      }}
    >
      <form className="confirm-body" onSubmit={submit}>
        <div className="confirm-icon confirm-icon-bad" aria-hidden="true">×</div>
        <h2 id="cancel-title">Cancelar la tutoría con {tutorName}</h2>
        <p className="muted">
          Tutoría {slot}. La cancelación no borra nada: queda un comprobante con el motivo y la fecha.
        </p>

        <fieldset className="reason-group">
          <legend>¿Por qué se cancela? <span className="muted">Elige una opción</span></legend>
          {CANCEL_REASONS.map((item) => (
            <label key={item.value} className={`reason${reason === item.value ? ' is-on' : ''}`}>
              <input
                type="radio"
                name="reason"
                value={item.value}
                checked={reason === item.value}
                onChange={() => setReason(item.value)}
                required
              />
              <span>
                <strong>{item.label}</strong>
                <small>{item.effect}</small>
              </span>
            </label>
          ))}
        </fieldset>

        <label className="field">
          <span>Comentario <span className="muted">(opcional)</span></span>
          <textarea
            rows={2}
            maxLength={300}
            value={note}
            placeholder="Ejemplo: el tutor tiene parcial ese día"
            onChange={(event) => setNote(event.target.value)}
          />
        </label>

        <div className="confirm-actions">
          <button type="button" className="button-quiet" onClick={onClose} disabled={saving}>Volver</button>
          <span className="spacer" />
          {!reason ? <span className="muted small">Elige un motivo para continuar</span> : null}
          <button type="submit" className="button-danger" disabled={saving || !reason}>
            {saving ? 'Cancelando…' : 'Cancelar tutoría'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
