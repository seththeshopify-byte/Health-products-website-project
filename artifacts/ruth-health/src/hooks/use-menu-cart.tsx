import { createContext, useContext, useState, useMemo, ReactNode } from "react";

export interface MenuCartLine {
  itemId: number;
  name: string;
  guestPrice: number | null;
  memberPrice: number | null;
  quantity: number;
}

interface MenuCartContextValue {
  lines: MenuCartLine[];
  addItem: (item: { itemId: number; name: string; guestPrice: number | null; memberPrice: number | null }, quantity?: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  removeItem: (itemId: number) => void;
  clear: () => void;
  count: number;
}

const MenuCartContext = createContext<MenuCartContextValue | null>(null);

// Wrap the app root with this provider so Food.tsx and Drinks.tsx share one
// cart. In-memory only (no localStorage — per project constraints).
export function MenuCartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<MenuCartLine[]>([]);

  const addItem: MenuCartContextValue["addItem"] = (item, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.itemId === item.itemId);
      if (existing) {
        return prev.map((l) => (l.itemId === item.itemId ? { ...l, quantity: l.quantity + quantity } : l));
      }
      return [...prev, { ...item, quantity }];
    });
  };

  const updateQuantity: MenuCartContextValue["updateQuantity"] = (itemId, quantity) => {
    setLines((prev) => {
      if (quantity <= 0) return prev.filter((l) => l.itemId !== itemId);
      return prev.map((l) => (l.itemId === itemId ? { ...l, quantity } : l));
    });
  };

  const removeItem: MenuCartContextValue["removeItem"] = (itemId) => {
    setLines((prev) => prev.filter((l) => l.itemId !== itemId));
  };

  const clear = () => setLines([]);

  const count = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);

  return (
    <MenuCartContext.Provider value={{ lines, addItem, updateQuantity, removeItem, clear, count }}>
      {children}
    </MenuCartContext.Provider>
  );
}

export function useMenuCart(): MenuCartContextValue {
  const ctx = useContext(MenuCartContext);
  if (!ctx) throw new Error("useMenuCart must be used within a MenuCartProvider");
  return ctx;
}
