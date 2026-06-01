import QRCode from 'qrcode';

export function hydrantInspectUrl(hydrantId) {
  const base = process.env.APP_URL || 'http://localhost:5173';
  return `${base.replace(/\/$/, '')}/inspect/${hydrantId}`;
}

export async function qrPngBuffer(text, options = {}) {
  return QRCode.toBuffer(text, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: options.width || 512,
    color: { dark: '#000000', light: '#ffffff' },
  });
}

export async function qrDataUrl(text) {
  return QRCode.toDataURL(text, { errorCorrectionLevel: 'M', margin: 1, width: 512 });
}
