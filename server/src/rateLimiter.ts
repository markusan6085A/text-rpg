// Простий rate limiter для Fastify
// Захищає від спаму та атак

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor(private windowMs: number, private maxRequests: number) {
    // Очищаємо старе кожні 5 хвилин
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const key in this.store) {
      if (this.store[key].resetAt < now) {
        delete this.store[key];
      }
    }
  }

  check(key: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const record = this.store[key];

    if (!record || record.resetAt < now) {
      // Новий період або перший запит
      this.store[key] = {
        count: 1,
        resetAt: now + this.windowMs,
      };
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetAt: now + this.windowMs,
      };
    }

    if (record.count >= this.maxRequests) {
      // Перевищено ліміт
      return {
        allowed: false,
        remaining: 0,
        resetAt: record.resetAt,
      };
    }

    // Збільшуємо лічильник
    record.count++;
    return {
      allowed: true,
      remaining: this.maxRequests - record.count,
      resetAt: record.resetAt,
    };
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.store = {};
  }
}

// Створюємо rate limiters для різних endpoints
export const rateLimiters = {
  // Auth endpoints - жорсткіші обмеження
  auth: new RateLimiter(60 * 1000, 5), // 5 спроб на хвилину
  register: new RateLimiter(60 * 1000, 3), // 3 реєстрації на хвилину
  
  // Chat - помірні обмеження
  chat: new RateLimiter(60 * 1000, 10), // 10 повідомлень на хвилину
  
  // Letters - помірні обмеження
  letters: new RateLimiter(60 * 1000, 5), // 5 листів на хвилину
  
  // Character updates - більш м'які (часто потрібні)
  characterUpdate: new RateLimiter(60 * 1000, 120), // 120 оновлень на хвилину
};

// Helper для отримання ключа rate limiter (по IP або accountId)
export function getRateLimitKey(req: any, prefix: string): string {
  // Спробуємо отримати accountId з JWT (якщо є)
  const auth = req.headers?.authorization || "";
  const [type, token] = String(auth).split(" ");
  
  if (type === "Bearer" && token) {
    try {
      const jwt = require("jsonwebtoken");
      const secret = process.env.JWT_SECRET;
      if (secret) {
        const payload = jwt.verify(token, secret) as any;
        if (payload?.accountId) {
          return `${prefix}:account:${payload.accountId}`;
        }
      }
    } catch {
      // Якщо токен невалідний - використовуємо IP
    }
  }
  
  // Fallback на IP
  const ip = req.ip || (req.headers && req.headers["x-forwarded-for"]) || (req.socket && req.socket.remoteAddress) || "unknown";
  return `${prefix}:ip:${String(ip)}`;
}

// Middleware для rate limiting
export function rateLimitMiddleware(limiter: RateLimiter, prefix: string) {
  return async (req: any, reply: any) => {
    const key = getRateLimitKey(req, prefix);
    const result = limiter.check(key);

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
      // ❗ ВАЖЛИВО: Додаємо Retry-After header (стандарт HTTP)
      reply.header("Retry-After", String(retryAfter));
      reply.code(429).send({
        error: "rate_limit_exceeded",
        message: "Too many requests. Please try again later.",
        retryAfter,
        resetAt: new Date(result.resetAt).toISOString(),
      });
      return;
    }

    // Додаємо headers для інформації про rate limit
    reply.header("X-RateLimit-Limit", limiter["maxRequests"]);
    reply.header("X-RateLimit-Remaining", result.remaining);
    reply.header("X-RateLimit-Reset", new Date(result.resetAt).toISOString());
  };
}
