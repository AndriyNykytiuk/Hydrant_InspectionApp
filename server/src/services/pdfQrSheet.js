import PDFDocument from 'pdfkit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hydrantInspectUrl, qrPngBuffer } from './qr.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT_PATH = path.resolve(__dirname, '../../fonts/Roboto.ttf');

const PAGE_MARGIN = 36;
const COLS = 3;
const ROWS = 4;

export async function streamQrSheetPdf(res, { brigade, hydrants }) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="qr-${brigade.id}.pdf"`
  );

  const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN });
  doc.registerFont('Roboto', FONT_PATH);
  doc.font('Roboto');
  doc.pipe(res);

  doc.fontSize(16).text(`QR-коди гідрантів — ${brigade.name}`, { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).text(`Всього: ${hydrants.length}`, { align: 'center' });
  doc.moveDown(1);

  const pageWidth = doc.page.width - PAGE_MARGIN * 2;
  const pageHeight = doc.page.height - PAGE_MARGIN * 2 - 60;
  const cellW = pageWidth / COLS;
  const cellH = pageHeight / ROWS;
  const qrSize = Math.min(cellW, cellH) - 50;

  const startY = doc.y;

  for (let i = 0; i < hydrants.length; i++) {
    const h = hydrants[i];
    const indexOnPage = i % (COLS * ROWS);
    if (i > 0 && indexOnPage === 0) {
      doc.addPage();
    }
    const localIdx = i % (COLS * ROWS);
    const col = localIdx % COLS;
    const row = Math.floor(localIdx / COLS);
    const x = PAGE_MARGIN + col * cellW;
    const baseY = (i < COLS * ROWS ? startY : PAGE_MARGIN) + row * cellH;

    const qrBuf = await qrPngBuffer(hydrantInspectUrl(h.id), { width: 400 });
    const qrX = x + (cellW - qrSize) / 2;
    doc.image(qrBuf, qrX, baseY, { width: qrSize, height: qrSize });

    doc.fontSize(10).text(`№ ${h.number}`, x + 4, baseY + qrSize + 4, {
      width: cellW - 8,
      align: 'center',
    });
    doc.fontSize(8).text(h.address, x + 4, baseY + qrSize + 18, {
      width: cellW - 8,
      align: 'center',
      ellipsis: true,
      height: 24,
    });
  }

  doc.end();
}
