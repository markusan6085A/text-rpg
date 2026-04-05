import pveAttackSkillMetaJson from "../data/pveAttackSkillMeta.generated.json";
import { rollAttackDamage, sanitizeCombatStats, type CombatStatsIn } from "./pveDamage";

type SkillMetaRow = {
  id: number;
  category: string;
  element?: string;
  levels: Record<string, { mpCost: number; power: number }>;
};

const meta = pveAttackSkillMetaJson as {
  version: number;
  skills: Record<string, SkillMetaRow>;
  professionToSkillIds: Record<string, number[]>;
};

function professionAllowsSkill(skillId: number, heroJson: any, classId: string): boolean {
  const keys = [heroJson?.profession, heroJson?.klass, heroJson?.classId, classId]
    .filter(Boolean)
    .map((x) => String(x).trim());
  for (const k of keys) {
    const list = meta.professionToSkillIds[k];
    if (Array.isArray(list) && list.includes(skillId)) return true;
  }
  return false;
}

export type PveBattleAttackResult =
  | {
      ok: true;
      nextHeroJson: any;
      logLines: string[];
      damage: number;
      isCrit: boolean;
      mobHpAfter: number;
      killed: boolean;
    }
  | { ok: false; code: string; message?: string };

export function applyPveBattleAttackSnapshot(args: {
  heroJson: any;
  classId: string;
  skillId: number;
  heroCombatStats: any;
  skillNameFallback?: string;
}): PveBattleAttackResult {
  const hjIn = args.heroJson && typeof args.heroJson === "object" ? args.heroJson : {};
  const hj = { ...hjIn };
  const sess: any = hj.battleSession;
  if (!sess || Number(sess.v) !== 1 || typeof sess.mobHP !== "number") {
    return { ok: false, code: "no_battle_session", message: "No active PvE battle on server" };
  }
  const mobHpBefore = Math.max(0, Math.floor(Number(sess.mobHP)));

  const skillId = Math.floor(Number(args.skillId));
  if (!Number.isFinite(skillId) || skillId < 1) {
    return { ok: false, code: "invalid_skill", message: "skillId invalid" };
  }

  const row = meta.skills[String(skillId)];
  if (!row) {
    return { ok: false, code: "unsupported_skill", message: "Attack skill not supported on server" };
  }

  if (!professionAllowsSkill(skillId, hj, String(args.classId ?? ""))) {
    return { ok: false, code: "forbidden_skill", message: "Skill not allowed for this profession" };
  }

  const learned = (Array.isArray(hj.skills) ? hj.skills : []).find((s: any) => Number(s?.id) === skillId);
  if (!learned) {
    return { ok: false, code: "not_learned", message: "Skill not learned" };
  }

  const level = Math.max(1, Math.floor(Number(learned.level ?? 1)));
  const levelRow = row.levels[String(level)];
  if (!levelRow) {
    return { ok: false, code: "invalid_level", message: "No level data for skill" };
  }

  const mpCost = Math.max(0, Number(levelRow.mpCost ?? 0) || 0);
  const heroMp = Math.max(0, Math.floor(Number(hj.mp ?? 0)));
  if (heroMp < mpCost) {
    return { ok: false, code: "not_enough_mp", message: "Not enough MP" };
  }

  const cat = row.category;
  if (cat !== "physical_attack" && cat !== "magic_attack") {
    return { ok: false, code: "not_attack", message: "Not an attack skill" };
  }

  if (mobHpBefore <= 0) {
    return { ok: false, code: "mob_dead", message: "Mob already defeated" };
  }

  const attacker: CombatStatsIn = sanitizeCombatStats(args.heroCombatStats);
  const targetResists = {
    fireResist: Number(sess.fireResist) || 0,
    waterResist: Number(sess.waterResist) || 0,
    windResist: Number(sess.windResist) || 0,
    earthResist: Number(sess.earthResist) || 0,
    holyResist: Number(sess.holyResist) || 0,
    darkResist: Number(sess.darkResist) || 0,
  };

  const { damage, isCrit } = rollAttackDamage({
    category: cat,
    power: levelRow.power,
    element: row.element,
    attacker,
    targetPDef: Math.max(1, Number(sess.mobPDef) || 1),
    targetMDef: Math.max(1, Number(sess.mobMDef) || 1),
    targetResists,
  });

  const mobHpAfter = Math.max(0, mobHpBefore - damage);
  hj.mp = heroMp - mpCost;
  const killed = mobHpAfter <= 0;

  const nextSession = {
    ...sess,
    mobHP: killed ? 0 : mobHpAfter,
    lastSkillId: skillId,
    lastDamage: damage,
    lastAt: Date.now(),
  };
  hj.battleSession = nextSession;

  const skillName = String(args.skillNameFallback || `Skill ${skillId}`);
  const logLines = [
    `Ви використовуєте [${skillName}].`,
    isCrit ? `Ви наносите ${damage} урону. (Крит!)` : `Ви наносите ${damage} урону.`,
  ];

  return {
    ok: true,
    nextHeroJson: hj,
    logLines,
    damage,
    isCrit,
    mobHpAfter: nextSession.mobHP,
    killed,
  };
}
