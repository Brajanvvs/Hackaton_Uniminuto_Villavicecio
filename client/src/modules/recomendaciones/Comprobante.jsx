import { formatDate } from '../compartido/formato';

export default function Comprobante({ item, request, slot }) {
  return (
    <article className="receipt">
      <header className="receipt-head">
        <div>
          <span className="eyebrow">Comprobante de cancelación</span>
          <strong className="receipt-code">{item.code}</strong>
        </div>
        <span className="muted">{formatDate(item.createdAt)}</span>
      </header>
      <dl className="receipt-data">
        <div><dt>Estudiante</dt><dd>{request.studentName}</dd></div>
        <div><dt>Materia</dt><dd>{request.subjectName}</dd></div>
        <div><dt>Horario</dt><dd>{slot}</dd></div>
        <div><dt>Tutor</dt><dd>{item.tutorName}</dd></div>
        <div className="receipt-wide"><dt>Motivo</dt><dd><strong>{item.reasonLabel}</strong></dd></div>
        {item.note ? <div className="receipt-wide"><dt>Comentario</dt><dd>“{item.note}”</dd></div> : null}
      </dl>
    </article>
  );
}
