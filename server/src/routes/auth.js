import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { unauthorized } from '../utils/errors.js';
import { requireAuth, signToken } from '../middleware/auth.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

const publicUser = (u) => ({
  id: u.id,
  email: u.email,
  fullName: u.fullName,
  role: u.role,
  brigadeId: u.brigadeId,
  brigade: u.brigade ? { id: u.brigade.id, name: u.brigade.name } : undefined,
});

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { brigade: true },
    });
    if (!user) throw unauthorized('Невірний логін або пароль');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw unauthorized('Невірний логін або пароль');
    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: publicUser(req.user) });
  })
);

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

router.post(
  '/change-password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const ok = await bcrypt.compare(currentPassword, req.user.passwordHash);
    if (!ok) throw unauthorized('Поточний пароль невірний');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash },
    });
    res.json({ ok: true });
  })
);

export default router;
