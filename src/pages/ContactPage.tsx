import { Link } from 'react-router-dom';
import { ArrowUpRight, HeartHandshake, MessageCircle, ShieldCheck, Building2 } from 'lucide-react';
import { Seo } from '../components/seo/Seo';
import { Container, Section } from '../components/ui/Container';
import { appConfig } from '../config/app';
import { paths } from '../routes/paths';

const helpTopics = [
  { icon: HeartHandshake, title: 'Your account & care workspace', description: 'Get help with signing in, appointments, records, or using your portal.' },
  { icon: Building2, title: 'Your organization', description: 'Ask about your hospital, laboratory, pharmacy, or insurance workspace.' },
  { icon: ShieldCheck, title: 'Privacy & account requests', description: 'Request your account data, a deletion review, or help with a lost authenticator.' },
];

export default function ContactPage() {
  return (
    <>
      <Seo title="Contact WellNest" description="Contact WellNest through Support. Create a private request and follow your conversation in one place." />
      <section className="relative overflow-hidden border-b border-line bg-[#faf9f5]">
        <div className="pointer-events-none absolute inset-0 mesh-soft" />
        <Container className="relative py-16 sm:py-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-600">Here for you</p>
          <h1 className="mt-5 max-w-3xl font-display text-5xl tracking-tight text-[#173f35] sm:text-6xl">A little help.<br /><span className="text-[#718568]">A lot more peace of mind.</span></h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-ink-500">Questions about WellNest? Start a conversation with Support and keep your request and replies together.</p>
          <Link to={appConfig.supportPath} className="mt-8 inline-flex min-h-12 items-center gap-5 rounded-full bg-[#173f35] px-7 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#24594a]">
            Open WellNest Support <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Container>
      </section>
      <Section>
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">How we can help</p>
            <div className="mt-7 space-y-7">
              {helpTopics.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex items-start gap-4">
                  <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef2e7] text-[#173f35]"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                  <div><h2 className="font-semibold text-ink-900">{title}</h2><p className="mt-2 text-sm leading-7 text-ink-500">{description}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-line bg-[#faf9f5] p-7 sm:p-9">
            <MessageCircle className="h-7 w-7 text-[#718568]" aria-hidden="true" />
            <h2 className="mt-5 font-display text-3xl text-[#173f35]">One conversation.<br />Everything in one place.</h2>
            <ol className="mt-7 space-y-5">
              {[
                ['Sign in to your account', 'Your request stays connected to your WellNest account.'],
                ['Tell us what you need', 'Choose a request type, add a subject, and describe how we can help.'],
                ['Follow the conversation', 'Return to Support to read replies and check your request status.'],
              ].map(([title, description], index) => (
                <li key={title} className="flex gap-4"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-brand-700">{index + 1}</span><div><h3 className="text-sm font-semibold text-ink-900">{title}</h3><p className="mt-1 text-sm leading-6 text-ink-500">{description}</p></div></li>
              ))}
            </ol>
            <p className="mt-7 border-t border-line pt-5 text-xs leading-6 text-ink-500">Keep passwords, authenticator codes, and medical attachments out of support messages.</p>
            <Link to={paths.privacy} className="mt-3 inline-block text-xs font-semibold text-brand-700 hover:underline">How your information is used</Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
