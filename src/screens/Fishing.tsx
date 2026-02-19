// src/screens/Fishing.tsx
// Рибалка: повноекранний фон, опис, перевірка удочки/наживки, 1 заброс = 5000 SP + 5M адени, 1 год, улов 100–300 риб
import React, { useState, useEffect } from "react";
import { useHeroStore } from "../state/heroStore";
import { useCharacterStore } from "../state/characterStore";
import {
  getFishingSession,
  setFishingSession,
  isFishingReady,
  getOrRollFishCount,
} from "../state/fishing/fishingPersistence";
import { itemsDB } from "../data/items/itemsDB";

const FISHING_COST_SP = 5000;
const FISHING_COST_ADENA = 5_000_000;
const FISHING_DURATION_MS = 60 * 60 * 1000;
const ROD_ITEM_ID = "baby_duck_rod";
const BAIT_ITEM_ID = "gludio_fish_lure";
const FISH_ITEM_ID = "fish_seawater";
const FISH_ICON = "/items/drops/resources/Etc_fish_seawater_i01_0.jpg";

type Navigate = (path: string) => void;

interface FishingProps {
  navigate: Navigate;
}

export default function Fishing({ navigate }: FishingProps) {
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);
  const characterId = useCharacterStore((s) => s.characterId);

  const [session, setSessionState] = useState<ReturnType<typeof getFishingSession>>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!characterId) return;
    setSessionState(getFishingSession(characterId));
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
  const fishCount = ready && characterId ? getOrRollFishCount(characterId) : 0;
  const remainingMs = session && !ready ? Math.max(0, FISHING_DURATION_MS - (now - session.startedAt)) : 0;
  const remainingStr =
    remainingMs > 0
      ? `${Math.floor(remainingMs / 60000)}:${String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, "0")}`
      : "";

  const handleStartFishing = () => {
    if (!hero || !characterId) return;
    if (!hasRod) {
      alert("Потрібна удочка! Надіньте удочку (Baby Duck Rod) в слот зброї.");
      return;
    }
    if (!hasBait) {
      alert("Потрібна наживка! Купіть наживку (Gludio) в магазині.");
      return;
    }
    if (!canAfford) {
      alert(
        `Недостатньо ресурсів. Потрібно: ${FISHING_COST_SP.toLocaleString()} SP та ${FISHING_COST_ADENA.toLocaleString()} адени.`
      );
      return;
    }
    const baitIndex = inv.findIndex((i) => i.id === BAIT_ITEM_ID && (i.count ?? 0) > 0);
    if (baitIndex < 0) return;
    const newInv = inv.map((item, idx) => {
      if (idx !== baitIndex) return item;
      const c = (item.count ?? 1) - 1;
      return c > 0 ? { ...item, count: c } : null;
    }).filter(Boolean) as typeof inv;
    setFishingSession(characterId, { startedAt: Date.now() });
    setSessionState(getFishingSession(characterId));
    updateHero({
      sp: sp - FISHING_COST_SP,
      adena: adena - FISHING_COST_ADENA,
      inventory: newInv,
    });
  };

  const handleCollect = () => {
    if (!hero || !characterId || fishCount <= 0) return;
    const fishDef = itemsDB[FISH_ITEM_ID];
    const name = fishDef?.name ?? "Морська риба";
    const icon = fishDef?.icon ?? FISH_ICON;
    const slot = fishDef?.slot ?? "resource";
    const existing = inv.find((i) => i.id === FISH_ITEM_ID);
    const newInv = existing
      ? inv.map((i) => (i.id === FISH_ITEM_ID ? { ...i, count: (i.count ?? 0) + fishCount } : i))
      : [...inv, { id: FISH_ITEM_ID, name, icon, slot, count: fishCount }];
    setFishingSession(characterId, null);
    setSessionState(null);
    updateHero({ inventory: newInv });
  };

  if (!hero) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-[#b8860b]">
        Загрузка...
      </div>
    );
  }

  return (
    <div className="w-full text-[#b8860b] px-2 pb-4 flex flex-col items-center">
      {/* Картинка на весь екран для сторінки — фон задається Layout customBackground="/icons/fishing.jpg" */}

      <div className="w-full max-w-[360px] rounded-lg border border-[#c7ad80]/40 bg-black/50 p-4 text-center">
        <h1 className="text-lg font-semibold text-[#b8860b] border-b border-white/30 pb-2 mb-3">
          Рибалка
        </h1>

        <p className="text-xs text-gray-300 text-left mb-4">
          Тут можна провести годину на березі: один заброс коштує {FISHING_COST_SP.toLocaleString()} SP та{" "}
          {FISHING_COST_ADENA.toLocaleString()} адени. Потрібні удочка та наживка. Після години збирай улов — від 100 до 300 риб.
        </p>

        {!session && (
          <>
            <div className="text-left text-xs space-y-1 mb-4">
              <p className={hasRod ? "text-green-400" : "text-red-400"}>
                {hasRod ? "✓ Удочка надіта" : "✗ Надіньте удочку (Baby Duck Rod)"}
              </p>
              <p className={hasBait ? "text-green-400" : "text-red-400"}>
                {hasBait ? `✓ Наживка є (${baitCount})` : "✗ Потрібна наживка (Gludio)"}
              </p>
              <p className={canAfford ? "text-green-400" : "text-red-400"}>
                {canAfford
                  ? `✓ SP: ${sp.toLocaleString()}, Адена: ${adena.toLocaleString()}`
                  : `✗ Потрібно ${FISHING_COST_SP.toLocaleString()} SP та ${FISHING_COST_ADENA.toLocaleString()} адени`}
              </p>
            </div>
            <button
              className="w-full py-3 rounded-md bg-[#2a2a2a] ring-1 ring-[#b8860b]/50 text-[#b8860b] hover:bg-[#3a3a3a] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!hasRod || !hasBait || !canAfford}
              onClick={handleStartFishing}
            >
              Начать рыбалку
            </button>
          </>
        )}

        {session && !ready && (
          <div className="space-y-2">
            <p className="text-sm text-gray-300">Рибалка йде. Залишилось: {remainingStr}</p>
            <p className="text-xs text-gray-500">Поверніться через годину та натисніть «Забрать улов».</p>
          </div>
        )}

        {ready && fishCount > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-green-400">Улов готовий!</p>
            <p className="text-xs text-gray-300">
              Риб: <span className="text-[#b8860b] font-semibold">{fishCount}</span>
            </p>
            <button
              className="w-full py-3 rounded-md bg-[#2a2a2a] ring-1 ring-green-500/50 text-green-400 hover:bg-[#3a3a3a]"
              onClick={handleCollect}
            >
              Забрать улов
            </button>
          </div>
        )}
      </div>

      <div className="mt-4">
        <button
          className="text-xs text-gray-400 hover:text-[#b8860b] underline"
          onClick={() => navigate("/city")}
        >
          Назад
        </button>
      </div>
    </div>
  );
}
