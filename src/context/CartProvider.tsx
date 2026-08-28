import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  sku?: string;
  image?: string | null;
  variant?: Record<string, any> | null;
};

type CartState = {
  items: CartItem[];
  addItem: (item: CartItem, qty?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  totalItems: number;
  totalPrice: number;
};

const CartContext = createContext<CartState | undefined>(undefined);

const STORAGE_KEY = 'noralco_cart_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const addItem = (item: CartItem, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((p) => p.productId === item.productId && JSON.stringify(p.variant) === JSON.stringify(item.variant));
      if (found) {
        return prev.map((p) =>
          p.productId === found.productId && JSON.stringify(p.variant) === JSON.stringify(found.variant)
            ? { ...p, quantity: p.quantity + qty }
            : p
        );
      }
      return [...prev, { ...item, quantity: qty }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setItems((prev) => prev.map((p) => (p.productId === productId ? { ...p, quantity } : p)));
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((p) => p.productId !== productId));
  };

  const clear = () => setItems([]);

  const totalItems = useMemo(() => items.reduce((s, it) => s + it.quantity, 0), [items]);
  const totalPrice = useMemo(() => items.reduce((s, it) => s + it.quantity * it.price, 0), [items]);

  const value: CartState = {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clear,
    totalItems,
    totalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export function useCartContext() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCartContext must be used within CartProvider');
  return ctx;
}
