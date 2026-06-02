import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { listUsers, createUser, deleteUser } from '../../api/users.js';
import { listBrigades } from '../../api/brigades.js';
import { extractError } from '../../api/client.js';
import { Button } from '../../components/Button/Button.jsx';
import { Input, Select } from '../../components/Input/Input.jsx';
import { Field } from '../../components/Field/Field.jsx';
import { Spinner } from '../../components/Spinner/Spinner.jsx';
import './AdminUsersPage.scss';

const initialForm = { email: '', fullName: '', password: '', brigadeId: '', role: 'rw' };

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [brigades, setBrigades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [u, b] = await Promise.all([listUsers(), listBrigades()]);
      setUsers(u);
      setBrigades(b);
      if (!form.brigadeId && b[0]) setForm((f) => ({ ...f, brigadeId: b[0].id }));
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
    setError(null);
    setCreating(true);
    try {
      const payload = {
        email: form.email,
        fullName: form.fullName,
        password: form.password,
        role: form.role,
      };
      if (form.role === 'rw' || form.brigadeId) {
        payload.brigadeId = form.brigadeId ? Number(form.brigadeId) : null;
      }
      await createUser(payload);
      setForm({ ...initialForm, brigadeId: form.brigadeId, role: form.role });
      load();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setCreating(false);
    }
  };

  const onDelete = async (u) => {
    if (!confirm(`Видалити користувача ${u.email}?`)) return;
    try {
      await deleteUser(u.id);
      load();
    } catch (err) {
      alert(extractError(err));
    }
  };

  return (
    <div className="admin-users">
      <h1 className="admin-users__title">Користувачі</h1>

      <form className="admin-users__form" onSubmit={onCreate}>
        <Field label="ПІБ">
          <Input
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            required
          />
        </Field>
        <Field label="Логін">
          <Input
            type="text"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </Field>
        <Field label="Пароль" hint="">
          <Input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={8}
            placeholder="мінімум 8 символів"
          />
        </Field>
        <Field label="Роль">
          <Select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value, brigadeId: e.target.value === 'rw' ? form.brigadeId : '' })}
            required
          >
            <option value="rw">Відповідальний за проведення перевірок ПГ</option>
            <option value="viewer">Спостерігач</option>
            <option value="god">Адміністратор</option>
          </Select>
        </Field>
        <Field label={form.role === 'rw' ? 'Частина' : 'Частина (необов\'язково)'}>
          <Select
            value={form.brigadeId}
            onChange={(e) => setForm({ ...form, brigadeId: e.target.value })}
            required={form.role === 'rw'}
          >
            <option value="">{form.role === 'rw' ? 'Оберіть...' : 'Без частини'}</option>
            {brigades.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="admin-users__form-submit">
          <Button type="submit" disabled={creating}>
            {creating ? 'Створення...' : 'Створити користувача'}
          </Button>
        </div>
      </form>

      {error && <div className="admin-users__error">{error}</div>}

      {loading ? (
        <div className="admin-users__loading"><Spinner /></div>
      ) : (
        <table className="users-table">
          <thead>
            <tr>
              <th>ПІБ</th>
              <th>Логін</th>
              <th>Роль</th>
              <th>Частина</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={u.role === 'god' ? 'users-table__row--god' : ''}>
                <td>{u.fullName}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`users-table__role users-table__role--${u.role}`}>
                    {u.role === 'god'
                      ? 'Адмін'
                      : u.role === 'viewer'
                        ? 'Спостерігач'
                        : 'Відповідальний за проведення перевірок ПГ'}
                  </span>
                </td>
                <td>{u.brigade?.name || '—'}</td>
                <td>
                  {u.id !== currentUser?.id && (
                    <Button size="sm" variant="ghost" onClick={() => onDelete(u)}>
                      Видалити
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
