import jwt from "jsonwebtoken";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is missing`);
  return v;
}

export async function requireAdmin(request: any, reply: any) {
  const auth = request.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return reply.code(401).send({ error: "No token" });

  try {
    const decoded = jwt.verify(token, mustEnv("ADMIN_JWT_SECRET")) as any;
    if (decoded?.role !== "admin") return reply.code(403).send({ error: "Forbidden" });

    // опційно: existence-only
    const ADMIN_LOGIN = mustEnv("ADMIN_LOGIN");
    if (decoded.login !== ADMIN_LOGIN) return reply.code(403).send({ error: "Forbidden" });

    request.admin = { login: decoded.login };
  } catch {
    return reply.code(401).send({ error: "Invalid token" });
  }
}
