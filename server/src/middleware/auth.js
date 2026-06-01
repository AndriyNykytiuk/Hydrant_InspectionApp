import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { forbidden, unauthorized } from '../utils/errors.js';

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, brigadeId: user.brigadeId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw unauthorized();
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
      include: { brigade: true },
    });
    if (!user) throw unauthorized();
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(unauthorized('Недійсний токен'));
    }
    next(err);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden());
    next();
  };
}

export function isGod(req) {
  return req.user?.role === 'god';
}

export function isViewer(req) {
  return req.user?.role === 'viewer';
}

export function canViewAll(req) {
  return isGod(req) || isViewer(req);
}
