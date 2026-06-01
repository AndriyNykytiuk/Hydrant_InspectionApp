import './Checkbox.scss';

export function Checkbox({ label, checked, onChange, disabled, className = '' }) {
  return (
    <label className={`checkbox ${disabled ? 'checkbox--disabled' : ''} ${className}`}>
      <input
        type="checkbox"
        className="checkbox__input"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="checkbox__box" aria-hidden="true" />
      <span className="checkbox__label">{label}</span>
    </label>
  );
}
