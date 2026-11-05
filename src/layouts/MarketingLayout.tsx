import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { CommandPalette } from '../components/chrome/CommandPalette';
import { LandingFooter, LandingHeader } from '../pages/landing/LandingChrome';
import '../pages/landing/landing.css';

export function MarketingLayout() {
  const location = useLocation();
  const isAuth = /^\/(login|register|forgot-password|reset-password|verify-email|verify-otp|two-factor|role-setup|auth\/callback)$/.test(location.pathname);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const node = document.getElementById(id);
      if (node) {
        node.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0 });
  }, [location.pathname, location.hash]);

  return (
    <div className={`flex min-h-screen flex-col bg-white ${isAuth ? '' : 'premium-landing'}`}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[90] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:shadow-md"
      >
        Skip to content
      </a>
      {!isAuth && <LandingHeader />}
      {!isAuth && <CommandPalette />}
      <main id="main" className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      {!isAuth && <LandingFooter />}
    </div>
  );
}
