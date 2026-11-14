/**
 * Browser-side cache of the POS product catalogue (IndexedDB).
 *
 * The POS screen renders from this cache instantly, then asks the backend only
 * for products changed since `since` (the backend's serverTime of the last sync).
 */

const DB_NAME = "pos-cache";
const STORE = "kv";
const KEY = "catalog-v1";

export type RawPosProduct = Record<string, any> & { _id: string; createdAt?: string };

export interface CachedCatalog {
  apiUrl: string;
  since: string;
  products: RawPosProduct[];
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB not available"));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function loadCatalog(): Promise<CachedCatalog | null> {
  try {
    const db = await openDb();
    const value = await new Promise<CachedCatalog | undefined>((resolve, reject) => {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    db.close();
    // Ignore a cache made for a different backend
    if (!value || value.apiUrl !== apiUrl || !Array.isArray(value.products)) return null;
    return value;
  } catch {
    return null;
  }
}

export async function saveCatalog(since: string, products: RawPosProduct[]): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ apiUrl, since, products } satisfies CachedCatalog, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Cache is an optimisation only
  }
}

export async function clearCatalog(): Promise<void> {
  try {
    const db = await openDb();
    db.transaction(STORE, "readwrite").objectStore(STORE).delete(KEY);
    db.close();
  } catch {
    // ignore
  }
}
