import React, { useState, useEffect } from "react";
import { createNewHero } from "../state/heroFactory";
import { clearBattlePersist } from "../state/battle/persist";
import { useHeroStore } from "../state/heroStore";
import { syncCurrentUserAndAccountHero } from "../state/heroStore/heroPersistence";
import { register, createCharacter, updateCharacter } from "../utils/api";
import { useAuthStore } from "../state/authStore";
import { useAdminStore } from "../state/adminStore";
import { useCharacterStore } from "../state/characterStore";
import { loadHeroFromAPI } from "../state/heroStore/heroLoadAPI";
import { getCityUiVariant } from "../utils/cityUiVariant";
import { resetTutorialHint } from "../state/gameSettings";

interface RegisterProps {
  navigate: (path: string) => void;
}

const raceOptions = [
  { value: "Human", label: "Человек" },
  { value: "Dark Elf", label: "Темный Эльф" },
  { value: "Elf", label: "Эльф" },
  { value: "Orc", label: "Орк" },
  { value: "Dwarf", label: "Гном" },
];

const classOptions = [
  { value: "Mystic", label: "Мистик" },
  { value: "Fighter", label: "Боец" },
];

const genderOptions = [
  { value: "Male", label: "Мужской" },
  { value: "Female", label: "Женский" },
];

/** Повна ширина картки — без фіксованих 400px (на вузькому екрані не вилазить за рамку) */
const CONTROL_WRAP = "w-full max-w-full min-w-0";

// Дозволені символи: букви, цифри + 4 спеціальні символи (_, -, ., @)
const ALLOWED_NICK_CHARS = /^[a-zA-Z0-9_\-\.@]+$/;
const MIN_NICK_LENGTH = 5;
const MAX_NICK_LENGTH = 15;

const validateNick = (nick: string): string | null => {
  const trimmed = nick.trim();
  
  if (trimmed.length < MIN_NICK_LENGTH) {
    return `Ник должен содержать минимум ${MIN_NICK_LENGTH} символов`;
  }
  
  if (trimmed.length > MAX_NICK_LENGTH) {
    return `Ник должен содержать максимум ${MAX_NICK_LENGTH} символов`;
  }
  
  if (!ALLOWED_NICK_CHARS.test(trimmed)) {
    return "Ник может содержать только буквы, цифры и символы: _, -, ., @";
  }
  
  return null;
};

export default function Register({ navigate }: RegisterProps) {
  const loadHero = useHeroStore((s) => s.loadHero);
  const setHero = useHeroStore((s) => s.setHero);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setCharacterId = useCharacterStore((s) => s.setCharacterId);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [race, setRace] = useState(raceOptions[0].value);
  const [clazz, setClazz] = useState(classOptions[0].value);
  const [gender, setGender] = useState(genderOptions[0].value);
  const [nickError, setNickError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Фільтруємо класи залежно від раси
  const getAvailableClasses = () => {
    if (race === "Dwarf") {
      // Для гнома тільки воїн
      return classOptions.filter(opt => opt.value === "Fighter");
    }
    return classOptions;
  };

  const availableClasses = getAvailableClasses();

  // Автоматично встановлюємо клас на "Fighter", якщо вибрано гнома
  useEffect(() => {
    if (race === "Dwarf" && clazz === "Mystic") {
      setClazz("Fighter");
    }
  }, [race, clazz]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Обмежуємо довжину при введенні
    if (value.length <= MAX_NICK_LENGTH) {
      setUsername(value);
      // Перевіряємо валідацію
      const error = validateNick(value);
      setNickError(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const trimmedUsername = username.trim();
      const nickValidationError = validateNick(trimmedUsername);
      
      if (nickValidationError) {
        setError(nickValidationError);
        setIsLoading(false);
        return;
      }

      if (password !== password2) {
        setError("Пароли не совпадают.");
        setIsLoading(false);
        return;
      }

      if (password.length < 6) {
        setError("Пароль должен содержать минимум 6 символов.");
        setIsLoading(false);
        return;
      }

      // 1. Реєстрація через API
      const accessToken = await register(trimmedUsername, password);
      setAccessToken(accessToken);
      useAdminStore.getState().checkAdmin().catch(() => {});

      // 2. Створення персонажа через API
      const character = await createCharacter({
        name: trimmedUsername,
        race,
        classId: clazz,
        sex: gender,
      });
      setCharacterId(character.id);
      // Обучалка під барами — показати знову для нового персонажа (ключ глобальний у браузері)
      resetTutorialHint();

      // 3. Створення героя через createNewHero
      const coreHero = createNewHero({
        id: `hero_${Date.now()}`,
        name: trimmedUsername,
        username: trimmedUsername,
        race,
        klass: clazz,
        gender,
      });

      // 4. Збереження heroJson через API
      await updateCharacter(character.id, {
        heroJson: coreHero,
      });

      // 5. Очищаємо бафи з попереднього героя при створенні нового
      clearBattlePersist();
      clearBattlePersist(trimmedUsername);
      
      // 5.1. Поточний користувач для loadHero — без запису героя в accounts (ще немає повного hero)
      syncCurrentUserAndAccountHero(trimmedUsername);
      
      // 6. Завантажуємо героя з API
      const loadedHero = await loadHeroFromAPI();
      if (loadedHero) {
        setHero(loadedHero);
        syncCurrentUserAndAccountHero(trimmedUsername, loadedHero);
        navigate("/city");
      } else {
        // Fallback: встановлюємо героя вручну
        const fallbackHero = { ...coreHero, name: trimmedUsername, username: trimmedUsername, sp: 0, skills: [] } as any;
        setHero(fallbackHero);
        syncCurrentUserAndAccountHero(trimmedUsername, fallbackHero);
        navigate("/city");
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      const errorMessage = err?.message || "Ошибка регистрации. Попробуйте снова.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isL2 = getCityUiVariant() === "l2";
  const l2Frame =
    "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.55)] bg-[radial-gradient(ellipse_100%_40%_at_50%_-10%,rgba(120,90,45,0.22)_0%,transparent_45%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";
  const shell = isL2
    ? "flex justify-center items-start px-2.5 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4 min-h-[100dvh] box-border overflow-x-hidden bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(90,70,40,0.35)_0%,transparent_55%),linear-gradient(180deg,#12100c_0%,#0a0907_100%)]"
    : "flex justify-center items-start px-2.5 py-2 sm:p-4 box-border overflow-x-hidden";
  const labelText = isL2 ? "text-[#d4c4a8]" : "text-white";
  const h1Cls = isL2
    ? "text-[#e8c56e] text-base sm:text-lg font-semibold text-center [text-shadow:0_1px_2px_rgba(0,0,0,0.75)] tracking-tight"
    : "text-white text-base sm:text-lg font-semibold text-center";
  const labelRowCls = "text-[11px] sm:text-xs font-medium text-center w-full";
  const inputCls = isL2
    ? "w-full box-border text-center sm:text-left text-xs sm:text-sm text-[#e8dcc8] placeholder-[#6a6048] placeholder:text-center sm:placeholder:text-left bg-[#0f0a06] border border-[#5c4a32]/60 rounded-md px-2.5 py-1.5 sm:py-2 min-h-[2rem] sm:min-h-[2.25rem]"
    : "l2-input w-full box-border text-xs sm:text-sm min-h-[2rem]";
  const selectCls = isL2
    ? "w-full box-border text-center text-xs sm:text-sm text-[#e8dcc8] bg-[#0f0a06] border border-[#5c4a32]/60 rounded-md px-2 py-1.5 sm:py-2 min-h-[2rem] sm:min-h-[2.25rem] appearance-none pr-8"
    : "l2-input w-full box-border text-xs sm:text-sm text-center min-h-[2rem]";
  const btnSubmit = isL2
    ? "w-full mt-2 sm:mt-3 py-2 sm:py-2.5 px-3 rounded-md text-xs sm:text-sm font-medium bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 text-[#e8c56e] shadow-[inset_0_1px_0_rgba(199,173,128,0.1)] hover:border-[#c7ad80]/50 active:scale-[0.99] transition-all disabled:opacity-60"
    : "l2-btn w-full mt-2 sm:mt-3 py-2 text-xs sm:text-sm";
  const btnBack = isL2
    ? "w-full py-2 sm:py-2.5 px-3 rounded-md text-xs sm:text-sm font-medium bg-gradient-to-b from-[#2a2419] to-[#16130e] border border-[#5c4a32]/60 text-[#c9a44c] hover:border-[#c7ad80]/45"
    : "l2-btn w-full py-2 text-xs sm:text-sm";
  const errCls = isL2 ? "text-[#d4786a]" : "text-red-400";
  const mutedCls = isL2 ? "text-[#8a7a60]" : "text-gray-400";

  return (
    <div className={shell}>
      <div className="w-full max-w-[min(100%,22rem)] sm:max-w-[26rem] space-y-2 sm:space-y-3">
        <div className={isL2 ? `${l2Frame} p-3 sm:p-5 space-y-2 sm:space-y-3` : "space-y-2 sm:space-y-3"}>
          <h1 className={h1Cls}>Создать героя</h1>

          <form onSubmit={handleSubmit} className="flex flex-col items-stretch gap-2 sm:gap-3 w-full min-w-0">
          {/* INPUTS */}
          {[
            {
              label: "Логин",
              element: (
                <div className="w-full">
                  <input
                    id="register-username"
                    name="username"
                    className={inputCls}
                    value={username}
                    onChange={handleUsernameChange}
                    maxLength={MAX_NICK_LENGTH}
                    placeholder={`5-${MAX_NICK_LENGTH} символов`}
                    autoComplete="username"
                  />
                  {nickError && (
                    <div className={`${errCls} text-[10px] sm:text-xs mt-0.5 text-center leading-tight`}>
                      {nickError}
                    </div>
                  )}
                  {!nickError && username.length > 0 && (
                    <div className={`${mutedCls} text-[10px] sm:text-xs mt-0.5 text-center`}>
                      {username.length}/{MAX_NICK_LENGTH}
                    </div>
                  )}
                </div>
              ),
            },
            {
              label: "Пароль",
              element: (
                <input
                  type="password"
                  className={inputCls}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              ),
            },
            {
              label: "Повтор",
              element: (
                <input
                  id="register-password2"
                  name="password2"
                  type="password"
                  className={inputCls}
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  autoComplete="new-password"
                />
              ),
            },
          ].map((row) => (
            <label
              key={row.label}
              className={`${labelText} flex flex-col items-stretch gap-1 sm:gap-1.5 w-full min-w-0`}
            >
              <span className={labelRowCls}>{row.label}:</span>
              <div className={CONTROL_WRAP}>{row.element}</div>
            </label>
          ))}

          {/* SELECTS */}
          {[
            { label: "Раса", options: raceOptions, value: race, setter: setRace },
            {
              label: "Класс",
              options: availableClasses,
              value: clazz,
              setter: setClazz,
            },
            {
              label: "Пол",
              options: genderOptions,
              value: gender,
              setter: setGender,
            },
          ].map((row) => (
            <label
              key={row.label}
              className={`${labelText} flex flex-col items-stretch gap-1 sm:gap-1.5 w-full min-w-0`}
            >
              <span className={labelRowCls}>{row.label}:</span>
              <div className={CONTROL_WRAP}>
                <select
                  className={selectCls}
                  style={
                    isL2
                      ? {
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23c9a44c'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 0.5rem center",
                          backgroundSize: "0.75rem",
                        }
                      : undefined
                  }
                  value={row.value}
                  onChange={(e) => row.setter(e.target.value)}
                >
                  {row.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          ))}

          {error && (
            <div className={`${errCls} text-[11px] sm:text-sm text-center leading-snug px-0.5`}>
              {error}
            </div>
          )}
          <button 
            type="submit" 
            className={btnSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Регистрация..." : "Зарегистрироваться"}
          </button>
        </form>

        <button
          className={btnBack}
          onClick={() => navigate("/")}
          type="button"
        >
          Вернуться
        </button>
        </div>
      </div>
    </div>
  );
}
