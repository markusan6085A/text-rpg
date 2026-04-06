/**
 * Лічильники questKillTargets у battle-finish (сервер — джерело правди).
 * Клієнт при serverAuthoritativeKill не викликає applyQuestKillProgressOnVictory.
 */
import { QUESTS, type QuestKillTarget } from "../data/gameQuests";

type MobLike = {
  id: string;
  name: string;
  level: number;
  isRaidBoss: boolean;
  aggressivePatrol?: boolean;
  aggressiveGroup?: string;
};

function mobMatchesKillTargetServer(
  mob: MobLike,
  target: QuestKillTarget,
  zoneId: string | undefined,
  heroLevel: number
): boolean {
  const delta = target.maxHeroLevelDelta;
  if (delta != null && delta >= 0) {
    const hl = heroLevel;
    if (hl < 1) return false;
    if (mob.isRaidBoss) return false;
    if (Math.abs(mob.level - hl) > delta) return false;
    if (target.killInZoneId && (!zoneId || zoneId !== target.killInZoneId)) return false;
    return true;
  }
  if (target.raidBossKillInZone) {
    if (!zoneId || zoneId !== target.raidBossKillInZone) return false;
    return mob.isRaidBoss === true;
  }
  if (target.aggressiveKillsInZone) {
    if (!zoneId || zoneId !== target.aggressiveKillsInZone) return false;
    if (mob.isRaidBoss) return false;
    return !!(mob.aggressivePatrol || mob.aggressiveGroup);
  }
  if (target.killInZoneId && (!zoneId || zoneId !== target.killInZoneId)) return false;
  if (target.mobNamePrefix && mob.name.startsWith(target.mobNamePrefix)) return true;
  if (target.mobIdPrefix && mob.id.startsWith(target.mobIdPrefix)) return true;
  if (mob.name === target.mobName) return true;
  return false;
}

/** Додає оновлення прогресу (той самий формат, що calculateQuestDrops — itemId = progressKey). */
export function appendQuestKillProgressForMob(
  mob: MobLike,
  zoneId: string | undefined,
  heroLevel: number,
  activeQuests: Array<{ questId: string; progress?: Record<string, number> }> | undefined,
  out: Array<{ questId: string; itemId: string; count: number }>
): void {
  if (!activeQuests?.length) return;
  const questById = new Map(QUESTS.map((q) => [q.id, q]));
  const hl = Math.max(1, Math.floor(Number(heroLevel) || 1));

  for (const aq of activeQuests) {
    const def = questById.get(aq.questId);
    if (!def?.questKillTargets?.length) continue;
    const prog = { ...(aq.progress || {}) };
    for (const kt of def.questKillTargets) {
      if (!mobMatchesKillTargetServer(mob, kt, zoneId, hl)) continue;
      const cur = prog[kt.progressKey] ?? 0;
      if (cur >= kt.requiredCount) continue;
      out.push({ questId: aq.questId, itemId: kt.progressKey, count: 1 });
      prog[kt.progressKey] = cur + 1;
    }
  }
}
