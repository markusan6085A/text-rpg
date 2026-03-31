/**
 * Кілька варіантів URL іконки: у даних змішані `skill0213.gif`, `Skill0214_0.jpg` (регістр/розширення на CDN різні).
 */
export function buildSkillIconCandidates(skillId: number, declaredRaw?: string | null): string[] {
  const out: string[] = [];
  const push = (u: string) => {
    const t = u.trim();
    if (!t || out.includes(t)) return;
    out.push(t);
  };

  const pad4 = String(skillId).padStart(4, "0");
  const decl = String(declaredRaw ?? "").trim();

  if (decl) {
    const full = decl.startsWith("/") ? decl : `/skills/${decl}`;
    push(full);
    push(full.toLowerCase());
  }

  push(`/skills/skill${pad4}.gif`);
  push(`/skills/skill${skillId}.gif`);
  push(`/skills/skill${pad4}.jpg`);
  push(`/skills/Skill${pad4}_0.jpg`);
  push(`/skills/skill${pad4}_0.jpg`);

  return out;
}
