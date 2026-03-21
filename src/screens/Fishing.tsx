// src/screens/Fishing.tsx
// Рибалка: повноекранний фон, опис, перевірка удочки/наживки, 1 заброс = 5000 SP + 5M адени, 1 год, улов 100–300 риб
// Сесія зберігається на сервері — один акаунт = одна сесія на всіх пристроях
import React, { useState, useEffect } from "react";
import { useHeroStore } from "../state/heroStore";
import { useCharacterStore } from "../state/characterStore";
import { fetchFishingSession, isFishingReady } from "../state/fishing/fishingPersistence";
import { getFishRangeByRodEnchant } from "../data/fishing/fishingCatchInfo";
import FishingCatchInfoModal from "./character/modals/FishingCatchInfoModal";
import * as api from "../utils/api";
import { showToast } from "../state/toastStore";
import { isUnauthorizedError } from "../utils/isUnauthorizedError";
import { getCityUiVariant } from "../utils/cityUiVariant";

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
  const updateServerState = useHeroStore((s) => s.updateServerState);
  const characterId = useCharacterStore((s) => s.characterId);
  const activeCharacterId = characterId || hero?.id || null;

  const [session, setSessionState] = useState<api.FishingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [showCatchInfoModal, setShowCatchInfoModal] = useState(false);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [catchResult, setCatchResult] = useState<{ fishCount: number, expGained: number } | null>(null);

  const isL2 = getCityUiVariant() === "l2";
  const l2Frame =
    "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.28)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";
  const modalPanel = isL2
    ? "bg-[#14110c] border border-[#5c4a32] rounded-lg p-4 w-full max-w-md shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
    : "bg-[#14110c] border border-white/40 rounded-lg p-4 max-w-md w-full";

  useEffect(() => {
    if (!activeCharacterId) {
      setLoading(false);
      setServerOffsetMs(0);
      return;
    }
    setLoading(true);
    fetchFishingSession(activeCharacterId)
      .then((res) => {
        setSessionState(res.session);
        setServerOffsetMs((res.serverNow ?? Date.now()) - Date.now());
        setLoading(false);
      })
      .catch((err) => {
        if (isUnauthorizedError(err)) {
          setLoading(false);
          return;
        }
        console.error("Failed to load fishing session:", err);
        setSessionState(null);
        setServerOffsetMs(0);
        setLoading(false);
      });
  }, [activeCharacterId]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const equipment = hero?.equipment ?? {};
  const encLevels = hero?.equipmentEnchantLevels ?? {};
  const getSlotId = (slot: string): string | null => {
    const val = equipment[slot];
    if (!val) return null;
    if (typeof val === "string") return val;
    if (val && typeof val === "object" && typeof (val as any).id === "string") return (val as any).id;
    return null;
  };
  const isRod = (id: string | null | undefined) => id === "baby_duck_rod" || id === "shop_baby_duck_rod" || (id && String(id).toLowerCase().includes("rod"));
  const rodSlot =
    isRod(getSlotId("weapon")) ? "weapon" :
    isRod(getSlotId("lrhand")) ? "lrhand" :
    isRod(getSlotId("shield")) ? "shield" :
    isRod(getSlotId("rhand")) ? "rhand" : null;
  const rodEquipped = rodSlot !== null;
  const rodEnchant = rodSlot ? (Number(encLevels[rodSlot]) || 0) : 0;
  const fishRange = getFishRangeByRodEnchant(rodEnchant);
  const inv = Array.isArray(hero?.inventory) ? hero.inventory : [];
  const baitCount = inv
    .filter((i) => i?.id === "gludio_fish_lure" || i?.id === "shop_gludio_fish_lure")
    .reduce((sum, i) => sum + (Number(i.count) || 0), 0);

  const hasRod = rodEquipped;
  const hasBait = baitCount >= 1;
  const sp = hero?.sp ?? 0;
  const adena = hero?.adena ?? 0;
  const canAfford = sp >= FISHING_COST_SP && adena >= FISHING_COST_ADENA;

  const estimatedServerNow = now + serverOffsetMs;
  const ready = session && isFishingReady(session, estimatedServerNow);
  const remainingMs = session && !ready ? Math.max(0, FISHING_DURATION_MS - (estimatedServerNow - session.startedAt)) : 0;
  const remainingStr =
    remainingMs > 0
      ? `${Math.floor(remainingMs / 60000)}:${String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, "0")}`
      : "";

  const handleStartFishing = async () => {
    if (!hero || !activeCharacterId || actionLoading) return;
    const missing = !hasRod || !hasBait || !canAfford;
    if (missing) {
      setShowRequirementsModal(true);
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.startFishing(activeCharacterId);
      setSessionState(res.session);
      setServerOffsetMs((res.serverNow ?? Date.now()) - Date.now());
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
      if (isUnauthorizedError(e)) {
        showToast("Сессия истекла. Войдите снова.", "error");
        navigate("/");
        return;
      }
      showToast(e?.message || e?.error || "Не удалось начать рыбалку", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCollect = async () => {
    if (!hero || !activeCharacterId || !ready || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await api.collectFishing(activeCharacterId);
      setSessionState(null);
      const hj = res.character.heroJson as any;
      const newRev = hj?.heroRevision;
      if (newRev != null) updateServerState({ heroRevision: newRev });
      updateHero({
        level: Number(res.character.level ?? hero.level ?? 1),
        exp: res.character.exp,
        inventory: hj?.inventory ?? hero.inventory ?? [],
        heroJson: { ...(hero as any).heroJson, ...hj, fishingSession: undefined },
      });
      setCatchResult({ fishCount: res.fishCount, expGained: res.expGained || 0 });
    } catch (e: any) {
      if (isUnauthorizedError(e)) {
        showToast("Сессия истекла. Войдите снова.", "error");
        navigate("/");
        return;
      }
      showToast(e?.message || e?.error || "Не удалось забрать улов", "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (!hero) {
    return (
      <div
        className={
          isL2
            ? `${l2Frame} w-full min-w-0 my-1 flex items-center justify-center min-h-[40vh] text-[#8a7a60] text-sm gap-2`
            : "flex items-center justify-center min-h-[40vh] text-[#b8860b]"
        }
      >
        {isL2 && (
          <span className="w-4 h-4 border-2 border-[#5c4a32] border-t-[#c7ad80] rounded-full animate-spin shrink-0" />
        )}
        Загрузка...
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={
          isL2
            ? `${l2Frame} w-full min-w-0 my-1 flex items-center justify-center min-h-[40vh] text-[#8a7a60] text-sm gap-2`
            : "flex items-center justify-center min-h-[40vh] text-[#b8860b]"
        }
      >
        {isL2 && (
          <span className="w-4 h-4 border-2 border-[#5c4a32] border-t-[#c7ad80] rounded-full animate-spin shrink-0" />
        )}
        Загрузка сессии...
      </div>
    );
  }

  return (
    <div
      className={
        isL2
          ? `${l2Frame} w-full min-w-0 my-1 px-3 py-3 text-[#d4c4a8]`
          : "w-full text-white px-4 py-2"
      }
    >
      <div className={isL2 ? "max-w-[420px] mx-auto w-full" : "w-full max-w-[360px] mx-auto"}>
        <div className="space-y-3">
          <div className={isL2 ? "border-t border-[#5c4a32]/45" : "border-t border-white/50"}></div>
          <div
            className={`text-center text-[16px] font-semibold ${
              isL2 ? "text-[#e8c56e] [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]" : ""
            }`}
            style={isL2 ? undefined : { color: "#4488ff" }}
          >
            Рыбалка
          </div>
          <div className="border-t-2" style={{ borderColor: "#c7ad80" }}></div>
          <button
            onClick={() => setShowCatchInfoModal(true)}
            className="w-full py-2 rounded border border-[#c7ad80]/60 text-[#c7ad80] hover:bg-[#c7ad80]/20 text-sm"
          >
            Информация об улове
          </button>
          {showCatchInfoModal && <FishingCatchInfoModal onClose={() => setShowCatchInfoModal(false)} />}
          {showRequirementsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => setShowRequirementsModal(false)}>
              <div
                className={modalPanel}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[#b8860b]">Чого не вистачає</h2>
                  <button className="text-gray-400 hover:text-white text-xl" onClick={() => setShowRequirementsModal(false)}>×</button>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Удочка:</span>
                    <span className={hasRod ? "text-green-400" : "text-red-400"}>
                      {hasRod ? "✓ є" : "✗ немає"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Наживка:</span>
                    <span className={hasBait ? "text-green-400" : "text-red-400"}>
                      {hasBait ? `✓ є (${baitCount})` : "✗ немає"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-gray-300">SP:</span>
                    <span className={`text-right ${sp >= FISHING_COST_SP ? "text-green-400" : "text-red-400"}`}>
                      {sp.toLocaleString()} / {FISHING_COST_SP.toLocaleString()}
                      {sp >= FISHING_COST_SP ? " ✓" : " ✗"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-gray-300">Адена:</span>
                    <span className={`text-right ${adena >= FISHING_COST_ADENA ? "text-green-400" : "text-red-400"}`}>
                      {adena.toLocaleString()} / {FISHING_COST_ADENA.toLocaleString()}
                      {adena >= FISHING_COST_ADENA ? " ✓" : " ✗"}
                    </span>
                  </div>
                </div>
                <div className={`mt-4 pt-3 border-t ${isL2 ? "border-[#5c4a32]/50" : "border-white/30"}`}>
                  <p className="text-xs text-[#c7ad80] mb-2">Не вистачає:</p>
                  <ul className="text-xs text-red-400 space-y-1">
                    {!hasRod && <li>• Удочка (Baby Duck Rod) — надіньте в слот зброї</li>}
                    {!hasBait && <li>• Наживка (Gludio Fish Lure) — купіть у магазині</li>}
                    {sp < FISHING_COST_SP && <li>• SP — потрібно ще {(FISHING_COST_SP - sp).toLocaleString()}</li>}
                    {adena < FISHING_COST_ADENA && <li>• Адена — потрібно ще {(FISHING_COST_ADENA - adena).toLocaleString()}</li>}
                  </ul>
                </div>
                <div className={`flex justify-center pt-4 mt-4 border-t ${isL2 ? "border-[#5c4a32]/50" : "border-white/50"}`}>
                  <button
                    onClick={() => setShowRequirementsModal(false)}
                    className="px-4 py-2 rounded-md bg-[#2a2a2a] ring-1 ring-white/10 text-xs text-[#b8860b] hover:bg-[#3a3a3a]"
                  >
                    Закрити
                  </button>
                </div>
              </div>
            </div>
          )}
          <p
            className={`text-xs text-left ${isL2 ? "text-[#a89878]" : ""}`}
            style={isL2 ? undefined : { color: "#c7ad80" }}
          >
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

        {!session && !catchResult && (
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
              disabled={actionLoading}
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

        {catchResult && (
          <div className="space-y-3 text-[12px] text-center bg-[#1a1a1a] p-4 rounded border border-[#c7ad80]/50">
            <p className="text-green-400 font-bold">Вы выловили {catchResult.fishCount} рыб!</p>
            {catchResult.expGained > 0 && (
              <p className="text-gray-400">
                вы получили <span className="text-yellow-400">{catchResult.expGained.toLocaleString()}</span> опыта
              </p>
            )}
            <button
              className="w-full py-2 mt-2 rounded-md bg-[#2a2a2a] ring-1 ring-[#c7ad80]/50 text-[#c7ad80] hover:bg-[#3a3a3a]"
              onClick={() => setCatchResult(null)}
            >
              Продолжить
            </button>
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
              className={
                isL2
                  ? "text-sm text-[#b85c4c] cursor-pointer hover:text-[#d4786a]"
                  : "text-sm text-red-600 cursor-pointer hover:text-red-500"
              }
            >
              В город
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
