import { useEffect, useState } from 'react';
import {
  listBrigades,
  createBrigade,
  updateBrigade,
  deleteBrigade,
} from '../../api/brigades.js';
import { extractError } from '../../api/client.js';
import { Button } from '../../components/Button/Button.jsx';
import { Input } from '../../components/Input/Input.jsx';
import { Field } from '../../components/Field/Field.jsx';
import { Spinner } from '../../components/Spinner/Spinner.jsx';
import './AdminBrigadesPage.scss';

export function AdminBrigadesPage() {
  const [brigades, setBrigades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setBrigades(await listBrigades());
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createBrigade(newName.trim());
      setNewName('');
      load();
    } catch (err) {
      setError(extractError(err));
    }
  };

  const startEdit = (b) => {
    setEditingId(b.id);
    setEditingName(b.name);
  };

  const saveEdit = async () => {
    try {
      await updateBrigade(editingId, editingName);
      setEditingId(null);
      load();
    } catch (err) {
      setError(extractError(err));
    }
  };

  const onDelete = async (b) => {
    if (!confirm(`Видалити частину "${b.name}"?`)) return;
    try {
      await deleteBrigade(b.id);
      load();
    } catch (err) {
      alert(extractError(err));
    }
  };

  return (
    <div className="admin-brigades">
      <h1 className="admin-brigades__title">Частини</h1>

      <form className="admin-brigades__form" onSubmit={onCreate}>
        <Field label="нова частина" className="admin-brigades__form-field">
          <Input
            placeholder="Назва частини"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
        </Field>
        <Button type="submit">Створити</Button>
      </form>

      {error && <div className="admin-brigades__error">{error}</div>}

      {loading ? (
        <div className="admin-brigades__loading"><Spinner /></div>
      ) : (
        <ul className="brigade-list">
          {brigades.map((b) => (
            <li className="brigade-list__item" key={b.id}>
              {editingId === b.id ? (
                <>
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    autoFocus
                  />
                  <div className="brigade-list__actions">
                    <Button size="sm" onClick={saveEdit}>Зберегти</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      Скасувати
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="brigade-list__main">
                    <div className="brigade-list__name">{b.name}</div>
                    <div className="brigade-list__meta">
                      {b._count?.hydrants ?? 0} гідрантів
                    </div>
                  </div>
                  <div className="brigade-list__actions">
                    <Button size="sm" variant="secondary" onClick={() => startEdit(b)}>
                      Редагувати
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDelete(b)}>
                      Видалити
                    </Button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
