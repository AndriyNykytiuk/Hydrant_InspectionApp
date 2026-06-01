import { Router } from 'express';
import { prisma } from '../db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth, isGod } from '../middleware/auth.js';
import { forbidden, notFound } from '../utils/errors.js';
import { hydrantInspectUrl, qrPngBuffer } from '../services/qr.js';

const router = Router();

router.get(
  '/hydrants/:id/qr',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const hydrant = await prisma.hydrant.findFirst({ where: { id, deletedAt: null } });
    if (!hydrant) throw notFound('Гідрант не знайдено');
    if (!isGod(req) && hydrant.brigadeId !== req.user.brigadeId) throw forbidden();
    const buf = await qrPngBuffer(hydrantInspectUrl(id), { width: 512 });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buf);
  })
);

export default router;
