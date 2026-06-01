import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { notFound, conflict } from '../utils/errors.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const where = { deletedAt: null };
    const brigades = await prisma.brigade.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { hydrants: { where: { deletedAt: null } } } },
      },
    });
    res.json(brigades);
  })
);

const createSchema = z.object({ name: z.string().min(1).max(100) });

router.post(
  '/',
  requireRole('god'),
  asyncHandler(async (req, res) => {
    const { name } = createSchema.parse(req.body);
    const exists = await prisma.brigade.findFirst({ where: { name, deletedAt: null } });
    if (exists) throw conflict('Частина з такою назвою вже існує');
    const brigade = await prisma.brigade.create({ data: { name } });
    res.status(201).json(brigade);
  })
);

router.patch(
  '/:id',
  requireRole('god'),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { name } = createSchema.parse(req.body);
    const brigade = await prisma.brigade.findFirst({ where: { id, deletedAt: null } });
    if (!brigade) throw notFound('Частину не знайдено');
    const updated = await prisma.brigade.update({ where: { id }, data: { name } });
    res.json(updated);
  })
);

router.delete(
  '/:id',
  requireRole('god'),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const brigade = await prisma.brigade.findFirst({ where: { id, deletedAt: null } });
    if (!brigade) throw notFound('Частину не знайдено');
    await prisma.brigade.update({ where: { id }, data: { deletedAt: new Date() } });
    res.json({ ok: true });
  })
);

export default router;
