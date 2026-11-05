import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, Search, X } from 'lucide-react';
import { Logo } from '../components/brand/Logo';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { NotificationCenter } from '../components/chrome/NotificationCenter';
import { primaryNav } from '../config/navigation';
import { paths } from '../routes/paths';
import { cn } from '../utils/cn';
import { useScrollLock } from '../hooks/useScrollLock';
import { useUI } from '../providers/UIProvider';
import { useAuth } from '../providers/AuthProvider';
import { dashboardPathFor } from '../services/auth/authService';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [openPath, setOpenPath] = useState<string | null>(null);
  const location = useLocation();
  const open = openPath === location.pathname;
  const { setCommandOpen } = useUI();
  const { user, role } = useAuth();
  useScrollLock(open);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-200',
        scrolled || open
          ? 'border-b border-slate-200/80 bg-white/90 shadow-xs backdrop-blur-xl'
          : 'border-b border-transparent bg-white/70 backdrop-blur-md',
      )}
    >
      <div className="mx-auto flex h-[70px] max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {primaryNav.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-900 font-semibold'
                    : 'text-ink-600 hover:bg-slate-50 hover:text-ink-900',
                )
              }
            >
              {item.label}
              {'badge' in item && item.badge ? (
                <Badge tone="sky" className="normal-case tracking-normal">
                  {String(item.badge)}
                </Badge>
              ) : null}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 text-xs text-ink-500 shadow-2xs transition hover:border-slate-300 hover:bg-white hover:text-ink-800"
          >
            <Search className="h-3.5 w-3.5 text-ink-400" />
            <span>Search</span>
            <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-ink-400">⌘K</kbd>
          </button>
          <NotificationCenter />
          {user && role ? (
            <Button to={dashboardPathFor(role)} size="sm">Open workspace</Button>
          ) : (
            <>
              <Button to={paths.login} variant="ghost" size="sm">
                Login
              </Button>
              <Button to={paths.register} size="sm">Get Started</Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-ink-700 transition hover:bg-slate-50 hover:text-ink-900"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-ink-700 transition hover:bg-slate-50 hover:text-ink-900"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpenPath(open ? null : location.pathname)}
          >
            <span className="sr-only">Toggle navigation</span>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div id="mobile-nav" className="border-t border-slate-200/80 bg-white shadow-lg lg:hidden">
          <nav className="mx-auto flex max-w-[1200px] flex-col gap-1 px-4 py-4 sm:px-6" aria-label="Mobile">
            {primaryNav.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-11 items-center justify-between rounded-xl px-3.5 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-brand-50 text-brand-900 font-semibold' : 'text-ink-700 hover:bg-slate-50',
                  )
                }
              >
                {item.label}
                {'badge' in item && item.badge ? <Badge tone="sky">{String(item.badge)}</Badge> : null}
              </NavLink>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
              {user && role ? (
                <Button to={dashboardPathFor(role)} fullWidth className="col-span-2">
                  Open workspace
                </Button>
              ) : (
                <>
                  <Button to={paths.login} variant="outline" fullWidth>
                    Login
                  </Button>
                  <Button to={paths.register} fullWidth>
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
