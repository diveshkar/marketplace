/**
 * Central API entry point (interceptor-style).
 * - Resolves URL: direct `VITE_API_BASE_URL` or dev fallback `/api/*` (Vite proxy).
 * - Single place to add default headers, auth, logging, and error normalization later.
 */

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

/** When unset, requests use `/api` + path so Vite `server.proxy` can forward to Express. */
export function getApiBaseUrl(): string | null {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (raw == null || String(raw).trim() === '') return null;
  return String(raw).replace(/\/$/, '');
}

export function apiUrl(path: string): string {
  const p = normalizePath(path);
  const base = getApiBaseUrl();
  if (base) return `${base}${p}`;
  return `/api${p}`;
}

/** URL to a locally served uploaded file (`GET /uploads/public/...` on the API). */
export function publicListingImageUrl(storedKey: string): string {
  const encoded = storedKey.split('/').map(encodeURIComponent).join('/');
  const base = getApiBaseUrl();
  if (base) return `${base}/uploads/public/${encoded}`;
  return `/uploads/public/${encoded}`;
}

/** Derive variant URLs from an original image key (matches server-side naming). */
function deriveVariantKey(originalKey: string, suffix: string, ext: string): string {
  const dotIdx = originalKey.lastIndexOf('.');
  const base = dotIdx > -1 ? originalKey.slice(0, dotIdx) : originalKey;
  return `${base}${suffix}.${ext}`;
}

/** WebP variant of full-size image. */
export function publicListingImageWebpUrl(storedKey: string): string {
  return publicListingImageUrl(deriveVariantKey(storedKey, '', 'webp'));
}

/** Thumbnail JPEG (300px wide). */
export function publicListingThumbUrl(storedKey: string): string {
  return publicListingImageUrl(deriveVariantKey(storedKey, '_thumb', 'jpg'));
}

/** Thumbnail WebP (300px wide). */
export function publicListingThumbWebpUrl(storedKey: string): string {
  return publicListingImageUrl(deriveVariantKey(storedKey, '_thumb', 'webp'));
}

export type ApiRequestInterceptor = (url: string, init: RequestInit) => RequestInit;

const requestInterceptors: ApiRequestInterceptor[] = [
  (_url, init) => {
    const headers = new Headers(init.headers);
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }
    return { ...init, headers };
  },
];

function applyRequestInterceptors(url: string, init: RequestInit): RequestInit {
  return requestInterceptors.reduce((acc, fn) => fn(url, acc), init);
}

/** Register at app bootstrap (e.g. attach Authorization when you add auth). */
export function registerRequestInterceptor(fn: ApiRequestInterceptor): void {
  requestInterceptors.push(fn);
}

/**
 * Fetch against the local API with shared defaults (interceptor chain).
 * Pass Express paths like `/health`, `/me` — not `/api/health` unless you disable the proxy fallback.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = apiUrl(path);
  const baseInit: RequestInit = {
    ...init,
    credentials: init?.credentials ?? 'include',
  };
  const finalInit = applyRequestInterceptors(url, baseInit);
  return fetch(url, finalInit);
}
