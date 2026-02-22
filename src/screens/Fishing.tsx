// src/screens/Fishing.tsx
// Рибалка: повноекранний фон, опис, перевірка удочки/наживки, 1 заброс = 5000 SP + 5M адени, 1 год, улов 100–300 риб
// Сесія зберігається на сервері — один акаунт = одна сесія на всіх пристроях
import React, { useState, useEffect } from "react";
import { useHeroStore } from "../state/heroStore";
import { useCharacterStore } from "../state/characterStore";
import { fetchFishingSession, isFishingReady } from "../state/fishing/fishingPersistence";
import * as api from "../utils/api";

const FISHING_COST_SP = 5000;
const FISHING_COST_ADENA = 5_000_000;
const FISHING_DURATION_MS = 60 * 60 * 1000;
const ROD_ITEM_ID = "baby_duck_rod";
const BAIT_ITEM_ID = "gludio_fish_lure";
// Улов залежить від заточки удочки (+0..+1000)
const FISH_BY_ROD_ENCHANT: Array<{ min: number; max: number }> = [
  { min: 100, max: 300 }, { min: 110, max: 300 }, { min: 120, max: 300 },
  { min: 130, max: 310 }, { min: 130, max: 320 }, { min: 130, max: 330 },
  { min: 140, max: 350 }, { min: 140, max: 360 }, { min: 150, max: 370 },
  { min: 150, max: 380 }, { min: 160, max: 400 },
];
function getFishRangeByRodEnchant(enchant: number): { min: number; max: number } {
  const idx = Math.min(10, Math.floor(Math.max(0, enchant) / 100));
  return FISH_BY_ROD_ENCHANT[idx];
}

type Navigate = (path: string) => void;

interface FishingProps {
  navigate: Navigate;
}

export default function Fishing({ navigate }: FishingProps) {
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);
  const updateServerState = useHeroStore((s) => s.updateServerState);
  const characterId = useCharacterStore((s) => s.characterId);

  const [session, setSessionState] = useState<api.FishingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!characterId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchFishingSession(characterId)
      .then((s) => {
        setSessionState(s);
        setLoading(false);
      })
      .catch(() => {
        setSessionState(null);
        setLoading(false);
      });
  }, [characterId]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const equipment = hero?.equipment ?? {};
  const encLevels = hero?.equipmentEnchantLevels ?? {};
  const rodSlot =
    equipment["weapon"] === ROD_ITEM_ID ? "weapon" :
    equipment["lrhand"] === ROD_ITEM_ID ? "lrhand" :
    equipment["shield"] === ROD_ITEM_ID ? "shield" : null;
  const rodEquipped = rodSlot !== null;
  const rodEnchant = rodSlot ? (Number(encLevels[rodSlot]) || 0) : 0;
  const fishRange = getFishRangeByRodEnchant(rodEnchant);
  const inv = Array.isArray(hero?.inventory) ? hero.inventory : [];
  const baitCount = inv
    .filter((i) => i?.id === BAIT_ITEM_ID)
    .reduce((sum, i) => sum + (Number(i.count) || 0), 0);

  const hasRod = rodEquipped;
  const hasBait = baitCount >= 1;
  const sp = hero?.sp ?? 0;
  const adena = hero?.adena ?? 0;
  const canAfford = sp >= FISHING_COST_SP && adena >= FISHING_COST_ADENA;

  const ready = session && isFishingReady(session);
  const remainingMs = session && !ready ? Math.max(0, FISHING_DURATION_MS - (now - session.startedAt)) : 0;
  const remainingStr =
    remainingMs > 0
      ? `${Math.floor(remainingMs / 60000)}:${String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, "0")}`
      : "";

  const handleStartFishing = async () => {
    if (!hero || !characterId || actionLoading) return;
    if (!hasRod) {
      alert("Нужна удочка! Наденьте удочку (Baby Duck Rod) в слот оружия.");
      return;
    }
    if (!hasBait) {
      alert("Нужна наживка! Купите наживку (Gludio) в магазине.");
      return;
    }
    if (!canAfford) {
      alert(
        `Недостаточно ресурсов. Нужно: ${FISHING_COST_SP.toLocaleString()} SP и ${FISHING_COST_ADENA.toLocaleString()} аден.`
      );
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.startFishing(characterId);
      setSessionState(res.session);
      const hj = res.character.heroJson as any;
      const newRev = hj?.heroRevision;
      if (newRev != null) updateServerState({ heroRevision: newRev });
      updateHero({
        sp: res.character.sp,
        adena: res.character.adena,
        inventory: hj?.inventory ?? hero.inventory ?? [],
        heroJson: { ...(hero as any).heroJson, ...hj, fishingSession: res.session },
      });
    } catch (e: any) {
      alert(e?.message || e?.error || "Не удалось начать рыбалку");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCollect = async () => {
    if (!hero || !characterId || !ready || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await api.collectFishing(characterId);
      setSessionState(null);
      const hj = res.character.heroJson as any;
      const newRev = hj?.heroRevision;
      if (newRev != null) updateServerState({ heroRevision: newRev });
      updateHero({
        inventory: hj?.inventory ?? hero.inventory ?? [],
        heroJson: { ...(hero as any).heroJson, ...hj, fishingSession: undefined },
      });
    } catch (e: any) {
      alert(e?.message || e?.error || "Не удалось забрать улов");
    } finally {
      setActionLoading(false);
    }
  };

  if (!hero) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-[#b8860b]">
        Загрузка...
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-[#b8860b]">
        Загрузка сессии...
      </div>
    );
  }

  return (
    <div className="w-full text-white px-4 py-2">
      <div className="w-full max-w-[360px] mx-auto">
        <div className="space-y-3">
          <div className="border-t border-white/50"></div>
          <div className="text-center text-[16px] font-semibold" style={{ color: "#4488ff" }}>Рыбалка</div>
          <p className="text-xs text-left" style={{ color: "#c7ad80" }}>
            Здесь можно провести час на берегу: один заброс стоит {FISHING_COST_SP.toLocaleString()} SP и{" "}
            {FISHING_COST_ADENA.toLocaleString()} аден. Нужны удочка и наживка. Через час заберите улов — от {fishRange.min} до {fishRange.max} рыб.
          </p>
          <div className="flex justify-start -ml-1">
            <div className="relative overflow-hidden rounded shadow-[inset_0_0_25px_10px_rgba(0,0,0,0.65)]">
              <img
                src="/icons/fishing.jpg"
                alt="Рыбалка"
                className="max-h-44 w-auto object-cover object-left block"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/icons/clanns.png";
                }}
              />
            </div>
          </div>

          <div className="border-t-2" style={{ borderColor: "#c7ad80" }}></div>

        {!session && (
          <div className="text-[12px] space-y-2">
            {!hasRod && (
              <>
                <p className="text-red-400">Наденьте удочку (Baby Duck Rod)</p>
                <div className="border-t" style={{ borderColor: "#c7ad80" }}></div>
              </>
            )}
            {hasBait ? (
              <p className="text-green-400">✓ Наживка есть ({baitCount})</p>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-red-400">Нужна наживка</span>
                <button
                  onClick={() => navigate("/shop?category=materials")}
                  className="px-2 py-1 text-[11px] rounded border border-[#c7ad80]/60 text-[#c7ad80] hover:bg-[#c7ad80]/20"
                >
                  Магазин
                </button>
              </div>
            )}
            <p className="text-[#cfcfcc]">
              SP: {FISHING_COST_SP.toLocaleString()} · Адена: {FISHING_COST_ADENA.toLocaleString()}
            </p>
            <button
              className="w-full py-3 rounded-md bg-[#2a2a2a] ring-1 ring-[#c7ad80]/50 text-[#c7ad80] hover:bg-[#3a3a3a] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!hasRod || !hasBait || !canAfford || actionLoading}
              onClick={handleStartFishing}
            >
              {actionLoading ? "..." : "Начать рыбалку"}
            </button>
            <div className="rounded border border-[#c7ad80]/50 px-3 py-2 flex items-center justify-between gap-2">
              <span style={{ color: "#ff8c00" }}>SP: {sp.toLocaleString()}</span>
              <span style={{ color: "#ffd700" }}>Адена: {adena.toLocaleString()}</span>
            </div>
          </div>
        )}

        {session && !ready && (
          <div className="space-y-2 text-[12px]">
            <p className="text-[#cfcfcc]">Рыбалка идёт. Осталось: {remainingStr}</p>
            <p className="text-gray-500">Вернитесь через час и нажмите «Забрать улов».</p>
            <div className="rounded border border-[#c7ad80]/50 px-3 py-2 flex items-center justify-between gap-2">
              <span style={{ color: "#ff8c00" }}>SP: {sp.toLocaleString()}</span>
              <span style={{ color: "#ffd700" }}>Адена: {adena.toLocaleString()}</span>
            </div>
          </div>
        )}

        {ready && (
          <div className="space-y-3 text-[12px]">
            <p className="text-green-400">Улов готов!</p>
            <p className="text-[#cfcfcc]">Рыб: {typeof session?.fishCount === "number" ? session.fishCount : `${fishRange.min}–${fishRange.max}`}</p>
            <button
              className="w-full py-3 rounded-md bg-[#2a2a2a] ring-1 ring-green-500/50 text-green-400 hover:bg-[#3a3a3a] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleCollect}
              disabled={actionLoading}
            >
              {actionLoading ? "..." : "Забрать улов"}
            </button>
            <div className="rounded border border-[#c7ad80]/50 px-3 py-2 flex items-center justify-between gap-2">
              <span style={{ color: "#ff8c00" }}>SP: {sp.toLocaleString()}</span>
              <span style={{ color: "#ffd700" }}>Адена: {adena.toLocaleString()}</span>
            </div>
          </div>
        )}

          <div className="mt-4 flex justify-center">
            <span
              onClick={() => navigate("/city")}
              className="text-sm text-red-600 cursor-pointer hover:text-red-500"
            >
              В город
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
