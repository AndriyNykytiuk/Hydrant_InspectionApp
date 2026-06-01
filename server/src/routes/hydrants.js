import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth, requireRole, isGod, canViewAll } from '../middleware/auth.js';
import { badRequest, forbidden, notFound } from '../utils/errors.js';
import {
  inspectionHasDefect,
  serializeInspectionChecks,
} from '../utils/inspectionFields.js';

const router = Router();

router.use(requireAuth);

const networkType = z.enum(['ring', 'deadend']);

const hydrantItemSchema = z.object({
  number: z.string().min(1),
  address: z.string().min(1),
  networkType,
  diameter: z.number().int().positive(),
  brigadeId: z.number().int().positive(),
});

const createSchema = z.union([
  hydrantItemSchema,
  z.object({ items: z.array(hydrantItemSchema).min(1) }),
]);

const latestInspectionInclude = {
  inspections: {
    orderBy: { createdAt: 'desc' },
    take: 1,
    include: { inspector: true, photos: true },
  },
};

const serializeHydrant = (h) => {
  const latest = h.inspections?.[0];
  return {
    id: h.id,
    brigadeId: h.brigadeId,
    brigade: h.brigade ? { id: h.brigade.id, name: h.brigade.name } : undefined,
    number: h.number,
    address: h.address,
    networkType: h.networkType,
    diameter: h.diameter,
    createdAt: h.createdAt,
    latestInspection: latest
      ? {
          id: latest.id,
          createdAt: latest.createdAt,
          isWorking: latest.isWorking,
          cleanPath: latest.cleanPath,
          banner: latest.banner,
          weakness: latest.weakness,
          ...serializeInspectionChecks(latest),
          inspector: latest.inspector
            ? { id: latest.inspector.id, fullName: latest.inspector.fullName }
            : null,
          photos: latest.photos.map((p) => ({ id: p.id, url: p.url })),
        }
      : null,
    hasDefect: inspectionHasDefect(latest),
  };
};

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { brigadeId, q, status, networkType: net } = req.query;
    const where = { deletedAt: null };
    if (!canViewAll(req)) {
      where.brigadeId = req.user.brigadeId;
    } else if (brigadeId) {
      where.brigadeId = Number(brigadeId);
    }
    if (q) {
      where.OR = [
        { number: { contains: String(q), mode: 'insensitive' } },
        { address: { contains: String(q), mode: 'insensitive' } },
      ];
    }
    if (net && (net === 'ring' || net === 'deadend')) {
      where.networkType = net;
    }
    const hydrants = await prisma.hydrant.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { brigade: true, ...latestInspectionInclude },
    });
    let serialized = hydrants.map(serializeHydrant);
    if (status === 'defect') serialized = serialized.filter((h) => h.hasDefect);
    if (status === 'ok') serialized = serialized.filter((h) => !h.hasDefect && h.latestInspection);
    if (status === 'not-inspected')
      serialized = serialized.filter((h) => !h.latestInspection);
    res.json(serialized);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const hydrant = await prisma.hydrant.findFirst({
      where: { id, deletedAt: null },
      include: { brigade: true, ...latestInspectionInclude },
    });
    if (!hydrant) throw notFound('Гідрант не знайдено');
    if (!canViewAll(req) && hydrant.brigadeId !== req.user.brigadeId) throw forbidden();
    res.json(serializeHydrant(hydrant));
  })
);

router.post(
  '/',
  requireRole('god'),
  asyncHandler(async (req, res) => {
    const parsed = createSchema.parse(req.body);
    const items = 'items' in parsed ? parsed.items : [parsed];
    const brigadeIds = [...new Set(items.map((i) => i.brigadeId))];
    const brigades = await prisma.brigade.findMany({
      where: { id: { in: brigadeIds }, deletedAt: null },
    });
    if (brigades.length !== brigadeIds.length) {
      throw badRequest('Одну або більше частин не знайдено');
    }
    const created = await prisma.$transaction(
      items.map((item) => prisma.hydrant.create({ data: item }))
    );
    res.status(201).json({ created: created.length, hydrants: created });
  })
);

const updateSchema = z.object({
  number: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  networkType: networkType.optional(),
  diameter: z.number().int().positive().optional(),
  brigadeId: z.number().int().positive().optional(),
});

router.patch(
  '/:id',
  requireRole('god'),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const data = updateSchema.parse(req.body);
    const hydrant = await prisma.hydrant.findFirst({ where: { id, deletedAt: null } });
    if (!hydrant) throw notFound('Гідрант не знайдено');
    if (data.brigadeId) {
      const brigade = await prisma.brigade.findFirst({
        where: { id: data.brigadeId, deletedAt: null },
      });
      if (!brigade) throw badRequest('Частину не знайдено');
    }
    const updated = await prisma.hydrant.update({
      where: { id },
      data,
      include: { brigade: true, ...latestInspectionInclude },
    });
    res.json(serializeHydrant(updated));
  })
);

router.delete(
  '/:id',
  requireRole('god'),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const hydrant = await prisma.hydrant.findFirst({ where: { id, deletedAt: null } });
    if (!hydrant) throw notFound('Гідрант не знайдено');
    await prisma.hydrant.update({ where: { id }, data: { deletedAt: new Date() } });
    res.json({ ok: true });
  })
);

export default router;
