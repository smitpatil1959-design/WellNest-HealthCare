import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface EmergencyQrProps {
  /** WellNest Health ID (VY-XXXX-XXXX) for this patient */
  healthId: string;
  size?: number;
}

/**
 * Renders a real, scannable QR code that links to the patient's
 * emergency-safe verification page (no clinical chart exposed).
 */
export function EmergencyQr({ healthId, size = 200 }: EmergencyQrProps) {
  const [src, setSrc] = useState('');

  const url = `${window.location.origin}/verify/health-id/${encodeURIComponent(healthId)}?emergency=1`;

  useEffect(() => {
    if (!healthId) return;
    QRCode.toDataURL(url, {
      margin: 1,
      width: size * 2, // 2x for retina sharpness
      color: { dark: '#0f1d2d', light: '#ffffff' },
    })
      .then(setSrc)
      .catch((err) => console.error('[EmergencyQr] QR error', err));
  }, [url, size, healthId]);

  return (
    <div className="inline-flex flex-col items-center gap-2.5">
      {src ? (
        <img
          src={src}
          alt={`Emergency QR for Health ID ${healthId}`}
          className="rounded-xl border border-slate-200/80 p-1"
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className="animate-pulse rounded-xl bg-slate-100"
          style={{ width: size, height: size }}
        />
      )}
      <p className="font-mono text-xs font-semibold tracking-wider text-brand-900">{healthId || '—'}</p>
    </div>
  );
}
