import { useState, useEffect } from 'react';
import { Modal } from '../Modal/Modal.jsx';
import { Field } from '../Field/Field.jsx';
import { Input, Select } from '../Input/Input.jsx';
import { Button } from '../Button/Button.jsx';
import { createHydrant, updateHydrant } from '../../api/hydrants.js';
import { extractError } from '../../api/client.js';

const defaultValues = {
  number: '',
  address: '',
  networkType: 'ring',
  diameter: 100,
  brigadeId: '',
};

export function HydrantEditModal({ open, hydrant, brigades, onClose, onSaved }) {
  const [data, setData] = useState(defaultValues);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setError(null);
      setData(
        hydrant
          ? {
              number: hydrant.number,
              address: hydrant.address,
              networkType: hydrant.networkType,
              diameter: hydrant.diameter,
              brigadeId: hydrant.brigadeId,
            }
          : { ...defaultValues, brigadeId: brigades?.[0]?.id || '' }
      );
    }
  }, [open, hydrant, brigades]);

  const update = (patch) => setData((d) => ({ ...d, ...patch }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        number: data.number,
        address: data.address,
        networkType: data.networkType,
        diameter: Number(data.diameter),
        brigadeId: Number(data.brigadeId),
      };
      const saved = hydrant
        ? await updateHydrant(hydrant.id, payload)
        : await createHydrant(payload);
      onSaved?.(saved);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={hydrant ? 'Редагувати гідрант' : 'Новий гідрант'}
      size="md"
    >
      <form className="hydrant-edit-form" onSubmit={onSubmit}>
        <Field label="Номер">
          <Input
            value={data.number}
            onChange={(e) => update({ number: e.target.value })}
            required
            autoFocus
          />
        </Field>
        <Field label="Адреса">
          <Input
            value={data.address}
            onChange={(e) => update({ address: e.target.value })}
            required
          />
        </Field>
        <Field label="Тип мережі">
          <Select
            value={data.networkType}
            onChange={(e) => update({ networkType: e.target.value })}
          >
            <option value="ring">Кільцева</option>
            <option value="deadend">Тупикова</option>
          </Select>
        </Field>
        <Field label="Діаметр (мм)">
          <Input
            type="number"
            min="1"
            value={data.diameter}
            onChange={(e) => update({ diameter: e.target.value })}
            required
          />
        </Field>
        <Field label="Частина">
          <Select
            value={data.brigadeId}
            onChange={(e) => update({ brigadeId: e.target.value })}
            required
          >
            <option value="">Оберіть частину</option>
            {brigades?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </Field>

        {error && <div className="hydrant-edit-form__error">{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Скасувати
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Збереження...' : 'Зберегти'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
