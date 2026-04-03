// src/screens/location/LocationQuestHelperBanners.tsx
import React from "react";

export type LocationFirstProfHelperKey =
  | "elvenMystic"
  | "elvenFighter"
  | "humanFighter"
  | "humanMystic"
  | "orcFighter"
  | "orcMystic"
  | "dwarvenFighter"
  | "darkFighter"
  | "darkMystic";

const FIRST_PROF_ORDER: LocationFirstProfHelperKey[] = [
  "elvenMystic",
  "elvenFighter",
  "humanFighter",
  "humanMystic",
  "orcFighter",
  "orcMystic",
  "dwarvenFighter",
  "darkFighter",
  "darkMystic",
];

const FIRST_PROF_STORAGE: Record<LocationFirstProfHelperKey, string> = {
  elvenMystic: "elven_mystic_first_prof_helper_18",
  elvenFighter: "elven_fighter_first_prof_helper_18",
  humanFighter: "human_fighter_first_prof_helper_18_gludin",
  humanMystic: "human_mystic_first_prof_helper_18_gludin",
  orcFighter: "orc_fighter_first_prof_helper_18_gludin",
  orcMystic: "orc_mystic_first_prof_helper_18_gludin",
  dwarvenFighter: "dwarven_fighter_first_prof_helper_18_gludin",
  darkFighter: "dark_fighter_first_prof_helper_18_floran",
  darkMystic: "dark_mystic_first_prof_helper_18_floran",
};

const FIRST_PROF_BODY: Record<LocationFirstProfHelperKey, React.ReactNode> = {
  elvenMystic: (
    <>
      Вы достигли 18 ур. «Путь мага Эльфов — отзвуки стихий»: квестовые эссенции с Lirein, Will-O-Wisp и Undine в
      окрестностях <span className="font-semibold">Floran Village</span> — метка «квест · добыча» в списке мобов.
    </>
  ),
  elvenFighter: (
    <>
      Вы достигли 18 ур. Возьмите квест «Путь воина Эльфов — трофеи» во вкладке «Квесты» и соберите трофеи с мобов Floran
      Village (подсказка «квест · добыча» в списке).
    </>
  ),
  humanFighter: (
    <>
      Вы в Gludin Village. Возьмите «Путь человека-воина — реагенты для первой профессии» во вкладке «Квесты»: цели и бонус
      к награде выпадают при приёме; нужные мобы отмечены «квест · добыча».
    </>
  ),
  humanMystic: (
    <>
      Вы в Gludin Village. Возьмите «Путь человека-мага — эссенции для первой профессии» — эссенции с элементалей и нежити
      этой зоны; объёмы и доп. награда задаются при приёме квеста.
    </>
  ),
  orcFighter: (
    <>
      Вы в Gludin Village. Квест «Путь орка-воина — тотемы клана»: Vuku Orc Fighter / Archer, Enku Orc Shaman / Champion;
      цели и бонус фиксируются при приёме.
    </>
  ),
  orcMystic: (
    <>
      «Путь орка-шамана — обереги стихий» в Gludin: Orc Shaman, Enku Orc Shaman, Mana Seeker, Will-O-Wisp — метки «квест ·
      добыча» до нужного количества.
    </>
  ),
  dwarvenFighter: (
    <>
      Вы в Gludin Village. «Путь гнома — образцы руин и шахт»: Pitchstone Golem, Dwarf Ghost, Ruin Imp, Obsidian Golem —
      объёмы и бонус к награде при приёме квеста.
    </>
  ),
  darkFighter: (
    <>
      Вы в Floran Village. Квест «Путь тёмного эльфа-воина — эффигии кошмара»: кошмары и стражи забвения этой зоны; цели и
      бонус фиксируются при приёме.
    </>
  ),
  darkMystic: (
    <>
      «Путь тёмного эльфа-мага — знаки стихий»: огоньки, искатели маны, саламандры и индисы Floran Village — метки «квест ·
      добыча» до нужного количества.
    </>
  ),
};

function helperShellClass(isL2: boolean) {
  return isL2
    ? "mb-3 rounded-lg border border-[#5c4a32]/50 bg-black/25 px-3 py-2.5 text-[11px] text-[#d4c4a8] leading-snug"
    : "mb-2 rounded border border-white/20 bg-black/30 px-2 py-2 text-[11px] text-[#c7ad80]";
}

function primaryBtnClass(isL2: boolean) {
  return isL2
    ? "px-3 py-1.5 rounded-md border border-[#5c4a32]/80 bg-gradient-to-b from-[#2e2619] to-[#14110c] text-[11px] text-[#e8c56e] hover:border-[#c7ad80]/45"
    : "px-3 py-1 rounded border border-[#c7ad80]/50 text-[11px] text-[#f4e2b8] hover:bg-white/5";
}

function hideBtnClass(isL2: boolean) {
  return isL2 ? "text-[10px] text-[#8a7a60] hover:text-[#d4c4a8]" : "text-[10px] text-gray-500 hover:text-gray-300";
}

export type LocationQuestHelperBannersProps = {
  isL2: boolean;
  navigate: (path: string) => void;
  showGludioQuestHint: boolean;
  onDismissGludioQuestHint: () => void;
  /** Підказка про квест тіньової D-зброї в Gludio (19+). */
  showShadowWeaponQuestHint?: boolean;
  onDismissShadowWeaponQuestHint?: () => void;
  firstProf: Record<LocationFirstProfHelperKey, { show: boolean; onDismiss: () => void }>;
};

export function LocationQuestHelperBanners({
  isL2,
  navigate,
  showGludioQuestHint,
  onDismissGludioQuestHint,
  showShadowWeaponQuestHint,
  onDismissShadowWeaponQuestHint,
  firstProf,
}: LocationQuestHelperBannersProps) {
  const dismissFirstProf = (key: LocationFirstProfHelperKey) => {
    try {
      localStorage.setItem(FIRST_PROF_STORAGE[key], "1");
    } catch {
      /* ignore */
    }
    firstProf[key].onDismiss();
  };

  return (
    <>
      {showGludioQuestHint ? (
        <div
          className={
            isL2
              ? "mb-3 rounded-lg border border-[#5c4a32]/50 bg-black/25 px-3 py-2.5 text-[11px] text-[#d4c4a8] leading-snug"
              : "mb-2 rounded border border-white/20 bg-black/30 px-2 py-2 text-[11px] text-[#c7ad80]"
          }
        >
          <div className="font-semibold text-[#c9a44c] mb-1">Помощник</div>
          <p className="mb-2 opacity-95">
            Задания для этой местности берутся во вкладке персонажа «Квесты». Откройте её и примите квест — мобы, которых нужно
            убить для счётчика квеста, подсвечиваются серым.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={primaryBtnClass(isL2)} onClick={() => navigate("/quests")}>
              Открыть вкладку «Квесты»
            </button>
            <button
              type="button"
              className={hideBtnClass(isL2)}
              onClick={() => {
                try {
                  localStorage.setItem("gludio_quest_tab_hint", "1");
                } catch {
                  /* ignore */
                }
                onDismissGludioQuestHint();
              }}
            >
              Скрыть
            </button>
          </div>
        </div>
      ) : null}

      {showShadowWeaponQuestHint && onDismissShadowWeaponQuestHint ? (
        <div
          className={
            isL2
              ? "mb-3 rounded-lg border border-[#5c4a32]/50 bg-black/25 px-3 py-2.5 text-[11px] text-[#d4c4a8] leading-snug"
              : "mb-2 rounded border border-white/20 bg-black/30 px-2 py-2 text-[11px] text-[#c7ad80]"
          }
        >
          <div className="font-semibold text-[#c9a44c] mb-1 flex items-center gap-2">
            <img src="/nps/144.png" alt="" className="w-4 h-4 object-contain shrink-0 opacity-95 rounded-sm" />
            Помощник
          </div>
          <p className="mb-2 opacity-95">
            Вы достигли 19 уровня — во вкладке «Квесты» примите «Теневой контракт — оружие D-grade» (Глудио, Странник
            теней): 100 мобов вашего уровня (±2, не рейд-босы), 10 Steel, награда — теневая D-grade пушка на выбор и 5
            свитков заточки оружия D-grade.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={primaryBtnClass(isL2)} onClick={() => navigate("/quests")}>
              Открыть «Квесты»
            </button>
            <button
              type="button"
              className={hideBtnClass(isL2)}
              onClick={() => {
                try {
                  localStorage.setItem("gludio_shadow_weapon_quest_hint", "1");
                } catch {
                  /* ignore */
                }
                onDismissShadowWeaponQuestHint();
              }}
            >
              Скрыть
            </button>
          </div>
        </div>
      ) : null}

      {FIRST_PROF_ORDER.map((key) => {
        const { show } = firstProf[key];
        if (!show) return null;
        return (
          <div key={key} className={helperShellClass(isL2)}>
            <div className="font-semibold text-[#c9a44c] mb-1 flex items-center gap-2">
              <img src="/nps/6.png" alt="" className="w-4 h-4 object-contain shrink-0 opacity-95" />
              Помощник
            </div>
            <p className="mb-2 opacity-95">{FIRST_PROF_BODY[key]}</p>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className={primaryBtnClass(isL2)} onClick={() => navigate("/quests")}>
                Вкладка «Квесты»
              </button>
              <button type="button" className={hideBtnClass(isL2)} onClick={() => dismissFirstProf(key)}>
                Скрыть
              </button>
            </div>
          </div>
        );
      })}
    </>
  );
}
