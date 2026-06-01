import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listBrigades } from '../../api/brigades.js';
import { createHydrantsBulk } from '../../api/hydrants.js';
import { extractError } from '../../api/client.js';
import { Button } from '../../components/Button/Button.jsx';
import { Input, Select } from '../../components/Input/Input.jsx';
import { Field } from '../../components/Field/Field.jsx';
import './AdminCreateHydrantsPage.scss';

const emptyRow = () => ({
  number: '',
  address: '',
  networkType: 'ring',
  diameter: '',
  count: 1,
});

const expandRow = (r, brigadeId) => {
  const count = Math.max(1, parseInt(r.count, 10) || 1);
  const baseNumber = r.number.trim();
  const items = [];
  const isPureNumber = /^\d+$/.test(baseNumber);
  if (count > 1 && !isPureNumber) {
    throw new Error(
      `Для кількості > 1 номер має бути цілим числом (поточне: "${baseNumber}")`
    );
  }
  for (let i = 0; i < count; i++) {
    items.push({
      number: count === 1 ? baseNumber : String(Number(baseNumber) + i),
      address: r.address.trim(),
      networkType: r.networkType,
      diameter: Number(r.diameter),
      brigadeId: Number(brigadeId),
    });
  }
  return items;
};

export function AdminCreateHydrantsPage() {
  const navigate = useNavigate();
  const [brigades, setBrigades] = useState([]);
  const [brigadeId, setBrigadeId] = useState('');
  const [rows, setRows] = useState([emptyRow()]);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listBrigades().then((b) => {
      setBrigades(b);
      if (b[0]) setBrigadeId(b[0].id);
    });
  }, []);

  const updateRow = (idx, patch) =>
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const removeRow = (idx) => setRows((rs) => rs.filter((_, i) => i !== idx));

  const addRow = () => setRows((rs) => [...rs, emptyRow()]);

  const totalToCreate = useMemo(
    () =>
      rows.reduce((sum, r) => {
        if (!r.number.trim() || !r.address.trim() || !r.diameter) return sum;
        const n = Math.max(1, parseInt(r.count, 10) || 1);
        return sum + n;
      }, 0),
    [rows]
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!brigadeId) {
      setError('Оберіть частину');
      return;
    }
    const filled = rows.filter((r) => r.number.trim() || r.address.trim());
    if (filled.length === 0) {
      setError('Заповніть хоча б один рядок');
      return;
    }
    for (const r of filled) {
      if (!r.number.trim() || !r.address.trim() || !r.diameter) {
        setError('Заповніть усі поля у кожному рядку');
        return;
      }
    }

    let items;
    try {
      items = filled.flatMap((r) => expandRow(r, brigadeId));
    } catch (err) {
      setError(err.message);
      return;
    }

    setSaving(true);
    try {
      const res = await createHydrantsBulk(items);
      alert(`Створено гідрантів: ${res.created}`);
      navigate('/hydrants');
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-create">
      <h1 className="admin-create__title">Додати гідранти</h1>
      <p className="admin-create__subtitle">
        Можна додати один або кілька гідрантів за раз. У стовпчику "К-ть" вкажи число, щоб
        створити N гідрантів за тією ж адресою з послідовними номерами (наприклад 123 + к-ть 5
        → 123, 124, 125, 126, 127).
      </p>

      <form onSubmit={onSubmit}>
        <Field label="Частина" className="admin-create__brigade">
          <Select
            value={brigadeId}
            onChange={(e) => setBrigadeId(e.target.value)}
            required
          >
            <option value="">Оберіть...</option>
            {brigades.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="admin-create__table">
          <div className="admin-create__row admin-create__row--head">
            <div>№</div>
            <div>Номер</div>
            <div>Адреса</div>
            <div>Тип мережі</div>
            <div>Ø (мм)</div>
            <div>К-ть</div>
            <div></div>
          </div>

          {rows.map((r, idx) => {
            const count = Math.max(1, parseInt(r.count, 10) || 1);
            const isPureNumber = /^\d+$/.test(r.number.trim());
            const showCountWarn = count > 1 && r.number.trim() && !isPureNumber;
            return (
              <div className="admin-create__row" key={idx}>
                <div className="admin-create__index">{idx + 1}</div>
                <Input
                  value={r.number}
                  onChange={(e) => updateRow(idx, { number: e.target.value })}
                  placeholder="напр. 123"
                  invalid={showCountWarn}
                />
                <Input
                  value={r.address}
                  onChange={(e) => updateRow(idx, { address: e.target.value })}
                  placeholder="вул., буд."
                />
                <Select
                  value={r.networkType}
                  onChange={(e) => updateRow(idx, { networkType: e.target.value })}
                >
                  <option value="ring">кільцева</option>
                  <option value="deadend">тупикова</option>
                </Select>
                <Input
                  type="number"
                  min="1"
                  value={r.diameter}
                  onChange={(e) => updateRow(idx, { diameter: e.target.value })}
                  placeholder="100"
                />
                <Input
                  type="number"
                  min="1"
                  max="500"
                  value={r.count}
                  onChange={(e) => updateRow(idx, { count: e.target.value })}
                  placeholder="1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRow(idx)}
                  disabled={rows.length === 1}
                >
                  ×
                </Button>
              </div>
            );
          })}
        </div>

        <div className="admin-create__add-row">
          <Button type="button" variant="secondary" onClick={addRow}>
            + Додати рядок
          </Button>
        </div>

        {error && <div className="admin-create__error">{error}</div>}

        <div className="admin-create__actions">
          <Button variant="ghost" onClick={() => navigate('/hydrants')} disabled={saving}>
            Скасувати
          </Button>
          <Button type="submit" size="lg" disabled={saving || totalToCreate === 0}>
            {saving ? 'Збереження...' : `Створити (${totalToCreate})`}
          </Button>
        </div>
      </form>
    </div>
  );
}
