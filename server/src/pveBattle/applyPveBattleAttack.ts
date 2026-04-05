import pveAttackSkillMetaJson from "../data/pveAttackSkillMeta.generated.json";
import { rollAttackDamage, rollBaseAutoAttackDamage, sanitizeCombatStats, type CombatStatsIn } from "./pveDamage";
import { effectiveSkillMpCost, rollMpSpend } from "./pveMpRsk";
import {
  canAttackWithBowServer,
  consumeOneArrow,
  getWeaponTypeFromEquipment,
  tryConsumeShotFromInventory,
} from "./pveShotArrowsServer";
import { cleanupBattleBuffs, applyMobBuffsToCombat } from "./pveBattleBuffsLite";
import { clampPlayerAccuracy, hitChancePercentVsMob, rollPvEAttackHit } from "./pveHitChance";
import {
  SONIC_CONSUMERS,
  SONIC_COST,
  SONIC_FOCUS_ID,
  FOCUSED_FORCE_CONSUMERS,
  FOCUSED_FORCE_COST,
  FOCUSED_FORCE_ID,
} from "./pveSonicConstants";
import { applyServerToggleResourceTicks } from "./applyServerToggleTicks";
import { syncHeroJsonResourcePercentsToAbsolutes } from "./pveHeroResourceSync";
import { pveVampirismPercentFromSkill } from "./pveVampirismSkillPercent";

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
  if (skillId === 0) return true;
  const keys = [heroJson?.profession, heroJson?.klass, heroJson?.classId, classId]
    .filter(Boolean)
    .map((x) => String(x).trim());
  for (const k of keys) {
    const list = meta.professionToSkillIds[k];
    if (Array.isArray(list) && list.includes(skillId)) return true;
  }
  return false;
}

function heroIsMageClass(heroJson: any): boolean {
  const parts = [heroJson?.klass, heroJson?.profession]
    .filter(Boolean)
    .map((x) => String(x).toLowerCase());
  const s = parts.join(" ");
  return (
    s.includes("mystic") ||
    s.includes("маг") ||
    s.includes("elder") ||
    s.includes("necromancer") ||
    s.includes("warlock") ||
    s.includes("prophet") ||
    s.includes("shaman")
  );
}

function applyMobBuffsToSession(sess: any, mobBuffsClean: any[], now: number) {
  const baseP = Math.max(1, Math.floor(Number(sess.mobPDefBase ?? sess.mobPDef) || 1));
  const baseM = Math.max(1, Math.floor(Number(sess.mobMDefBase ?? sess.mobMDef) || 1));
  const baseE = Math.max(0, Math.floor(Number(sess.mobEvasionBase ?? sess.mobEvasion) || 0));
  const merged = applyMobBuffsToCombat(
    {
      pDef: baseP,
      mDef: baseM,
      evasion: baseE,
      fireResist: Number(sess.fireResistBase ?? 0) || 0,
      waterResist: Number(sess.waterResistBase ?? 0) || 0,
      windResist: Number(sess.windResistBase ?? 0) || 0,
      earthResist: Number(sess.earthResistBase ?? 0) || 0,
      holyResist: Number(sess.holyResistBase ?? 0) || 0,
      darkResist: Number(sess.darkResistBase ?? 0) || 0,
    },
    mobBuffsClean
  );
  sess.mobPDef = merged.pDef;
  sess.mobMDef = merged.mDef;
  sess.mobEvasion = merged.evasion;
  sess.fireResist = merged.fireResist;
  sess.waterResist = merged.waterResist;
  sess.windResist = merged.windResist;
  sess.earthResist = merged.earthResist;
  sess.holyResist = merged.holyResist;
  sess.darkResist = merged.darkResist;
  sess.mobBuffs = mobBuffsClean;
}

/** Перерахунок pDef/mDef/evasion/резистів моба тільки з battleSession.mobBuffs (БД), без клієнта. */
function syncMobCombatFromSessionBuffs(sess: any, now: number) {
  if (typeof sess.mobPDefBase !== "number") sess.mobPDefBase = Math.max(1, Math.floor(Number(sess.mobPDef) || 1));
  if (typeof sess.mobMDefBase !== "number") sess.mobMDefBase = Math.max(1, Math.floor(Number(sess.mobMDef) || 1));
  if (sess.fireResistBase === undefined) sess.fireResistBase = Number(sess.fireResist) || 0;
  if (sess.waterResistBase === undefined) sess.waterResistBase = Number(sess.waterResist) || 0;
  if (sess.windResistBase === undefined) sess.windResistBase = Number(sess.windResist) || 0;
  if (sess.earthResistBase === undefined) sess.earthResistBase = Number(sess.earthResist) || 0;
  if (sess.holyResistBase === undefined) sess.holyResistBase = Number(sess.holyResist) || 0;
  if (sess.darkResistBase === undefined) sess.darkResistBase = Number(sess.darkResist) || 0;
  if (sess.mobEvasionBase === undefined) {
    sess.mobEvasionBase = Math.max(0, Math.floor(Number(sess.mobEvasion) || 0));
  }
  const stored = cleanupBattleBuffs(Array.isArray(sess.mobBuffs) ? sess.mobBuffs : [], now);
  applyMobBuffsToSession(sess, stored, now);
}

function checkSonicAndForceStacks(heroJson: any, skillId: number): { ok: false; code: string } | { ok: true } {
  const buffs = Array.isArray(heroJson.heroBuffs) ? heroJson.heroBuffs : [];
  if (SONIC_CONSUMERS.has(skillId)) {
    const need = SONIC_COST[skillId] ?? 1;
    const focusBuff = buffs.find((b: any) => Number(b?.id) === SONIC_FOCUS_ID);
    const stacks = Math.max(0, Math.floor(Number(focusBuff?.stacks) || 0));
    if (stacks < need) return { ok: false, code: "sonic_focus_required" };
  }
  if (FOCUSED_FORCE_CONSUMERS.has(skillId)) {
    const need = FOCUSED_FORCE_COST[skillId] ?? 1;
    const focusBuff = buffs.find((b: any) => Number(b?.id) === FOCUSED_FORCE_ID);
    const stacks = Math.max(0, Math.floor(Number(focusBuff?.stacks) || 0));
    if (stacks < need) return { ok: false, code: "focused_force_required" };
  }
  return { ok: true };
}

/** Застосувати списання стаків після підтвердженого влучання. */
function applySonicAndForceStacks(heroJson: any, skillId: number): any[] {
  let buffs = Array.isArray(heroJson.heroBuffs) ? [...heroJson.heroBuffs] : [];
  if (SONIC_CONSUMERS.has(skillId)) {
    const need = SONIC_COST[skillId] ?? 1;
    const focusBuff = buffs.find((b: any) => Number(b?.id) === SONIC_FOCUS_ID);
    const stacks = Math.max(0, Math.floor(Number(focusBuff?.stacks) || 0));
    const newStacks = Math.max(0, stacks - need);
    const remainingFocus = newStacks > 0 ? { ...focusBuff, stacks: newStacks } : null;
    const withoutFocus = buffs.filter((b: any) => Number(b?.id) !== SONIC_FOCUS_ID);
    buffs = remainingFocus ? [remainingFocus, ...withoutFocus] : withoutFocus;
  }
  if (FOCUSED_FORCE_CONSUMERS.has(skillId)) {
    const need = FOCUSED_FORCE_COST[skillId] ?? 1;
    const focusBuff = buffs.find((b: any) => Number(b?.id) === FOCUSED_FORCE_ID);
    const stacks = Math.max(0, Math.floor(Number(focusBuff?.stacks) || 0));
    const newStacks = Math.max(0, stacks - need);
    const remainingForce = newStacks > 0 ? { ...focusBuff, stacks: newStacks } : null;
    const withoutForce = buffs.filter((b: any) => Number(b?.id) !== FOCUSED_FORCE_ID);
    buffs = remainingForce ? [remainingForce, ...withoutForce] : withoutForce;
  }
  return buffs;
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
  loadoutSlots?: any[];
  activeChargeSlots?: any[];
}): PveBattleAttackResult {
  const hjIn = args.heroJson && typeof args.heroJson === "object" ? args.heroJson : {};
  const hj = { ...hjIn };
  const sess: any = hj.battleSession;
  const now = Date.now();

  if (!sess || Number(sess.v) !== 1 || typeof sess.mobHP !== "number") {
    return { ok: false, code: "no_battle_session", message: "No active PvE battle on server" };
  }

  if (String(sess.zoneId || "") === "fishing") {
    return { ok: false, code: "fishing_local", message: "Fishing uses local combat" };
  }

  const mobHpBefore = Math.max(0, Math.floor(Number(sess.mobHP)));
  if (mobHpBefore <= 0) {
    return { ok: false, code: "mob_dead", message: "Mob already defeated" };
  }

  const skillId = Math.floor(Number(args.skillId));
  if (!Number.isFinite(skillId) || skillId < 0) {
    return { ok: false, code: "invalid_skill", message: "skillId invalid" };
  }

  syncMobCombatFromSessionBuffs(sess, now);

  const sessStarted = Number(sess.startedAt) || 0;
  const youngBattle = sessStarted > 0 && now - sessStarted < 15_000;
  const toggleLogLines = applyServerToggleResourceTicks(
    hj,
    now,
    youngBattle ? { maxTickCatchup: 2 } : undefined
  );

  if (!professionAllowsSkill(skillId, hj, String(args.classId ?? ""))) {
    return { ok: false, code: "forbidden_skill", message: "Skill not allowed for this profession" };
  }

  if (skillId !== 0) {
    const learned = (Array.isArray(hj.skills) ? hj.skills : []).find((s: any) => Number(s?.id) === skillId);
    if (!learned) {
      return { ok: false, code: "not_learned", message: "Skill not learned" };
    }
  }

  const row = skillId === 0 ? null : meta.skills[String(skillId)];
  if (skillId !== 0 && !row) {
    return { ok: false, code: "unsupported_skill", message: "Attack skill not supported on server" };
  }

  const loadoutSlots = Array.isArray(args.loadoutSlots) ? args.loadoutSlots : [];
  const activeChargeSlots = Array.isArray(args.activeChargeSlots) ? args.activeChargeSlots : [];
  const weaponId = hj.equipment?.weapon ?? hj.equipment?.lrhand;
  const heroMp = Math.max(0, Math.floor(Number(hj.mp ?? 0)));
  const csInRaw = args.heroCombatStats && typeof args.heroCombatStats === "object" ? args.heroCombatStats : {};
  const csStats: CombatStatsIn = sanitizeCombatStats(csInRaw);

  let mpCostEff = 0;
  let level = 1;
  let levelRow: { mpCost: number; power: number } | null = null;
  let cat: "physical_attack" | "magic_attack" = "physical_attack";

  if (skillId === 0) {
    mpCostEff = 0;
  } else {
    const learned = (Array.isArray(hj.skills) ? hj.skills : []).find((s: any) => Number(s?.id) === skillId)!;
    level = Math.max(1, Math.floor(Number(learned.level ?? 1)));
    levelRow = row!.levels[String(level)] || null;
    if (!levelRow) {
      return { ok: false, code: "invalid_level", message: "No level data for skill" };
    }
    cat = row!.category as "physical_attack" | "magic_attack";
    if (cat !== "physical_attack" && cat !== "magic_attack") {
      return { ok: false, code: "not_attack", message: "Not an attack skill" };
    }
    mpCostEff = effectiveSkillMpCost(levelRow.mpCost, csInRaw as Record<string, number>);
    if (heroMp < mpCostEff) {
      return { ok: false, code: "not_enough_mp", message: "Not enough MP" };
    }

    const stCheck = checkSonicAndForceStacks(hj, skillId);
    if (!stCheck.ok) {
      return {
        ok: false,
        code: stCheck.code,
        message: stCheck.code === "sonic_focus_required" ? "Потрібні стаки Sonic Focus" : "Потрібні стаки Focused Force",
      };
    }
  }

  const bowNeed =
    skillId === 0
      ? getWeaponTypeFromEquipment(hj.equipment) === "bow"
      : cat === "physical_attack" && getWeaponTypeFromEquipment(hj.equipment) === "bow";

  let bowGrade: ReturnType<typeof canAttackWithBowServer>["grade"] = null;
  if (bowNeed) {
    const bowCheck = canAttackWithBowServer(hj);
    if (!bowCheck.ok) {
      return { ok: false, code: "no_arrows", message: bowCheck.message || "No arrows" };
    }
    bowGrade = bowCheck.grade ?? null;
  }

  const accuracy = clampPlayerAccuracy((csInRaw as any).accuracy);
  const mobEv = Math.max(0, Math.min(120, Math.floor(Number(sess.mobEvasion) || 0)));
  const hitPct = hitChancePercentVsMob(accuracy, mobEv);
  const landed = rollPvEAttackHit(hitPct);
  const skillNameForLog = skillId === 0 ? "Attack" : String(args.skillNameFallback || `Skill ${skillId}`);

  if (!landed) {
    hj.battleSession = {
      ...sess,
      lastSkillId: skillId,
      lastDamage: 0,
      lastAt: Date.now(),
    };
    syncHeroJsonResourcePercentsToAbsolutes(hj);
    return {
      ok: true,
      nextHeroJson: hj,
      logLines: [
        ...toggleLogLines,
        `Ви промахнулись [${skillNameForLog}] (шанс влучання ${hitPct}%).`,
      ],
      damage: 0,
      isCrit: false,
      mobHpAfter: mobHpBefore,
      killed: false,
    };
  }

  if (skillId !== 0) {
    hj.heroBuffs = applySonicAndForceStacks(hj, skillId);
  }

  const isPhysical = skillId === 0 || cat === "physical_attack";
  const isMagic = skillId !== 0 && cat === "magic_attack";
  const shotConsume = skillId === 0 ? 1 : 2;
  let inv = Array.isArray(hj.inventory) ? [...hj.inventory] : [];

  if (bowNeed && bowGrade) {
    const ar = consumeOneArrow(inv, bowGrade as any);
    if (!ar.ok) return { ok: false, code: "no_arrows", message: "No arrows" };
    inv = ar.inventory;
  }

  const shot = tryConsumeShotFromInventory({
    inventory: inv,
    loadoutSlots,
    activeChargeSlots,
    isPhysical,
    isMagic,
    weaponItemId: weaponId,
    consumeCount: shotConsume,
  });
  inv = shot.inventory;
  hj.inventory = inv;

  let damage = 0;
  let isCrit = false;

  if (skillId === 0) {
    const physMult = heroIsMageClass(hj) ? 0.5 : 1.0;
    const r = rollBaseAutoAttackDamage({
      pAtk: Number(csStats.pAtk) || 1,
      targetPDef: Math.max(1, Number(sess.mobPDef) || 1),
      crit: Number(csStats.crit) || 40,
      critPower: Number(csStats.critPower) || 100,
      lsBackbiting: Number(csStats.lsBackbiting) || 0,
      physicalDamageMultiplier: physMult,
      shotMultiplier: shot.multiplier,
    });
    damage = r.damage;
    isCrit = r.isCrit;
    hj.mp = heroMp;
  } else {
    const mpSpend = rollMpSpend(mpCostEff, csInRaw as Record<string, number>);
    hj.mp = heroMp - mpSpend;
    const attacker = csStats;
    const targetResists = {
      fireResist: Number(sess.fireResist) || 0,
      waterResist: Number(sess.waterResist) || 0,
      windResist: Number(sess.windResist) || 0,
      earthResist: Number(sess.earthResist) || 0,
      holyResist: Number(sess.holyResist) || 0,
      darkResist: Number(sess.darkResist) || 0,
    };
    const rolled = rollAttackDamage({
      category: cat,
      power: levelRow!.power,
      element: row!.element,
      attacker,
      targetPDef: Math.max(1, Number(sess.mobPDef) || 1),
      targetMDef: Math.max(1, Number(sess.mobMDef) || 1),
      targetResists,
    });
    damage = Math.max(1, Math.round(rolled.damage * shot.multiplier));
    isCrit = rolled.isCrit;
  }

  let healVamp = 0;
  if (damage > 0) {
    const wt = getWeaponTypeFromEquipment(hj.equipment);
    const vampMeleeBonus =
      isPhysical && !isMagic && wt !== "bow"
        ? Math.max(0, Number((csInRaw as any).vampirismMelee) || 0)
        : 0;
    const vampFromBuffs = Math.max(0, Number((csInRaw as any).vampirism) || 0) + vampMeleeBonus;
    const vampFromSkill = pveVampirismPercentFromSkill(skillId);
    const isDrainSkill = skillId === 1090 || skillId === 1245;
    let vampPct =
      isDrainSkill && vampFromSkill > 0
        ? vampFromSkill
        : vampFromBuffs > 0
          ? vampFromBuffs
          : vampFromSkill;
    vampPct = Math.max(0, Math.min(100, vampPct));
    if (vampPct > 0) {
      healVamp = Math.round(damage * (vampPct / 100));
      if (healVamp > 0) {
        const maxHp = Math.max(1, Math.floor(Number(hj.maxHp ?? 1)));
        const curHp = Math.max(0, Math.floor(Number(hj.hp ?? 0)));
        hj.hp = Math.min(maxHp, curHp + healVamp);
      }
    }
  }

  const mobHpAfter = Math.max(0, mobHpBefore - damage);
  const killed = mobHpAfter <= 0;

  const nextSession = {
    ...sess,
    mobHP: killed ? 0 : mobHpAfter,
    lastSkillId: skillId,
    lastDamage: damage,
    lastAt: Date.now(),
  };
  hj.battleSession = nextSession;

  const skillName = skillNameForLog;
  const healLine = healVamp > 0 ? `Відновлено ${healVamp} HP (вампіризм).` : null;
  const logLines =
    skillId === 0
      ? [
          shot.used ? `Автоматична атака (заряд ×${shot.multiplier.toFixed(1)}).` : `Ви атакуєте.`,
          isCrit ? `Ви наносите ${damage} урону. (Крит!)` : `Ви наносите ${damage} урону.`,
          ...(healLine ? [healLine] : []),
        ]
      : [
          `Ви використовуєте [${skillName}].`,
          isCrit ? `Ви наносите ${damage} урону. (Крит!)` : `Ви наносите ${damage} урону.`,
          ...(healLine ? [healLine] : []),
        ];

  syncHeroJsonResourcePercentsToAbsolutes(hj);
  return {
    ok: true,
    nextHeroJson: hj,
    logLines: [...toggleLogLines, ...logLines],
    damage,
    isCrit,
    mobHpAfter: nextSession.mobHP,
    killed,
  };
}
