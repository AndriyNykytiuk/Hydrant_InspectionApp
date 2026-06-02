# Hydrant_InspectionApp

Застосунок для перевірки пожежних гідрантів — **React + Express + SCSS (BEM) + PostgreSQL (Prisma)**.

## Стек
- **client/** — React 18 + Vite, SCSS (BEM), React Router, axios
- **server/** — Express, Prisma ORM, JWT-авторизація, генерація QR та DOCX-актів
- **БД** — PostgreSQL (локально через Docker, у проді — Supabase)

## Вимоги
- Node.js 20+
- Docker + Docker Compose (для локальної БД)

## Запуск локально

```bash
npm run install:all   # залежності root + server + client (один раз)
npm run dev           # підіймає БД, мігрує, сідить і стартує все
```

`npm run dev` через хук `predev` автоматично:
1. `docker compose up -d --wait` — підіймає Postgres і чекає, поки БД стане healthy;
2. `prisma migrate deploy` — застосовує міграції;
3. `seed` — створює адміністратора (ідемпотентно);
4. запускає **server** (http://localhost:5000) і **client** (http://localhost:5173) разом.

Далі відкрий http://localhost:5173.

> Якщо `:5000` зайнятий старим процесом — `lsof -ti:5000 | xargs kill`, потім знову `npm run dev`.

### Конфігурація (`server/.env`)
Створи `server/.env` з `server/.env.example`. Для локальної розробки **обидва** URL вказують на Docker-Postgres:

```env
DATABASE_URL=postgresql://hydrants:hydrants@localhost:5432/hydrants?schema=public
DIRECT_URL=postgresql://hydrants:hydrants@localhost:5432/hydrants?schema=public
```

`SEED_GOD_EMAIL` / `SEED_GOD_PASSWORD` задають логін/пароль адміністратора, який створює сід.

## Корисні команди

| Команда | Дія |
|---|---|
| `npm run dev` | повний локальний запуск (БД + міграції + сід + server/client) |
| `npm run db:up` / `npm run db:down` | підняти / зупинити Docker-Postgres |
| `npm run db:logs` | логи БД |
| `npm --prefix server run prisma:deploy` | застосувати міграції до поточної БД |
| `npm run seed` | створити/перевірити адміністратора |
| `npm --prefix server run prisma:studio` | Prisma Studio |
| `npm run build` | прод-збірка клієнта |

## Деплой (Render)

Деплой описаний у `render.yaml` (Blueprint): два сервіси — `hydrant-backend` (web) та `hydrant-frontend` (static).

- Бекенд стартує командою `prisma migrate deploy && node prisma/seed.js && node src/index.js`.
- БД у проді — **Supabase**: `DATABASE_URL` = transaction pooler (порт `6543`, `?pgbouncer=true`), `DIRECT_URL` = session pooler (порт `5432`).
- Секрети (`DATABASE_URL`, `DIRECT_URL`, `APP_URL`, `CORS_ORIGIN`, `VITE_API_URL`, ...) задаються в дашборді Render (`sync: false`), **не** в репозиторії.
- `server/.env` у `.gitignore`, тому локальний конфіг ніяк не впливає на прод — пуш у GitHub лишає Render-конфіг недоторканим.

Клієнт під час білду читає `VITE_API_URL` (Vite «запікає» її в бандл), тож після зміни цієї змінної на Render треба **Clear build cache & deploy**.
