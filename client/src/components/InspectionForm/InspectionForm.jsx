import { useState } from 'react';
import { Field } from '../Field/Field.jsx';
import { Textarea } from '../Input/Input.jsx';
import { Button } from '../Button/Button.jsx';
import { YesNo } from '../YesNo/YesNo.jsx';
import { PhotoUploader } from '../PhotoUploader/PhotoUploader.jsx';
import { createInspection } from '../../api/hydrants.js';
import { extractError } from '../../api/client.js';
import {
  CHECKLIST_SECTIONS,
  OVERALL_KEY,
  OVERALL_LABEL,
  ALL_CHECK_KEYS,
  WATER_TEST_KEYS,
  GATE_LABEL,
} from './checklist.js';
import './InspectionForm.scss';

// Якщо гідрант уже перевіряли — переносимо попередні відповіді, щоб інспектор
// міняв лише те, що змінилось. Нові пункти (яких не було в тій перевірці) лишаються
// без відповіді.
const initialState = (latest) =>
  Object.fromEntries(
    ALL_CHECK_KEYS.map((k) => [k, typeof latest?.[k] === 'boolean' ? latest[k] : null])
  );

const formatDate = (d) =>
  new Date(d).toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

export function InspectionForm({ hydrant, onSaved, onCancel }) {
  const latest = hydrant.latestInspection;
  const [checks, setChecks] = useState(() => initialState(latest));
  // Пуск води вмикаємо автоматично, якщо у попередній перевірці на ці пункти відповідали.
  const [waterTested, setWaterTested] = useState(() =>
    WATER_TEST_KEYS.some((k) => typeof latest?.[k] === 'boolean')
  );
  const [weakness, setWeakness] = useState('');
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const setCheck = (key, value) => setChecks((c) => ({ ...c, [key]: value }));

  // Перемикач "Перевірка з пуском води": при вимкненні скидаємо відповіді секції.
  const toggleWaterTest = (on) => {
    setWaterTested(on);
    if (!on) {
      setChecks((c) => {
        const next = { ...c };
        for (const k of WATER_TEST_KEYS) next[k] = null;
        return next;
      });
    }
  };

  // Пункти секції з пуском води не вимагаються, поки чекбокс вимкнено.
  const requiredKeys = waterTested
    ? ALL_CHECK_KEYS
    : ALL_CHECK_KEYS.filter((k) => !WATER_TEST_KEYS.includes(k));
  const unanswered = requiredKeys.filter((k) => checks[k] === null);
  const ready = unanswered.length === 0;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!ready) {
      setError(`Не заповнені пункти: ${unanswered.length}`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const inspection = await createInspection(
        hydrant.id,
        { ...checks, weakness },
        files
      );
      onSaved?.(inspection);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="inspection-form" onSubmit={onSubmit}>
      <div className="inspection-form__hydrant">
        <div className="inspection-form__hydrant-row">
          <span className="inspection-form__hydrant-label">Гідрант №</span>
          <span className="inspection-form__hydrant-value">{hydrant.number}</span>
        </div>
        <div className="inspection-form__hydrant-row">
          <span className="inspection-form__hydrant-label">Адреса</span>
          <span className="inspection-form__hydrant-value">{hydrant.address}</span>
        </div>
        <div className="inspection-form__hydrant-row">
          <span className="inspection-form__hydrant-label">Тип / Ø</span>
          <span className="inspection-form__hydrant-value">
            {hydrant.networkType === 'ring' ? 'кільцева' : 'тупикова'} · {hydrant.diameter} мм
          </span>
        </div>
      </div>

 

      {latest && (
        <div className="inspection-form__carryover">
          Відповіді перенесено з перевірки від {formatDate(latest.createdAt)}
          {latest.inspector?.fullName ? ` (${latest.inspector.fullName})` : ''}. Змініть лише те, що відрізняється, і збережіть.
        </div>
      )}

      {CHECKLIST_SECTIONS.map((section) => (
        <fieldset key={section.title} className="inspection-form__section">
          <legend className="inspection-form__section-title">{section.title}</legend>

          {section.gated && (
            <label className="inspection-form__gate">
              <input
                type="checkbox"
                checked={waterTested}
                onChange={(e) => toggleWaterTest(e.target.checked)}
                disabled={saving}
              />
              <span>{GATE_LABEL}</span>
            </label>
          )}

          {(!section.gated || waterTested) &&
            section.items.map((item) => (
              <Field key={item.key} label={item.label}>
                <YesNo
                  name={item.key}
                  value={checks[item.key]}
                  onChange={(v) => setCheck(item.key, v)}
                  disabled={saving}
                />
              </Field>
            ))}
        </fieldset>
      ))}

      <Field label="Інші виявлені недоліки / коментар" hint="Опишіть текстом, якщо є">
        <Textarea
          value={weakness}
          onChange={(e) => setWeakness(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Наприклад: підтікання після закриття, тощо..."
          disabled={saving}
        />
      </Field>
           <Field label={OVERALL_LABEL}>
        <YesNo
          name={OVERALL_KEY}
          value={checks[OVERALL_KEY]}
          onChange={(v) => setCheck(OVERALL_KEY, v)}
          disabled={saving}
        />
      </Field>
       {/* <Field label="Фото">
        <PhotoUploader files={files} onChange={setFiles} disabled={saving} />
      </Field>
      */}
      

      {error && <div className="inspection-form__error">{error}</div>}

      <div className="inspection-form__actions">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            Скасувати
          </Button>
        )}
        
        <Button type="submit" disabled={saving || !ready}>
          {saving ? 'Збереження...' : 'Зберегти перевірку'}
        </Button>
      </div>
    </form>
  );
}
