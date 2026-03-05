import React, { useState } from "react";

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
  return (
    <div className="border-b border-white/20">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left py-2 px-3 flex justify-between items-center text-[#c7ad80] font-semibold text-sm hover:bg-white/5"
      >
        {title}
        <span className="text-gray-400">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="px-3 pb-3 text-gray-300 text-xs leading-relaxed space-y-1.5">{children}</div>}
    </div>
  );
}

function LinkBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="text-amber-400 hover:text-amber-300 underline text-xs">
      {children}
    </button>
  );
}

export default function Help({ navigate }: HelpProps) {
  return (
    <div className="w-full text-white px-3 py-4">
      <div className="max-w-[360px] mx-auto border border-white/50 rounded-lg p-4 bg-[#1a0b0b]/30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-lg font-bold text-[#ffe9c0]">Помощь</div>
            <div className="text-xs text-orange-400/90">Обучалка для новых игроков</div>
          </div>
          <button onClick={() => navigate("/about")} className="text-gray-400 hover:text-white text-[10px]">
            ← Меню
          </button>
        </div>
        <div className="w-full h-px bg-gray-600 mb-3" />

        <div className="space-y-0 max-h-[65vh] overflow-y-auto pb-20">
          <Section title="Как перемещаться" defaultOpen={true}>
            <p><strong>Город</strong> — главный хаб. Отсюда открываются все сервисы. <LinkBtn onClick={() => navigate("/city")}>→ Город</LinkBtn></p>
            <p><strong>Телепорт (GK)</strong> — переход между локациями для боя с мобами. <LinkBtn onClick={() => navigate("/gk")}>→ Телепорт</LinkBtn></p>
            <p><strong>Локация</strong> — место, где вы бьётесь с мобами. Нажмите на моба, чтобы начать бой.</p>
          </Section>

          <Section title="HP, MP, CP — что это?">
            <p><strong>HP</strong> — здоровье. При нуле вы умираете. Восстанавливается в городе (регенерация) или хилами.</p>
            <p><strong>MP</strong> — мана для скиллов. Тратится при касте скиллов, восстанавливается автоматически.</p>
            <p><strong>CP</strong> — заряд (Combat Points). Нужен для некоторых скиллов.</p>
            <p>Бары отображаются сверху слева. Регенерация работает вне боя.</p>
          </Section>

          <Section title="Уровень и EXP">
            <p>EXP (опыт) — получаете за убийство мобов и рыбалку. Набрав нужное количество — повышаете уровень.</p>
            <p>С каждым уровнем растут HP, MP, урон и защита.</p>
          </Section>

          <Section title="SP (Skill Points)">
            <p>SP — очки скиллов. Накопичиваются за убийство мобов и рыбалку.</p>
            <p><strong>Гильдия магов</strong> — изучение основных скиллов (атака, хил, бафы). <LinkBtn onClick={() => navigate("/guild")}>→ Гильдия магов</LinkBtn></p>
            <p><strong>Дополнительные скиллы</strong> — расширенные скиллы за SP. <LinkBtn onClick={() => navigate("/additional-skills")}>→ Доп. скиллы</LinkBtn></p>
            <p>Рыбалка тратит 5000 SP за один заброс.</p>
          </Section>

          <Section title="Бой с мобами">
            <p>1. Выберите локацию через <LinkBtn onClick={() => navigate("/gk")}>Телепорт</LinkBtn>.</p>
            <p>2. Нажмите на моба в списке.</p>
            <p>3. Используйте скиллы (атака, бафы, хилы) во время боя.</p>
            <p>4. После победы — EXP, SP, предметы в инвентарь.</p>
            <p>При смерти можно воскреснуть в городе (70% HP) или ждать респавна.</p>
          </Section>

          <Section title="Экипировка и инвентарь">
            <p><LinkBtn onClick={() => navigate("/inventory")}>Инвентарь</LinkBtn> — предметы. Экипируйте оружие, броню, аксессуары.</p>
            <p><LinkBtn onClick={() => navigate("/equipment")}>Экипировка</LinkBtn> — слоты: оружие, голова, грудь, ноги, перчатки, ботинки и т.д.</p>
            <p>Некоторые предметы дают бонусы к статам. Заточка (enchant) усиливает предметы.</p>
          </Section>

          <Section title="Рыбалка">
            <p><strong>Нужно:</strong> удочка Baby Duck Rod (в слоте оружия), Gludio Fish Lure (в инвентаре), 5000 SP, 5 000 000 adena.</p>
            <p><strong>Как:</strong> зайдите в <LinkBtn onClick={() => navigate("/fishing")}>Рыбалку</LinkBtn>, нажмите «Начать». Ждите 1 час, затем «Собрать».</p>
            <p>Улов зависит от заточки удочки. Рыбалка даёт EXP и рыбу в инвентарь.</p>
          </Section>

          <Section title="Валюты">
            <p><strong>Adena</strong> — основная валюта. За мобов, продажа предметов, покупки в магазине.</p>
            <p><strong>Coin of Luck</strong> — премиум-валюта. Увеличение слотов инвентаря, эмблема клана, премиум-акаунт.</p>
            <p><strong>Ancient Adena</strong> — специальная валюта для некоторых сервисов.</p>
            <p><strong>Премиум-акаунт</strong> — x2 к EXP. Покупается за Coin of Luck.</p>
          </Section>

          <Section title="Чат, почта, форум">
            <p><LinkBtn onClick={() => navigate("/chat")}>Чат</LinkBtn> — общий, торговля. Пишите сообщения в реальном времени.</p>
            <p><LinkBtn onClick={() => navigate("/mail")}>Почта</LinkBtn> — письма между игроками. Отправка предметов, адены.</p>
            <p><LinkBtn onClick={() => navigate("/forum")}>Форум</LinkBtn> — темы, посты. Можно создавать темы, отвечать, редактировать свои посты.</p>
          </Section>

          <Section title="Кланы">
            <p><LinkBtn onClick={() => navigate("/clans")}>Кланы</LinkBtn> — создание или вступление в клан.</p>
            <p>В клане: чат, склад, эмблема, репутация. Управление через страницу клана.</p>
          </Section>

          <Section title="Магазины">
            <p><LinkBtn onClick={() => navigate("/shop")}>Магазин вещей</LinkBtn> — покупка предметов за adena / Coin of Luck.</p>
            <p><strong>GM-шоп</strong> — специальные предметы (требует доступа).</p>
            <p><strong>Магическая статуя</strong> — бесплатные бафы в городе.</p>
          </Section>

          <Section title="Прочее">
            <p><LinkBtn onClick={() => navigate("/about")}>Меню</LinkBtn> — онлайн, смена ника, цвет ника, <LinkBtn onClick={() => navigate("/achievements")}>достижения</LinkBtn>, <LinkBtn onClick={() => navigate("/leaderboard")}>рейтинг</LinkBtn>.</p>
            <p><strong>Склад</strong> — хранение предметов. Доступ из города.</p>
            <p><strong>Тату-мастер</strong> — смена внешности.</p>
            <p><strong>7 Печатей</strong> — сезонное событие с медалями и наградами.</p>
          </Section>

          <Section title="Частые вопросы">
            <p><strong>Где купить удочку и наживку?</strong> Магазин вещей → категория «Материалы» или поиск «rod», «lure».</p>
            <p><strong>Умер — что делать?</strong> Кнопка «В город (70% HP)» появится под барами. Или ждите респавна.</p>
            <p><strong>Как изменить ник?</strong> Меню → «Изменить ник». За coin of luck.</p>
            <p><strong>Как изменить цвет ника?</strong> Меню → «Покрасить ник».</p>
          </Section>
        </div>
      </div>
    </div>
  );
}
