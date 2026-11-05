import { NavLink } from 'react-router-dom';
import { Home, Layers, MessageCircle, UserPlus } from 'lucide-react';
import { paths } from '../../routes/paths';
import { cn } from '../../utils/cn';

const items = [
  { to: paths.home, label: 'Home', icon: Home },
  { to: paths.features, label: 'Care', icon: Layers },
  { to: paths.contact, label: 'Talk', icon: MessageCircle },
  { to: paths.register, label: 'Register', icon: UserPlus },
];

export function BottomNav() {
  return (
    <nav
      aria-label="Patient shortcuts"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-white/92 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(12,56,95,0.06)] backdrop-blur-xl md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold',
                    isActive ? 'text-brand-700' : 'text-ink-400',
                  )
                }
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
