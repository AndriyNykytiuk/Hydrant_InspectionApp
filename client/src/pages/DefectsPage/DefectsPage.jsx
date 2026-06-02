import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listHydrants } from '../../api/hydrants.js';
import { listBrigades } from '../../api/brigades.js';
import { extractError } from '../../api/client.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { getInspectionDefects } from '../../components/InspectionForm/checklist.js';
import { Button } from '../../components/Button/Button.jsx';
import { Spinner } from '../../components/Spinner/Spinner.jsx';
import { Select } from '../../components/Input/Input.jsx';
import './DefectsPage.scss';

const formatDateTime = (d) =>
  new Date(d).toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export function DefectsPage() {
  const navigate = useNavigate();
  const { canViewAll } = useAuth();
  const [hydrants, setHydrants] = useState([]);
  const [brigades, setBrigades] = useState([]);
  const [brigadeId, setBrigadeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { status: 'defect' };
      if (canViewAll && brigadeId) params.brigadeId = brigadeId;
      const data = await listHydrants(params);
      setHydrants(data);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [brigadeId]);

  useEffect(() => {
    if (canViewAll) listBrigades().then(setBrigades).catch(() => setBrigades([]));
  }, [canViewAll]);

  return (
    <div className="defects-page">
      <div className="defects-page__header">
        <div>
          <h1 className="defects-page__title">
            Несправні гідранти
            {!loading && (
              <span className="defects-page__count" title="Кількість несправних гідрантів">
                {hydrants.length}
              </span>
            )}
          </h1>
          <p className="defects-page__subtitle">
            Гідранти, де остання перевірка виявила недоліки
          </p>
        </div>
        {canViewAll && (
          <Select
            value={brigadeId}
            onChange={(e) => setBrigadeId(e.target.value)}
            style={{ minWidth: 180 }}
          >
            <option value="">Усі частини</option>
            {brigades.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        )}
      </div>

      {error && <div className="defects-page__error">{error}</div>}

      {loading ? (
        <div className="defects-page__loading">
          <Spinner /> Завантаження...
        </div>
      ) : hydrants.length === 0 ? (
        <div className="defects-page__empty">Несправних гідрантів немає 🎉</div>
      ) : (
        <div className="defects-page__list">
          {hydrants.map((h) => {
            const insp = h.latestInspection;
            const defects = getInspectionDefects(insp);
            return (
              <div key={h.id} className="defect-card">
                <div className="defect-card__head">
                  <div className="defect-card__hydrant">
                    <span className="defect-card__number">ПГ-{h.number}</span>
                    {h.brigade?.name && (
                      <span className="defect-card__brigade">{h.brigade.name}</span>
                    )}
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/hydrants/${h.id}`)}>
                    Відкрити
                  </Button>
                </div>

                <div className="defect-card__address">{h.address}</div>

                {insp && (
                  <div className="defect-card__reporter">
                    Виявив: <strong>{insp.inspector?.fullName || '—'}</strong>
                    <span className="defect-card__date"> · {formatDateTime(insp.createdAt)}</span>
                  </div>
                )}

                {defects.length > 0 && (
                  <ul className="defect-card__defects">
                    {defects.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
