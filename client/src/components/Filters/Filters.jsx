import { Input, Select } from '../Input/Input.jsx';
import { Field } from '../Field/Field.jsx';
import './Filters.scss';

export function Filters({ value, onChange, brigades, showBrigadeFilter }) {
  const update = (patch) => onChange({ ...value, ...patch });

  return (
    <div className="filters">
      <Field label="Пошук" className="filters__field filters__field--wide">
        <Input
          type="search"
          placeholder="Номер або адреса..."
          value={value.q || ''}
          onChange={(e) => update({ q: e.target.value })}
        />
      </Field>

      {showBrigadeFilter && (
        <Field label="Частина" className="filters__field">
          <Select
            value={value.brigadeId || ''}
            onChange={(e) => update({ brigadeId: e.target.value })}
          >
            <option value="">Усі частини</option>
            {brigades?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Field label="Статус" className="filters__field">
        <Select
          value={value.status || ''}
          onChange={(e) => update({ status: e.target.value })}
        >
          <option value="">Усі</option>
          <option value="ok">Справний</option>
          <option value="defect">З недоліками</option>
          <option value="not-inspected">Не перевірено</option>
        </Select>
      </Field>

      <Field label="Тип мережі" className="filters__field">
        <Select
          value={value.networkType || ''}
          onChange={(e) => update({ networkType: e.target.value })}
        >
          <option value="">Будь-який</option>
          <option value="ring">Кільцева</option>
          <option value="deadend">Тупикова</option>
        </Select>
      </Field>
    </div>
  );
}
