import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Pill,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  Package,
  User,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { usePharmacyPortal } from '../../hooks/usePharmacyPortal';
import { paths } from '../../routes/paths';
import type { RxStatus } from '../../types/pharmacy';
import { fadeUp, stagger } from '../../animations/variants';

export default function PharmacyOrdersPage() {
  const { scripts, setStatus, can } = usePharmacyPortal();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | RxStatus>('all');

  const orders = scripts.filter((s) => s.status !== 'cancelled');

  const processingCount = orders.filter((o) => o.status === 'processing').length;
  const readyCount = orders.filter((o) => o.status === 'ready').length;
  const completedCount = orders.filter((o) => o.status === 'completed').length;

  const filteredOrders = useMemo(() => {
    return orders.filter((rx) => {
      const matchSearch = `${rx.medicine} ${rx.patientName} ${rx.rxNumber}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || rx.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  return (
    <>
      <Seo
        title="Fulfillment Orders & Bagging — Pharmacy Command"
        description="Prescription dispensing line, order bagging, and patient pickup verification."
      />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <PatientPageHeader
          eyebrow="Dispensing Operations"
          title="Fulfillment Order Queue & Dispense Line"
          description="Track prescription preparation through clinical verification, count-and-pour fulfillment, packaging, and counter pickup logging."
        />

        {/* Metrics Row */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Total Active Orders"
            value={orders.length}
            icon={Pill}
            subtext="Fulfillment line"
          />
          <StatTile
            label="In Preparation"
            value={processingCount}
            icon={Clock}
            subtext="Count & pour line"
          />
          <StatTile
            label="Ready for Pickup"
            value={readyCount}
            icon={Package}
            subtext="Staged in pickup bins"
          />
          <StatTile
            label="Dispensed Today"
            value={completedCount}
            icon={CheckCircle2}
            subtext="Pickup logged"
          />
        </motion.div>

        {/* Filter Toolbar */}
        <motion.div variants={fadeUp} className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Input
              placeholder="Search by medication, patient name, or Rx number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-ink-400" />}
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['all', 'pending', 'verifying', 'processing', 'ready', 'completed'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                  statusFilter === s
                    ? 'bg-brand-50 text-brand-900 ring-1 ring-brand-200'
                    : 'text-ink-600 hover:bg-slate-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Orders List */}
        <motion.div variants={fadeUp} className="space-y-3">
          {filteredOrders.map((rx) => {
            const pickupCode = (rx.id.slice(-4) + '19').slice(0, 4);
            return (
              <Card key={rx.id} hover className="transition-all">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 text-brand-700">
                      <Pill className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-bold text-ink-900">{rx.medicine}</h4>
                        <span className="font-mono text-xs font-semibold rounded bg-slate-100 px-2 py-0.5 text-ink-700">
                          {rx.rxNumber}
                        </span>
                        <Badge
                          tone={
                            rx.status === 'completed'
                              ? 'emerald'
                              : rx.status === 'ready'
                              ? 'brand'
                              : rx.status === 'processing'
                              ? 'sky'
                              : 'amber'
                          }
                          className="capitalize text-[10px]"
                        >
                          {rx.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-ink-600">
                        Patient: <strong className="text-ink-900">{rx.patientName}</strong> · Prescriber: Dr. {rx.doctor}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-ink-400">
                        <span className="font-semibold text-brand-800 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded">
                          Pickup Code: #{pickupCode}
                        </span>
                        <span>Dose: {rx.dosage || 'Standard'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0">
                    <Button to={paths.app.pharmacyRx(rx.id)} size="sm" variant="outline">
                      Inspect Rx
                    </Button>
                    {(can('orders') || can('all')) && rx.status !== 'completed' ? (
                      <AdvanceButton
                        rxId={rx.id}
                        status={rx.status}
                        onAdvance={setStatus}
                        unsigned={rx.source === 'patient'}
                      />
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </motion.div>
      </motion.div>
    </>
  );
}

function AdvanceButton({
  rxId,
  status,
  onAdvance,
  unsigned,
}: {
  rxId: string;
  status: RxStatus;
  onAdvance: (id: string, s: RxStatus) => void;
  unsigned: boolean;
}) {
  if (status === 'pending') {
    return (
      <Button
        size="sm"
        disabled={unsigned}
        onClick={() => onAdvance(rxId, 'verifying')}
        rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
      >
        Start Verify
      </Button>
    );
  }
  if (status === 'verifying') {
    return (
      <Button
        size="sm"
        disabled={unsigned}
        onClick={() => onAdvance(rxId, 'processing')}
        rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
      >
        Route to Fill Line
      </Button>
    );
  }
  if (status === 'processing') {
    return (
      <Button
        size="sm"
        onClick={() => onAdvance(rxId, 'ready')}
        rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
      >
        Mark Ready for Pickup
      </Button>
    );
  }
  if (status === 'ready') {
    return (
      <Button
        size="sm"
        onClick={() => onAdvance(rxId, 'completed')}
        leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
      >
        Log Patient Pickup
      </Button>
    );
  }
  return null;
}

function StatTile({
  label,
  value,
  subtext,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  subtext: string;
  icon: typeof Pill;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-ink-500">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-ink-400">{subtext}</p>
    </div>
  );
}
