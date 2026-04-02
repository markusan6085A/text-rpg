import React, { useState } from "react";
import { isWarmCityUi, getCityUiVariant } from "../utils/cityUiVariant";
import { L2_WARM_OUTER_FRAME } from "../utils/l2WarmLayoutClassNames";

interface HelpProps {
  navigate: (path: string) => void;
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, children, defaultOpen = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const isL2 = isWarmCityUi(getCityUiVariant());
  return (
    <div className={isL2 ? "border-b border-[#5c4a32]/35" : "border-b border-white/20"}>
      <button
        onClick={() => setOpen(!open)}
        className={
          isL2
            ? "w-full text-left py-2 px-3 flex justify-between items-center text-[#e8c56e] font-semibold text-sm hover:bg-black/25"
            : "w-full text-left py-2 px-3 flex justify-between items-center text-[#c7ad80] font-semibold text-sm hover:bg-white/5"
        }
      >
        {title}
        <span className={isL2 ? "text-[#8a7a60]" : "text-gray-400"}>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div
          className={
            isL2
              ? "px-3 pb-3 text-[#d4c4a8] text-xs leading-relaxed space-y-1.5"
              : "px-3 pb-3 text-gray-300 text-xs leading-relaxed space-y-1.5"
          }
        >
          {children}
        </div>
      )}
    </div>
  );
}

function LinkBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  const isL2 = isWarmCityUi(getCityUiVariant());
  return (
    <button
      onClick={onClick}
      className={
        isL2
          ? "text-[#9d8265] hover:text-[#c9a44c] underline text-xs"
          : "text-amber-400 hover:text-amber-300 underline text-xs"
      }
    >
      {children}
    </button>
  );
}

export default function Help({ navigate }: HelpProps) {
  const isL2 = isWarmCityUi(getCityUiVariant());
  const l2Frame = L2_WARM_OUTER_FRAME;
  const innerPanel = isL2
    ? "max-w-[420px] mx-auto rounded-xl border border-[#5c4a32]/75 bg-black/25 shadow-[inset_0_1px_0_rgba(199,173,128,0.08)] p-4"
    : "max-w-[360px] mx-auto border border-white/50 rounded-lg p-4 bg-[#1a0b0b]/30";

  return (
    <div
      className={
        isL2
          ? `${l2Frame} w-full min-w-0 my-1 px-3 py-4 text-[#d4c4a8]`
          : "w-full text-white px-3 py-4"
      }
    >
      <div className={innerPanel}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className={isL2 ? "text-lg font-bold text-[#e8c56e]" : "text-lg font-bold text-[#ffe9c0]"}>Помощь</div>
            <div className={isL2 ? "text-xs text-[#a89878]" : "text-xs text-orange-400/90"}>Обучалка для новых игроков</div>
          </div>
          <button
            onClick={() => navigate("/about")}
            className={
              isL2
                ? "text-[#9d8265] hover:text-[#c9a44c] text-[10px]"
                : "text-gray-400 hover:text-white text-[10px]"
            }
          >
            ← Меню
          </button>
        </div>
        <div className={isL2 ? "w-full h-px bg-[#5c4a32]/45 mb-3" : "w-full h-px bg-gray-600 mb-3"} />

        <div className="space-y-0 max-h-[65vh] overflow-y-auto pb-20">
          <Section title="Как перемещаться" defaultOpen={true}>
            <p>
              <strong>Город</strong> — главный хаб: магазины, гильдия скиллов, склад, рынок, квесты.{" "}
              <LinkBtn onClick={() => navigate("/city")}>→ В город</LinkBtn>
            </p>
            <p>
              <strong>Телепорт (GK)</strong> — выбор локации, где есть мобы. Оттуда попадаете на экран локации.{" "}
              <LinkBtn onClick={() => navigate("/gk")}>→ Телепорт</LinkBtn>
            </p>
            <p>
              <strong>Локация</strong> — после телепорта откроется список мобов; нажмите на моба, чтобы начать бой.
            </p>
          </Section>

          <Section title="HP, MP, CP — что это?">
            <p><strong>HP</strong> — здоровье. При 0 вы погибаете: экран смерти и телепорт в город (восстановление части HP/MP/CP) или ожидание.</p>
            <p><strong>MP</strong> — мана для скиллов; тратится в бою, восстанавливается со временем и регеном вне боя.</p>
            <p><strong>CP</strong> — очки для части умений (Combat Points).</p>
            <p>Полоски — вверху слева. В городе действует регенерация вне боя.</p>
          </Section>

          <Section title="Уровень и EXP">
            <p>EXP дают мобы, рыбалка и часть активностей. При заполнении шкалы — повышение уровня.</p>
            <p>С уровнем растут базовые ресурсы и открываются уровни скиллов (см. требования в гильдии).</p>
            <p>
              <strong>Премиум</strong> — ускорение опыта (x2 EXP). Раздел{" "}
              <LinkBtn onClick={() => navigate("/premium-account")}>→ Премиум</LinkBtn>.
            </p>
            <p>
              Таблица уровней: <LinkBtn onClick={() => navigate("/exp-table")}>→ Таблица EXP</LinkBtn>
            </p>
          </Section>

          <Section title="SP и скиллы">
            <p><strong>SP</strong> — очки умений; копятся с мобов и рыбалки. Тратятся в гильдии и на доп. скиллы.</p>
            <p>
              <strong>Гильдия навыков</strong> — основные скиллы класса, прокачка по уровням; на <strong>20 уровне</strong> — выбор
              первой профессии (ветка), дальше — следующие ступени по уровню.{" "}
              <LinkBtn onClick={() => navigate("/guild")}>→ Гильдия</LinkBtn>
            </p>
            <p>
              Список изученных скиллов (как на панели боя):{" "}
              <LinkBtn onClick={() => navigate("/learned-skills")}>→ Скиллы персонажа</LinkBtn>
            </p>
            <p>
              <strong>Дополнительные скиллы</strong> — отдельный список за SP.{" "}
              <LinkBtn onClick={() => navigate("/additional-skills")}>→ Доп. скиллы</LinkBtn>
            </p>
            <p>Рыбалка: один заброс стоит <strong>5000 SP</strong> (и удочка + наживка).</p>
          </Section>

          <Section title="Бой с мобами">
            <p>1. <LinkBtn onClick={() => navigate("/gk")}>Телепорт</LinkBtn> → выберите зону.</p>
            <p>2. На локации нажмите моба → старт боя.</p>
            <p>3. Атака, бафы, хилы — кнопки скиллов; следите за MP/CP.</p>
            <p>4. Победа: EXP, SP, дроп в инвентарь (или переполнение — сундук переполнения).</p>
            <p>Поражение/смерть: телепорт в город с экрана смерти или ожидание.</p>
          </Section>

          <Section title="Экипировка и инвентарь">
            <p><LinkBtn onClick={() => navigate("/inventory")}>→ Инвентарь</LinkBtn> — предметы, расходники, ресурсы.</p>
            <p>
              <strong>Экипировка</strong> — наденьте вещи из{" "}
              <LinkBtn onClick={() => navigate("/inventory")}>→ Инвентаря</LinkBtn> (манекен и слоты сверху экрана инвентаря).
            </p>
            <p>Заточка (enchant) усиливает предмет; для некоторых профессий важен тип оружия под скилл.</p>
          </Section>

          <Section title="Крафт ресурсов">
            <p>Сборка ресурсов из материалов в инвентаре — в городе.</p>
            <p><LinkBtn onClick={() => navigate("/craft/resources")}>→ Крафт ресурсов</LinkBtn></p>
          </Section>

          <Section title="Рыбалка">
            <p><strong>Нужно:</strong> удочка (слот оружия), наживка Gludio Fish Lure в инвентаре, <strong>5000 SP</strong> на заброс.</p>
            <p><strong>Как:</strong> <LinkBtn onClick={() => navigate("/fishing")}>→ Рыбалка</LinkBtn> → «Начать», через 1 час — «Собрать».</p>
            <p>Улов и бонус зависят от заточки удочки; даёт EXP и рыбу.</p>
          </Section>

          <Section title="Рынок, квесты, ежедневки">
            <p>
              <strong>Рынок игроков</strong> — выставление лотов и покупка у других (адена).{" "}
              <LinkBtn onClick={() => navigate("/market")}>→ Рынок</LinkBtn>
            </p>
            <p>
              <strong>Квесты</strong> — сюжетные и побочные цепочки. <LinkBtn onClick={() => navigate("/quests")}>→ Квесты</LinkBtn>
            </p>
            <p>
              <strong>Магазин квестов</strong> — обмен предметов/валют по квестовым токенам.{" "}
              <LinkBtn onClick={() => navigate("/quest-shop")}>→ Магазин квестов</LinkBtn>
            </p>
            <p>
              <strong>Ежедневные задания</strong> — ежедневный прогресс (убийства, адена и т.д.).{" "}
              <LinkBtn onClick={() => navigate("/daily-quests")}>→ Ежедневки</LinkBtn>
            </p>
          </Section>

          <Section title="Валюты">
            <p><strong>Adena</strong> — основная валюта: мобы, продажа, магазин, рынок, часть сервисов.</p>
            <p><strong>Coin of Luck</strong> — донат/премиум: слоты инвентаря, премиум, оформление ника и др.</p>
            <p><strong>Ancient Adena (AA)</strong> — отдельный счётчик для части контента и обменов.</p>
            <p><strong>Серебряные монеты</strong> — специальные покупки, где указано в интерфейсе.</p>
          </Section>

          <Section title="Чат, почта, форум, новости">
            <p><LinkBtn onClick={() => navigate("/chat")}>→ Чат</LinkBtn> — общение и торговля в реальном времени.</p>
            <p><LinkBtn onClick={() => navigate("/mail")}>→ Почта</LinkBtn> — письма, вложения, адена.</p>
            <p><LinkBtn onClick={() => navigate("/forum")}>→ Форум</LinkBtn> — темы и ответы.</p>
            <p><LinkBtn onClick={() => navigate("/news")}>→ Новости</LinkBtn> — объявления проекта.</p>
          </Section>

          <Section title="Кланы">
            <p><LinkBtn onClick={() => navigate("/clans")}>→ Кланы</LinkBtn> — поиск, заявки, создание.</p>
            <p>В клане: чат, склад, эмблема (часто за Coin of Luck), рейтинги и управление у лидера.</p>
          </Section>

          <Section title="Магазины и сервисы в городе">
            <p><LinkBtn onClick={() => navigate("/shop")}>→ Магазин вещей</LinkBtn> — adena и, где указано, Coin of Luck.</p>
            <p><LinkBtn onClick={() => navigate("/shop/sell")}>→ Продажа предметов</LinkBtn></p>
            <p><strong>GM-шоп</strong> — при наличии доступа. <LinkBtn onClick={() => navigate("/gm-shop")}>→ GM-шоп</LinkBtn></p>
            <p><LinkBtn onClick={() => navigate("/magic-statue")}>→ Магическая статуя</LinkBtn> — бафы в городе.</p>
            <p><LinkBtn onClick={() => navigate("/tattoo-artist")}>→ Тату-мастер</LinkBtn> — внешность.</p>
            <p><LinkBtn onClick={() => navigate("/warehouse")}>→ Склад</LinkBtn> — хранение лишних вещей.</p>
          </Section>

          <Section title="Прочее">
            <p><LinkBtn onClick={() => navigate("/about")}>→ Меню</LinkBtn> — онлайн, ник, цвет ника, настройки.</p>
            <p><LinkBtn onClick={() => navigate("/settings")}>→ Настройки</LinkBtn> — язык, обучалка снова, отображение.</p>
            <p><LinkBtn onClick={() => navigate("/achievements")}>→ Достижения</LinkBtn>, <LinkBtn onClick={() => navigate("/leaderboard")}>→ Рейтинг</LinkBtn>, <LinkBtn onClick={() => navigate("/online-players")}>→ Онлайн</LinkBtn></p>
            <p><LinkBtn onClick={() => navigate("/seven-seals")}>→ 7 Печатей</LinkBtn> — сезонное событие.</p>
            <p><LinkBtn onClick={() => navigate("/stats")}>→ Статы</LinkBtn> — распределение и просмотр характеристик.</p>
          </Section>

          <Section title="Частые вопросы">
            <p><strong>Нет скиллов / нет выбора профессии на 20?</strong> Зайдите в <LinkBtn onClick={() => navigate("/guild")}>гильдию</LinkBtn>; профессия должна быть базовой job id (не «Fighter» как текст). После исправления клиента — перезайдите или F5.</p>
            <p><strong>Где удочка и наживка?</strong> Магазин → материалы / поиск rod, lure.</p>
            <p><strong>Смерть?</strong> Экран с телепортом в город; часть HP/MP/CP восстановится.</p>
            <p><strong>Смена ника / цвета?</strong> Меню → соответствующие пункты (часто за Coin of Luck).</p>
            <p><strong>Как снова показать жёлтую обучалку под барами?</strong> <LinkBtn onClick={() => navigate("/settings")}>Настройки</LinkBtn> → блок обучалки.</p>
          </Section>
        </div>
      </div>
    </div>
  );
}
