import { HttpError } from '../utils/errors.js';

export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err?.name === 'ZodError') {
    return res.status(400).json({ error: 'Невалідні дані', details: err.issues });
  }
  console.error(err);
  res.status(500).json({ error: 'Внутрішня помилка сервера' });
}
