import { Link } from 'react-router-dom';
import { Logo } from '../components/brand/Logo';
import { Container } from '../components/ui/Container';
import { appConfig } from '../config/app';
import { footerNav } from '../config/navigation';

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-slate-200/80 bg-[#f8fafc]">
      <div className="pointer-events-none absolute -right-24 top-0 h-64 w-64 rounded-full bg-brand-100/40 blur-3xl" />
      <Container className="relative py-16 sm:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-5 max-w-sm text-sm leading-6 text-ink-500">
              A universal digital health ecosystem for source-verified medical records and consent-based sharing between patients and authorized care organizations.
            </p>
            <p className="mt-6 text-sm text-ink-400">
              <Link to={appConfig.supportPath} className="transition-colors hover:text-brand-700">
                Contact WellNest Support
              </Link>
            </p>
          </div>

          <FooterCol title="Platform" items={footerNav.platform} />
          <FooterCol title="Ecosystem" items={footerNav.ecosystem} />
          <FooterCol title="Company" items={footerNav.company} />
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-slate-200/80 pt-6 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {appConfig.name}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-ink-700">About</Link>
            <Link to="/features" className="hover:text-ink-700">Features</Link>
            <Link to="/contact" className="hover:text-ink-700">Contact</Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: readonly { label: string; href: string }[];
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-700">{title}</p>
      <ul className="mt-3.5 space-y-2">
        {items.map((item) => (
          <li key={`${item.href}-${item.label}`}>
            <Link to={item.href} className="text-xs text-ink-500 transition-colors hover:text-brand-700">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
