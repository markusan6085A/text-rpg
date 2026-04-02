import React from "react";
import { useHeroStore } from "../state/heroStore";
import { isWarmCityUi, getCityUiVariant } from "../utils/cityUiVariant";
import { L2_WARM_OUTER_FRAME } from "../utils/l2WarmLayoutClassNames";

interface Navigate {
  (path: string): void;
}

interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  getProgress: (hero: any) => { current: number; target: number };
}

const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "mob_1",
    name: "Перше вбивство",
    desc: "Вбити 1 моба",
    icon: "⚔️",
    getProgress: (h) => ({
      current: Number((h as any)?.mobsKilled ?? (h as any)?.heroJson?.mobsKilled ?? 0) || 0,
      target: 1,
    }),
  },
  {
    id: "mob_10",
    name: "Мисливець",
    desc: "Вбити 10 мобів",
    icon: "🗡️",
    getProgress: (h) => ({
      current: Number((h as any)?.mobsKilled ?? (h as any)?.heroJson?.mobsKilled ?? 0) || 0,
      target: 10,
    }),
  },
  {
    id: "mob_50",
    name: "Досвідчений воїн",
    desc: "Вбити 50 мобів",
    icon: "🛡️",
    getProgress: (h) => ({
      current: Number((h as any)?.mobsKilled ?? (h as any)?.heroJson?.mobsKilled ?? 0) || 0,
      target: 50,
    }),
  },
  {
    id: "mob_100",
    name: "Мисливець за головами",
    desc: "Вбити 100 мобів",
    icon: "⚔️",
    getProgress: (h) => ({
      current: Number((h as any)?.mobsKilled ?? (h as any)?.heroJson?.mobsKilled ?? 0) || 0,
      target: 100,
    }),
  },
  {
    id: "mob_500",
    name: "Легендарний вбивця",
    desc: "Вбити 500 мобів",
    icon: "💀",
    getProgress: (h) => ({
      current: Number((h as any)?.mobsKilled ?? (h as any)?.heroJson?.mobsKilled ?? 0) || 0,
      target: 500,
    }),
  },
  {
    id: "mob_1000",
    name: "Володар полів",
    desc: "Вбити 1000 мобів",
    icon: "👑",
    getProgress: (h) => ({
      current: Number((h as any)?.mobsKilled ?? (h as any)?.heroJson?.mobsKilled ?? 0) || 0,
      target: 1000,
    }),
  },
  {
    id: "level_5",
    name: "Новачок",
    desc: "Досягти 5 рівня",
    icon: "📜",
    getProgress: (h) => ({ current: h?.level ?? 1, target: 5 }),
  },
  {
    id: "level_10",
    name: "Учень",
    desc: "Досягти 10 рівня",
    icon: "📖",
    getProgress: (h) => ({ current: h?.level ?? 1, target: 10 }),
  },
  {
    id: "level_20",
    name: "Ветеран",
    desc: "Досягти 20 рівня",
    icon: "📕",
    getProgress: (h) => ({ current: h?.level ?? 1, target: 20 }),
  },
  {
    id: "level_40",
    name: "Майстер",
    desc: "Досягти 40 рівня",
    icon: "📗",
    getProgress: (h) => ({ current: h?.level ?? 1, target: 40 }),
  },
  {
    id: "level_60",
    name: "Герой",
    desc: "Досягти 60 рівня",
    icon: "📘",
    getProgress: (h) => ({ current: h?.level ?? 1, target: 60 }),
  },
  {
    id: "level_80",
    name: "Легенда",
    desc: "Досягти 80 рівня",
    icon: "🏆",
    getProgress: (h) => ({ current: h?.level ?? 1, target: 80 }),
  },
  {
    id: "sp_100",
    name: "Студент",
    desc: "Накопичити 100 SP",
    icon: "📚",
    getProgress: (h) => ({ current: h?.sp ?? 0, target: 100 }),
  },
  {
    id: "sp_500",
    name: "Знавець скілів",
    desc: "Накопичити 500 SP",
    icon: "🔮",
    getProgress: (h) => ({ current: h?.sp ?? 0, target: 500 }),
  },
  {
    id: "sp_1000",
    name: "Магістр",
    desc: "Накопичити 1000 SP",
    icon: "✨",
    getProgress: (h) => ({ current: h?.sp ?? 0, target: 1000 }),
  },
  {
    id: "fish_100",
    name: "Рибалка",
    desc: "Виловити 100 риб",
    icon: "🎣",
    getProgress: (h) => ({
      current: Number((h as any)?.heroJson?.fishCaughtTotal ?? 0) || 0,
      target: 100,
    }),
  },
  {
    id: "fish_500",
    name: "Рибалкар",
    desc: "Виловити 500 риб",
    icon: "🐟",
    getProgress: (h) => ({
      current: Number((h as any)?.heroJson?.fishCaughtTotal ?? 0) || 0,
      target: 500,
    }),
  },
  {
    id: "fish_1000",
    name: "Морський вовк",
    desc: "Виловити 1000 риб",
    icon: "🌊",
    getProgress: (h) => ({
      current: Number((h as any)?.heroJson?.fishCaughtTotal ?? 0) || 0,
      target: 1000,
    }),
  },
];

export default function Achievements({ navigate }: { navigate: Navigate }) {
  const hero = useHeroStore((s) => s.hero);
  const isL2 = isWarmCityUi(getCityUiVariant());
  const l2Frame = L2_WARM_OUTER_FRAME;
  const innerPanel = isL2
    ? "max-w-[420px] mx-auto rounded-xl border border-[#5c4a32]/75 bg-black/25 shadow-[inset_0_1px_0_rgba(199,173,128,0.08)] p-4"
    : "max-w-[360px] mx-auto border border-white/50 rounded-lg p-4 bg-[#1a0b0b]/30";

  const completed = React.useMemo(() => {
    if (!hero) return 0;
    return ACHIEVEMENTS.filter((a) => {
      const p = a.getProgress(hero);
      return p.current >= p.target;
    }).length;
  }, [hero]);

  return (
    <div
      className={
        isL2 ? `${l2Frame} w-full min-w-0 my-1 px-3 py-4 text-[#d4c4a8]` : "w-full text-white px-3 py-4"
      }
    >
      <div className={innerPanel}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className={isL2 ? "text-lg font-bold text-[#e8c56e]" : "text-lg font-bold text-[#ffe9c0]"}>
              Досягнення
            </div>
            <div className={isL2 ? "text-xs text-[#a89878]" : "text-xs text-orange-400/90"}>
              {hero ? `${completed} / ${ACHIEVEMENTS.length}` : "Увійдіть для перегляду"}
            </div>
          </div>
          <button
            onClick={() => navigate("/about")}
            className={
              isL2
                ? "text-[#9d8265] hover:text-[#c9a44c] text-[10px]"
                : "text-gray-400 hover:text-white text-[10px]"
            }
          >
            ← Назад
          </button>
        </div>
        <div className={isL2 ? "w-full h-px bg-[#5c4a32]/45 mb-3" : "w-full h-px bg-gray-600 mb-3"} />

        {!hero ? (
          <div className={isL2 ? "text-[#8a7a60] text-sm" : "text-gray-400 text-sm"}>
            Завантажте персонажа для перегляду досягнень.
          </div>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {ACHIEVEMENTS.map((a) => {
              const p = a.getProgress(hero);
              const done = p.current >= p.target;
              return (
                <div
                  key={a.id}
                  className={`flex items-center gap-3 p-2 rounded border ${
                    done
                      ? "border-green-500/50 bg-green-900/20"
                      : isL2
                        ? "border-[#5c4a32]/45 bg-black/25"
                        : "border-white/20 bg-black/20"
                  }`}
                >
                  <span className="text-2xl">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-semibold text-sm ${
                        done ? "text-green-300" : isL2 ? "text-[#e8dcc8]" : "text-gray-300"
                      }`}
                    >
                      {a.name}
                    </div>
                    <div className={isL2 ? "text-[11px] text-[#8a7a60]" : "text-[11px] text-gray-400"}>{a.desc}</div>
                    <div
                      className={
                        isL2 ? "text-[10px] text-[#6a6048] mt-0.5" : "text-[10px] text-gray-500 mt-0.5"
                      }
                    >
                      {p.current} / {p.target}
                    </div>
                  </div>
                  {done && <span className="text-green-400 text-lg">✓</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
