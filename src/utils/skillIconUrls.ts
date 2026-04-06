/**
 * Плейсхолдер після помилки завантаження іконки — не використовувати відсутній skill0000.gif (безкінечний 404 → спам).
 */
export const SKILL_ICON_ERROR_FALLBACK =
  "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

/**
 * Кілька варіантів URL іконки: у даних змішані `skill0213.gif`, `Skill0214_0.jpg` (регістр/розширення на CDN різні).
 */
export function buildSkillIconCandidates(skillId: number, declaredRaw?: string | null): string[] {
  const out: string[] = [];
  const push = (u: string) => {
    const t = u.trim();
    if (!t || out.includes(t)) return;
    if (/\/skill0000\.gif$/i.test(t)) return;
    out.push(t);
  };

  const sid = Math.floor(Number(skillId));
  const pad4 = String(sid).padStart(4, "0");
  const decl = String(declaredRaw ?? "").trim();

  if (decl) {
    const full = decl.startsWith("/") ? decl : `/skills/${decl}`;
    push(full);
    push(full.toLowerCase());
  }

  if (sid !== 0) {
    push(`/skills/skill${pad4}.gif`);
    push(`/skills/skill${sid}.gif`);
    push(`/skills/skill${pad4}.jpg`);
    push(`/skills/Skill${pad4}_0.jpg`);
    push(`/skills/skill${pad4}_0.jpg`);
  }

  return out;
}
