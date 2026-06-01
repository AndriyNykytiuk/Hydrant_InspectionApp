import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import { Button } from '../../components/Button/Button.jsx';
import { Field } from '../../components/Field/Field.jsx';
import { Input } from '../../components/Input/Input.jsx';
import { extractError } from '../../api/client.js';
import './LoginPage.scss';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/hydrants';

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate(next, { replace: true });
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
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

        <Button type="submit" size="lg" fullWidth disabled={loading}>
          {loading ? 'Вхід...' : 'Увійти'}
        </Button>
      </form>
    </div>
  );
}
