import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, ArrowDown, ArrowRight, ArrowUpRight, BadgeCheck, Building2,
  Check, CheckCheck, ClipboardList, FileCheck2, FileHeart, FileText,
  Fingerprint, FlaskConical, Heart, HeartHandshake, Hospital, LockKeyhole,
  Pill, Plus, QrCode, ShieldCheck, Stethoscope, UserRound, Users,
} from 'lucide-react';
import { paths } from '../../routes/paths';
import { useAuth } from '../../providers/AuthProvider';
import { dashboardPathFor } from '../../services/auth/authService';

const audiences = [
  { name: 'Patients', icon: Heart, title: 'More living.', emphasis: 'Less managing.', description: 'Your reports, prescriptions, and care history, together at last. Walk into your next appointment with your health story already in your hands.', image: 'family-wellness.jpg', alt: 'A family spending time together outdoors', points: ['Your health records in one place', 'Share with the people caring for you', 'A health identity that stays with you'], href: paths.roles.patient, link: 'Explore WellNest for patients', caption: 'For the moments that matter.' },
  { name: 'Doctors', icon: Stethoscope, title: 'The whole story.', emphasis: 'Better connected.', description: 'Bring the patient’s history into focus. Review shared records, manage consultations, and keep prescriptions connected to the care you provide.', image: 'doctor-laptop.jpg', alt: 'A doctor working with digital records', points: ['Patient history with permission', 'Connected consultation workflows', 'Prescriptions and reports together'], href: paths.roles.doctor, link: 'Explore WellNest for doctors', caption: 'More time for the person in front of you.' },
  { name: 'Hospitals', icon: Hospital, title: 'Many departments.', emphasis: 'One care journey.', description: 'Connect the everyday work of your hospital, from patient registration and appointments to clinical records and discharge documentation.', image: 'hospital-lobby.jpg', alt: 'A bright and welcoming hospital interior', points: ['Connected patient records', 'Appointments and admissions', 'A shared organizational workspace'], href: paths.roles.hospital, link: 'Explore WellNest for hospitals', caption: 'Care that moves together.' },
  { name: 'Laboratories', icon: FlaskConical, title: 'Every report.', emphasis: 'In the right hands.', description: 'Keep test requests, reports, and publishing in one workflow. Help patients and their care teams find the information they need.', image: 'laboratory.jpg', alt: 'Laboratory equipment used for diagnostic testing', points: ['Manage tests and report workflows', 'Publish patient-linked results', 'Keep diagnostic records connected'], href: paths.roles.laboratory, link: 'Explore WellNest for laboratories', caption: 'A clearer path from test to care.' },
  { name: 'Pharmacies', icon: Pill, title: 'Connected prescriptions.', emphasis: 'Considered care.', description: 'Bring prescription verification, dispensing queues, inventory, and orders into a workspace built for your pharmacy’s day.', image: 'pharmacy.jpg', alt: 'Organized shelves in a pharmacy', points: ['Prescription verification tools', 'Connected dispensing workflows', 'Inventory and order management'], href: paths.roles.pharmacy, link: 'Explore WellNest for pharmacies', caption: 'Every prescription, part of the story.' },
  { name: 'Insurance', icon: ShieldCheck, title: 'Clearer records.', emphasis: 'Connected support.', description: 'Keep policies, member information, claims, and supporting documents organized in one dedicated insurance workspace.', image: 'insurance.jpg', alt: 'Insurance documents and planning materials', points: ['Member and policy management', 'Claims and document workflows', 'Role-based access to information'], href: paths.roles.insurance, link: 'Explore WellNest for insurance', caption: 'Clarity at every step.' },
];

const questions = [
  { question: 'What is WellNest?', answer: 'WellNest is a digital health platform that brings patients, doctors, hospitals, laboratories, pharmacies, and insurance providers into connected workspaces. It helps keep medical records and care information organized around the patient.' },
  { question: 'Who can use WellNest?', answer: 'Patients and healthcare professionals can create an account and choose the role that fits them. Dedicated workspaces are available for doctors, hospitals, laboratories, pharmacies, and insurance teams.' },
  { question: 'Who can see my medical records?', answer: 'WellNest provides access controls so you can review requests to your records and manage sharing. Healthcare teams use role-based workspaces, and access history helps you keep track of activity.' },
  { question: 'What can I keep in my health record?', answer: 'The patient workspace includes medical records, lab reports, prescriptions, medications, vaccinations, appointments, and a health timeline, so you can find the different parts of your care in one place.' },
  { question: 'How do I get started?', answer: 'Choose Get started, then sign in or create an account and select your role. Once your setup is complete, you can open your workspace and start exploring your health records or care workflows.' },
];

function HealthCard() {
  return (
    <div className="w-[230px] rounded-[20px] border border-white/80 bg-white/95 p-5 text-[#173f35] shadow-[0_15px_50px_-12px_#173f3530] backdrop-blur-md sm:w-[258px]">
      <div className="flex items-center justify-between"><span className="text-[9px] font-semibold uppercase tracking-[1.7px]">Your health, at a glance</span><span className="flex size-7 items-center justify-center rounded-full bg-[#edf3e8]"><Heart size={13} /></span></div>
      <div className="mt-4 flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-full bg-[#f4e5d9]"><UserRound size={22} strokeWidth={1.4} /></span><div><p className="text-sm font-semibold">Hello, Alex <span aria-hidden="true">☀</span></p><p className="mt-1 text-[10px] text-[#6b7c72]">Your care. All connected.</p></div></div>
      <div className="mt-5 space-y-3">{[{ icon: FileText, label: 'Medical records', value: 'Together' }, { icon: Pill, label: 'Prescriptions', value: 'Organized' }, { icon: ShieldCheck, label: 'Sharing controls', value: 'Yours' }].map(item => <div key={item.label} className="flex items-center gap-2 text-[10px]"><item.icon size={13} className="text-[#718a75]" /><span className="text-[#6b7c72]">{item.label}</span><span className="ml-auto font-medium">{item.value}</span></div>)}</div>
      <div className="mt-4 flex items-center gap-1.5 border-t border-[#173f35]/8 pt-3 text-[9px] text-[#718475]"><CheckCheck size={12} /> Illustrative patient workspace</div>
    </div>
  );
}

function Hero() {
  const { user, role } = useAuth();
  return (
    <section className="relative overflow-hidden bg-[#faf9f5]">
      <div className="landing-wrap grid items-center gap-10 pb-14 pt-10 sm:pt-14 lg:min-h-[680px] lg:grid-cols-[1fr_1fr] lg:gap-14 lg:pb-20 lg:pt-12">
        <div className="landing-enter relative z-10 max-w-[570px]">
          <p className="landing-label text-[#637b60]">A little more connected. A lot more you.</p>
          <h1 className="landing-serif mt-7 text-[66px] leading-[0.99] tracking-[-2.4px] text-[#173f35] sm:text-[85px] lg:text-[98px]">Your health,<br />all together.<br /><span className="italic text-[#728c68]">Finally.</span><span className="text-[#dd9478]">✳</span></h1>
          <p className="mt-7 max-w-[370px] text-[14px] leading-[1.9] text-[#66766b]">A little less paperwork. A lot more peace of mind. Your records, your care team, your health story — beautifully connected in one place.</p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link to={user && role ? dashboardPathFor(role) : paths.login} className="landing-button bg-[#173f35] text-white shadow-lg shadow-[#173f35]/10 hover:bg-[#295b48]">{user && role ? 'Open your workspace' : 'Start your health journey'}<ArrowUpRight size={17} /></Link>
            <a href="#how-it-works" className="inline-flex min-h-11 items-center gap-2.5 text-xs font-semibold text-[#173f35] hover:text-[#a54f33]">Discover WellNest<span className="flex size-7 items-center justify-center rounded-full border border-[#173f35]/20"><ArrowDown size={13} /></span></a>
          </div>
          <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] text-[#68796c]"><span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} />Your privacy comes first</span><span className="inline-flex items-center gap-1.5"><Check size={14} />Built around your care</span></div>
        </div>
        <div className="landing-enter landing-enter-delay relative mx-auto w-full max-w-[560px] pb-9 pl-7 pt-4 sm:pl-12 lg:pl-9">
          <div className="landing-photo relative h-[410px] overflow-hidden bg-[#e7e9e1] sm:h-[495px] lg:h-[518px]">
            <img src="/images/hero-clinician.jpg" alt="A smiling healthcare professional ready to help" fetchPriority="high" width="940" height="627" className="h-full w-full object-cover object-[58%_center]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#173f35]/20 via-transparent to-transparent" />
            <div className="absolute bottom-5 right-5 text-right text-white"><p className="landing-serif text-[27px] italic">Care, with you at the heart.</p><p className="mt-1 text-[9px] tracking-[1px]">THE WellNest WAY</p></div>
          </div>
          <div className="absolute -right-1 -top-1 flex size-[104px] -rotate-12 flex-col items-center justify-center gap-1 rounded-full border-[5px] border-[#faf9f5] bg-[#dce9cc] text-[#284b35] sm:right-0 sm:size-[116px]"><HeartHandshake size={28} strokeWidth={1.3} /><span className="text-center text-[8px] font-semibold uppercase leading-4 tracking-[1px]">Human first.<br />Always.</span></div>
          <div className="absolute bottom-0 left-0"><HealthCard /></div>
          <span aria-hidden="true" className="landing-serif absolute -right-1 bottom-[-6px] text-[75px] leading-none text-[#dc997f]">✳</span>
        </div>
      </div>
      <div className="border-y border-[#173f35]/10 bg-[#eeefe6]">
        <div className="landing-wrap flex flex-col items-center justify-between gap-5 py-6 lg:flex-row"><p className="text-[9px] font-semibold uppercase tracking-[1.8px] text-[#74816e]">One connected world of care</p><div className="flex flex-wrap justify-center gap-x-6 gap-y-4 sm:gap-x-8">{[{ icon: UserRound, label: 'Patients' }, { icon: Stethoscope, label: 'Doctors' }, { icon: Building2, label: 'Hospitals' }, { icon: FlaskConical, label: 'Laboratories' }, { icon: Pill, label: 'Pharmacies' }, { icon: ShieldCheck, label: 'Insurance' }].map(item => <a key={item.label} href="#ecosystem" className="flex items-center gap-2 text-[11px] font-medium text-[#51674f] hover:text-[#a54f33]"><item.icon size={18} strokeWidth={1.4} />{item.label}</a>)}</div></div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="why-wellnest" className="landing-wrap py-20 sm:py-24 lg:py-28">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="landing-label text-[#718469]">Less scattered. More connected.</p><h2 className="landing-serif mt-5 text-[43px] leading-[1.08] tracking-[-1px] sm:text-[54px]">Healthcare can feel complicated.<br /><span className="italic text-[#758b6b]">Your health shouldn’t.</span></h2></div><p className="max-w-[270px] text-[12px] leading-7 text-[#718073]">We bring the pieces together, so you can focus on what matters most: feeling better and living well.</p></div>
      <div className="mt-11 grid gap-5 lg:grid-cols-[1.25fr_1fr_1fr]">
        <article className="relative overflow-hidden rounded-[24px] bg-[#eae9f1] p-7 sm:p-8">
          <FileHeart size={25} strokeWidth={1.4} className="text-[#68657d]" /><h3 className="landing-serif mt-5 text-[31px] leading-tight text-[#3a3b52]">Your whole health story.<br />One happy place.</h3><p className="mt-3 max-w-[280px] text-xs leading-6 text-[#737183]">Lab reports, prescriptions, and medical history. Easy to find. Ready when life happens.</p>
          <div className="mt-7 space-y-2.5 rounded-2xl bg-white/75 p-4 shadow-[0_10px_30px_-15px_#54506f25]">{[{ icon: FlaskConical, title: 'Lab reports', sub: 'The details, together', color: 'bg-[#e9e6f2] text-[#7c6b9b]' }, { icon: Pill, title: 'Prescriptions', sub: 'Care you can keep track of', color: 'bg-[#f7e9dd] text-[#b68864]' }, { icon: ClipboardList, title: 'Medical history', sub: 'Your story, in one timeline', color: 'bg-[#e8efdf] text-[#6d8858]' }].map(item => <div key={item.title} className="flex items-center gap-3 rounded-xl bg-white p-2.5"><span className={`flex size-9 items-center justify-center rounded-lg ${item.color}`}><item.icon size={17} strokeWidth={1.6} /></span><div><p className="text-[10px] font-semibold text-[#414a45]">{item.title}</p><p className="mt-1 text-[8px] text-[#7d867e]">{item.sub}</p></div><BadgeCheck size={15} className="ml-auto text-[#73956b]" /></div>)}</div>
          <Link to={paths.features} className="mt-6 inline-flex min-h-10 items-center gap-2 text-[11px] font-semibold text-[#58516f]">Meet your health record<ArrowUpRight size={14} /></Link>
        </article>
        <article className="overflow-hidden rounded-[24px] bg-[#e5ecd9] p-7 sm:p-8">
          <Fingerprint size={26} strokeWidth={1.4} className="text-[#5c7751]" /><h3 className="landing-serif mt-5 text-[31px] leading-tight">One identity.<br />A lifetime of you.</h3><p className="mt-3 text-xs leading-6 text-[#6a7c60]">Your personal Health ID connects your care journey, wherever it takes you.</p>
          <div className="mt-9 -rotate-6 rounded-[16px] bg-[#234b3b] p-5 text-[#edf4e4] shadow-xl shadow-[#234b3b]/15"><div className="flex items-center justify-between"><span className="text-[15px] font-semibold tracking-tight">WellNest</span><span className="text-[7px] uppercase tracking-[1.5px]">Health ID</span></div><div className="mt-7 flex items-end justify-between"><div><p className="text-[8px] text-[#b8cbb0]">YOUR HEALTH. YOUR IDENTITY.</p><p className="mt-2 text-[13px] tracking-[2px]">WN •••• •••• 2026</p></div><QrCode size={34} strokeWidth={1.3} /></div><p className="mt-4 text-[7px] text-[#bdd1b4]">Illustrative Health ID</p></div>
          <Link to={paths.roles.patient} className="mt-9 inline-flex min-h-10 items-center gap-2 text-[11px] font-semibold">Make it yours<ArrowUpRight size={14} /></Link>
        </article>
        <article className="relative overflow-hidden rounded-[24px] bg-[#f2e2d8] p-7 sm:p-8">
          <HeartHandshake size={26} strokeWidth={1.4} className="text-[#a67c64]" /><h3 className="landing-serif mt-5 text-[31px] leading-tight text-[#654c3e]">Good care.<br />Great connections.</h3><p className="mt-3 text-xs leading-6 text-[#957a69]">Keep your care team on the same page. Share the right information, on your terms.</p>
          <div className="relative mx-auto mt-6 flex h-[170px] w-[210px] items-center justify-center"><div className="absolute size-[146px] rounded-full border border-dashed border-[#b6967c]/50" /><div className="absolute size-[94px] rounded-full border border-[#b6967c]/25" /><span className="relative flex size-16 items-center justify-center rounded-full bg-[#fcf7f0] shadow-md"><Heart size={28} strokeWidth={1.3} className="text-[#a97961]" /></span><span className="absolute left-0 top-6 flex size-12 items-center justify-center rounded-full border-4 border-[#f2e2d8] bg-[#e4eacb]"><Stethoscope size={20} className="text-[#687b4e]" /></span><span className="absolute right-1 top-3 flex size-12 items-center justify-center rounded-full border-4 border-[#f2e2d8] bg-[#eee6f0]"><FlaskConical size={19} className="text-[#96819c]" /></span><span className="absolute bottom-1 left-[78px] flex size-12 items-center justify-center rounded-full border-4 border-[#f2e2d8] bg-[#e6d2bc]"><Hospital size={19} className="text-[#9e8064]" /></span></div>
          <Link to="/#ecosystem" className="mt-3 inline-flex min-h-10 items-center gap-2 text-[11px] font-semibold text-[#785844]">Find your connection<ArrowUpRight size={14} /></Link>
        </article>
      </div>
    </section>
  );
}

function Ecosystem() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const audience = audiences[active];
  return (
    <section id="ecosystem" className="bg-[#f0f1e9] py-20 sm:py-24">
      <div className="landing-wrap">
        <div className="text-center"><p className="landing-label justify-center text-[#73816b]">For every person. For every part of care.</p><h2 className="landing-serif mt-5 text-[44px] leading-tight tracking-[-1px] sm:text-[57px]">Different roles. <span className="italic text-[#778d6c]">One shared purpose.</span></h2></div>
        <div role="tablist" aria-label="Explore WellNest for your role" className="mx-auto mt-8 flex max-w-[850px] flex-wrap justify-center gap-2 rounded-[24px] bg-[#e6e9dd] p-2 sm:rounded-full">
          {audiences.map((item, index) => <button key={item.name} ref={node => { tabRefs.current[index] = node; }} id={`audience-tab-${index}`} role="tab" aria-selected={active === index} aria-controls="audience-panel" tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={event => { let next = index; if (event.key === 'ArrowRight') next = (index + 1) % audiences.length; else if (event.key === 'ArrowLeft') next = (index + audiences.length - 1) % audiences.length; else if (event.key === 'Home') next = 0; else if (event.key === 'End') next = audiences.length - 1; else return; event.preventDefault(); setActive(next); tabRefs.current[next]?.focus(); }} className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-3 text-[11px] font-medium transition-colors ${active === index ? 'bg-[#244b3b] text-white shadow-sm' : 'text-[#63745e] hover:bg-white/60'}`}><item.icon size={14} />{item.name}</button>)}
        </div>
        <div id="audience-panel" role="tabpanel" aria-labelledby={`audience-tab-${active}`} tabIndex={0} className="mt-10 grid overflow-hidden rounded-[26px] bg-[#faf9f5] lg:min-h-[430px] lg:grid-cols-2">
          <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14"><h3 className="landing-serif text-[43px] leading-[1.08] tracking-[-0.5px] sm:text-[51px]">{audience.title}<br /><span className="italic text-[#7a8e6a]">{audience.emphasis}</span></h3><p className="mt-5 max-w-[350px] text-xs leading-7 text-[#6e7a6b]">{audience.description}</p><ul className="mt-5 space-y-3">{audience.points.map(point => <li key={point} className="flex items-center gap-2.5 text-[11px] text-[#425b45]"><span className="flex size-4 items-center justify-center rounded-full bg-[#e8eddf]"><Check size={10} /></span>{point}</li>)}</ul><Link to={audience.href} className="mt-7 inline-flex min-h-10 items-center gap-3 text-xs font-semibold">{audience.link}<ArrowUpRight size={15} /></Link></div>
          <div className="relative min-h-[300px] overflow-hidden lg:min-h-[430px]"><img key={audience.image} src={`/images/${audience.image}`} alt={audience.alt} loading="lazy" width="940" height="627" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-[#173f35]/65 to-transparent" /><div className="absolute bottom-8 left-8 right-8"><Heart size={23} className="mb-3 text-[#eceddd]" strokeWidth={1.4} /><p className="landing-serif text-[30px] italic leading-tight text-white">{audience.caption}</p></div></div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: UserRound, title: 'Make yourself at home.', body: 'Create your account and choose your role. Your personal workspace is where your connected care journey begins.', number: '01', color: 'bg-[#e8eddd]' },
    { icon: FileCheck2, title: 'Bring your story together.', body: 'Find your records, reports, and prescriptions in one place. A clearer picture of your health, without the paper trail.', number: '02', color: 'bg-[#eee8f1]' },
    { icon: HeartHandshake, title: 'Move forward, connected.', body: 'Manage sharing with your care team and keep your health information close, wherever life takes you next.', number: '03', color: 'bg-[#f3e4d8]' },
  ];
  return (
    <section id="how-it-works" className="landing-wrap py-20 sm:py-24 lg:py-28">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="landing-label text-[#73816b]">A fresh start, without the fuss</p><h2 className="landing-serif mt-5 text-[44px] leading-tight tracking-[-1px] sm:text-[56px]">A simpler way <span className="italic text-[#778d6c]">to feel connected.</span></h2></div><Link to={paths.login} className="mb-2 inline-flex min-h-10 shrink-0 items-center gap-3 text-xs font-semibold">Let’s get you started<ArrowUpRight size={15} /></Link></div>
      <ol className="mt-12 grid gap-9 md:grid-cols-3 md:gap-8">{steps.map(step => <li key={step.number} className="relative border-t border-[#173f35]/15 pt-7"><div className="flex items-center justify-between"><span className={`flex size-14 items-center justify-center rounded-[18px] ${step.color}`}><step.icon size={24} strokeWidth={1.35} /></span><span className="landing-serif text-[43px] text-[#a4ad96]">{step.number}</span></div><h3 className="mt-6 text-[15px] font-semibold">{step.title}</h3><p className="mt-3 max-w-[320px] text-xs leading-7 text-[#778071]">{step.body}</p></li>)}</ol>
    </section>
  );
}

function Security() {
  return (
    <section id="security" className="bg-[#173f35] text-[#f4f4e9]">
      <div className="landing-wrap grid gap-12 py-20 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-20">
        <div><p className="landing-label text-[#c4d5a8]">Personal to you. Protected by design.</p><h2 className="landing-serif mt-6 text-[48px] leading-[1.06] tracking-[-1px] sm:text-[62px]">Your health is personal.<br /><span className="italic text-[#c4d5a8]">Let’s keep it that way.</span></h2><p className="mt-6 max-w-[390px] text-xs leading-7 text-[#c2cfc2]">Trust begins with control. WellNest brings your health information together with thoughtful tools to manage who can see it.</p><Link to={paths.features} className="mt-7 inline-flex min-h-11 items-center gap-3 border-b border-[#c4d5a8]/40 pb-1 text-xs font-medium text-[#e3edce]">Get to know our platform<ArrowUpRight size={15} /></Link></div>
        <div className="relative rounded-[24px] border border-[#b3c99e]/20 bg-[#244b3e] p-6 sm:p-8"><div className="mb-7 flex items-center gap-3 border-b border-[#d6e2c5]/15 pb-5"><span className="flex size-12 items-center justify-center rounded-full bg-[#d5e5be] text-[#244b3e]"><ShieldCheck size={24} strokeWidth={1.4} /></span><div><p className="text-[14px] font-medium">Care built on trust.</p><p className="mt-1 text-[10px] text-[#bccdb8]">Your information. Your choices.</p></div></div><div className="space-y-6">{[{ icon: LockKeyhole, title: 'You’re in control', body: 'Review access requests and manage record sharing.' }, { icon: Users, title: 'The right access for each role', body: 'Dedicated workspaces for patients and care teams.' }, { icon: Activity, title: 'A clearer view of activity', body: 'Access history helps you follow your record’s journey.' }].map(item => <div key={item.title} className="flex gap-4"><item.icon size={20} strokeWidth={1.35} className="mt-0.5 shrink-0 text-[#c3d6a6]" /><div><h3 className="text-xs font-medium">{item.title}</h3><p className="mt-1.5 text-[11px] leading-6 text-[#baccb7]">{item.body}</p></div></div>)}</div></div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="landing-wrap grid gap-10 py-20 sm:py-24 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:py-28">
      <div><p className="landing-label text-[#73816b]">A little clarity goes a long way</p><h2 className="landing-serif mt-5 text-[47px] leading-[1.08] tracking-[-1px] sm:text-[57px]">Good questions.<br /><span className="italic text-[#778d6c]">Thoughtful answers.</span></h2><p className="mt-5 max-w-[270px] text-xs leading-7 text-[#718073]">Your health deserves clarity. Here are a few things you might be wondering.</p><Link to={paths.contact} className="mt-6 inline-flex min-h-10 items-center gap-3 text-xs font-semibold">Still curious? Let’s talk<ArrowUpRight size={15} /></Link></div>
      <div className="space-y-2">{questions.map((item, index) => <details key={item.question} className="landing-faq group rounded-2xl border-b border-[#173f35]/12 px-5 transition-colors" open={index === 0 ? true : undefined}><summary className="flex min-h-[68px] cursor-pointer list-none items-center justify-between gap-4 py-5 text-xs font-semibold"><span>{item.question}</span><Plus size={17} className="faq-plus shrink-0 text-[#71866b] transition-transform" /></summary><p className="pb-6 pr-4 text-xs leading-7 text-[#718073]">{item.answer}</p></details>)}</div>
    </section>
  );
}

function Cta() {
  const { user, role } = useAuth();
  return (
    <section className="landing-wrap pb-7">
      <div className="relative isolate overflow-hidden rounded-[28px] bg-[#e9c6b3] px-6 py-14 text-center sm:px-12 sm:py-16">
        <span aria-hidden="true" className="landing-serif pointer-events-none absolute -bottom-16 -left-7 -z-10 text-[270px] leading-none text-[#d6aa92]/45">✳</span><span aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 -z-10 size-80 rounded-full border border-[#9a7159]/15" /><span aria-hidden="true" className="pointer-events-none absolute -right-12 -top-16 -z-10 size-64 rounded-full border border-[#9a7159]/15" />
        <p className="landing-label justify-center text-[#6e5744]">Here’s to a healthier connection</p><h2 className="landing-serif mt-5 text-[47px] leading-[1.04] tracking-[-1px] sm:text-[65px]">Your next chapter.<br /><span className="italic">A little more together.</span></h2><p className="mx-auto mt-5 max-w-[370px] text-xs leading-7 text-[#725e4d]">Make room for a simpler, more connected health journey. We’ll be right here with you.</p><Link to={user && role ? dashboardPathFor(role) : paths.login} className="landing-button mt-7 bg-[#173f35] text-white hover:bg-[#295b48]">{user && role ? 'Open your workspace' : 'Find your place at WellNest'}<ArrowRight size={16} /></Link>
      </div>
    </section>
  );
}

export function PremiumLanding() {
  return <><Hero /><Features /><Ecosystem /><HowItWorks /><Security /><Faq /><Cta /></>;
}
