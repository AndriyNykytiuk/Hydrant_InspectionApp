import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import { Button } from '../../components/Button/Button.jsx';
import { Field } from '../../components/Field/Field.jsx';
import { Input } from '../../components/Input/Input.jsx';
import { extractError, pingHealth } from '../../api/client.js';
import './LoginPage.scss';

// Якщо відповідь бекенду не приходить за стільки мс — показуємо банер
// «сервер прокидається» (Render присипляє free-сервіс при простої).
const COLD_START_HINT_MS = 2500;

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [waking, setWaking] = useState(false);
  const wakeTimer = useRef(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/hydrants';

  const startWakeWatch = () => {
    clearTimeout(wakeTimer.current);
    wakeTimer.current = setTimeout(() => setWaking(true), COLD_START_HINT_MS);
  };
  const stopWakeWatch = () => {
    clearTimeout(wakeTimer.current);
    setWaking(false);
  };

  // Будимо сервер одразу при відкритті сторінки, поки користувач вводить дані.
  useEffect(() => {
    let cancelled = false;
    startWakeWatch();
    pingHealth()
      .catch(() => {})
      .finally(() => {
        if (!cancelled) stopWakeWatch();
      });
    return () => {
      cancelled = true;
      clearTimeout(wakeTimer.current);
    };
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    startWakeWatch();
    try {
      await login(email, password);
      navigate(next, { replace: true });
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
      stopWakeWatch();
    }
  };

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={onSubmit}>
        <div className="login-form__brand">
          <span className="login-form__logo" aria-hidden="true"></span>
          <h1 className="login-form__title">пожежні гідранти</h1>
          <p className="login-form__subtitle">Система перевірки пожежних гідрантів</p>
        </div>

        <Field label="Логін">
          <Input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
            autoFocus
          />
        </Field>

        <Field label="Пароль">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </Field>

        {error && <div className="login-form__error">{error}</div>}

        {waking && !error && (
          <div className="login-form__waking" role="status">
            <span className="login-form__spinner" aria-hidden="true" />
            Сервер прокидається після простою — це може зайняти до хвилини. Зачекайте…
          </div>
        )}

        <Button type="submit" size="lg" fullWidth disabled={loading}>
          {loading ? 'Вхід...' : 'Увійти'}
        </Button>
      </form>
    </div>
  );
}
