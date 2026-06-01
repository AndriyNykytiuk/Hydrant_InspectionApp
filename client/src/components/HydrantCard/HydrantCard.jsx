import { StatusBadge } from '../StatusBadge/StatusBadge.jsx';
import { Button } from '../Button/Button.jsx';
import './HydrantCard.scss';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

export function HydrantCard({
  hydrant,
  onInspect,
  onEdit,
  onDelete,
  onShowResult,
  canManage,
  canInspect = true,
}) {
  const status = !hydrant.latestInspection
    ? 'pending'
    : hydrant.hasDefect
      ? 'defect'
      : 'ok';

  const stop = (fn) => (e) => {
    e.stopPropagation();
    fn?.(hydrant);
  };

  const onCardClick = () => onShowResult?.(hydrant);
  const onCardKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onShowResult?.(hydrant);
    }
  };

  return (
    <article
      className={`hydrant-card hydrant-card--${status} hydrant-card--clickable`}
      onClick={onCardClick}
      onKeyDown={onCardKey}
      role="button"
      tabIndex={0}
    >
      <header className="hydrant-card__header">
        <div>
          <span className="hydrant-card__number">ПГ- {hydrant.number}</span>
          <div className="hydrant-card__address">{hydrant.address}</div>
        </div>
        <StatusBadge hydrant={hydrant} />
      </header>

      <dl className="hydrant-card__meta">

        <div className="hydrant-card__meta-row">
          <dt className="hydrant-card__meta-key">Тип мережі</dt>
          <dd className="hydrant-card__meta-value">
            {hydrant.networkType === 'ring' ? 'кільцева' : 'тупикова'}
          </dd>
        </div>
        <div className="hydrant-card__meta-row">
          <dt className="hydrant-card__meta-key">Діаметр</dt>
          <dd className="hydrant-card__meta-value">{hydrant.diameter} мм</dd>
        </div>
        <div className="hydrant-card__meta-row">
          <dt className="hydrant-card__meta-key">Остання перевірка</dt>
          <dd className="hydrant-card__meta-value">
            {formatDate(hydrant.latestInspection?.createdAt)}
            {hydrant.latestInspection?.inspector?.fullName && (
              <span className="hydrant-card__inspector">
                {' '}· {hydrant.latestInspection.inspector.fullName}
              </span>
            )}
          </dd>
        </div>
      </dl>

      {(canInspect || canManage) && (
        <footer className="hydrant-card__actions" onClick={(e) => e.stopPropagation()}>
          {canInspect && (
            <Button variant="primary" size="sm" onClick={stop(onInspect)}>
              Перевірити
            </Button>
          )}
          {canManage && (
            <>
              <Button variant="secondary" size="sm" onClick={stop(onEdit)}>
                Редагувати
              </Button>
              <Button variant="ghost" size="sm" onClick={stop(onDelete)}>
                Видалити
              </Button>
            </>
          )}
        </footer>
      )}
    </article>
  );
}
