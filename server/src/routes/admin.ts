import type { FastifyPluginAsync } from "fastify";
import crypto from "crypto";

// Якщо не хочеш ставити залежності — робимо TOTP самі (без бібліотек).
function base32ToBuf(base32: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = base32.replace(/=+$/g, "").toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (const c of cleaned) {
    const val = alphabet.indexOf(c);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

function genBase32Secret(len = 32) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const buf = crypto.randomBytes(len);
  let out = "";
  for (let i = 0; i < buf.length; i++) out += alphabet[buf[i] % alphabet.length];
  return out;
}

function totpNow(secretBase32: string, stepSec = 30, digits = 6) {
  const key = base32ToBuf(secretBase32);
  const counter = Math.floor(Date.now() / 1000 / stepSec);
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const h = crypto.createHmac("sha1", key).update(msg).digest();
  const offset = h[h.length - 1] & 0x0f;
  const code =
    ((h[offset] & 0x7f) << 24) |
    ((h[offset + 1] & 0xff) << 16) |
    ((h[offset + 2] & 0xff) << 8) |
    (h[offset + 3] & 0xff);
  const otp = (code % 10 ** digits).toString().padStart(digits, "0");
  return otp;
}

function verifyTotp(secretBase32: string, code: string) {
  // допускаємо +-1 вікно (щоб не бісило)
  const clean = (code || "").trim();
  if (!/^\d{6}$/.test(clean)) return false;

  const step = 30;
  const now = Date.now();

  const checkAt = (t: number) => {
    const key = base32ToBuf(secretBase32);
    const counter = Math.floor(t / 1000 / step);
    const msg = Buffer.alloc(8);
    msg.writeBigUInt64BE(BigInt(counter));
    const h = crypto.createHmac("sha1", key).update(msg).digest();
    const offset = h[h.length - 1] & 0x0f;
    const codeInt =
      ((h[offset] & 0x7f) << 24) |
      ((h[offset + 1] & 0xff) << 16) |
      ((h[offset + 2] & 0xff) << 8) |
      (h[offset + 3] & 0xff);
    const otp = (codeInt % 1_000_000).toString().padStart(6, "0");
    return otp === clean;
  };

  return checkAt(now - 30_000) || checkAt(now) || checkAt(now + 30_000);
}

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(test, "hex"));
}

function signAdminToken(secret: string) {
  // дуже простий HMAC token (щоб без jwt пакета), 15 хв
  const exp = Date.now() + 15 * 60 * 1000;
  const payload = `admin|${exp}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}|${sig}`).toString("base64url");
}

function verifyAdminToken(token: string, secret: string) {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const [role, expStr, sig] = raw.split("|");
    if (role !== "admin") return false;
    const exp = Number(expStr);
    if (!Number.isFinite(exp) || Date.now() > exp) return false;
    const payload = `${role}|${exp}`;
    const good = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(good, "hex"));
  } catch {
    return false;
  }
}

export const adminRoutes: FastifyPluginAsync = async (app) => {
  // 1) ping (публічний)
  app.get("/admin/ping", async () => ({ ok: true }));

  // 2) setup (одноразово)
  app.post("/admin/auth/setup", async (req, reply) => {
    const login = process.env.ADMIN_LOGIN || "Existence";
    const jwtSecret = process.env.ADMIN_JWT_SECRET;
    if (!jwtSecret) return reply.code(500).send({ error: "ADMIN_JWT_SECRET missing" });

    // якщо вже налаштовано — не даємо перезатерти
    if (process.env.ADMIN_PASSWORD_HASH && process.env.ADMIN_2FA_SECRET) {
      return reply.code(409).send({ error: "Admin already configured" });
    }

    const body = req.body as any;
    const password = String(body?.password || "");
    if (password.length < 12) {
      return reply.code(400).send({ error: "Password must be at least 12 chars" });
    }

    const secret = genBase32Secret(32);
    const passHash = hashPassword(password);

    // ВАЖЛИВО: ми не можемо записати .env прямо звідси на 100% безпечно/гарантовано,
    // тому повертаємо значення — ти вставиш їх у .env вручну (1 раз).
    const otpauth = `otpauth://totp/TextRPG:${encodeURIComponent(login)}?secret=${secret}&issuer=${encodeURIComponent("TextRPG")}`;

    return reply.send({
      login,
      adminPasswordHash: passHash,
      admin2faSecret: secret,
      otpauth,
      note: "Скопіюй adminPasswordHash -> ADMIN_PASSWORD_HASH і admin2faSecret -> ADMIN_2FA_SECRET у .env, потім pm2 restart.",
    });
  });

  // 3) login (пароль + 2FA)
  app.post("/admin/auth/login", async (req, reply) => {
    const body = req.body as any;
    const login = String(body?.login || "");
    const password = String(body?.password || "");
    const code = String(body?.code || "");

    const adminLogin = process.env.ADMIN_LOGIN || "Existence";
    const passHash = process.env.ADMIN_PASSWORD_HASH || "";
    const secret = process.env.ADMIN_2FA_SECRET || "";
    const jwtSecret = process.env.ADMIN_JWT_SECRET || "";

    if (!passHash || !secret || !jwtSecret) {
      return reply.code(500).send({ error: "Admin not configured. Run /admin/auth/setup first." });
    }

    if (login !== adminLogin) return reply.code(401).send({ error: "Bad credentials" });
    if (!verifyPassword(password, passHash)) return reply.code(401).send({ error: "Bad credentials" });
    if (!verifyTotp(secret, code)) return reply.code(401).send({ error: "Bad 2FA code" });

    const token = signAdminToken(jwtSecret);
    return reply.send({ accessToken: token, tokenType: "admin" });
  });

  // 4) protected ping
  app.get("/admin/secure-ping", async (req, reply) => {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const jwtSecret = process.env.ADMIN_JWT_SECRET || "";
    if (!jwtSecret) return reply.code(500).send({ error: "ADMIN_JWT_SECRET missing" });

    if (!token || !verifyAdminToken(token, jwtSecret)) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
    return reply.send({ ok: true, admin: true });
  });
};
