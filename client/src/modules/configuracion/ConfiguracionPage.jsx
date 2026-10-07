import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Aviso, CRITERIA, formatWeight } from '../compartido/formato';

const initial = { mastery: 35, schedule: 30, experience: 15, time: 10, skills: 10 };

const formulaNames = {
  mastery: 'materia',
  schedule: 'horario',
  experience: 'experiencia',
  time: 'tiempo',
  skills: 'habilidades',
};

export default function ConfiguracionPage() {
  const [weights, setWeights] = useState(initial);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    api.configuracion()
      .then((result) => { if (active) setWeights(result); })
      .catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, []);

  const total = CRITERIA.reduce((sum, { key }) => sum + (Number(weights[key]) || 0), 0);

  async function onSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setSaved('');
    setError('');
    try {
      const body = {};
      for (const { key } of CRITERIA) body[key] = Number(weights[key]);
      const result = await api.guardarConfiguracion(body);
      setWeights(result);
      setSaved('Pesos actualizados. La próxima solicitud usa esta configuración.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page page-narrow">
      <header className="page-head">
        <p className="eyebrow">Módulo de configuración</p>
        <h1>Pesos del algoritmo</h1>
        <p>
          El coordinador decide qué importa más. Cada criterio se mide de 0 a 100 y el puntaje es su promedio ponderado.
          La materia sigue siendo un filtro: quien no la domina no entra al ranking.
        </p>
      </header>
      <form className="panel form-card stack" onSubmit={onSubmit}>
        <Aviso>{error}</Aviso>
        <Aviso tipo="ok">{saved}</Aviso>
        {CRITERIA.map(({ key, label, hint }) => {
          const value = Number(weights[key]) || 0;
          const percent = total > 0 ? Math.round((value / total) * 100) : 0;
          return (
            <label className="weight-row" key={key}>
              <div>
                <strong>{label}</strong>
                <small>{hint}</small>
                <div className="weight-share">
                  <div className="bar-track"><div style={{ width: `${percent}%` }} /></div>
                  <span>{percent}%</span>
                </div>
              </div>
              <input
                type="number"
                min="0"
                max="1000"
                step="1"
                value={weights[key] ?? 0}
                onChange={(event) => setWeights({ ...weights, [key]: event.target.value })}
                required
              />
            </label>
          );
        })}
        <p className="formula">
          puntaje = ({CRITERIA.map(({ key }) => `${formulaNames[key]}×${formatWeight(weights[key] || 0)}`).join(' + ')}) / {formatWeight(total)}
        </p>
        <button className="button button-block" type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar pesos'}</button>
      </form>
    </div>
  );
}
