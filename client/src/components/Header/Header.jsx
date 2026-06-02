import { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import { listHydrants } from '../../api/hydrants.js';
import Hydrant from '../../pict/hydrant.svg';
import './Header.scss';

export function Header() {
  const { user, logout, isGod, canViewAll } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [defectCount, setDefectCount] = useState(0);

  const handleLogout = () => {
    if (!confirm('Вийти з облікового запису?')) return;
    logout();
    navigate('/login');
  };

  // Кількість несправних гідрантів для бейджа (оновлюємо при зміні сторінки).
  useEffect(() => {
    if (!canViewAll) return;
    listHydrants({ status: 'defect' })
      .then((d) => setDefectCount(d.length))
      .catch(() => {});
  }, [canViewAll, location.pathname]);

  const navLinks = [
    { to: '/hydrants', label: 'Пожежні гідранти', show: true },
    { to: '/defects', label: 'Несправні гідранти', show: canViewAll, badge: defectCount },
    { to: '/admin/brigades', label: 'Частини', show: isGod },
    { to: '/admin/users', label: 'Користувачі', show: isGod },
    { to: '/admin/hydrants/new', label: 'Додати гідранти', show: isGod },
  ];

  return (
    <header className="header">
      <div className="header__inner">
        <div className="header__brand">
          <span className="header__logo" aria-hidden="true"><img src={Hydrant} alt="Гідрант" /></span>
          <span className="header__title">Гідранти</span>
        </div>

        <button
          type="button"
          className="header__burger"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Закрити меню' : 'Відкрити меню'}
          aria-expanded={menuOpen}
          aria-controls="header-nav"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {menuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>

        <div
          className={`header__backdrop ${menuOpen ? 'header__backdrop--open' : ''}`}
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />

        <nav
          id="header-nav"
          className={`header__nav ${menuOpen ? 'header__nav--open' : ''}`}
        >
          <div className="header__nav-head">
            <span className="header__nav-title">Меню</span>
            <button
              type="button"
              className="header__nav-close"
              onClick={() => setMenuOpen(false)}
              aria-label="Закрити меню"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {navLinks
            .filter((l) => l.show)
            .map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `header__link ${isActive ? 'header__link--active' : ''}`
                }
              >
                {l.label}
                {l.badge > 0 && <span className="header__badge">{l.badge}</span>}
              </NavLink>
            ))}
        </nav>

        <div className="header__user">
          <div className="header__user-info">
            <div className="header__user-name">{user?.fullName}</div>
            <div className="header__user-meta">
              {user?.role === 'god'
                ? 'Адміністратор'
                : user?.role === 'viewer'
                  ? 'Спостерігач'
                  : 'Відповідальний за проведення перевірок ПГ'}
              {user?.brigade?.name ? ` · ${user.brigade.name}` : ''}
            </div>
          </div>
          <button
            type="button"
            className="header__logout"
            onClick={handleLogout}
            aria-label="Вийти з облікового запису"
            title="Вийти з облікового запису"
          >
            <svg
              className="header__logout-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="header__logout-label">Вийти</span>
          </button>
        </div>
      </div>
    </header>
  );
}
