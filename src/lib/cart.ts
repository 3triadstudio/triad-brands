import { useSyncExternalStore } from "react";

export type CartItem = {
  id: string;
  lineId?: string;
  title: string;
  from: number;
  quantity?: number;
  size?: string;
  color?: string;
  notes?: string;
};

const KEY = "triad.cart";
let items: CartItem[] = [];
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CartItem[];
      items = parsed.map((item) => ({
        ...item,
        lineId: item.lineId ?? item.id,
        quantity: Math.max(1, Number(item.quantity) || 1),
      }));
    }
  } catch {
    items = [];
  }
}

function emit() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const emptyItems: CartItem[] = [];

export function useCart() {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => items,
    () => emptyItems,
  );
  return snapshot;
}

export function addToCart(item: CartItem) {
  load();
  const nextItem = {
    ...item,
    lineId: item.lineId ?? buildLineId(item),
    quantity: Math.max(1, Number(item.quantity) || 1),
  };
  const existingIndex = items.findIndex((current) => getCartItemKey(current) === nextItem.lineId);
  if (existingIndex >= 0) {
    items = items.map((current, index) =>
      index === existingIndex
        ? { ...current, ...nextItem, quantity: (current.quantity ?? 1) + nextItem.quantity }
        : current,
    );
  } else {
    items = [...items, nextItem];
  }
  emit();
  return nextItem.lineId;
}

export function getCartItemKey(item: CartItem) {
  return item.lineId ?? item.id;
}

function buildLineId(item: CartItem) {
  return [item.id, item.size ?? "", item.color ?? "", item.notes ?? ""].join("::");
}

export function updateCartQuantity(lineId: string, quantity: number) {
  load();
  items = items.map((item) =>
    getCartItemKey(item) === lineId
      ? { ...item, quantity: Math.max(1, Math.floor(quantity)) }
      : item,
  );
  emit();
}

export function removeFromCart(lineId: string) {
  load();
  items = items.filter((item) => getCartItemKey(item) !== lineId);
  emit();
}

export function clearCart() {
  items = [];
  emit();
}

export function cartQuantity(itemsToFormat: CartItem[]) {
  return itemsToFormat.reduce((total, item) => total + (item.quantity ?? 1), 0);
}

export function cartEstimate(itemsToFormat: CartItem[]) {
  return itemsToFormat.reduce((total, item) => total + item.from * (item.quantity ?? 1), 0);
}

export function buildCartQuoteMessage(itemsToFormat: CartItem[]) {
  return [
    "Hello Triad Studio, I'd like to request a quote for these items.",
    ...itemsToFormat.map((item, index) =>
      [
        `${index + 1}. ${item.title}`,
        `Quantity: ${item.quantity ?? 1}`,
        item.size ? `Size: ${item.size}` : null,
        item.color ? `Color: ${item.color}` : null,
        item.notes ? `Special requests: ${item.notes}` : null,
        `Starting estimate: KES ${(item.from * (item.quantity ?? 1)).toLocaleString("en-KE")}`,
      ]
        .filter(Boolean)
        .join("\n"),
    ),
    `Estimated total from: KES ${cartEstimate(itemsToFormat).toLocaleString("en-KE")}`,
  ].join("\n\n");
}
