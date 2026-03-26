import { getAccessToken } from '../auth/auth-storage';
import { registerRequestInterceptor } from './api-client';

let installed = false;

/** Attach Bearer token to API calls (Phase 3 — local JWT). */
export function setupAuthInterceptor(): void {
  if (installed) return;
  installed = true;
  registerRequestInterceptor((_url, init) => {
    const token = getAccessToken();
    const headers = new Headers(init.headers);
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return { ...init, headers };
  });
}
