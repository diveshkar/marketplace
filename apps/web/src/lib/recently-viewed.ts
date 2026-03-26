const STORAGE_KEY = 'marketplace_recently_viewed';
const MAX_ITEMS = 20;

export type RecentlyViewedItem = {
  listingId: string;
  title: string;
  price: number;
  city: string;
  imageKey?: string;
  viewedAt: string;
};

export function getRecentlyViewed(): RecentlyViewedItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentlyViewedItem[];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(item: Omit<RecentlyViewedItem, 'viewedAt'>): void {
  try {
    const existing = getRecentlyViewed().filter((i) => i.listingId !== item.listingId);
    const entry: RecentlyViewedItem = { ...item, viewedAt: new Date().toISOString() };
    const updated = [entry, ...existing].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch { /* ignore quota errors */ }
}
