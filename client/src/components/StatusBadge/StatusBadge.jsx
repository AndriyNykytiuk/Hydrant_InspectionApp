import './StatusBadge.scss';

export function StatusBadge({ hydrant }) {
  const insp = hydrant.latestInspection;
  let variant = 'neutral';
  let label = 'Не перевірено';
  if (insp) {
    if (hydrant.hasDefect) {
      variant = 'defect';
      label = 'Має недоліки';
    } else {
      variant = 'ok';
      label = 'Справний';
    }
  }
  return <span className={`status-badge status-badge--${variant}`}>{label}</span>;
}
