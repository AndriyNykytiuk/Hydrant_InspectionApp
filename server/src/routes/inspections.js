import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '../db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth, isGod, isViewer, canViewAll } from '../middleware/auth.js';
import { badRequest, forbidden, notFound } from '../utils/errors.js';
import {
  CHECK_KEYS,
  collectChecks,
  serializeInspectionChecks,
} from '../utils/inspectionFields.js';

const router = Router({ mergeParams: true });

const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = randomBytes(12).toString('hex') + ext;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp|heic)$/i.test(file.mimetype)) cb(null, true);
    else cb(new Error('Дозволені лише зображення (jpeg, png, webp, heic)'));
  },
});

router.use(requireAuth);

const boolFromForm = (v) => v === true || v === 'true' || v === '1';
const tribool = (v) => (v === undefined || v === '' || v === null ? null : boolFromForm(v));

const inspectionBodySchema = z.object({
  isWorking: z.boolean(),
  weakness: z.string().max(2000).default(''),
  checks: z.object(
    Object.fromEntries(CHECK_KEYS.map((k) => [k, z.boolean().nullable()]))
  ),
});

const serializeInspection = (i) => ({
  id: i.id,
  createdAt: i.createdAt,
  isWorking: i.isWorking,
  weakness: i.weakness,
  ...serializeInspectionChecks(i),
  inspector: i.inspector
    ? { id: i.inspector.id, fullName: i.inspector.fullName }
    : null,
  photos: i.photos ? i.photos.map((p) => ({ id: p.id, url: p.url })) : [],
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const hydrantId = Number(req.params.hydrantId);
    const hydrant = await prisma.hydrant.findFirst({
      where: { id: hydrantId, deletedAt: null },
    });
    if (!hydrant) throw notFound('Гідрант не знайдено');
    if (!canViewAll(req) && hydrant.brigadeId !== req.user.brigadeId) throw forbidden();
    const inspections = await prisma.inspection.findMany({
      where: { hydrantId },
      orderBy: { createdAt: 'desc' },
      include: { inspector: true, photos: true },
    });
    res.json(inspections.map(serializeInspection));
  })
);

router.post(
  '/',
  upload.array('photos', 5),
  asyncHandler(async (req, res) => {
    const hydrantId = Number(req.params.hydrantId);
    const hydrant = await prisma.hydrant.findFirst({
      where: { id: hydrantId, deletedAt: null },
    });
    if (!hydrant) throw notFound('Гідрант не знайдено');
    if (isViewer(req)) {
      for (const f of req.files || []) fs.unlinkSync(f.path);
      throw forbidden('Спостерігач не може створювати перевірки');
    }
    if (!isGod(req) && hydrant.brigadeId !== req.user.brigadeId) throw forbidden();

    const payload = {
      isWorking: boolFromForm(req.body.isWorking),
      weakness: req.body.weakness ?? '',
      checks: collectChecks((k) => tribool(req.body[k])),
    };

    const parsed = inspectionBodySchema.safeParse(payload);
    if (!parsed.success) {
      for (const f of req.files || []) fs.unlinkSync(f.path);
      throw badRequest('Невалідні дані перевірки', parsed.error.issues);
    }

    const files = req.files || [];
    const inspection = await prisma.inspection.create({
      data: {
        hydrantId,
        inspectorId: req.user.id,
        ...parsed.data,
        photos: {
          create: files.map((f) => ({ url: `/uploads/${f.filename}` })),
        },
      },
      include: { inspector: true, photos: true },
    });
    res.status(201).json(serializeInspection(inspection));
  })
);

export default router;
