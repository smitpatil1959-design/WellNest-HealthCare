import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Shield,
  FileText,
  Pill,
  Siren,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  LifeBuoy,
} from 'lucide-react';
import { Seo } from '../../components/seo/Seo';
import { PatientPageHeader } from '../../components/patient/PatientPageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { paths } from '../../routes/paths';
import { fadeUp, stagger } from '../../animations/variants';

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    id: '1',
    category: 'Consent & Privacy',
    question: 'How do doctor access grants work?',
    answer:
      'Approving a request saves a time-limited grant for the listed record categories. The server checks the grant before provider requests. Review expiry dates or revoke active grants from "Who can access". Revocation cannot retrieve copies that were already shared.',
  },
  {
    id: '2',
    category: 'Records & Reports',
    question: 'Can I delete or modify a record signed by a hospital?',
    answer:
      'Clinical records are linked to their issuing provider. Contact that provider or open a Support & privacy request to ask for a correction or deletion review. A request does not automatically alter or delete your medical records.',
  },
  {
    id: '3',
    category: 'Prescriptions & Refills',
    question: 'How do I refill a prescription through the platform?',
    answer:
      'The patient portal currently displays your prescription details but does not submit refill requests. Contact your prescribing clinician or pharmacy directly to arrange a refill.',
  },
  {
    id: '4',
    category: 'Emergency QR Card',
    question: 'What information is visible when first responders scan my Emergency QR?',
    answer:
      'The Emergency QR reveals only critical lifesaving facts: your name, blood group, recorded life-threatening allergies, active emergency medications, and immediate emergency contact phone numbers. It never exposes your confidential consultation notes or full medical history.',
  },
  {
    id: '5',
    category: 'Universal Health ID',
    question: 'Is my Health ID tied to a single hospital system?',
    answer:
      'Your Health ID identifies your WellNest patient account. Participating providers use it to request access; the ID alone does not grant permission or automatically connect records held in external hospital systems.',
  },
];

export default function HelpCenterPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('1');

  const filteredFaqs = faqs.filter(
    (item) =>
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Seo
        title="Help Center & Support — WellNest"
        description="Knowledge base, patient guides, and assistance for the WellNest health platform."
      />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <PatientPageHeader
          eyebrow="Help & Resources"
          title="Patient Help Center"
          description="Everything you need to know about managing your universal records, granting clinical consent, and using emergency features."
        />

        {/* Search Hero */}
        <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8">
          <div className="pointer-events-none absolute inset-0 aurora opacity-40" />
          <div className="relative max-w-xl">
            <h2 className="text-xl font-bold tracking-tight text-ink-900 sm:text-2xl">
              How can we assist you today?
            </h2>
            <p className="mt-1 text-xs text-ink-500">
              Search by keyword, clinical feature, or privacy guideline
            </p>
            <div className="mt-4">
              <Input
                placeholder="Search articles: consent, emergency QR, lab reports, refills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="h-4 w-4 text-ink-400" />}
              />
            </div>
          </div>
        </motion.div>

        {/* Category Cards */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <CategoryCard
            icon={Shield}
            title="Consent & Privacy"
            description="Access controls & revocation"
          />
          <CategoryCard
            icon={FileText}
            title="Records & Reports"
            description="Diagnostic result timelines"
          />
          <CategoryCard
            icon={Pill}
            title="Prescriptions"
            description="Dosage adherence & refills"
          />
          <CategoryCard
            icon={Siren}
            title="Emergency Access"
            description="Paramedic QR fact sheets"
          />
        </motion.div>

        {/* FAQ Accordion & Contact Support Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          <motion.div variants={fadeUp} className="space-y-3 lg:col-span-2">
            <div className="mb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-ink-500">
                Frequently Asked Questions
              </h3>
            </div>

            {filteredFaqs.map((faq) => {
              const isOpen = expandedId === faq.id;
              return (
                <Card key={faq.id} className="transition-all">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isOpen ? null : faq.id)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700">
                        {faq.category}
                      </span>
                      <h4 className="mt-0.5 text-sm font-semibold text-ink-900">
                        {faq.question}
                      </h4>
                    </div>
                    <div className="ml-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-ink-500">
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </button>

                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 border-t border-slate-100 pt-3 text-xs leading-relaxed text-ink-600"
                    >
                      {faq.answer}
                    </motion.div>
                  )}
                </Card>
              );
            })}
          </motion.div>

          {/* Contact Support Desk */}
          <motion.div variants={fadeUp} className="space-y-4">
            <Card className="border-teal-200/70 bg-gradient-to-br from-white to-brand-50/40">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 text-white shadow-xs">
                  <LifeBuoy className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink-900">WellNest Patient Desk</h3>
                  <p className="text-[11px] text-ink-500">A little help, when you need it.</p>
                </div>
              </div>

              <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-3 text-xs text-ink-600">
                <p className="leading-6">Questions about your account, records, or access? Our contact page helps you prepare an email to the support team.</p>
                <p className="text-[11px] text-ink-400">
                  Have your question ready, and leave sensitive medical information out of your message.
                </p>
              </div>

              <Button
                to={paths.contact}
                size="sm"
                fullWidth
                className="mt-5"
                leftIcon={<MessageSquare className="h-3.5 w-3.5" />}
              >
                Contact support
              </Button>
            </Card>

            <Card className="bg-slate-50/70 border-slate-200/60">
              <h4 className="text-xs font-bold text-ink-900">Clinical Emergency?</h4>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-500">
                If you are experiencing an acute medical emergency, please dial <strong>911</strong> or visit your nearest hospital emergency department immediately.
              </p>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}

function CategoryCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Shield;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all hover:border-brand-200 hover:shadow-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <h3 className="mt-3 text-xs font-bold text-ink-900">{title}</h3>
      <p className="mt-0.5 text-[11px] text-ink-400">{description}</p>
    </div>
  );
}
