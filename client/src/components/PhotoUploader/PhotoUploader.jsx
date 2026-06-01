import { useRef, useState } from 'react';
import './PhotoUploader.scss';

const MAX_FILES = 5;
const MAX_SIZE = 5 * 1024 * 1024;

export function PhotoUploader({ files, onChange, disabled }) {
  const inputRef = useRef(null);
  const [error, setError] = useState(null);

  const onPick = (e) => {
    setError(null);
    const picked = Array.from(e.target.files || []);
    const all = [...files, ...picked];
    if (all.length > MAX_FILES) {
      setError(`Максимум ${MAX_FILES} фото`);
      return;
    }
    for (const f of picked) {
      if (f.size > MAX_SIZE) {
        setError(`Файл ${f.name} більший за 5 MB`);
        return;
      }
    }
    onChange(all);
    e.target.value = '';
  };

  const remove = (idx) => {
    const next = files.filter((_, i) => i !== idx);
    onChange(next);
  };

  return (
    <div className="photo-uploader">
      <div className="photo-uploader__grid">
        {files.map((f, idx) => {
          const url = URL.createObjectURL(f);
          return (
            <div className="photo-uploader__item" key={idx}>
              <img className="photo-uploader__preview" src={url} alt={f.name} />
              <button
                type="button"
                className="photo-uploader__remove"
                onClick={() => remove(idx)}
                disabled={disabled}
                aria-label="Видалити фото"
              >
                ×
              </button>
            </div>
          );
        })}
        {files.length < MAX_FILES && (
          <button
            type="button"
            className="photo-uploader__add"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
          >
            <span className="photo-uploader__add-icon">＋</span>
            <span className="photo-uploader__add-label">Додати фото</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        onChange={onPick}
        className="photo-uploader__input"
      />
      {error && <div className="photo-uploader__error">{error}</div>}
      <div className="photo-uploader__hint">
        До {MAX_FILES} фото, кожне до 5 MB
      </div>
    </div>
  );
}
