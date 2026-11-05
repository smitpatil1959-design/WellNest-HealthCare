import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { CheckCircle2, Copy, Download, Printer, Share2, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { Logo } from '../brand/Logo';
import { qrVerificationUrl } from '../../lib/healthId';
import { useToast } from '../../providers/ToastProvider';

interface HealthIdCardProps {
  healthId: string;
  name: string;
  issuedDate?: string;
}

export function HealthIdCard({ healthId, name, issuedDate }: HealthIdCardProps) {
  const { push } = useToast();
  const [src, setSrc] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  const formattedDate = issuedDate
    ? new Date(issuedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '2026';

  const verificationUrl = qrVerificationUrl(healthId);

  useEffect(() => {
    QRCode.toDataURL(verificationUrl, {
      margin: 1,
      width: 480,
      color: {
        dark: '#0c385f',
        light: '#ffffff',
      },
    })
      .then(setSrc)
      .catch((err) => console.error('[QR generation error]', err));
  }, [verificationUrl]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(healthId);
      push({ tone: 'success', title: 'Health ID Copied', description: healthId });
    } catch {
      push({ tone: 'info', title: 'Health ID', description: healthId });
    }
  };

  const download = () => {
    if (!src) return;
    const link = document.createElement('a');
    link.href = src;
    link.download = `WellNest-Health-ID-${healthId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    push({ tone: 'success', title: 'Downloaded QR Code', description: `Saved as WellNest-Health-ID-${healthId}.png` });
  };

  const printCard = () => {
    window.print();
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'WellNest Universal Health ID',
          text: `My verified WellNest Health ID: ${healthId} (${name}). Verified securely across healthcare providers.`,
          url: verificationUrl,
        });
        return;
      } catch (err: unknown) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          copy();
        }
        return;
      }
    }
    copy();
  };

  return (
    <div className="mx-auto w-full max-w-md">
      {/* Printable / Display Card */}
      <article
        ref={cardRef}
        id="wellnest-health-id-card"
        className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-7 text-center shadow-md ring-1 ring-slate-100 print:border print:shadow-none"
      >
        {/* Decorative subtle medical mesh backdrop */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-brand-50/60 blur-2xl print:hidden" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-emerald-50/50 blur-2xl print:hidden" />

        {/* Card Header with WellNest Brand */}
        <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="text-left">
            <Logo />
            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-700">
              Universal Health ID
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-md border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 shadow-2xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Verified</span>
          </div>
        </div>

        {/* Patient Identity */}
        <div className="relative mt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Patient Holder</p>
          <h2 className="mt-0.5 font-display text-2xl font-bold tracking-tight text-ink-900">
            {name}
          </h2>
          <div className="mt-2.5 inline-flex items-center justify-center rounded-xl bg-brand-50/80 px-4 py-1.5 ring-1 ring-brand-200/70">
            <p className="font-mono text-2xl sm:text-3xl font-bold tracking-wider text-brand-900">
              {healthId}
            </p>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="relative mx-auto mt-5 flex flex-col items-center">
          <div className="relative rounded-xl bg-white p-3 shadow-xs ring-1 ring-slate-200/80">
            {src ? (
              <img
                src={src}
                alt={`QR code for ${healthId}`}
                className="h-48 w-48 sm:h-56 sm:w-56 rounded-lg object-contain"
              />
            ) : (
              <div className="flex h-48 w-48 sm:h-56 sm:w-56 animate-pulse items-center justify-center rounded-lg bg-slate-100 text-xs text-ink-400">
                Generating QR…
              </div>
            )}
            <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-brand-700">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Scan to access this patient's verified health profile</span>
            </div>
          </div>

          <p className="mt-4 max-w-xs text-xs leading-relaxed text-ink-500">
            This QR code encodes a secure verification link. Sensitive clinical records, prescriptions,
            and labs remain protected and require provider authentication and patient consent.
          </p>
        </div>

        {/* Card Footer */}
        <div className="relative mt-6 flex flex-wrap items-center justify-between border-t border-slate-100 pt-4 text-[11px] text-ink-400">
          <div className="flex items-center gap-1 text-ink-600">
            <ShieldCheck className="h-4 w-4 text-brand-600" />
            <span className="font-medium">Consent controls access</span>
          </div>
          <span>Issued: {formattedDate}</span>
        </div>
      </article>

      {/* Action Buttons */}
      <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4 print:hidden">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={copy}
          leftIcon={<Copy className="h-4 w-4 text-brand-600" />}
          className="justify-center shadow-sm"
        >
          Copy ID
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={download}
          leftIcon={<Download className="h-4 w-4 text-brand-600" />}
          className="justify-center shadow-sm"
        >
          Download
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={printCard}
          leftIcon={<Printer className="h-4 w-4 text-brand-600" />}
          className="justify-center shadow-sm"
        >
          Print Card
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={share}
          leftIcon={<Share2 className="h-4 w-4 text-brand-600" />}
          className="justify-center shadow-sm"
        >
          Share
        </Button>
      </div>

      {/* Print-specific style */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #wellnest-health-id-card, #wellnest-health-id-card * {
            visibility: visible;
          }
          #wellnest-health-id-card {
            position: absolute;
            left: 50%;
            top: 20%;
            transform: translateX(-50%);
            width: 380px !important;
            padding: 24px !important;
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
