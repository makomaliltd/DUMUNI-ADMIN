/**
 * Centralized API client.
 * Uses VITE_API_URL env var for cross-origin backend (e.g. Render),
 * falls back to relative URLs for same-origin deployments.
 */

const API_BASE = (typeof window !== 'undefined' && (window as any).__API_BASE_URL__) ||
  (import.meta as any).env?.VITE_API_URL ||
  '';

/**
 * Build absolute URL by prepending API base when configured.
 * Example: apiUrl('/users') → 'https://backend.onrender.com/api/users'
 */
export function apiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (API_BASE) {
    const base = API_BASE.replace(/\/+$/, '');
    return `${base}${cleanPath}`;
  }
  return cleanPath;
}

/**
 * Typed fetch wrapper that prepends API base URL.
 * Automatically adds JSON content-type for POST/PUT/PATCH.
 */
export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = apiUrl(path);

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Auto-set JSON content-type for requests with body
  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    // Try to get error detail from JSON body
    let errorMessage = `HTTP ${res.status} ${res.statusText}`;
    try {
      const errorBody = await res.json();
      if (errorBody.error || errorBody.message) {
        errorMessage = errorBody.error || errorBody.message;
      }
    } catch {
      // Not JSON, use default
    }
    throw new Error(errorMessage);
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
}

export default apiFetch;
