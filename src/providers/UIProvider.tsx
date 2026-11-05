import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface UIContextValue {
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  toggleCommand: () => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false);
  const toggleCommand = useCallback(() => setCommandOpen((value) => !value), []);
  const value = useMemo(
    () => ({ commandOpen, setCommandOpen, toggleCommand }),
    [commandOpen, toggleCommand],
  );
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- provider hook shares its context module.
export function useUI() {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within UIProvider');
  return context;
}
