// API client for backend communication
// У production на l2dop.com запити йдуть через /api → Vercel rewrite на api.l2dop.com
export const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  (import.meta.env.MODE === "production" ? "/api" : "http://localhost:3000");

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).__API_URL__ = API_URL;
  (window as any).__VITE_API_URL__ = import.meta.env.VITE_API_URL || 'NOT SET';
}

export interface ApiError {
  error: string;
}

import { useAuthStore } from "../../state/authStore";

export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

/** Результат refresh: успіх з токеном, auth failure (401/403), або мережева помилка. */
type RefreshResult = { token: string } | { authFailure: true } | { authFailure: false };

/** Звіт у журнал адміна (AdminActionLog, system.client_error) — 409/5xx на /characters/*. Без await у критичному шляху. */
async function reportClientErrorToServer(
  endpoint: string,
  status: number,
  errorBody: unknown
): Promise<void> {
  try {
    const token = getAccessToken();
    if (!token) return;
    const { useCharacterStore } = await import("../../state/characterStore");
    const { useHeroStore } = await import("../../state/heroStore");
    const characterId = useCharacterStore.getState().characterId;
    const characterName = useHeroStore.getState().hero?.name;
    const err = errorBody as Record<string, unknown>;
    const code = String(err?.error ?? err?.reason ?? `http_${status}`).slice(0, 120);
    const detail = [err?.message, err?.details]
      .filter((x) => x != null && String(x).trim() !== "")
      .map((x) => String(x))
      .join(" ");
    const message = detail ? detail.slice(0, 500) : undefined;
    await fetch(`${API_URL}/client-error-log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({
        characterId: characterId || undefined,
        characterName: characterName || undefined,
        code,
        message,
        httpStatus: status,
        path: endpoint.slice(0, 300),
      }),
    });
  } catch {
    /* ignore */
  }
}

async function refreshAccessToken(): Promise<RefreshResult> {
  const REFRESH_TIMEOUT_MS = 8000; // При поганому інтернеті не зависати
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), REFRESH_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (res.ok) {
      const data = await res.json();
      if (data?.accessToken) {
        useAuthStore.getState().setAccessToken(data.accessToken);
        return { token: data.accessToken };
      }
    }
    // Сервер повернув 401/403 — токен дійсно протух
    const isAuthFailure = res.status === 401 || res.status === 403;
    return { authFailure: isAuthFailure };
  } catch {
    clearTimeout(t);
    // Мережева помилка, таймаут, AbortError — не викидати з гри
    return { authFailure: false };
  }
}

/** Options for apiRequest; _retry is internal to prevent infinite refresh loop. */
type ApiRequestOptions = RequestInit & { _retry?: boolean };

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { _retry, ...fetchOptions } = options;
  const headers: HeadersInit = {
    ...(fetchOptions.headers || {}),
  };

  if (fetchOptions.method === "DELETE") {
    delete (headers as Record<string, string>)["Content-Type"];
    delete (headers as Record<string, string>)["content-type"];
  } else {
    if (!(headers as Record<string, string>)["Content-Type"]) {
      (headers as Record<string, string>)["Content-Type"] = "application/json";
    }
  }

  const doFetch = async (token: string | null) => {
    const h = { ...headers };
    if (token) (h as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    return fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      headers: h,
      credentials: "include",
    });
  };

  let token = getAccessToken();
  let response = await doFetch(token);

  const isAuthEndpoint =
    endpoint.startsWith("/auth/") || endpoint.startsWith("/admin/auth/");
  let retried = !!_retry;
  if (response.status === 401 && !retried && !isAuthEndpoint) {
    retried = true;
    const refreshResult = await refreshAccessToken();
    if ("token" in refreshResult) {
      response = await doFetch(refreshResult.token);
    } else {
      // Викидаємо з гри тільки при реальному auth failure (токен протух). При мережевій помилці — ні.
      if (refreshResult.authFailure) {
        useAuthStore.getState().logout();
      }
      const error: ApiError = await response.json().catch(() => ({ error: "unauthorized" }));
      const err = new Error(error.error || "unauthorized") as any;
      err.status = 401;
      err.unauthorized = true;
      throw err;
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({
      error: `HTTP ${response.status}: ${response.statusText}`,
    }));
    const error: ApiError = errorBody as ApiError;
    const errorWithStatus = new Error(error.error || `HTTP ${response.status}`) as any;
    errorWithStatus.status = response.status;
    errorWithStatus.details = (errorBody as any).details || (errorBody as any).errors;
    errorWithStatus.body = errorBody;

    const reportClient =
      endpoint.includes("/characters/") &&
      (response.status === 409 || (response.status >= 500 && response.status < 600));
    if (reportClient) {
      void reportClientErrorToServer(endpoint, response.status, errorBody);
    }

    // 401 = сесія недійсна — вихід. 403 = «заборонено дію», але користувач ще автентифікований
    // (наприклад PUT /world/.../hp під час респавну моба). Раніше 403 теж викликав logout() —
    // гравець вилітав з гри при будь-якій забороненій операції.
    if (response.status === 401) {
      useAuthStore.getState().logout();
      errorWithStatus.unauthorized = true;
      throw errorWithStatus;
    }
    if (response.status === 403) {
      errorWithStatus.forbidden = true;
      throw errorWithStatus;
    }

    if (response.status === 429) {
      const retryAfter = Number((error as any).retryAfter);
      const sec = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 60;
      try {
        const mod = await import("../../state/heroStore");
        mod.setRateLimitCooldown(sec * 1000);
      } catch (_) {}
      errorWithStatus.retryAfter = sec;
      errorWithStatus.message = `Забагато запитів. Зачекайте ${sec} сек.`;
      try {
        const { showToast } = await import("../../state/toastStore");
        showToast(errorWithStatus.message, "info");
      } catch (_) {}
    }
    throw errorWithStatus;
  }

  return response.json();
}
