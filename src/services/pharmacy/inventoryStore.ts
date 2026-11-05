import { inventory as initialInventory } from '../../constants/pharmacyData';
import type { InventoryItem } from '../../types/pharmacy';

let items = initialInventory;
const listeners = new Set<() => void>();

export function getInventorySnapshot(): InventoryItem[] {
  return items;
}

export function subscribeToInventory(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function adjustInventoryItem(id: string, onHand: number): void {
  if (!Number.isFinite(onHand) || onHand < 0) return;
  const updated = items.map((item) => item.id === id ? { ...item, onHand: Math.floor(onHand) } : item);
  if (updated.every((item, index) => item === items[index])) return;
  items = updated;
  listeners.forEach((listener) => listener());
}
