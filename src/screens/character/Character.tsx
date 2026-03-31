import React, { useState, useEffect } from "react";
import { useHeroStore } from "../../state/heroStore";
import { useCharacterStore } from "../../state/characterStore";
import { getProfessionDefinition, normalizeProfessionId } from "../../data/skills";
import { getExpToNext, EXP_TABLE, MAX_LEVEL } from "../../data/expTable";
import CharacterEquipmentFrame from "./CharacterEquipmentFrame";
import RecipeBookButton from "./RecipeBookButton";
import CharacterBuffs from "./CharacterBuffs";
import SevenSealsBonusModal from "../../components/SevenSealsBonusModal";
import { getActiveSevenSealsRank, getSevenSealsBonusFromHero } from "../../utils/sevenSealsBonus";
import { listCharacters, getSevenSealsRank, claimSevenSealsReward, type Character } from "../../utils/api";
import { loadHeroFromAPI } from "../../state/heroStore/heroLoadAPI";
import { isPremiumActive } from "../../utils/premium/isPremiumActive";
import { useCityUiVariant } from "../../utils/cityUiVariant";
import { showToast } from "../../state/toastStore";
// Форматирование чисел (как в City)
const formatNumber = (num: number) => {
  return num.toLocaleString("ru-RU");
};

function raceLabelRu(race: string): string {
  const r = String(race || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "");
  const map: Record<string, string> = {
    human: "Человек",
    elf: "Эльф",
    elven: "Эльф",
    darkelf: "Тёмный эльф",
    dark: "Тёмный эльф",
    dwarf: "Гном",
    dwarven: "Гном",
    orc: "Орк",
  };
  return map[r] || race || "—";
}

interface CharacterProps {
  navigate?: (path: string) => void;
}

export default function Character({ navigate: navigateProp }: CharacterProps = {}) {
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);

  const navigate = navigateProp ?? ((path: string) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  });

  const cityUi = useCityUiVariant();
  const isL2 = cityUi === "l2";

  const l2MenuMark = isL2 ? (
    <span
      className="w-4 shrink-0 text-center text-[10px] leading-none text-[#ddbf7a] [text-shadow:0_1px_2px_rgba(0,0,0,0.95)]"
      aria-hidden
    >
      ✧
    </span>
  ) : null;

  const l2Frame =
    "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.28)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";

  const l2RowBase =
    "w-full text-left text-[12px] py-2.5 px-3 mb-2 rounded-md flex items-center gap-2.5 bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#7a6548]/85 shadow-[inset_0_1px_0_rgba(199,173,128,0.14),0_4px_14px_rgba(0,0,0,0.55),0_0_12px_rgba(184,134,11,0.1)]";

  const svcBtn = (classes: string) =>
    isL2
      ? `${l2RowBase} hover:border-[#c7ad80]/50 hover:brightness-110 active:scale-[0.99] transition-[border-color,transform,filter] duration-150 ${classes}`
      : `w-full text-left text-[12px] py-1.5 border-b border-solid border-[#c7ad80]/60 flex items-center gap-2 ${classes}`;

  const infoRow = (classes: string) =>
    isL2 ? `${l2RowBase} ${classes}` : `border-b border-solid border-[#c7ad80]/60 pb-1 mb-1 flex items-center gap-2 w-full ${classes}`;

  const ico = isL2 ? "w-4 h-4 object-contain shrink-0" : "w-3 h-3 object-contain shrink-0";

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [characterData, setCharacterData] = useState<Character | null>(null);
  const [sevenSealsRank, setSevenSealsRank] = useState<number | null>(null);
  const [showSevenSealsModal, setShowSevenSealsModal] = useState(false);

  const characterId = useCharacterStore((s) => s.characterId);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") !== "quests") return;
    params.delete("tab");
    const qs = params.toString();
    const base = window.location.pathname + (qs ? `?${qs}` : "");
    window.history.replaceState({}, "", base);
    window.history.pushState({}, "", "/quests");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  const sevenSealsBonus = getSevenSealsBonusFromHero(hero);
  const sevenSealsRankFromHero = getActiveSevenSealsRank(sevenSealsBonus);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!characterId || !hero) return;
      try {
        const data = await getSevenSealsRank(characterId);
        if (cancelled) return;
        const claimed =
          data.rank != null && data.rank >= 1 && data.rank <= 3 ? data.rank : null;
        setSevenSealsRank(claimed ?? sevenSealsRankFromHero ?? null);
        if (data.canClaimLastWeek) {
          try {
            const claimRes = await claimSevenSealsReward(characterId);
            if (claimRes.ok && !claimRes.alreadyClaimed) {
              const loadedHero = await loadHeroFromAPI();
              if (loadedHero && !cancelled) useHeroStore.getState().setHero(loadedHero);
              const b = claimRes.bonus;
              if (b && typeof b.pAtk === "number" && !cancelled) {
                const r = b.rank ?? data.rank ?? "?";
                const col = b.coinLuck ?? 0;
                showToast(
                  `7 Печатей, ${r} місце: нараховано бонус — фіз. атака +${b.pAtk}, маг. атака +${b.mAtk}, фіз. захист +${b.pDef}, маг. захист +${b.mDef}, CoL +${col}.`,
                  "success"
                );
              }
            }
          } catch {
            // ignore claim errors
          }
        }
      } catch {
        if (!cancelled) {
          setSevenSealsRank(sevenSealsRankFromHero ?? null);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [characterId, hero?.name, sevenSealsRankFromHero]);

  // Завантажуємо Character для отримання createdAt
  useEffect(() => {
    const loadCharacter = async () => {
      try {
        const characters = await listCharacters();
        const currentChar = characters.find(c => c.name === hero?.name);
        if (currentChar) {
          setCharacterData(currentChar);
        }
      } catch (err) {
        console.error('[Character] Failed to load character data:', err);
      }
    };
    if (hero?.name) {
      loadCharacter();
    }
  }, [hero?.name]);

  // -----------------------------
  // Локальні значення з hero
  // -----------------------------
  const nickname = hero?.name || "";
  const level = hero?.level || 1;
  const race = hero?.race || "";
  const gender = hero?.gender || "";
  const status = hero?.status || "";
  const profession = hero?.profession || "";
  const adena = hero?.adena || 0;
  const coins = hero?.coinOfLuck || 0;
  const silverCoins = hero?.coins_silver ?? 0;
  const classLabel = (() => {
    const profId = normalizeProfessionId(profession as any);
    const profDef = profId ? getProfessionDefinition(profId) : null;
    return profDef?.label || profession || "—";
  })();

  // -----------------------------
  // EXP calculation
  // -----------------------------
  // В проекті hero.exp — прогрес у межах поточного рівня (не cumulative).
  const expCurrent = Math.max(0, Number(hero?.exp ?? 0));
  // EXP needed for next level (дельта до наступного лвл)
  const expToNext = getExpToNext(level);
  // Друге число: всього потрібно за рівень (для макс. лвл — поріг 5e9)
  const expToNextDisplay = level >= MAX_LEVEL 
    ? (EXP_TABLE[MAX_LEVEL - 1] ?? 0) 
    : expToNext;
  // Перше число: поточний досвід
  const expCurrentDisplay = level >= MAX_LEVEL ? expToNextDisplay : expCurrent;
  const expPercent = expToNextDisplay > 0 
    ? Math.min(100, Math.floor((expCurrent / expToNextDisplay) * 100)) 
    : 100;

  // -----------------------------
  // Statistics from heroJson
  // -----------------------------
  const heroJson = (hero as any)?.heroJson || {};
  const stats = typeof heroJson === 'object' ? heroJson : {};
  const karma = stats.karma || 0;
  const pk = stats.pk || 0;
  // 🔥 mobsKilled може бути як в hero, так і в heroJson - перевіряємо обидва місця
  const mobsKilled = (hero as any)?.mobsKilled ?? stats.mobsKilled ?? stats.mobs_killed ?? stats.killedMobs ?? stats.totalKills ?? 0;
  const pvpWins = stats.pvpWins || stats.pvp_wins || 0;
  const pvpLosses = stats.pvpLosses || stats.pvp_losses || 0;
  
  // Date of registration - get from characterData or stats
  const registrationDate = characterData?.createdAt || stats.registrationDate || stats.createdAt || null;

  // -----------------------------
  // SP
  // -----------------------------
  const sp = Number(hero?.sp ?? stats.sp ?? 0) || 0;

  // -----------------------------
  // Сохранение статуса
  // -----------------------------
  const saveStatus = () => {
    updateHero({ status: newStatus });
    setShowStatusModal(false);
  };

  if (!hero)
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
        <div className="w-5 h-5 border-2 border-[#5c4a32] border-t-[#c7ad80] rounded-full animate-spin" />
      </div>
    );

  const topBtn =
    isL2
      ? "w-[76px] h-[26px] rounded-md border border-[#8a734f]/90 bg-gradient-to-b from-[#3d3224] via-[#252016] to-[#100d0a] text-[10px] font-semibold text-[#f0e6d4] leading-none shadow-[inset_0_1px_0_rgba(255,230,190,0.2),0_4px_10px_rgba(0,0,0,0.45)] hover:border-[#d4af37]/55 hover:brightness-110 active:scale-[0.99] transition-[border-color,transform,filter] duration-150"
      : "w-[76px] h-[22px] rounded-md border border-[#c7ad80] bg-[#1f1d1a]/80 text-[12px] text-[#e7d7b3] leading-none shadow-[inset_0_0_8px_rgba(0,0,0,0.75)] hover:bg-[#2a2723]/80 active:translate-y-[1px]";

  return (
    <div
      className={
        isL2
          ? `${l2Frame} w-full min-w-0 my-1 flex flex-col items-center text-[#e8dcc8]`
          : "w-full flex flex-col items-center text-white"
      }
    >
      <div
        className={
          isL2
            ? "flex flex-col items-center relative w-full max-w-[420px] mx-auto px-3 pt-3 pb-2"
            : "flex flex-col items-center relative"
        }
        style={
          isL2
            ? undefined
            : {
                width: "360px",
                paddingTop: "10px",
                paddingBottom: "10px",
              }
        }
      >
        {/* ВЕРХ — МОЙ ПЕРСОНАЖ + КНОПКИ */}
        <div
          className={
            isL2
              ? "w-full mb-3 rounded-lg border border-[#c9a44c]/40 bg-black/35 p-3 shadow-[inset_0_1px_0_rgba(255,220,180,0.08),0_0_24px_rgba(184,134,11,0.12)]"
              : "w-full px-3 mb-1 mt-0"
          }
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div
                className={
                  isL2
                    ? "text-[14px] font-bold text-[#e8c56e] [text-shadow:0_1px_2px_rgba(0,0,0,0.95),0_0_16px_rgba(184,134,11,0.4)] leading-tight tracking-wide"
                    : "text-[12px] font-semibold text-[#d6c29a] leading-none"
                }
              >
                Мой персонаж
              </div>
              {isL2 && (
                <p className="text-[11px] text-[#e8dcc8] mt-2 leading-snug">
                  <span className="text-[#d4b878]">
                    {raceLabelRu(race)} – {level} – {classLabel}
                  </span>
                  {gender ? (
                    <span className="text-[#8a7a60]">
                      {" "}
                      ({gender.toLowerCase() === "female" ? "Ж" : "М"})
                    </span>
                  ) : null}
                </p>
              )}
              {!isL2 && (
                <>
                  {isPremiumActive(hero) && (
                    <div className="text-[11px] text-[#22c55e] mt-1">
                      включен премиум аккаунт х2
                    </div>
                  )}
                  <div className="h-px bg-[#6b5b3f]/60 mt-2" />
                </>
              )}
              {isL2 && isPremiumActive(hero) && (
                <div className="text-[11px] text-[#22c55e] mt-1.5">
                  включен премиум аккаунт х2
                </div>
              )}
              {isL2 && <div className="h-px bg-[#5c4a32]/55 mt-2.5" />}
            </div>
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              {isL2 ? (
                <>
                  <button type="button" onClick={() => navigate("/warehouse")} className={topBtn}>
                    Склад
                  </button>
                  <button type="button" onClick={() => navigate("/about")} className={topBtn}>
                    Меню
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = "/";
                    }}
                    className={topBtn}
                  >
                    Выход
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = "/";
                    }}
                    className={topBtn}
                  >
                    Выход
                  </button>
                  <button type="button" onClick={() => navigate("/about")} className={topBtn}>
                    Меню
                  </button>
                </>
              )}
            </div>
          </div>

          <div
            className={
              isL2
                ? "border-t border-[#5c4a32]/40 pt-2 pb-1 mt-3"
                : "border-t border-solid border-[#c7ad80]/60 pt-2 pb-2 mt-2"
            }
          >
            <div className={`text-xs ${isL2 ? "text-[#d4c4a8]" : "text-[#d4c4a8]"}`}>
              Статус:{" "}
              {status ? (
                <span className="text-[#f0d78c]">{status}</span>
              ) : isL2 ? (
                <span className="text-red-400/95 font-medium">off</span>
              ) : (
                <span className="text-[#8a7a60]">нет</span>
              )}
              <button
                className="text-[#c45c5c] underline ml-1 text-[10px] hover:text-[#f4a4a4]"
                onClick={() => {
                  setNewStatus(status);
                  setShowStatusModal(true);
                }}
              >
                ред
              </button>
            </div>
            {!isL2 && (
              <div className="text-[11px] text-yellow-300 mt-1 border-t border-solid border-[#c7ad80]/60 pt-1">
                Профессия: {classLabel === "—" ? "Нет" : classLabel}
              </div>
            )}
            {isL2 ? (
              <div className="mt-2 border-t border-[#5c4a32]/35 pt-2">
                <CharacterBuffs />
              </div>
            ) : (
              <>
                <CharacterBuffs />
              </>
            )}
          </div>
          {!isL2 && <div className="border-b border-solid border-[#c7ad80]/60" />}
        </div>

        <CharacterEquipmentFrame allowUnequip={false} marginTop="8px" />

        <div
          className={
            isL2
              ? "w-full border-t border-[#c7ad80]/20 mt-2 mb-1"
              : "w-full border-t-2 border-solid border-[#c7ad80]/70 mt-1"
          }
        />

        <div
          className={
            isL2
              ? "w-full text-left text-[12px] mt-1 text-[#d4c4a8]"
              : "w-[330px] text-left text-[12px] text-[#c7ad80] mt-1 space-y-1"
          }
        >
          {isL2 && (
            <div className={infoRow("text-[12px]")}>
              {l2MenuMark}
              <span>
                Уровень: <span className="text-[#f0d78c] tabular-nums">{level}</span>
              </span>
            </div>
          )}
          <div className={infoRow("text-[12px]")}>
            <img src="/icons/adena.png" alt="Adena" className={ico} />
            <span>
              Аденa: <span className="text-[#f0d78c]">{formatNumber(adena)}</span>
            </span>
          </div>
          <div className={infoRow("text-[12px]")}>
            <img src="/icons/col (1).png" alt="Coin of Luck" className={ico} />
            <span>
              Coin of Luck: <span className="text-[#f0d78c]">{coins}</span>
            </span>
          </div>
          <div className={infoRow("text-[12px]")}>
            <img
              src="/items/drops/resources/etc_coins_silver_i00.png"
              alt="Серебряные Монеты"
              className={ico}
            />
            <span>
              Серебряные Монеты: <span className="text-[#f0d78c]">{silverCoins}</span>
            </span>
          </div>

          {isL2 ? (
            <div className={`${l2RowBase} flex flex-col items-stretch gap-1.5 text-[12px]`}>
              <div className="flex items-center gap-2 w-full">
                <img src="/icons/star.png" alt="Experience" className={ico} />
                <span className="min-w-0">
                  Опыт:{" "}
                  <span className="text-[#e8a85c]">{formatNumber(expCurrentDisplay)}</span> /{" "}
                  <span className="text-[#9d8265]">{formatNumber(expToNextDisplay)}</span>
                  <span className="text-[#8a7a60] ml-1">({expPercent}%)</span>
                </span>
              </div>
              <div className="pl-6 w-full">
                <div className="h-2 rounded overflow-hidden bg-black/55 border border-[#2a241c] shadow-[inset_0_1px_3px_rgba(0,0,0,0.55)]">
                  <div
                    className="h-full bg-gradient-to-r from-[#5c4018] via-[#c9a44c] to-[#fce9a8]"
                    style={{ width: `${expPercent}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className={infoRow("text-[12px]")}>
              <img src="/icons/star.png" alt="Experience" className={ico} />
              <span>
                Опыт:{" "}
                <span className="text-[#e8a85c]">{formatNumber(expCurrentDisplay)}</span> /{" "}
                <span className="text-[#9d8265]">{formatNumber(expToNextDisplay)}</span>
              </span>
            </div>
          )}

          <div className={infoRow("text-[12px]")}>
            <img src="/icons/news.png" alt="SP" className={ico} />
            <span>
              SP: <span className="text-[#a8c4a0]">{formatNumber(sp)}</span>
            </span>
          </div>

          {isL2 && (
            <div className={infoRow("text-[12px]")}>
              {l2MenuMark}
              <span>
                Класс:{" "}
                <span className="text-[#d4b878]">
                  {(() => {
                    const profId = normalizeProfessionId(profession as any);
                    const profDef = profId ? getProfessionDefinition(profId) : null;
                    return profDef?.label || profession || "—";
                  })()}
                </span>
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate("/stats")}
            className={svcBtn("text-[#c9a44c] hover:text-[#f4e2b8]")}
          >
            {l2MenuMark}
            <img src="/icons/rate.png" alt="Characteristics" className={ico} />
            <span>Характеристики</span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/learned-skills")}
            className={svcBtn("text-[#c9a44c] hover:text-[#f4e2b8]")}
          >
            {l2MenuMark}
            <img src="/icons/news.png" alt="Skills" className={ico} />
            <span>Умения</span>
          </button>
          <RecipeBookButton
            navigate={navigate}
            className={isL2 ? svcBtn("text-[#c9a44c] hover:text-[#f4e2b8]") : undefined}
          />
          <button
            type="button"
            onClick={() => navigate("/quests")}
            className={svcBtn("text-[#c9a44c] hover:text-[#f4e2b8]")}
          >
            {l2MenuMark}
            <img src="/icons/news.png" alt="Quests" className={ico} />
            <span>Мои квесты</span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/achievements")}
            className={svcBtn("text-[#c9a44c] hover:text-[#f4e2b8]")}
          >
            {l2MenuMark}
            <img src="/icons/star.png" alt="Achievements" className={ico} />
            <span>Достижения</span>
          </button>

          <div className={infoRow("text-[12px] text-[#a89878]")}>
            <img src="/icons/rate.png" alt="Ratings" className={ico} />
            <span>Рейтинги</span>
          </div>
          {sevenSealsRank !== null && (
            <button
              type="button"
              onClick={() => setShowSevenSealsModal(true)}
              className={svcBtn("text-left")}
            >
              {l2MenuMark}
              <span
                className={
                  sevenSealsRank === 1
                    ? "text-[#f0d78c]"
                    : sevenSealsRank === 2
                      ? "text-[#c8beb0]"
                      : "text-[#d4a574]"
                }
              >
                Победитель 7 печатей ({sevenSealsRank} место)
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate("/daily-quests")}
            className={svcBtn("text-[#7d9b7a] hover:text-[#c8e4c4]")}
          >
            {l2MenuMark}
            <img src="/icons/battles.png" alt="Daily Quests" className={ico} />
            <span>Ежедневные задания</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/premium-account")}
            className={svcBtn("text-[#d4b88a] hover:text-[#f4e8d4]")}
          >
            {l2MenuMark}
            <img src="/icons/coin.png" alt="Premium" className={ico} />
            <span>Премиум аккаунт (ускоренная прокачка)</span>
          </button>
        </div>

        <div
          className={
            isL2
              ? "w-full text-left text-[11px] mt-3 rounded-lg border border-[#5c4a32]/45 bg-black/18 p-3 text-[#c7ad80] shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]"
              : "w-[330px] text-left text-[11px] text-[#c7ad80] mt-2 border-t-2 border-solid border-[#c7ad80]/70 pt-2"
          }
        >
          <div
            className={
              isL2
                ? "font-semibold mb-2 text-[12px] text-[#e8c56e]"
                : "font-semibold mb-2"
            }
          >
            Социальный статус
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] text-[#d4c4a8]">
            <div className="flex justify-between gap-2">
              <span>Карма</span>
              <span className={karma >= 0 ? "text-green-400" : "text-red-400"}>{karma}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>Рек.</span>
              <span>0</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>PK</span>
              <span className={pk === 0 ? "text-green-400" : "text-red-400"}>{pk}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>Ост. рек.</span>
              <span>0</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>Убил мобов</span>
              <span>{mobsKilled}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>PvP побед/поражений</span>
              <span className={pvpWins > pvpLosses ? "text-green-400" : "text-gray-400"}>
                {pvpWins}/{pvpLosses}
              </span>
            </div>
          </div>
          {registrationDate && (
            <div className="mt-2 text-[#8a7a60] text-[10px]">
              Рег-я:{" "}
              {new Date(registrationDate).toLocaleDateString("ru-RU", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })}
            </div>
          )}
        </div>

      </div>

      {showSevenSealsModal && sevenSealsRank !== null && (
        <SevenSealsBonusModal
          rank={sevenSealsRank as 1 | 2 | 3}
          playerName={nickname}
          bonus={getSevenSealsBonusFromHero(hero) as { pAtk: number; mAtk: number; pDef: number; mDef: number; coinLuck?: number } | undefined}
          onClose={() => setShowSevenSealsModal(false)}
        />
      )}

      {showStatusModal && (
        <div className="fixed inset-0 bg-black/65 flex items-center justify-center z-50">
          <div
            className={
              isL2
                ? "rounded-xl border border-[#c7ad80]/40 p-4 shadow-[0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(120,90,45,0.22)_0%,transparent_55%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]"
                : "bg-[#14110c] border border-[#c7ad80] rounded-lg p-4"
            }
            style={{ width: "260px" }}
          >
            <div
              className={
                isL2
                  ? "text-[#e8c56e] font-bold text-sm text-center mb-2 [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]"
                  : "text-yellow-400 font-bold text-sm text-center mb-2"
              }
            >
              Новый статус
            </div>

            <input
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full bg-black/80 text-[#e8dcc8] border border-[#5c4a32]/70 focus:border-[#c7ad80]/50 p-1.5 text-sm mb-3 rounded outline-none"
              placeholder="Введите статус..."
            />

            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={saveStatus}
                className="bg-green-800/90 text-white text-[11px] py-1.5 px-4 rounded-md border border-green-700/50 hover:brightness-110"
              >
                Сохранить
              </button>
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="bg-[#2a2620] text-[#d4c4a8] text-[11px] py-1.5 px-4 rounded-md border border-[#5c4a32]/70 hover:border-[#c7ad80]/40"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
