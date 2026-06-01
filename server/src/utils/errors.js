export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (msg, details) => new HttpError(400, msg, details);
export const unauthorized = (msg = 'Не авторизовано') => new HttpError(401, msg);
export const forbidden = (msg = 'Доступ заборонено') => new HttpError(403, msg);
export const notFound = (msg = 'Не знайдено') => new HttpError(404, msg);
export const conflict = (msg = 'Конфлікт') => new HttpError(409, msg);
