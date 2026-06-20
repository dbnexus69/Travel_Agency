/**
 * salesCache.ts
 * Módulo de caché en localStorage para ventas y clientes.
 * TTL: 5 minutos — después de ese tiempo se considera stale y se recarga desde red.
 * Al crear/eliminar ventas, el caché se invalida automáticamente.
 */

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

function getCacheKey(baseKey: string): string {
  try {
    const token = localStorage.getItem('moontravel_token');
    if (!token) return `${baseKey}_anonymous`;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return `${baseKey}_${payload.userId || 'unknown'}`;
  } catch {
    return `${baseKey}_anonymous`;
  }
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    const age = Date.now() - entry.timestamp;
    if (age > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // localStorage puede estar lleno — ignorar silenciosamente
  }
}

function deleteCache(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {}
}

// ---------- API pública ----------

/** Guarda ventas y clientes en caché con timestamp actual */
export function saveSalesAndClientsCache(sales: unknown[], clients: unknown[]): void {
  writeCache(getCacheKey('moontravel_sales_cache'), sales);
  writeCache(getCacheKey('moontravel_clients_cache'), clients);
}

/** Retorna ventas desde caché si TTL no expiró, null si expirado */
export function loadSalesCache(): unknown[] | null {
  return readCache<unknown[]>(getCacheKey('moontravel_sales_cache'));
}

/** Retorna clientes desde caché si TTL no expiró, null si expirado */
export function loadClientsCache(): unknown[] | null {
  return readCache<unknown[]>(getCacheKey('moontravel_clients_cache'));
}

/** Invalida ambos cachés (ventas + clientes). Usar al crear/eliminar ventas. */
export function invalidateSalesCache(): void {
  deleteCache(getCacheKey('moontravel_sales_cache'));
  deleteCache(getCacheKey('moontravel_clients_cache'));
}
