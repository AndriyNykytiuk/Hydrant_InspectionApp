import { Modal } from '../Modal/Modal.jsx';
import { Button } from '../Button/Button.jsx';
import { StatusBadge } from '../StatusBadge/StatusBadge.jsx';
import {
  CHECKLIST_SECTIONS,
  OVERALL_KEY,
  OVERALL_LABEL,
} from '../InspectionForm/checklist.js';
import './InspectionResultModal.scss';

const formatDateTime = (d) =>
  new Date(d).toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const Check = ({ value, yes, no }) => (
  <span
    className={`inspection-result__check inspection-result__check--${
      value ? 'yes' : 'no'
    }`}
  >
    {value ? yes : no}
  </span>
);

export function InspectionResultModal({ open, hydrant, onClose, onOpenDetail }) {
  if (!hydrant) return null;
  const insp = hydrant.latestInspection;
  const variant = !insp ? 'pending' : hydrant.hasDefect ? 'defect' : 'ok';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Перевірка ПГ-${hydrant.number}`}
      size="md"
      footer={
        onOpenDetail && (
          <Button variant="secondary" onClick={() => onOpenDetail(hydrant)}>
            Відкрити сторінку гідранта
          </Button>
        )
      }
    >
      <div className="inspection-result">
        <div className="inspection-result__head">
          <div className="inspection-result__address">{hydrant.address}</div>
          <StatusBadge hydrant={hydrant} />
        </div>

        {!insp ? (
          <div className="inspection-result__empty">
            Гідрант ще не перевіряли
          </div>
        ) : (
          <div
            className={`inspection-result__card inspection-result__card--${variant}`}
          >
            <div className="inspection-result__top">
              <div className="inspection-result__date">
                {formatDateTime(insp.createdAt)}
              </div>
              <div className="inspection-result__inspector">
                {insp.inspector?.fullName || '—'}
              </div>
            </div>

            <div className="inspection-result__overall">
              <Check
                value={insp[OVERALL_KEY]}
                yes={OVERALL_LABEL.replace('?', ' — так')}
                no={OVERALL_LABEL.replace('?', ' — ні')}
              />
            </div>

            {CHECKLIST_SECTIONS.map((section) => {
              const answered = section.items.filter(
                (item) => insp[item.key] !== null && insp[item.key] !== undefined
              );
              if (answered.length === 0) return null;
              return (
                <div key={section.title} className="inspection-result__section">
                  <div className="inspection-result__section-title">
                    {section.title}
                  </div>
                  <div className="inspection-result__items">
                    {answered.map((item) => (
                      <div
                        key={item.key}
                        className={`inspection-result__item inspection-result__item--${
                          insp[item.key] ? 'yes' : 'no'
                        }`}
                      >
                        <span className="inspection-result__item-icon" aria-hidden="true">
                          {insp[item.key] ? '✓' : '✕'}
                        </span>
                        <span className="inspection-result__item-text">
                          {insp[item.key] ? item.label : item.defect}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {insp.weakness && (
              <div className="inspection-result__weakness">
                <strong>Інші недоліки: </strong>
                {insp.weakness}
              </div>
            )}

            {insp.photos?.length > 0 && (
              <div className="inspection-result__photos">
                {insp.photos.map((p) => (
                  <a
                    key={p.id}
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inspection-result__photo"
                  >
                    <img src={p.url} alt="" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
