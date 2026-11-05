import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Menu, X } from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider';
import { dashboardPathFor } from '../../services/auth/authService';
import { paths } from '../../routes/paths';
import { useScrollLock } from '../../hooks/useScrollLock';
import { Logo } from '../../components/brand/Logo';

const navigation = [
  { label: 'Why WellNest', href: '/#why-wellnest' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Who we help', href: '/#ecosystem' },
  { label: 'Our promise', href: '/#security' },
];

export function LandingBrand({ light = false }: { light?: boolean }) {
  return <Logo inverted={light} />;
}

export function LandingHeader() {
  const [open, setOpen] = useState(false);
  const { user, role } = useAuth();
  const location = useLocation();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLAnchorElement>('a')?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); toggleRef.current?.focus(); }
      if (event.key === 'Tab') {
        const links = menuRef.current?.querySelectorAll<HTMLAnchorElement>('a');
        if (!links?.length) return;
        if (!event.shiftKey && document.activeElement === links[links.length - 1]) { event.preventDefault(); toggleRef.current?.focus(); }
        else if (event.shiftKey && document.activeElement === toggleRef.current) { event.preventDefault(); links[links.length - 1].focus(); }
        else if (event.shiftKey && document.activeElement === links[0]) { event.preventDefault(); toggleRef.current?.focus(); }
      }
    };
    const onResize = () => { if (window.innerWidth >= 1024) setOpen(false); };
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => { document.removeEventListener('keydown', onKey); window.removeEventListener('resize', onResize); };
  }, [open]);

  const destination = user && role ? dashboardPathFor(role) : paths.login;
  const cta = user && role ? 'Your workspace' : 'Get started';
  return (
    <header className="sticky top-0 z-50 border-b border-[#173f35]/8 bg-[#faf9f5]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[88px] max-w-[1280px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
        <LandingBrand />
        <nav className="hidden items-center gap-7 xl:gap-9 lg:flex" aria-label="Primary navigation">
          {navigation.map(item => <Link key={item.href} to={item.href} className={`text-[12px] font-medium transition-colors hover:text-[#a54f33] ${location.pathname + location.hash === item.href ? 'text-[#a54f33]' : 'text-[#3e554c]'}`}>{item.label}</Link>)}
        </nav>
        <div className="hidden items-center gap-6 lg:flex">
          {!user && <Link to={paths.login} className="text-xs font-semibold text-[#173f35] hover:text-[#a54f33]">Log in</Link>}
          <Link to={destination} className="landing-button bg-[#173f35] text-white hover:bg-[#295b48]">{cta}<ArrowUpRight size={15} /></Link>
        </div>
        <button ref={toggleRef} type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="landing-mobile-menu" aria-label={open ? 'Close navigation' : 'Open navigation'} className="flex size-11 items-center justify-center rounded-full border border-[#173f35]/15 text-[#173f35] lg:hidden">{open ? <X size={21} /> : <Menu size={21} />}</button>
      </div>
      {open && <div ref={menuRef} id="landing-mobile-menu" className="fixed inset-x-0 top-[88px] h-[calc(100dvh-88px)] overflow-y-auto bg-[#faf9f5] px-6 py-8 lg:hidden">
        <nav aria-label="Mobile navigation" className="flex flex-col">
          {navigation.map(item => <Link onClick={() => setOpen(false)} key={item.href} to={item.href} className="border-b border-[#173f35]/10 py-5 text-xl text-[#173f35]">{item.label}</Link>)}
          {!user && <Link onClick={() => setOpen(false)} to={paths.login} className="py-6 text-lg text-[#173f35]">Log in</Link>}
          <Link onClick={() => setOpen(false)} to={destination} className="landing-button mt-5 bg-[#173f35] text-white">{cta}<ArrowRight size={18} /></Link>
        </nav>
      </div>}
    </header>
  );
}

export function LandingFooter() {
  const columns = [
    { title: 'Explore', items: [{ label: 'Why WellNest', href: '/#why-wellnest' }, { label: 'How it works', href: '/#how-it-works' }, { label: 'Features', href: paths.features }, { label: 'Our promise', href: '/#security' }] },
    { title: 'For your world', items: [{ label: 'Patients', href: paths.roles.patient }, { label: 'Doctors', href: paths.roles.doctor }, { label: 'Hospitals & clinics', href: paths.roles.hospital }, { label: 'Laboratories', href: paths.roles.laboratory }, { label: 'Pharmacies', href: paths.roles.pharmacy }, { label: 'Insurance', href: paths.roles.insurance }] },
    { title: 'Say hello', items: [{ label: 'About us', href: paths.about }, { label: 'Contact our team', href: paths.contact }, { label: 'Common questions', href: '/#faq' }, { label: 'Log in to WellNest', href: paths.login }] },
  ];
  return (
    <footer className="bg-[#faf9f5] text-[#173f35]">
      <div className="mx-auto max-w-[1280px] px-5 pb-7 pt-16 sm:px-8 lg:px-12">
        <div className="grid gap-12 pb-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div><LandingBrand /><p className="mt-5 max-w-[230px] text-[13px] leading-7 text-[#65776d]">Your health.<br />Connected for life.</p><div className="mt-5 inline-flex items-center gap-2 text-[10px] text-[#65776d]"><span className="size-1.5 rounded-full bg-[#6c9272]" />Made with care. Built around you.</div></div>
          {columns.map(column => <div key={column.title}><h2 className="text-xs font-semibold">{column.title}</h2><ul className="mt-5 space-y-3.5">{column.items.map(item => <li key={item.label}><Link to={item.href} className="text-[12px] text-[#65776d] transition-colors hover:text-[#a54f33]">{item.label}</Link></li>)}</ul></div>)}
        </div>
        <div className="flex flex-col justify-between gap-3 border-t border-[#173f35]/12 pt-6 text-[10px] text-[#65776d] sm:flex-row"><p>© {new Date().getFullYear()} WellNest. All rights reserved.</p><div className="flex gap-5"><Link to={paths.privacy}>Privacy & controls</Link><Link to={paths.support}>Support</Link></div></div>
      </div>
    </footer>
  );
}
