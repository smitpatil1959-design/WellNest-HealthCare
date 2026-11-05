import { useState } from 'react';
import { Seo } from '../components/seo/Seo';
import { Container, Section } from '../components/ui/Container';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { Spinner } from '../components/ui/Spinner';
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton';
import { Progress } from '../components/ui/Progress';
import { Avatar } from '../components/ui/Avatar';
import { Timeline } from '../components/ui/Timeline';
import { MedicalStatusBadge } from '../components/ui/MedicalStatusBadge';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { Table } from '../components/ui/Table';
import { Sparkline } from '../components/ui/Sparkline';
import { useToast } from '../providers/ToastProvider';

export default function DesignSystemPage() {
  const { push } = useToast();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Seo title="Design system" description="WellNest design primitives for Phase 1." />
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute inset-0 mesh-soft" />
        <Container className="relative py-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-600">Internal</p>
          <h1 className="mt-3 font-display text-4xl text-ink-900">Design system</h1>
          <p className="mt-3 max-w-2xl text-ink-500">
            Production primitives used across marketing and reserved for future clinical consoles.
          </p>
        </Container>
      </section>

      <Section>
        <Container className="space-y-16">
          <div>
            <SectionHeading title="Buttons" />
            <div className="mt-6 flex flex-wrap gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="soft">Soft</Button>
              <Button loading>Saving</Button>
            </div>
          </div>

          <div>
            <SectionHeading title="Inputs" />
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Input label="Patient name" placeholder="Elena Voss" />
              <Select label="Role" options={[{ value: 'doctor', label: 'Doctor' }]} />
              <Textarea label="Clinical note" placeholder="Impression…" />
              <Input label="With error" error="Required" />
            </div>
          </div>

          <div>
            <SectionHeading title="Feedback" />
            <div className="mt-6 space-y-3">
              <Alert tone="info" title="Info">Consent expires in 12 hours.</Alert>
              <Alert tone="success" title="Success">Panel signed by Harbor Lab.</Alert>
              <Alert tone="warning" title="Warning">Allergy list is incomplete.</Alert>
              <Alert tone="error" title="Error">Issuer credential expired.</Alert>
              <div className="flex flex-wrap items-center gap-3">
                <Spinner />
                <Button variant="outline" onClick={() => push({ title: 'Toast ready', description: 'Notification system is live.', tone: 'success' })}>
                  Trigger toast
                </Button>
                <Button variant="outline" onClick={() => setOpen(true)}>
                  Open modal
                </Button>
              </div>
              <Progress value={64} label="Onboarding" />
              <Sparkline points={[4, 8, 6, 12, 10, 16, 14, 18]} className="h-12 w-40" />
            </div>
          </div>

          <div>
            <SectionHeading title="Records" />
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge>Brand</Badge>
              <Badge tone="emerald">Emerald</Badge>
              <Badge tone="sky">Sky</Badge>
              <MedicalStatusBadge status="stable" />
              <MedicalStatusBadge status="critical" />
              <VerifiedBadge />
              <Avatar name="Maya Chen" src="/images/portrait-dr-chen.jpg" />
              <Avatar name="Jordan Hale" />
            </div>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader title="Timeline" description="Issued events" />
                <Timeline
                  items={[
                    { title: 'CMP released', meta: 'Today', body: 'Harbor Laboratory', tone: 'emerald' },
                    { title: 'Consult signed', meta: 'Mon', body: 'Northline Medical' },
                  ]}
                />
              </Card>
              <SkeletonCard />
            </div>
            <div className="mt-8">
              <Table
                columns={['Name', 'Role']}
                rows={[
                  ['Elena Voss', 'Patient'],
                  ['Dr. Chen', 'Doctor'],
                ]}
              />
            </div>
            <Card className="mt-8" padded={false}>
              <EmptyState title="No events yet" description="Issued records will appear on this timeline." />
            </Card>
            <Skeleton className="mt-6 h-10 w-48" />
          </div>
        </Container>
      </Section>

      <Modal open={open} onClose={() => setOpen(false)} title="Confirm share" description="Grant Dr. Chen 72-hour access to labs and medications." footer={<Button onClick={() => setOpen(false)}>Close</Button>}>
        <p className="text-sm text-ink-500">This is a design-system demonstration. No consent is written.</p>
      </Modal>
    </>
  );
}
