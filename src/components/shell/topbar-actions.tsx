"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type DependencyList,
  type ReactNode,
} from "react";

type TopbarActionsContextValue = {
  actions: ReactNode;
  setActions: (node: ReactNode) => void;
};

const TopbarActionsContext = createContext<TopbarActionsContextValue | null>(
  null,
);

export function TopbarActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<ReactNode>(null);
  return (
    <TopbarActionsContext.Provider value={{ actions, setActions }}>
      {children}
    </TopbarActionsContext.Provider>
  );
}

/** Read the currently registered topbar actions (used by the Topbar). */
export function useTopbarActions(): ReactNode {
  return useContext(TopbarActionsContext)?.actions ?? null;
}

/**
 * Register the primary action buttons for the current page in the topbar.
 * Pass a factory plus a deps array so the node is only re-registered when its
 * inputs change (avoids a set-state-on-render loop).
 */
export function usePageActions(
  factory: () => ReactNode,
  deps: DependencyList,
): void {
  const ctx = useContext(TopbarActionsContext);
  useEffect(() => {
    ctx?.setActions(factory());
    return () => ctx?.setActions(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
