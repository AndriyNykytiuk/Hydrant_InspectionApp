import { useEffect, useState } from 'react';
import { Modal } from '../Modal/Modal.jsx';
import { Button } from '../Button/Button.jsx';
import { Field } from '../Field/Field.jsx';
import { Input } from '../Input/Input.jsx';

export function DefectActModal({ open, onClose, onSubmit, target }) {
  const [surname, setSurname] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setSurname('');
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = surname.trim();
    if (!value) {
      setError('Введіть прізвище представника об\'єкта');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(value);
      onClose();
    } catch (err) {
      setError(err?.message || 'Не вдалося сформувати акт');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={submitting ? undefined : onClose}
      title="Сформувати акт виявлених несправностей"
      size="sm"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {target && (
          <div style={{ color: 'var(--color-text-muted, #666)', fontSize: 13 }}>
            {target}
          </div>
        )}
        <Field
          label="Прізвище представника об'єкта"
          hint="Власник / орендар / користувач / балансоутримувач"
        >
          <Input
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            placeholder="напр. Іваненко І.І."
            autoFocus
            disabled={submitting}
            required
          />
        </Field>

        {error && (
          <div style={{
            background: 'rgba(220, 53, 69, 0.1)',
            color: '#dc3545',
            padding: '8px 12px',
            borderRadius: 6,
            fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Скасувати
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Формую...' : 'Сформувати акт'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
