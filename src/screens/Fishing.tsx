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

type Navigate = (path: string) => void;

interface FishingProps {
  navigate: Navigate;
}

export default function Fishing({ navigate }: FishingProps) {
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);
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
    fetchFishingSession(characterId).then((s) => {
      setSessionState(s);
      setLoading(false);
    });
  }, [characterId]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const equipment = hero?.equipment ?? {};
  const rodEquipped =
    equipment["weapon"] === ROD_ITEM_ID ||
    equipment["lrhand"] === ROD_ITEM_ID ||
    equipment["shield"] === ROD_ITEM_ID;
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
      updateHero({
        inventory: hj?.inventory ?? hero.inventory ?? [],
        heroJson: { ...(hero as any).heroJson, ...hj, fishingSession: undefined },
      });
      alert(`Улов: ${res.fishCount} рыб`);
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
    <div className="w-full flex items-start justify-center">
      <div className="w-full max-w-md mt-5 mb-10 px-3">
        <div className="px-4 py-3 border-b border-black/70">
          <h1 className="text-lg font-semibold text-[#b8860b] text-center mb-3">
            Рыбалка
          </h1>
          <p className="text-xs text-[#cfcfcc] text-left">
            Здесь можно провести час на берегу: один заброс стоит {FISHING_COST_SP.toLocaleString()} SP и{" "}
            {FISHING_COST_ADENA.toLocaleString()} аден. Нужны удочка и наживка. Через час заберите улов — от 100 до 300 рыб.
          </p>
        </div>

        {!session && (
          <div className="px-4 py-3 border-b border-black/70 text-[12px] text-[#cfcfcc]">
            <div className="text-left text-xs space-y-1 mb-4">
              <p className={hasRod ? "text-green-400" : "text-red-400"}>
                {hasRod ? "✓ Удочка надета" : "✗ Наденьте удочку (Baby Duck Rod)"}
              </p>
              <p className={hasBait ? "text-green-400" : "text-red-400"}>
                {hasBait ? `✓ Наживка есть (${baitCount})` : "✗ Нужна наживка (Gludio)"}
              </p>
              <p className={canAfford ? "text-green-400" : "text-red-400"}>
                {canAfford
                  ? `✓ SP: ${sp.toLocaleString()}, Адена: ${adena.toLocaleString()}`
                  : `✗ Нужно ${FISHING_COST_SP.toLocaleString()} SP и ${FISHING_COST_ADENA.toLocaleString()} аден`}
              </p>
            </div>
            <button
              className="w-full py-3 rounded-md bg-[#2a2a2a] ring-1 ring-[#b8860b]/50 text-[#b8860b] hover:bg-[#3a3a3a] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!hasRod || !hasBait || !canAfford || actionLoading}
              onClick={handleStartFishing}
            >
              {actionLoading ? "..." : "Начать рыбалку"}
            </button>
          </div>
        )}

        {session && !ready && (
          <div className="px-4 py-3 border-b border-black/70 space-y-2 text-[12px] text-[#cfcfcc]">
            <p className="text-sm">Рыбалка идёт. Осталось: {remainingStr}</p>
            <p className="text-xs text-gray-500">Вернитесь через час и нажмите «Забрать улов».</p>
          </div>
        )}

        {ready && (
          <div className="px-4 py-3 border-b border-black/70 space-y-3 text-[12px] text-[#cfcfcc]">
            <p className="text-sm text-green-400">Улов готов!</p>
            <p className="text-xs">Рыб: 100–300 (случайно)</p>
            <button
              className="w-full py-3 rounded-md bg-[#2a2a2a] ring-1 ring-green-500/50 text-green-400 hover:bg-[#3a3a3a] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleCollect}
              disabled={actionLoading}
            >
              {actionLoading ? "..." : "Забрать улов"}
            </button>
          </div>
        )}

        <div className="px-4 py-2">
          <button
            className="w-full text-center text-[12px] text-[#ff8c00] hover:text-[#ffa500] underline py-2"
            onClick={() => navigate("/city")}
          >
            Назад
          </button>
        </div>
      </div>
    </div>
  );
}
