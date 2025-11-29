import React, { useState, useEffect } from "react";
import { itemsDB } from "../../data/items/itemsDB";
import { SLOT_ICONS } from "./constants";

// Форматирование чисел (как в City)
const formatNumber = (num: number) => {
  return num.toLocaleString("ru-RU");
};

const characterMap: Record<string, string> = {
  darkelf_female: "darkelf_female.png",
  darkelf_male: "darkelf_male.png",
  dwarf_female: "dwarf_female.png",
  dwarf_male: "dwarf_male.png",
  elf_female: "elf_female.png",
  elf_male: "elf_male.png",
  human_female: "human_female.png",
  human_male: "human_male.png",
  orc_female: "orc_female.png",
  orc_male: "orc_male.png",
};

export default function Character() {
  const [hero, setHero] = useState<any>(null);

  const [nickname, setNickname] = useState("");
  const [level, setLevel] = useState(1);
  const [race, setRace] = useState("");
  const [gender, setGender] = useState("");
  const [status, setStatus] = useState("");
  const [profession, setProfession] = useState("");

  const [adena, setAdena] = useState(0);
  const [coins, setCoins] = useState(0);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  // -----------------------------
  // Загрузка героя
  // -----------------------------
  useEffect(() => {
    const accounts = JSON.parse(localStorage.getItem("l2_accounts_v2") || "[]");
    const h = accounts.length > 0 ? accounts[0].hero : null;

    if (h) {
      setHero(h);

      if (h.name) setNickname(h.name);
      if (h.level) setLevel(h.level);
      if (h.race) setRace(h.race);
      if (h.gender) setGender(h.gender);
      if (h.profession) setProfession(h.profession);

      if (typeof h.adena === "number") setAdena(h.adena);
      if (typeof h.coinOfLuck === "number") setCoins(h.coinOfLuck);

      if (h.status) setStatus(h.status);
    }
  }, []);

  // -----------------------------
  // EXP (как в City)
  // -----------------------------
  const expCurrent = hero?.expCurrent ?? 0;
  const expToNext = hero?.expToNext ?? 100000;
  const expPercent = hero?.expPercent ?? 0;

  // -----------------------------
  // Сохранение статуса
  // -----------------------------
  const saveStatus = () => {
    const updatedHero = { ...hero, status: newStatus };

    setHero(updatedHero);
    setStatus(newStatus);

    const accounts = JSON.parse(localStorage.getItem("l2_accounts_v2") || "[]");
    accounts[0].hero = updatedHero;
    localStorage.setItem("l2_accounts_v2", JSON.stringify(accounts));

    setShowStatusModal(false);
  };

  // -----------------------------
  // Картинка персонажа
  // -----------------------------
  const key = `${race}_${gender}`;
  const characterImage = `/characters/${characterMap[key] || "human_male.png"}`;

  // -----------------------------
  // Иконка надетого предмета
  // -----------------------------
  const getSlotIcon = (slot: string) => {
    if (!hero || !hero.equipment) return SLOT_ICONS[slot];
    const itemId = hero.equipment[slot];
    if (!itemId) return SLOT_ICONS[slot];
    const def = itemsDB[itemId];
    if (!def) return SLOT_ICONS[slot];
    return def.icon.startsWith("/") ? def.icon : `/items/${def.icon}`;
  };

  const btn =
    "w-20 py-1 text-[10px] bg-[#0f0a06] text-white border border-[#3e301c] rounded-md";

  if (!hero)
    return <div className="text-white text-center mt-10">Загрузка...</div>;

  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center text-white">
      <div
        className="mt-2 rounded-xl border-2 flex flex-col items-center relative"
        style={{
          width: "360px",
          backgroundColor: "rgba(20, 12, 6, 0.9)",
          borderColor: "#3b2c1a",
          paddingTop: "10px",
          paddingBottom: "10px",
        }}
      >

        {/* ========================================================= */}
        {/*     ВЕРХ — БАРЫ + ИНФО + КНОПКИ СПРАВА      */}
        {/* ========================================================= */}
        <div className="w-full px-3 mb-2 mt-1 flex justify-between">

          {/* ЛЕВАЯ КОЛОНКА БАРОВ */}
          <div className="flex flex-col gap-[4px] mt-[4px]">

            {/* CP */}
            <div className="flex items-center gap-1">
              <span className="w-7 text-[10px] text-[#caa777]">CP</span>
              <div className="w-24 h-[0.7rem] bg-[#2c241b] rounded-[3px] overflow-hidden relative">
                <div
                  className="h-full bg-[#d9963b]"
                  style={{
                    width: `${Math.min(100, (hero.cp / hero.maxCp) * 100)}%`,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-[9px] text-[#241809] font-semibold">
                  {hero.cp}/{hero.maxCp}
                </div>
              </div>
            </div>

            {/* HP */}
            <div className="flex items-center gap-1">
              <span className="w-7 text-[10px] text-[#caa777]">HP</span>
              <div className="w-24 h-[0.7rem] bg-[#2c1b1b] rounded-[3px] overflow-hidden relative">
                <div
                  className="h-full bg-[#c9423b]"
                  style={{
                    width: `${Math.min(100, (hero.hp / hero.maxHp) * 100)}%`,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-[9px] text-[#330e0e] font-semibold">
                  {hero.hp}/{hero.maxHp}
                </div>
              </div>
            </div>

            {/* MP */}
            <div className="flex items-center gap-1">
              <span className="w-7 text-[10px] text-[#caa777]">MP</span>
              <div className="w-24 h-[0.7rem] bg-[#202637] rounded-[3px] overflow-hidden relative">
                <div
                  className="h-full bg-[#4d7ad9]"
                  style={{
                    width: `${Math.min(100, (hero.mp / hero.maxMp) * 100)}%`,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-[9px] text-[#0f1728] font-semibold">
                  {hero.mp}/{hero.maxMp}
                </div>
              </div>
            </div>

            {/* EXP */}
            <div className="flex items-center gap-1">
              <span className="w-7 text-[10px] text-[#caa777]">Exp</span>
              <div className="w-24 h-[0.7rem] bg-[#22321f] rounded-[3px] overflow-hidden relative">
                <div
                  className="h-full bg-[#4f9c3b]"
                  style={{ width: `${expPercent}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-[9px] text-[#0f1b0b] font-semibold">
                  {formatNumber(expCurrent)} / {formatNumber(expToNext)} ({expPercent}%)
                </div>
              </div>
            </div>

          </div>

          {/* ЦЕНТРАЛЬНАЯ ИНФОРМАЦИЯ */}
          <div className="flex flex-col items-center text-center mt-1 flex-1">

            <div className="font-bold text-sm">
              {level} ур. — {nickname || "Без имени"}
            </div>

            <div className="text-xs mt-1">
              Статус:{" "}
              {status ? (
                <span className="text-yellow-400">{status}</span>
              ) : (
                <span className="text-gray-400">нет</span>
              )}
              <button
                className="text-red-400 underline ml-1 text-[10px]"
                onClick={() => {
                  setNewStatus(status);
                  setShowStatusModal(true);
                }}
              >
                ред
              </button>
            </div>

            <div className="text-[11px] text-yellow-300 mt-1">
              Профессия: {profession || "Нет"}
            </div>
          </div>

          {/* КНОПКИ СПРАВА */}
          <div className="flex flex-col gap-1 text-right text-[10px] ml-2">
            <button
              className="w-16 py-[2px] bg-[#1d140c] text-white border border-[#5b4726] rounded-md"
              onClick={() => (window.location.href = "/")}
            >
              Выход
            </button>

            <button
              className="w-16 py-[2px] bg-[#1d140c] text-white border border-[#5b4726] rounded-md"
              onClick={() => alert("Меню в разработке")}
            >
              Меню
            </button>
          </div>

        </div>

        {/* ========================================= */}
        {/*     МОДЕЛЬ + СЛОТЫ — БЕЗ ИЗМЕНЕНИЙ       */}
        {/* ========================================= */}
        <div
          className="rounded-xl border-2 relative flex justify-center"
          style={{
            width: "330px",
            backgroundImage: "url('/hero-bg.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderColor: "#5b4726",
            paddingTop: "10px",
            paddingBottom: "10px",
          }}
        >
          {/* Левые слоты */}
          <div className="absolute left-2 top-4 flex flex-col gap-1">
            <img src={getSlotIcon("head")} className="w-7 h-7 border border-yellow-600 bg-black/50" />
            <img src={getSlotIcon("armor")} className="w-7 h-7 border border-yellow-600 bg-black/50" />
            <img src={getSlotIcon("legs")} className="w-7 h-7 border border-yellow-600 bg-black/50" />
            <img src={getSlotIcon("gloves")} className="w-7 h-7 border border-yellow-600 bg-black/50" />
            <img src={getSlotIcon("boots")} className="w-7 h-7 border border-yellow-600 bg-black/50" />
            <img src={getSlotIcon("belt")} className="w-7 h-7 border border-yellow-600 bg-black/50" />

            <div className="flex gap-1 mt-1">
              <img src={getSlotIcon("weapon")} className="w-7 h-7 border border-yellow-600 bg-black/50" />
              <img src={getSlotIcon("shield")} className="w-7 h-7 border border-yellow-600 bg-black/50" />
            </div>
          </div>

          {/* Правые слоты */}
          <div className="absolute right-2 top-4 flex flex-col gap-1 items-end">
            <img src={getSlotIcon("jewelry")} className="w-7 h-7 border border-yellow-600 bg-black/50" />
            <img src={getSlotIcon("necklace")} className="w-7 h-7 border border-yellow-600 bg-black/50" />
            <img src={getSlotIcon("earring_left")} className="w-7 h-7 border border-yellow-600 bg-black/50" />
            <img src={getSlotIcon("earring_right")} className="w-7 h-7 border border-yellow-600 bg-black/50" />
            <img src={getSlotIcon("ring_left")} className="w-7 h-7 border border-yellow-600 bg-black/50" />
            <img src={getSlotIcon("ring_right")} className="w-7 h-7 border border-yellow-600 bg-black/50" />

            <div className="flex gap-1 mt-1">
              <img src={getSlotIcon("tattoo")} className="w-7 h-7 border border-yellow-600 bg-black/50" />
              <img src={getSlotIcon("cloak")} className="w-7 h-7 border border-yellow-600 bg-black/50" />
            </div>
          </div>

          {/* Модель */}
          <div className="mt-16 mb-[-6px] flex flex-col items-center">
            <img src={characterImage} alt="character" className="w-24 drop-shadow-xl" />
            <div className="w-16 h-4 bg-black/70 rounded-full blur-md mt-[-4px]"></div>
          </div>
        </div>

        {/* ========================================================= */}
        {/*     КНОПКИ В ОДИН РЯД — Инвентарь + Снаряжение          */}
        {/* ========================================================= */}
        <div className="flex justify-center gap-2 mt-3">
          <button
            className={`${btn} bg-yellow-600 text-black w-32`}
            onClick={() => (window.location.href = "/inventory")}
          >
            Инвентарь
          </button>

          <button
            className={`${btn} bg-yellow-600 text-black w-32`}
            onClick={() => (window.location.href = "/equipment")}
          >
            Снаряжение
          </button>
        </div>

        {/* ========================================================= */}
        {/*     СТОЛБЕЦ ПУНКТОВ — КАК ТЫ ПРОСИЛ                        */}
        {/* ========================================================= */}
        <div className="w-[330px] text-left text-[12px] text-[#f4e2b8] mt-4 space-y-1">

          <div>Аденa: {adena}</div>
          <div>Coin of Luck: {coins}</div>

          <div>
            Опыт: {formatNumber(expCurrent)} / {formatNumber(expToNext)} ({expPercent}%)
          </div>

          <div>Количество получаемого опыта: + 0</div>
          <div>Очки умений: 0</div>

          <div className="mt-2">Умения</div>
          <div>Панель умений</div>
          <div>Мои квесты</div>

          <div className="mt-2">Рейтинги</div>
          <div>Ежедневные задания</div>

          <div className="mt-2">Премиум аккаунт (ускоренная прокачка)</div>
        </div>

        {/* Нижнее меню */}
        <div className="grid grid-cols-3 gap-2 mt-4 mb-2">
          <button className={btn} onClick={() => (window.location.href = "/city")}>
            Город
          </button>
          <button className={`${btn} bg-yellow-600 text-black`}>Персонаж</button>
          <button className={btn}>Статы</button>
        </div>
      </div>

      {/* Модалка статуса */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-[#1a1208] border border-[#5b4726] rounded-lg p-4" style={{ width: "260px" }}>
            <div className="text-yellow-400 font-bold text-sm text-center mb-2">
              Новый статус
            </div>

            <input
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full bg-black text-white border border-[#5b4726] p-1 text-sm mb-3 rounded"
              placeholder="Введите статус..."
            />

            <div className="flex gap-2 justify-center">
              <button
                onClick={saveStatus}
                className="bg-green-700 text-white text-[11px] py-1 px-4 rounded"
              >
                Сохранить
              </button>
              <button
                onClick={() => setShowStatusModal(false)}
                className="bg-gray-600 text-white text-[11px] py-1 px-4 rounded"
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
