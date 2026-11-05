import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  Heart,
  Lock,
  QrCode,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { Button } from '../../components/ui/Button';
import { MedicalStatusBadge } from '../../components/ui/MedicalStatusBadge';
import { AnimatedCounter } from '../../components/ui/AnimatedCounter';
import { heroStats } from '../../constants/content';
import { paths } from '../../routes/paths';
import { fadeUp, floatY, stagger } from '../../animations/variants';
import { useAuth } from '../../providers/AuthProvider';
import { dashboardPathFor } from '../../services/auth/authService';

export function Hero() {
  const { user, role } = useAuth();
  const workspacePath = user && role ? dashboardPathFor(role) : paths.login;

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -left-36 top-8 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(6,78,59,0.12),transparent_68%)] blur-2xl" />
      <div className="pointer-events-none absolute -right-36 top-1/4 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(4,120,87,0.12),transparent_68%)] blur-2xl" />
      <Container className="relative pb-12 pt-10 sm:pb-16 sm:pt-14 lg:pb-24 lg:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8">
          <motion.div variants={stagger} initial="hidden" animate="show" className="relative z-10">
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
                One Record • Your Whole Lifetime
              </span>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="mt-5 max-w-[640px] bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-600 bg-clip-text text-balance font-display text-4xl leading-[1.04] tracking-tight text-transparent sm:text-5xl lg:text-6xl"
            >
              One secure health record for your entire life.
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-5 max-w-lg text-base leading-relaxed text-ink-500 sm:text-lg">
              Hospitals issue. Laboratories sign. You carry the complete clinical history — source-verified, consented, and calm enough to trust with a family.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
                to={paths.register}
                size="lg"
                className="!h-auto !min-h-[52px] !rounded-xl !bg-emerald-900 !px-7 !py-3.5 !font-medium !shadow-lg !shadow-emerald-950/20 hover:!bg-emerald-800"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Get Started
              </Button>
              <Button
                to={workspacePath}
                size="lg"
                variant="outline"
                className="!h-auto !min-h-[52px] !rounded-xl !border-slate-200 !bg-white/90 !px-7 !py-3.5 !font-medium !text-slate-800 hover:!bg-white"
              >
                Open workspace
              </Button>
            </motion.div>
            <motion.div variants={fadeUp} className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-ink-600">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                HIPAA & SOC 2 Minded Architecture
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-emerald-700" />
                Explicit Patient-Governed Consent
              </span>
            </motion.div>
            <motion.dl variants={fadeUp} className="mt-10 grid grid-cols-3 gap-3 sm:gap-4">
              {heroStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-emerald-900/10 bg-white/80 p-3 shadow-xl shadow-emerald-950/5 backdrop-blur-xl sm:p-4">
                  <dt className="font-display text-3xl text-emerald-950 sm:text-4xl">
                    <AnimatedCounter value={Number(stat.value)} />
                  </dt>
                  <dd className="mt-0.5 text-[11px] leading-snug text-slate-600">{stat.label}</dd>
                </div>
              ))}
            </motion.dl>
          </motion.div>

          <div className="relative mx-auto flex min-h-[520px] w-full max-w-[580px] items-center justify-center sm:min-h-[600px]">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(4,120,87,0.16),transparent_68%)] blur-2xl sm:h-[520px] sm:w-[520px]" />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 w-[232px] rounded-[40px] border-4 border-slate-800 bg-slate-950 p-3 shadow-2xl sm:w-[250px]"
              aria-label="Illustration of the WellNest patient health app"
            >
              <div className="overflow-hidden rounded-[29px] bg-gradient-to-b from-white to-emerald-50">
                <div className="flex items-center justify-between px-4 pb-2 pt-3">
                  <span className="text-[10px] font-bold tracking-wide text-emerald-950">WellNest HEALTH</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-label="Active" />
                </div>
                <div className="px-4 pb-4 pt-3 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-800">Health vitality index</p>
                  <div className="relative mx-auto mt-3 flex h-28 w-28 items-center justify-center">
                    <svg viewBox="0 0 112 112" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
                      <circle cx="56" cy="56" r="48" fill="none" stroke="#d1fae5" strokeWidth="7" />
                      <motion.circle
                        cx="56"
                        cy="56"
                        r="48"
                        fill="none"
                        stroke="#047857"
                        strokeLinecap="round"
                        strokeWidth="7"
                        strokeDasharray="301.6"
                        initial={{ strokeDashoffset: 301.6 }}
                        animate={{ strokeDashoffset: 301.6 * (1 - 0.86) }}
                        transition={{ duration: 1.4, delay: 0.3, ease: 'easeOut' }}
                      />
                    </svg>
                    <div>
                      <span className="block font-display text-4xl leading-none text-emerald-950">86</span>
                      <span className="mt-1 block text-[9px] font-medium text-slate-500">of 100</span>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-left">
                    <div className="flex items-center justify-between rounded-xl border border-emerald-900/10 bg-white/90 px-3 py-2">
                      <span className="inline-flex items-center gap-2 text-[10px] font-medium text-slate-600">
                        <Heart className="h-3.5 w-3.5 text-rose-500" /> Heart rate
                      </span>
                      <span className="text-[11px] font-bold text-slate-800">72 bpm</span>
                    </div>
                    <div className="rounded-xl border border-emerald-900/10 bg-white/90 px-3 py-2">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="inline-flex items-center gap-2 text-[10px] font-medium text-slate-600">
                          <Activity className="h-3.5 w-3.5 text-emerald-700" /> Latest lab
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">CMP</span>
                      </div>
                      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-800">
                        Lab Signed
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1.5 bg-emerald-900 px-3 py-2.5 text-[10px] font-semibold text-emerald-50">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  WellNest Health ID Active
                </div>
              </div>
            </motion.div>
            <motion.div
              {...floatY}
              className="absolute left-0 top-8 z-20 hidden w-[235px] rounded-2xl border border-emerald-900/10 bg-white/90 p-3.5 shadow-2xl shadow-emerald-950/10 backdrop-blur-xl lg:block"
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Diagnostic Panel</p>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-800">Lab Signed</span>
              </div>
              <p className="mt-1.5 text-xs font-bold text-slate-900">CMP · Harbor Diagnostic Lab</p>
              <p className="text-[11px] text-slate-500">Released today · Cryptographic signature</p>
            </motion.div>

            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
              className="absolute right-0 top-20 z-20 hidden w-[215px] rounded-2xl border border-emerald-900/10 bg-white/90 p-3.5 shadow-2xl shadow-emerald-950/10 backdrop-blur-xl lg:block"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Attending Physician</p>
              <div className="mt-2 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-900 text-[11px] font-bold text-white" aria-hidden="true">MC</div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Dr. Maya Chen</p>
                  <p className="text-[11px] font-medium text-emerald-800">72-hr consent active</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
              className="absolute bottom-5 left-0 z-20 w-[min(48%,230px)] rounded-2xl border border-emerald-900/10 bg-white/90 p-3.5 shadow-2xl shadow-emerald-950/10 backdrop-blur-xl sm:left-0"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Prescription Record</p>
              <p className="mt-1 text-xs font-bold text-slate-900">Lisinopril 10mg</p>
              <p className="text-[11px] text-slate-500">Oral · Once daily morning</p>
              <div className="mt-2">
                <MedicalStatusBadge status="stable" />
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-14 right-0 z-20 hidden w-[200px] rounded-2xl border border-emerald-900/10 bg-white/90 p-3.5 shadow-2xl shadow-emerald-950/10 backdrop-blur-xl sm:block"
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Emergency ID</p>
                <QrCode className="h-4 w-4 text-emerald-800" />
              </div>
              <p className="mt-1 text-xs font-bold text-slate-900">O+ · QR Verifiable</p>
              <p className="text-[11px] text-slate-500">Verified allergies on card</p>
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
}
