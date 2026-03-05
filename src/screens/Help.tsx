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
            <div className="text-lg font-bold text-[#ffe9c0]">Допомога</div>
            <div className="text-xs text-orange-400/90">Обучалка для нових гравців</div>
          </div>
          <button onClick={() => navigate("/about")} className="text-gray-400 hover:text-white text-[10px]">
            ← Меню
          </button>
        </div>
        <div className="w-full h-px bg-gray-600 mb-3" />

        <div className="space-y-0 max-h-[65vh] overflow-y-auto">
          <Section title="Як рухатися" defaultOpen={true}>
            <p><strong>Місто</strong> — головний хаб. Звідси відкриваються всі сервіси. <LinkBtn onClick={() => navigate("/city")}>→ Місто</LinkBtn></p>
            <p><strong>Телепорт (GK)</strong> — перехід між локаціями для бою з мобами. <LinkBtn onClick={() => navigate("/gk")}>→ Телепорт</LinkBtn></p>
            <p><strong>Локація</strong> — місце, де ви б'єтеся з мобами. Натисніть на моба, щоб почати бій.</p>
          </Section>

          <Section title="HP, MP, CP — що це?">
            <p><strong>HP</strong> — здоров'я. При нулі ви вмираєте. Відновлюється в місті (регенерація) або хілами.</p>
            <p><strong>MP</strong> — мана для скілів. Витрачається при касті скілів, відновлюється автоматично.</p>
            <p><strong>CP</strong> — заряд (Combat Points). Потрібен для деяких скілів.</p>
            <p>Барі показуються зверху зліва. Регенерація працює поза боєм.</p>
          </Section>

          <Section title="Рівень та EXP">
            <p>EXP (досвід) — отримуєте за вбивство мобів і рибалку. Набравши потрібну кількість — підвищуєте рівень.</p>
            <p>З кожним рівнем зростають HP, MP, урон та захист.</p>
          </Section>

          <Section title="SP (Skill Points)">
            <p>SP — очки скілів. Накопичуються за вбивство мобів і рибалку.</p>
            <p><strong>Гільдія магів</strong> — вивчення основних скілів (атака, хіл, бафи). <LinkBtn onClick={() => navigate("/guild")}>→ Гільдія магів</LinkBtn></p>
            <p><strong>Додаткові скіли</strong> — розширені скіли за SP. <LinkBtn onClick={() => navigate("/additional-skills")}>→ Додаткові скіли</LinkBtn></p>
            <p>Рибалка витрачає 5000 SP за один закид.</p>
          </Section>

          <Section title="Бій з мобами">
            <p>1. Виберіть локацію через <LinkBtn onClick={() => navigate("/gk")}>Телепорт</LinkBtn>.</p>
            <p>2. Натисніть на моба в списку.</p>
            <p>3. Використовуйте скіли (атака, бафи, хіли) під час бою.</p>
            <p>4. Після перемоги — EXP, SP, предмети в інвентар.</p>
            <p>При смерті можна воскреснути в місті (70% HP) або чекати респавну.</p>
          </Section>

          <Section title="Екіпіровка та інвентар">
            <p><LinkBtn onClick={() => navigate("/inventory")}>Інвентар</LinkBtn> — предмети. Екіпіруйте зброю, броню, аксесуари.</p>
            <p><LinkBtn onClick={() => navigate("/equipment")}>Екіпіровка</LinkBtn> — слоты: зброя, голова, груди, ноги, рукавиці, чоботи тощо.</p>
            <p>Деякі предмети дають бонуси до статів. Заточка (enchant) підсилює предмети.</p>
          </Section>

          <Section title="Рибалка">
            <p><strong>Потрібно:</strong> удочка Baby Duck Rod (в слоті зброї), Gludio Fish Lure (в інвентарі), 5000 SP, 5 000 000 adena.</p>
            <p><strong>Як:</strong> зайдіть у <LinkBtn onClick={() => navigate("/fishing")}>Рибалку</LinkBtn>, натисніть «Почати». Чекайте 1 годину, потім «Зібрати».</p>
            <p>Улов залежить від заточки удочки. Рибалка дає EXP і рибу в інвентар.</p>
          </Section>

          <Section title="Валюти">
            <p><strong>Adena</strong> — основна валюта. За мобів, продаж предметів, покупки в магазині.</p>
            <p><strong>Coin of Luck</strong> — преміум-валюта. Збільшення слотів інвентаря, емблема клану, premium-акаунт.</p>
            <p><strong>Ancient Adena</strong> — спеціальна валюта для деяких сервісів.</p>
            <p><strong>Преміум-акаунт</strong> — x2 до EXP. Купується за Coin of Luck.</p>
          </Section>

          <Section title="Чат, пошта, форум">
            <p><LinkBtn onClick={() => navigate("/chat")}>Чат</LinkBtn> — загальний, торгівля. Пишіть повідомлення в реальному часі.</p>
            <p><LinkBtn onClick={() => navigate("/mail")}>Пошта</LinkBtn> — листи між гравцями. Відправка предметів, адени.</p>
            <p><LinkBtn onClick={() => navigate("/forum")}>Форум</LinkBtn> — теми, пости. Можна створювати теми, відповідати, редагувати свої пости.</p>
          </Section>

          <Section title="Клани">
            <p><LinkBtn onClick={() => navigate("/clans")}>Клани</LinkBtn> — створення або вступ у клан.</p>
            <p>У клані: чат, склад, емблема, репутація. Керування через сторінку клану.</p>
          </Section>

          <Section title="Магазини">
            <p><LinkBtn onClick={() => navigate("/shop")}>Магазин вещей</LinkBtn> — покупка предметів за adena / Coin of Luck.</p>
            <p><strong>GM-шоп</strong> — спеціальні предмети (потребує доступу).</p>
            <p><strong>Магична статуя</strong> — безкоштовні бафи в місті.</p>
          </Section>

          <Section title="Інше">
            <p><LinkBtn onClick={() => navigate("/about")}>Меню</LinkBtn> — онлайн, зміна ніка, колір ніка, <LinkBtn onClick={() => navigate("/achievements")}>досягнення</LinkBtn>, <LinkBtn onClick={() => navigate("/leaderboard")}>рейтинг</LinkBtn>.</p>
            <p><strong>Склад</strong> — зберігання предметів. Доступ з міста.</p>
            <p><strong>Тату-майстер</strong> — зміна зовнішності.</p>
            <p><strong>7 Печатей</strong> — сезонна подія з медалями та нагородами.</p>
          </Section>

          <Section title="Часті питання">
            <p><strong>Де купити удочку і наживку?</strong> Магазин вещей → категорія «Матеріали» або пошук «rod», «lure».</p>
            <p><strong>Помер — що робити?</strong> Кнопка «В город (70% HP)» з'явиться під барами. Або чекайте респавну.</p>
            <p><strong>Як змінити нік?</strong> Меню → «Изменить ник». За coin of luck.</p>
            <p><strong>Як змінити колір ніка?</strong> Меню → «Покрасить ник».</p>
          </Section>
        </div>
      </div>
    </div>
  );
}
