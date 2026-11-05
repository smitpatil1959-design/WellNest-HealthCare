import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from '../components/app/Sidebar';
import { Topbar } from '../components/app/Topbar';
import { Breadcrumb } from '../components/app/Breadcrumb';
import { AppBottomNav } from '../components/app/AppBottomNav';
import { CommandPalette } from '../components/chrome/CommandPalette';
import { DoctorFab } from '../components/doctor/DoctorFab';
import { useScrollLock } from '../hooks/useScrollLock';
import { useAuth } from '../providers/AuthProvider';
import { X } from 'lucide-react';
import { PortalDataStatus } from '../components/app/PortalDataStatus';

export function AppLayout() {
  const { role } = useAuth();
  const [drawer, setDrawer] = useState(false);
  const location = useLocation();
  const [drawerPath, setDrawerPath] = useState(location.pathname);
  const drawerOpen = drawer && drawerPath === location.pathname;
  const drawerRef = useRef<HTMLElement>(null);
  const menuTriggerRef = useRef<HTMLElement | null>(null);
  useScrollLock(drawerOpen);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    menuTriggerRef.current = document.activeElement as HTMLElement;
    drawerRef.current?.querySelector<HTMLElement>('a,button')?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setDrawer(false); menuTriggerRef.current?.focus(); }
      if (event.key === 'Tab') {
        const elements = drawerRef.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])');
        if (!elements?.length) return;
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    const onResize = () => { if (window.innerWidth >= 1024) setDrawer(false); };
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => { document.removeEventListener('keydown', onKey); window.removeEventListener('resize', onResize); };
  }, [drawerOpen]);

  const openMenu = () => { setDrawerPath(location.pathname); setDrawer(true); };

  return (
    <div id="app-root" data-portal={role ?? undefined} className="min-h-screen pb-20 lg:pb-0">
      <a
        href="#app-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[90] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:shadow-md focus:ring-2 focus:ring-brand-600"
      >
        Skip to workspace
      </a>
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-64 lg:flex-col">
        <Sidebar />
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink-950/40 backdrop-blur-[2px]"
            aria-label="Close menu"
            onClick={() => setDrawer(false)}
          />
          <motion.aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Workspace navigation"
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -24, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            className="absolute inset-y-0 left-0 w-[min(86vw,300px)] border-r border-slate-200 bg-white shadow-xl"
          >
            <button type="button" onClick={() => { setDrawer(false); menuTriggerRef.current?.focus(); }} aria-label="Close workspace navigation" className="absolute right-3 top-7 z-10 flex size-9 items-center justify-center rounded-full border border-white/20 text-[#e3edcf] hover:bg-white/10"><X size={16} /></button>
            <Sidebar onNavigate={() => setDrawer(false)} />
          </motion.aside>
        </div>
      ) : null}

      <div className="min-w-0 lg:pl-64">
        <Topbar onMenu={openMenu} />
        <CommandPalette />
        <main id="app-main" className="px-4 py-6 sm:px-6 lg:px-9 lg:py-8">
          <div className="mx-auto max-w-6xl">
            <Breadcrumb />
            <PortalDataStatus />
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      <DoctorFab />
      <AppBottomNav onMenu={openMenu} />
    </div>
  );
}
