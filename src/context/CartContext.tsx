"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { CartItem, Product } from "@/types";

const STORAGE_KEY = "store-cart";
const EMPTY_CART: CartItem[] = [];

let cachedRaw: string | null | undefined;
let cachedItems = EMPTY_CART;
const listeners = new Set<() => void>();

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Partial<CartItem>;
  return (
    typeof item.productId === "string" &&
    typeof item.name === "string" &&
    typeof item.price === "number" &&
    Number.isInteger(item.quantity) &&
    (item.quantity ?? 0) > 0
  );
}

function getCartSnapshot() {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === cachedRaw) return cachedItems;

  cachedRaw = stored;
  if (!stored) {
    cachedItems = EMPTY_CART;
    return cachedItems;
  }

  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed) || !parsed.every(isCartItem)) {
      throw new Error("El contenido guardado del carrito no es válido.");
    }
    cachedItems = parsed;
  } catch (error) {
    console.error("No se pudo restaurar el carrito guardado.", error);
    window.localStorage.removeItem(STORAGE_KEY);
    cachedRaw = null;
    cachedItems = EMPTY_CART;
  }

  return cachedItems;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) listener();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function updateCart(items: CartItem[]) {
  const serialized = JSON.stringify(items);
  window.localStorage.setItem(STORAGE_KEY, serialized);
  cachedRaw = serialized;
  cachedItems = items;
  listeners.forEach((listener) => listener());
}

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, getCartSnapshot, () => EMPTY_CART);

  function addItem(product: Product) {
    const current = getCartSnapshot();
    const existing = current.find((item) => item.productId === product.id);
    const updated = existing
      ? current.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      : [
          ...current,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            quantity: 1,
          },
        ];
    updateCart(updated);
  }

  function removeItem(productId: string) {
    updateCart(getCartSnapshot().filter((item) => item.productId !== productId));
  }

  function clearCart() {
    updateCart([]);
  }

  const value = useMemo(
    () => ({
      items,
      itemCount: items.reduce((count, item) => count + item.quantity, 0),
      addItem,
      removeItem,
      clearCart,
    }),
    [items],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de CartProvider.");
  }
  return context;
}
