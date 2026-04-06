/**
 * Сторінка на https://, а VITE_API_URL зібрали з http://той_самий_хост —
 * браузер блокує fetch (Mixed Content). Підміняємо лише для того самого hostname.
 */
export function upgradeApiBaseForPageProtocol(baseUrl: string): string {
  if (typeof window === "undefined" || !baseUrl) return baseUrl;
  if (baseUrl.startsWith("/")) return baseUrl;
  if (window.location.protocol !== "https:") return baseUrl;
  if (!baseUrl.toLowerCase().startsWith("http://")) return baseUrl;
  try {
    const u = new URL(baseUrl);
    if (u.hostname !== window.location.hostname) return baseUrl;
    const path = u.pathname === "/" ? "" : u.pathname.replace(/\/$/, "");
    return `https://${u.host}${path}${u.search}`.replace(/\/$/, "") || `https://${u.host}`;
  } catch {
    return baseUrl;
  }
}
