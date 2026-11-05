import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, ArrowUpRight } from 'lucide-react';
import { useUI } from '../../providers/UIProvider';
import { useScrollLock } from '../../hooks/useScrollLock';
import { paths } from '../../routes/paths';
import { primaryNav } from '../../config/navigation';
import { roleList } from '../../constants/roles';
import { cn } from '../../utils/cn';
import { useAuth } from '../../providers/AuthProvider';
import { accountNav, appNavByRole } from '../../config/appNav';
import { portalTheme } from '../../config/portal';

const extras = [
  { label: 'Login', href: paths.login, hint: 'Account' },
  { label: 'Create account', href: paths.register, hint: 'Account' },
  { label: 'Forgot password', href: paths.forgotPassword, hint: 'Account' },
];

export function CommandPalette() {
  const { commandOpen, setCommandOpen } = useUI();
  const [query, setQuery] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { role } = useAuth();
  const location = useLocation();
  const inWorkspace = location.pathname.startsWith('/app');
  useScrollLock(commandOpen);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(!commandOpen);
      }
      if (event.key === 'Escape') setCommandOpen(false);
      if (commandOpen && event.key === 'Tab') {
        const elements = dialogRef.current?.querySelectorAll<HTMLElement>('input,button:not([disabled])');
        if (!elements?.length) return;
        if (event.shiftKey && document.activeElement === elements[0]) { event.preventDefault(); elements[elements.length - 1].focus(); }
        else if (!event.shiftKey && document.activeElement === elements[elements.length - 1]) { event.preventDefault(); elements[0].focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [commandOpen, setCommandOpen]);

  const items = useMemo(() => {
    const publicItems = [
      ...primaryNav.map((item) => ({ label: item.label, href: item.href, hint: 'Navigate' })),
      ...roleList.map((role) => ({ label: role.label, href: role.path, hint: 'Ecosystem' })),
      ...extras,
    ];
    const workspaceItems = role ? [...appNavByRole[role], ...accountNav].map(item => ({ label: item.label === 'Command' || item.label === 'Control' ? 'Overview' : item.label, href: item.href, hint: portalTheme[role].label })) : [];
    const all = inWorkspace ? workspaceItems : [...publicItems, ...workspaceItems];
    const q = query.trim().toLowerCase();
    return q ? all.filter((item) => item.label.toLowerCase().includes(q)) : all;
  }, [query, role, inWorkspace]);

  if (!commandOpen) return null;

  return (
    <div className="fixed inset-0 z-[85] flex items-start justify-center px-4 pt-[12vh]">
      <button type="button" className="absolute inset-0 bg-ink-950/25 backdrop-blur-[3px]" aria-label="Close search" onClick={() => setCommandOpen(false)} />
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Search WellNest" className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4">
          <Search className="h-4 w-4 text-ink-400" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label={inWorkspace ? 'Search your workspace pages' : 'Search WellNest pages'}
            placeholder={inWorkspace ? 'Where would you like to go?' : 'Search pages, roles, and actions…'}
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-ink-400"
          />
          <kbd className="hidden rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-ink-400 sm:inline">ESC</kbd>
        </div>
        <ul className="max-h-80 overflow-auto p-2">
          {items.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-ink-500">Nothing matches that search.</li>
          ) : (
            items.map((item) => (
              <li key={`${item.href}-${item.label}`}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-brand-50/70 hover:text-brand-900',
                  )}
                  onClick={() => {
                    navigate(item.href);
                    setCommandOpen(false);
                    setQuery('');
                  }}
                >
                  <span className="font-medium text-ink-800">{item.label}</span>
                  <span className="inline-flex items-center gap-1 text-xs text-ink-400">
                    {item.hint}
                    <ArrowUpRight className="h-3 w-3" />
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
