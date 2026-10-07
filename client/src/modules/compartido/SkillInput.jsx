import { useId, useState } from 'react';

export default function SkillInput({ value, onChange, suggestions = [], max = 12 }) {
  const [draft, setDraft] = useState('');
  const listId = useId();
  const taken = new Set(value.map((item) => item.toLocaleLowerCase('es')));

  function add(raw) {
    const name = raw.replace(/\s+/g, ' ').trim();
    if (!name || name.length > 60 || value.length >= max) return;
    if (taken.has(name.toLocaleLowerCase('es'))) {
      setDraft('');
      return;
    }
    onChange([...value, name]);
    setDraft('');
  }

  function onKeyDown(event) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      add(draft);
    } else if (event.key === 'Backspace' && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="skill-input">
      {value.map((name) => (
        <span className="chip is-on" key={name}>
          {name}
          <button
            type="button"
            aria-label={`Quitar ${name}`}
            onClick={() => onChange(value.filter((item) => item !== name))}
          >
            ×
          </button>
        </span>
      ))}
      <input
        list={listId}
        value={draft}
        maxLength={60}
        placeholder={value.length >= max ? `Máximo ${max}` : 'Escribe y presiona Enter'}
        disabled={value.length >= max}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => add(draft)}
      />
      <datalist id={listId}>
        {suggestions
          .filter((name) => !taken.has(name.toLocaleLowerCase('es')))
          .map((name) => <option key={name} value={name} />)}
      </datalist>
    </div>
  );
}
