import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth, canViewAll } from '../middleware/auth.js';
import { forbidden, notFound } from '../utils/errors.js';
import { streamQrSheetPdf } from '../services/pdfQrSheet.js';
import { buildDefectActDocx } from '../services/docxDefectAct.js';
import { inspectionHasDefect } from '../utils/inspectionFields.js';

const router = Router();

const latestInspectionInclude = {
  inspections: {
    orderBy: { createdAt: 'desc' },
    take: 1,
    include: { inspector: true },
  },
};

const actBodySchema = z.object({
  representativeSurname: z.string().trim().min(1).max(200),
});

const sendDocx = (res, buffer, filename) => {
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', buffer.length);
  res.end(buffer);
};

router.get(
  '/brigades/:id/qr-sheet.pdf',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const brigade = await prisma.brigade.findFirst({ where: { id, deletedAt: null } });
    if (!brigade) throw notFound('Частину не знайдено');
    if (!canViewAll(req) && req.user.brigadeId !== id) throw forbidden();
    const hydrants = await prisma.hydrant.findMany({
      where: { brigadeId: id, deletedAt: null },
      orderBy: { number: 'asc' },
    });
    await streamQrSheetPdf(res, { brigade, hydrants });
  })
);

router.post(
  '/brigades/:id/defect-act.docx',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!canViewAll(req)) throw forbidden();
    const { representativeSurname } = actBodySchema.parse(req.body);
    const id = Number(req.params.id);
    const brigade = await prisma.brigade.findFirst({ where: { id, deletedAt: null } });
    if (!brigade) throw notFound('Частину не знайдено');
    const hydrants = await prisma.hydrant.findMany({
      where: { brigadeId: id, deletedAt: null },
      orderBy: { number: 'asc' },
      include: latestInspectionInclude,
    });
    const withDefects = hydrants
      .map((h) => ({ ...h, latestInspection: h.inspections[0] || null }))
      .filter((h) => inspectionHasDefect(h.latestInspection));
    const buffer = await buildDefectActDocx({
      brigade,
      hydrantsWithDefects: withDefects,
      ourRepresentative: req.user.fullName,
      representativeSurname,
    });
    sendDocx(res, buffer, `defect-act-${brigade.id}.docx`);
  })
);

router.post(
  '/reports/defects-all-act.docx',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!canViewAll(req)) throw forbidden();
    const { representativeSurname } = actBodySchema.parse(req.body);
    const hydrants = await prisma.hydrant.findMany({
      where: { deletedAt: null },
      orderBy: [{ brigadeId: 'asc' }, { number: 'asc' }],
      include: { ...latestInspectionInclude, brigade: true },
    });
    const withDefects = hydrants
      .map((h) => ({ ...h, latestInspection: h.inspections[0] || null }))
      .filter((h) => inspectionHasDefect(h.latestInspection));
    const buffer = await buildDefectActDocx({
      brigade: { id: 0, name: 'Усі частини' },
      hydrantsWithDefects: withDefects,
      ourRepresentative: req.user.fullName,
      representativeSurname,
      aggregated: true,
    });
    sendDocx(res, buffer, `defect-act-all.docx`);
  })
);

export default router;
