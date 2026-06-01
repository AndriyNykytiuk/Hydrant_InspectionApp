import './Field.scss';

export function Field({ label, error, hint, children, className = '' }) {
  return (
    <div className={`field ${className}`}>
      {label && <label className="field__label">{label}</label>}
      <div className="field__control">{children}</div>
      {error && <div className="field__error">{error}</div>}
      {hint && !error && <div className="field__hint">{hint}</div>}
    </div>
  );
}
