import React from "react";

export type GuildFirstProfQuestNeeds = {
  elvenMystic: boolean;
  elvenFighter: boolean;
  humanFighter: boolean;
  humanMystic: boolean;
  darkFighter: boolean;
  darkMystic: boolean;
  orcFighter: boolean;
  orcMystic: boolean;
  dwarvenFighter: boolean;
};

const BANNER_BODY: Record<keyof GuildFirstProfQuestNeeds, string> = {
  elvenMystic:
    "Во вкладке «Квесты» примите «Путь мага Эльфов — отзвуки стихий»: квестовые эссенции с Lirein, Will-O-Wisp и Undine в окрестностях Floran Village. После сдачи на 20 уровне здесь появится выбор профессии.",
  elvenFighter:
    "Во вкладке «Квесты» примите «Путь воина Эльфов — трофеи»: добудьте клыки с Venomous Spider, листья с Lirein, кости с Tracker Skeleton Leader и жетоны с Boogle Ratman Leader в зонах Floran Village. После сдачи на 20 уровне здесь появится выбор первой профессии.",
  humanFighter:
    "Во вкладке «Квесты» примите «Путь человека-воина — реагенты для первой профессии»: добудьте реагенты с Evil Eye Seer, Arachnid Tracker, Stink Zombie и Skeleton Scout в окрестностях Gludin Village (количество и бонус к награде определяются при приёме). После сдачи на 20 уровне здесь появится выбор первой профессии.",
  humanMystic:
    "Во вкладке «Квесты» примите «Путь человека-мага — эссенции для первой профессии»: соберите эссенции с Lirein Elder, Salamander Noble, Undine Noble и Undead Slave в Gludin Village. После сдачи на 20 уровне откроется выбор Cleric / Wizard.",
  darkFighter:
    "Во вкладке «Квесты» примите «Путь тёмного эльфа-воина — эффигии кошмара»: трофеи с Lesser Dark Horror, Shade Horror, Crypt Horror и Oblivion Watcher в зонах Floran Village (объёмы и бонус — при приёме). После сдачи на 20 уровне откроется выбор первой профессии.",
  darkMystic:
    "Примите «Путь тёмного эльфа-мага — знаки стихий»: конденсаты с Will-O-Wisp, Mana Seeker, Scarlet Salamander и Undine в Floran Village. Доп. награда показывается в активном квесте.",
  orcFighter:
    "Во вкладке «Квесты» примите «Путь орка-воина — тотемы клана»: трофеи у Vuku Orc Fighter, Vuku Orc Archer, Enku Orc Shaman и Enku Orc Champion в Gludin Village (объёмы и бонус — при приёме).",
  orcMystic:
    "Примите «Путь орка-шамана — обереги стихий»: материалы с Orc Shaman, Enku Orc Shaman, Mana Seeker и Will-O-Wisp в Gludin Village.",
  dwarvenFighter:
    "Примите «Путь гнома — образцы руин и шахт»: компоненты с Pitchstone Golem, Dwarf Ghost, Ruin Imp и Obsidian Golem в Gludin Village (объёмы и бонус — при приёме).",
};

export function GuildScreenFirstProfQuestBanners(props: {
  isL2: boolean;
  heroLevel: number;
  navigate: (path: string) => void;
  needs: GuildFirstProfQuestNeeds;
}) {
  const { isL2, heroLevel, navigate, needs } = props;
  const wrap =
    isL2
      ? "p-3 space-y-2 rounded-lg border border-amber-900/40 bg-black/25 shadow-[inset_0_1px_0_rgba(199,173,128,0.06)]"
      : "p-3 space-y-2 rounded-lg border border-amber-700/30 bg-black/20";
  const titleCls = isL2 ? "text-[#e8c56e] font-semibold" : "text-amber-200 font-semibold";
  const bodyCls = isL2 ? "text-[#c9b99a]" : "text-[#e8dcc8]";
  const btnCls = isL2
    ? "text-[11px] font-semibold text-[#c9a44c] hover:text-[#f0e0c0] underline underline-offset-2"
    : "text-[11px] font-semibold text-amber-300 hover:text-amber-200 underline";

  return (
    <>
      {(Object.keys(needs) as (keyof GuildFirstProfQuestNeeds)[]).map((key) =>
        needs[key] && heroLevel >= 18 ? (
          <div key={key} className={wrap}>
            <div className="flex items-start gap-2">
              <img src="/nps/6.png" alt="" className="w-8 h-8 object-contain shrink-0 opacity-95 mt-0.5" />
              <div className="text-[11px] leading-snug space-y-2">
                <div className={titleCls}>Возьмите квест для профессии!</div>
                <p className={bodyCls}>{BANNER_BODY[key]}</p>
                <button type="button" onClick={() => navigate("/quests")} className={btnCls}>
                  Открыть «Квесты» →
                </button>
              </div>
            </div>
          </div>
        ) : null
      )}
    </>
  );
}
