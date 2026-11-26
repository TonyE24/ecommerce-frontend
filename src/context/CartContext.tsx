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
const CHECKOUT_STORAGE_KEY = "store-checkout-attempt";
const EMPTY_CART: CartItem[] = [];
const IDLE_CHECKOUT = { status: "idle" } as const;

let cachedRaw: string | null | undefined;
let cachedItems = EMPTY_CART;
let cachedCheckoutRaw: string | null | undefined;
let cachedCheckoutAttempt: CheckoutAttempt = IDLE_CHECKOUT;
const listeners = new Set<() => void>();

export type CheckoutAttempt =
  | { status: "idle" }
  | { status: "submitting"; orderId?: number }
  | { status: "pending"; orderId: number }
  | { status: "uncertain" };

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  checkoutAttempt: CheckoutAttempt;
  setCheckoutAttempt: (attempt: CheckoutAttempt) => void;
  addItem: (product: Product) => boolean;
  removeItem: (productId: string) => boolean;
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

function getCheckoutAttemptSnapshot(): CheckoutAttempt {
  const stored = window.localStorage.getItem(CHECKOUT_STORAGE_KEY);
  if (stored === cachedCheckoutRaw) return cachedCheckoutAttempt;

  cachedCheckoutRaw = stored;
  if (!stored) {
    cachedCheckoutAttempt = IDLE_CHECKOUT;
    return cachedCheckoutAttempt;
  }

  try {
    const parsed: unknown = JSON.parse(stored);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("status" in parsed)
    ) {
      throw new Error("El estado de pago guardado no es válido.");
    }

    const orderId = "orderId" in parsed ? parsed.orderId : undefined;
    if (parsed.status === "pending") {
      if (
        typeof orderId !== "number" ||
        !Number.isSafeInteger(orderId) ||
        orderId < 1
      ) {
        throw new Error("El identificador de orden guardado no es válido.");
      }
      cachedCheckoutAttempt = { status: "pending", orderId };
    } else if (parsed.status === "submitting") {
      if (
        orderId !== undefined &&
        (typeof orderId !== "number" ||
          !Number.isSafeInteger(orderId) ||
          orderId < 1)
      ) {
        throw new Error("El identificador de orden guardado no es válido.");
      }
      cachedCheckoutAttempt =
        typeof orderId === "number"
          ? { status: "submitting", orderId }
          : { status: "submitting" };
    } else if (parsed.status === "uncertain" && orderId === undefined) {
      cachedCheckoutAttempt = { status: "uncertain" };
    } else {
      throw new Error("El estado de pago guardado no es válido.");
    }
  } catch (error) {
    console.error("No se pudo restaurar el estado de pago.", error);
    window.localStorage.removeItem(CHECKOUT_STORAGE_KEY);
    cachedCheckoutRaw = null;
    cachedCheckoutAttempt = IDLE_CHECKOUT;
  }

  return cachedCheckoutAttempt;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (
      event.key === STORAGE_KEY ||
      event.key === CHECKOUT_STORAGE_KEY ||
      event.key === null
    ) {
      listener();
    }
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

function updateCheckoutAttempt(attempt: CheckoutAttempt) {
  const serialized =
    attempt.status === "idle" ? null : JSON.stringify(attempt);
  if (serialized === null) {
    window.localStorage.removeItem(CHECKOUT_STORAGE_KEY);
  } else {
    window.localStorage.setItem(CHECKOUT_STORAGE_KEY, serialized);
  }
  cachedCheckoutRaw = serialized;
  cachedCheckoutAttempt = attempt;
  listeners.forEach((listener) => listener());
}

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, getCartSnapshot, () => EMPTY_CART);
  const checkoutAttempt = useSyncExternalStore(
    subscribe,
    getCheckoutAttemptSnapshot,
    () => IDLE_CHECKOUT,
  );

  function addItem(product: Product) {
    if (getCheckoutAttemptSnapshot().status !== "idle") return false;

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
    return true;
  }

  function removeItem(productId: string) {
    if (getCheckoutAttemptSnapshot().status !== "idle") return false;

    updateCart(getCartSnapshot().filter((item) => item.productId !== productId));
    return true;
  }

  function clearCart() {
    updateCart([]);
    updateCheckoutAttempt(IDLE_CHECKOUT);
  }

  const value = useMemo(
    () => ({
      items,
      itemCount: items.reduce((count, item) => count + item.quantity, 0),
      checkoutAttempt,
      setCheckoutAttempt: updateCheckoutAttempt,
      addItem,
      removeItem,
      clearCart,
    }),
    [items, checkoutAttempt],
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
