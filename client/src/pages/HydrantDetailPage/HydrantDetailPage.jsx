import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getHydrant, listInspections } from '../../api/hydrants.js';
import { QrCode, hydrantInspectUrl } from '../../components/QrCode/QrCode.jsx';
import { extractError } from '../../api/client.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { Button } from '../../components/Button/Button.jsx';
import { StatusBadge } from '../../components/StatusBadge/StatusBadge.jsx';
import { InspectionModal } from '../../components/InspectionModal/InspectionModal.jsx';
import { Spinner } from '../../components/Spinner/Spinner.jsx';
import {
  CHECKLIST_SECTIONS,
  OVERALL_KEY,
  OVERALL_LABEL,
} from '../../components/InspectionForm/checklist.js';
import './HydrantDetailPage.scss';

const formatDateTime = (d) =>
  new Date(d).toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const Check = ({ value, yes, no }) => (
  <span className={`detail-check detail-check--${value ? 'yes' : 'no'}`}>
    {value ? yes : no}
  </span>
);

export function HydrantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isGod, isViewer } = useAuth();

  const [hydrant, setHydrant] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inspectOpen, setInspectOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [h, ins] = await Promise.all([getHydrant(id), listInspections(id)]);
      setHydrant(h);
      setInspections(ins);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="hydrant-detail__loading">
        <Spinner /> Завантаження...
      </div>
    );
  }
  if (error) return <div className="hydrant-detail__error">{error}</div>;
  if (!hydrant) return null;

  return (
    <div className="hydrant-detail">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        ← Назад
      </Button>

      <header className="hydrant-detail__header">
        <div>
          <h1 className="hydrant-detail__title">Гідрант № {hydrant.number}</h1>
          <div className="hydrant-detail__address">{hydrant.address}</div>
        </div>
        <StatusBadge hydrant={hydrant} />
      </header>

      <div className="hydrant-detail__main">
        <section className="hydrant-detail__info">
          <h2 className="hydrant-detail__section-title">Інформація</h2>
          <dl className="hydrant-detail__props">
            <div className="hydrant-detail__prop">
              <dt>Частина</dt>
              <dd>{hydrant.brigade?.name}</dd>
            </div>
            <div className="hydrant-detail__prop">
              <dt>Тип мережі</dt>
              <dd>{hydrant.networkType === 'ring' ? 'кільцева' : 'тупикова'}</dd>
            </div>
            <div className="hydrant-detail__prop">
              <dt>Діаметр</dt>
              <dd>{hydrant.diameter} мм</dd>
            </div>
          </dl>

          <div className="hydrant-detail__qr">
            <QrCode value={hydrantInspectUrl(hydrant.id)} size={200} className="hydrant-detail__qr-img" />
            <div className="hydrant-detail__qr-caption">QR-код для перевірки</div>
          </div>

          {!isViewer && (
            <Button onClick={() => setInspectOpen(true)} size="lg" fullWidth>
              Провести перевірку
            </Button>
          )}
        </section>

        <section className="hydrant-detail__history">
          <h2 className="hydrant-detail__section-title">
            Історія перевірок
            <span className="hydrant-detail__count">{inspections.length}</span>
          </h2>

          {inspections.length === 0 ? (
            <div className="hydrant-detail__empty">Перевірок ще не було</div>
          ) : (
            <ul className="inspection-history">
              {inspections.map((i) => {
                const allChecks = CHECKLIST_SECTIONS.flatMap((s) => s.items);
                const hasDefect =
                  !i.isWorking ||
                  !!i.weakness?.trim() ||
                  allChecks.some((it) => i[it.key] === false);
                const failed = allChecks.filter((it) => i[it.key] === false);
                return (
                  <li
                    key={i.id}
                    className={`inspection-history__item ${
                      hasDefect ? 'inspection-history__item--defect' : 'inspection-history__item--ok'
                    }`}
                  >
                    <div className="inspection-history__top">
                      <div className="inspection-history__date">{formatDateTime(i.createdAt)}</div>
                      <div className="inspection-history__inspector">
                        {i.inspector?.fullName || '—'}
                      </div>
                    </div>
                    <div className="inspection-history__checks">
                      <Check value={i[OVERALL_KEY]} yes={OVERALL_LABEL.replace('?', ' — так')} no={OVERALL_LABEL.replace('?', ' — ні')} />
                    </div>
                    {failed.length > 0 && (
                      <ul className="inspection-history__defects">
                        {failed.map((it) => (
                          <li key={it.key}>{it.defect}</li>
                        ))}
                      </ul>
                    )}
                    {i.weakness && (
                      <div className="inspection-history__weakness">
                        <strong>Інші недоліки: </strong>
                        {i.weakness}
                      </div>
                    )}
                    {i.photos?.length > 0 && (
                      <div className="inspection-history__photos">
                        {i.photos.map((p) => (
                          <a
                            key={p.id}
                            href={p.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inspection-history__photo"
                          >
                            <img src={p.url} alt="" />
                          </a>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <InspectionModal
        open={inspectOpen}
        hydrant={hydrant}
        onClose={() => setInspectOpen(false)}
        onSaved={() => {
          setInspectOpen(false);
          load();
        }}
      />
    </div>
  );
}
