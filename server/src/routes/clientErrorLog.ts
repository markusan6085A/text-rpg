import type { FastifyInstance } from "fastify";
import { getAuth } from "./character/auth";
import { writeAdminAuditLog } from "../adminAudit";
import { RateLimiter, getRateLimitKey } from "../rateLimiter";

/** Ліміт: 40 звітів на годину на акаунт (захист від спаму). */
const clientErrorLimiter = new RateLimiter(60 * 60 * 1000, 40);

function clampStr(s: unknown, max: number): string {
  const t = String(s ?? "").trim();
  return t.length > max ? t.slice(0, max) : t;
}

/**
 * POST /client-error-log — звіт про помилки клієнта (409, тощо) у журнал адміна (AdminActionLog, adminLogin=system).
 * Потрібен Bearer (ігровий токен), не адмін.
 */
export async function clientErrorLogRoutes(app: FastifyInstance) {
  app.post("/client-error-log", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const key = getRateLimitKey(req, "client_error_log");
    const rl = clientErrorLimiter.check(key);
    if (!rl.allowed) {
      return reply.code(429).send({ error: "rate_limit", retryAfterMs: Math.max(0, rl.resetAt - Date.now()) });
    }

    const body = (req.body || {}) as {
      characterId?: string;
      characterName?: string;
      code?: string;
      message?: string;
      httpStatus?: number;
      path?: string;
    };

    const code = clampStr(body.code, 120) || "unknown";
    const message = body.message ? clampStr(body.message, 600) : "";
    const httpStatus =
      typeof body.httpStatus === "number" && Number.isFinite(body.httpStatus)
        ? Math.trunc(body.httpStatus)
        : undefined;
    const path = body.path ? clampStr(body.path, 300) : "";
    const characterId = body.characterId ? clampStr(body.characterId, 64) : "";
    const characterName = body.characterName ? clampStr(body.characterName, 64) : "";

    const msg = [code, message].filter(Boolean).join(" — ").slice(0, 1900);

    try {
      await writeAdminAuditLog({
        req,
        adminLogin: "system",
        action: "system.client_error",
        status: "failed",
        targetCharacterId: characterId || null,
        targetCharacterName: characterName || null,
        message: msg || code,
        metadata: {
          source: "client",
          accountLogin: auth.login,
          httpStatus,
          path,
        },
      });
    } catch (e) {
      app.log.error(e, "[client-error-log] write failed");
      return reply.code(500).send({ error: "log_failed" });
    }

    return { ok: true };
  });
}
