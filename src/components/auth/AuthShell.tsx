import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, HeartHandshake, ShieldCheck } from 'lucide-react';
import { LandingBrand } from '../../pages/landing/LandingChrome';
import { Seo } from '../seo/Seo';
import { paths } from '../../routes/paths';

export function AuthShell({
  title,
  description,
  children,
  seoTitle,
  seoDescription,
  asideQuote = 'A little less paperwork. A lot more peace of mind.',
  asideByline = 'Your health story. Beautifully connected.',
}: {
  title: string;
  description: string;
  children: ReactNode;
  seoTitle: string;
  seoDescription: string;
  asideQuote?: string;
  asideByline?: string;
}) {
  return (
    <div id="auth-root" className="flex min-h-dvh flex-col bg-[#faf9f5]">
      <Seo title={seoTitle} description={seoDescription} />
      <header className="flex min-h-[88px] items-center justify-between gap-4 px-5 sm:px-10 lg:px-12">
        <LandingBrand />
        <Link to={paths.contact} className="inline-flex min-h-11 items-center gap-2 text-[11px] font-medium text-[#60745b]">A little help?<ArrowUpRight size={14} /></Link>
      </header>
      <div className="grid flex-1 lg:grid-cols-[1fr_1fr]">
        <div className="flex items-center justify-center px-5 pb-12 pt-6 sm:px-10 lg:py-12">
          <div className="w-full max-w-[390px]">
            <Link to={paths.home} className="mb-8 inline-flex min-h-10 items-center gap-2 text-[10px] text-[#7a8872] hover:text-[#244c3d]"><ArrowLeft size={13} />Back to WellNest</Link>
            <p className="landing-label text-[#7a896b]">Your next chapter starts here</p>
            <h1 className="mt-4 text-balance font-display text-[46px] leading-[1.05] tracking-[-1.5px] text-[#173f35] sm:text-[55px]">
              {title}
            </h1>
            <p className="mt-4 max-w-[370px] text-xs leading-7 text-[#708066]">{description}</p>
            <div className="mt-7">{children}</div>
            <div className="mt-8 flex items-center justify-center gap-2 border-t border-[#dfe5d4] pt-5 text-[9px] text-[#7e8b73]"><ShieldCheck size={13} />One sign-in. Your own connected workspace.</div>
          </div>
        </div>
        <aside className="relative hidden p-4 pb-7 pl-0 lg:flex">
          <div className="relative isolate flex min-h-[660px] w-full flex-col justify-between overflow-hidden rounded-[32px] bg-[#173f35] p-10 xl:p-12">
            <div aria-hidden="true" className="absolute -right-28 -top-28 -z-10 size-[450px] rounded-full border border-[#c5d8a5]/15" />
            <div aria-hidden="true" className="absolute -right-14 -top-14 -z-10 size-[340px] rounded-full border border-[#c5d8a5]/15" />
            <div><span className="inline-flex items-center gap-2 text-[9px] font-medium uppercase tracking-[2px] text-[#d5e2bd]"><HeartHandshake size={18} strokeWidth={1.3} />Human first. Always.</span><p className="mt-7 font-display text-[57px] leading-[1.03] tracking-[-1px] text-[#f6f5e9]">Good care begins<br />with a <em className="text-[#c8d9ac]">connection.</em></p></div>
            <div className="relative my-8 h-[235px] overflow-hidden rounded-[80px_16px_16px_16px] bg-[#e5e7dd] xl:h-[290px]"><img src="/images/hero-clinician.jpg" alt="A welcoming healthcare professional" width="940" height="627" className="h-full w-full object-cover object-[60%_35%]" /><div className="absolute inset-0 bg-gradient-to-t from-[#173f35]/30 to-transparent" /><span className="absolute bottom-4 right-4 rounded-full border border-white/30 bg-white/90 px-4 py-2 text-[9px] text-[#244c3d]">Your care. All connected.</span></div>
            <div><p className="font-display text-[31px] leading-tight text-[#f5f3e5]">{asideQuote}</p><p className="mt-3 text-[10px] text-[#c4d3b9]">{asideByline}</p><div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 border-t border-[#c5d8a5]/20 pt-5 text-[9px] text-[#bbcdb0]">{['Patients', 'Doctors', 'Hospitals', 'Labs', 'Pharmacies', 'Insurance', 'Administrators'].map(label => <span key={label}>{label}</span>)}</div></div>
          </div>
        </aside>
      </div>
      <footer className="px-5 py-5 text-center text-[9px] text-[#819075]">© {new Date().getFullYear()} WellNest. Made with care, built around you.</footer>
    </div>
  );
}
