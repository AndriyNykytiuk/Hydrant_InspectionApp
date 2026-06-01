import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';

import authRouter from './routes/auth.js';
import brigadesRouter from './routes/brigades.js';
import usersRouter from './routes/users.js';
import hydrantsRouter from './routes/hydrants.js';
import inspectionsRouter from './routes/inspections.js';
import qrRouter from './routes/qr.js';
import pdfRouter from './routes/pdf.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

app.set('trust proxy', 1);

const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
  : true;
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(uploadDir));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api/brigades', brigadesRouter);
app.use('/api/users', usersRouter);
app.use('/api/hydrants', hydrantsRouter);
app.use('/api/hydrants/:hydrantId/inspections', inspectionsRouter);
app.use('/api', qrRouter);
app.use('/api', pdfRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
