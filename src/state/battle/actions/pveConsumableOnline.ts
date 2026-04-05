import { pveConsumableUseAPI } from "../../../utils/api/characters";
import { useHeroStore } from "../../heroStore";
import { useCharacterStore } from "../../characterStore";
import { useAuthStore } from "../../authStore";
import { battleStoreRef } from "../../battleStoreRef";
import {
  cleanupBuffs,
  mergeServerHeroBuffsRespectLocalToggleOff,
} from "../helpers";
import { persistBattle, loadBattle } from "../persist";
import {
  mergeHeroBuffsForPveResourceScaling,
  pveSnapshotBaseCaps,
  scalePveSnapshotHpMpCpToBuffed,
} from "../../../utils/heroBuffedResources";
import { filterBuffsForHeroProfession } from "../loadout";
import { applyRevisionConflictFromApiError } from "../../heroStore";
import { runSerializedPveMutation } from "./pveMutationQueue";
import type { BattleState } from "../types";
import { getMaxResources } from "../helpers/getMaxResources";

const SERVER_SYNC_POTION_IDS = new Set([
  "lesser_healing_potion",
  "healing_potion",
  "lesser_mana_potion",
  "mana_potion",
  "cp_potion",
]);

export function isPveServerSyncedPotionItemId(itemId: string): boolean {
  return SERVER_SYNC_POTION_IDS.has(String(itemId || "").trim());
}

type SetPersist = (updates: Partial<BattleState>) => void;

/**
 * Онлайн PvE: сервер знімає предмет і оновлює heroJson.hp/mp/cp у базовому просторі (як pve-battle-tick).
 */
export function schedulePveConsumableOnline(args: {
  itemId: string;
  kind: "hp" | "mp" | "cp";
  restoreAmountBuffed: number;
  buffedMaxHp: number;
  buffedMaxMp: number;
  buffedMaxCp: number;
  loadoutSlots: (number | string | null)[];
  activeChargeSlots: number[];
  cooldownKey: number;
  prevCooldowns: Record<string, number>;
  setAndPersist: SetPersist;
  clientLogLine: string;
}): void {
  const hero = useHeroStore.getState().hero;
  const token = useAuthStore.getState().accessToken;
  const cid = String(useCharacterStore.getState().characterId ?? "").trim();
  const hid = String((hero as any)?.id ?? "").trim();
  if (!hero?.name || !token || !cid || hid !== cid) {
    const st0 = battleStoreRef.getState();
    const nextLog0 = [`Потрібна онлайн-сесія для банки в PvE.`, ...(st0?.log ?? [])].slice(0, 30);
    if (battleStoreRef.setState) {
      battleStoreRef.setState({ cooldowns: args.prevCooldowns, log: nextLog0 });
    }
    const n0 = useHeroStore.getState().hero?.name;
    if (n0) {
      const saved0 = loadBattle(n0) || {};
      persistBattle({ ...saved0, cooldowns: args.prevCooldowns, log: nextLog0 } as any, n0);
    }
    return;
  }

  const body: Parameters<typeof pveConsumableUseAPI>[1] = {
    expectedRevision: -1,
    itemId: args.itemId,
    restoreAmountBuffed: Math.max(0, Math.round(args.restoreAmountBuffed)),
    loadoutSlots: args.loadoutSlots,
    activeChargeSlots: args.activeChargeSlots,
  };
  if (args.kind === "hp") body.buffedMaxHp = Math.floor(args.buffedMaxHp);
  if (args.kind === "mp") body.buffedMaxMp = Math.floor(args.buffedMaxMp);
  if (args.kind === "cp") body.buffedMaxCp = Math.floor(args.buffedMaxCp);

  void runSerializedPveMutation(async () => {
    try {
      const expectedRevisionRaw =
        useHeroStore.getState().serverState?.heroRevision ??
        ((useHeroStore.getState().hero as any)?.heroJson?.heroRevision ?? 0);
      const expectedRevision = Number(expectedRevisionRaw);
      body.expectedRevision = Number.isFinite(expectedRevision) && expectedRevision >= 0 ? expectedRevision : 0;

      const heroJsonBefore = ((useHeroStore.getState().hero as any)?.heroJson || {}) as Record<string, any>;
      const res = await pveConsumableUseAPI(cid, body);
      if (!res?.ok || !(res as any).character) throw new Error("invalid response");

      const ch = (res as any).character;
      const mergedHj = (ch.heroJson && typeof ch.heroJson === "object" ? ch.heroJson : {}) as Record<string, any>;
      const srvHp = (res as any).heroHpAfter;
      const srvMp = (res as any).heroMpAfter;
      const srvCp = (res as any).heroCpAfter;
      if (Number.isFinite(Number(srvHp))) mergedHj.hp = Math.floor(Number(srvHp));
      if (Number.isFinite(Number(srvMp))) mergedHj.mp = Math.floor(Number(srvMp));
      if (Number.isFinite(Number(srvCp))) mergedHj.cp = Math.floor(Number(srvCp));

      const store = useHeroStore.getState();
      const prevHj = ((store.hero as any)?.heroJson || {}) as Record<string, any>;
      const tickNow = Date.now();
      const clientBattle = cleanupBuffs(battleStoreRef.getState()?.heroBuffs || [], tickNow);
      const hSync = store.hero;
      const mergedToggleHeroBuffs = mergeServerHeroBuffsRespectLocalToggleOff(
        hSync,
        mergedHj.heroBuffs,
        clientBattle,
        tickNow
      );
      const forScaleRaw = mergeHeroBuffsForPveResourceScaling(
        mergedHj.heroBuffs,
        heroJsonBefore.heroBuffs,
        clientBattle
      );
      const buffsForScale = hSync
        ? cleanupBuffs(filterBuffsForHeroProfession(hSync, forScaleRaw), tickNow)
        : cleanupBuffs(forScaleRaw, tickNow);
      const baseCapsUse = pveSnapshotBaseCaps(mergedHj, hSync ? getMaxResources(hSync) : null);
      const scaledRes = scalePveSnapshotHpMpCpToBuffed(mergedHj, buffsForScale, tickNow, baseCapsUse);

      const inv =
        Array.isArray(mergedHj.inventory) ? mergedHj.inventory : store.hero?.inventory;

      store.applyServerSync(
        {
          hp: scaledRes.hp,
          mp: scaledRes.mp,
          cp: scaledRes.cp,
          ...(Array.isArray(inv) ? { inventory: inv } : {}),
          heroJson: { ...prevHj, ...mergedHj, heroBuffs: mergedToggleHeroBuffs },
        } as any,
        {
          heroRevision: mergedHj.heroRevision,
          updatedAt: ch.updatedAt ? new Date(ch.updatedAt).getTime() : Date.now(),
        }
      );

      const line =
        typeof (res as any).logLine === "string" && (res as any).logLine.trim().length > 0
          ? (res as any).logLine
          : args.clientLogLine;
      const heroName = store.hero?.name;
      const st = battleStoreRef.getState();
      const nextLog = [line, ...(st?.log ?? [])].slice(0, 30);
      args.setAndPersist({ log: nextLog });
      if (heroName) {
        const saved = loadBattle(heroName) || {};
        persistBattle({ ...saved, log: nextLog } as any, heroName);
      }
    } catch (e: any) {
      if (Number(e?.status) === 409) {
        applyRevisionConflictFromApiError(e);
      }
      const code = String(e?.body?.error ?? "");
      const msg = String(e?.body?.message ?? e?.message ?? "");
      const errLine =
        code === "no_item"
          ? `Немає предмета в інвентарі (сервер).`
          : msg && msg.length < 120
            ? msg
            : `Не вдалося застосувати банку (сервер).`;
      const st = battleStoreRef.getState();
      const nextLog = [errLine, ...(st?.log ?? [])].slice(0, 30);
      if (battleStoreRef.setState) {
        battleStoreRef.setState({
          cooldowns: args.prevCooldowns,
          log: nextLog,
        });
      }
      const heroName = useHeroStore.getState().hero?.name;
      if (heroName) {
        const saved = loadBattle(heroName) || {};
        persistBattle({ ...saved, cooldowns: args.prevCooldowns, log: nextLog } as any, heroName);
      }
    }
  });
}
