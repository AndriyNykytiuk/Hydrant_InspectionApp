import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export function QrCode({ value, size = 200, className }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, { width: size, margin: 1, errorCorrectionLevel: 'M' })
      .then((url) => !cancelled && setSrc(url))
      .catch(() => !cancelled && setSrc(null));
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!src) return <div className={className} style={{ width: size, height: size }} />;
  return <img src={src} alt="QR" width={size} height={size} className={className} />;
}

export function hydrantInspectUrl(hydrantId) {
  return `${window.location.origin}/inspect/${hydrantId}`;
}
