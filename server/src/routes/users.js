import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { conflict, notFound, badRequest } from '../utils/errors.js';

const router = Router();

router.use(requireAuth, requireRole('god'));

const publicUser = (u) => ({
  id: u.id,
  email: u.email,
  fullName: u.fullName,
  role: u.role,
  brigadeId: u.brigadeId,
  brigade: u.brigade ? { id: u.brigade.id, name: u.brigade.name } : undefined,
  createdAt: u.createdAt,
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      include: { brigade: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users.map(publicUser));
  })
);

const createSchema = z
  .object({
    email: z.string().min(1),
    password: z.string().min(8),
    fullName: z.string().min(1),
    brigadeId: z.number().int().positive().nullable().optional(),
    role: z.enum(['god', 'viewer', 'rw']),
  })
  .refine((d) => d.role !== 'rw' || d.brigadeId != null, {
    message: 'Для ролі "Відповідальний" потрібно обрати частину',
    path: ['brigadeId'],
  });

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    if (data.brigadeId != null) {
      const brigade = await prisma.brigade.findFirst({
        where: { id: data.brigadeId, deletedAt: null },
      });
      if (!brigade) throw badRequest('Частину не знайдено');
    }
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) throw conflict('Користувач з таким логіном вже існує');
    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        passwordHash,
        role: data.role,
        brigadeId: data.brigadeId ?? null,
      },
      include: { brigade: true },
    });
    res.status(201).json(publicUser(user));
  })
);

const updateSchema = z.object({
  fullName: z.string().min(1).optional(),
  brigadeId: z.number().int().positive().optional(),
  password: z.string().min(8).optional(),
});

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const data = updateSchema.parse(req.body);
    const user = await prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw notFound('Користувача не знайдено');
    if (user.role === 'god') throw badRequest('Не можна редагувати god-користувача через API');

    const patch = {};
    if (data.fullName) patch.fullName = data.fullName;
    if (data.brigadeId) {
      const brigade = await prisma.brigade.findFirst({
        where: { id: data.brigadeId, deletedAt: null },
      });
      if (!brigade) throw badRequest('Частину не знайдено');
      patch.brigadeId = data.brigadeId;
    }
    if (data.password) patch.passwordHash = await bcrypt.hash(data.password, 10);

    const updated = await prisma.user.update({
      where: { id },
      data: patch,
      include: { brigade: true },
    });
    res.json(publicUser(updated));
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const user = await prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw notFound('Користувача не знайдено');
    if (user.id === req.user.id) throw badRequest('Не можна видалити власний обліковий запис');
    if (user.role === 'god') {
      const gods = await prisma.user.count({ where: { role: 'god', deletedAt: null } });
      if (gods <= 1) throw badRequest('Не можна видалити останнього адміністратора');
    }
    await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
    res.json({ ok: true });
  })
);

export default router;
