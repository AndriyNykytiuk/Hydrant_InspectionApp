import './YesNo.scss';

export function YesNo({ name, value, onChange, disabled }) {
  return (
    <div className="yes-no">
      <label
        className={`yes-no__option ${value === true ? 'yes-no__option--active yes-no__option--yes' : ''}`}
      >
        <input
          type="radio"
          name={name}
          className="yes-no__input"
          checked={value === true}
          onChange={() => onChange(true)}
          disabled={disabled}
        />
        Так
      </label>
      <label
        className={`yes-no__option ${value === false ? 'yes-no__option--active yes-no__option--no' : ''}`}
      >
        <input
          type="radio"
          name={name}
          className="yes-no__input"
          checked={value === false}
          onChange={() => onChange(false)}
          disabled={disabled}
        />
        Ні
      </label>
    </div>
  );
}
