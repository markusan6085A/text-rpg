import React, { useState, useEffect } from "react";
import { createNewHero } from "../state/heroFactory";
import { clearBattlePersist } from "../state/battle/persist";
import { useHeroStore } from "../state/heroStore";
import { getJSON, setJSON } from "../state/persistence";
import { register, createCharacter, updateCharacter, adminLogout } from "../utils/api";
import { useAuthStore } from "../state/authStore";
import { useAdminStore } from "../state/adminStore";
import { useCharacterStore } from "../state/characterStore";
import { loadHeroFromAPI } from "../state/heroStore/heroLoadAPI";

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

const CONTROL_WRAP = "w-[400px]"; // збільшена ширина для input/select

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
      adminLogout().catch(() => {});
      useAdminStore.getState().resetAdmin();

      // 2. Створення персонажа через API
      const character = await createCharacter({
        name: trimmedUsername,
        race,
        classId: clazz,
        sex: gender,
      });
      setCharacterId(character.id);

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
      
      // 6. Завантажуємо героя з API
      const loadedHero = await loadHeroFromAPI();
      if (loadedHero) {
        setHero(loadedHero);
        navigate("/city");
      } else {
        // Fallback: встановлюємо героя вручну
        setHero({
          ...coreHero,
          sp: 0,
          skills: [],
          battleStats: {} as any,
        } as any);
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

  return (
    <div className="flex justify-center p-4">
      <div className="w-full max-w-[380px] space-y-4">
        <h1 className="text-white text-xl font-semibold text-center">
          Создать героя
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
          {/* INPUTS */}
          {[
            {
              label: "Логин",
              element: (
                <div className="w-full">
                  <input
                    className="l2-input w-full"
                    value={username}
                    onChange={handleUsernameChange}
                    maxLength={MAX_NICK_LENGTH}
                    placeholder={`5-${MAX_NICK_LENGTH} символов`}
                  />
                  {nickError && (
                    <div className="text-red-400 text-xs mt-1 text-center">
                      {nickError}
                    </div>
                  )}
                  {!nickError && username.length > 0 && (
                    <div className="text-gray-400 text-xs mt-1 text-center">
                      {username.length}/{MAX_NICK_LENGTH} символов
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
                  className="l2-input w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              ),
            },
            {
              label: "Повтор",
              element: (
                <input
                  type="password"
                  className="l2-input w-full"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                />
              ),
            },
          ].map((row) => (
            <label
              key={row.label}
              className="text-white flex flex-col items-center gap-2 w-full"
            >
              <span className="label-text">{row.label}:</span>
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
              className="text-white flex flex-col items-center gap-2 w-full"
            >
              <span className="label-text">{row.label}:</span>
              <div className={CONTROL_WRAP}>
                <select
                  className="l2-input w-full"
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
            <div className="text-red-400 text-sm text-center">
              {error}
            </div>
          )}
          <button 
            type="submit" 
            className="l2-btn w-full max-w-[400px] mt-3"
            disabled={isLoading}
          >
            {isLoading ? "Регистрация..." : "Зарегистрироваться"}
          </button>
        </form>

        <button
          className="l2-btn w-full max-w-[400px]"
          onClick={() => navigate("/")}
          type="button"
        >
          Вернуться
        </button>
      </div>
    </div>
  );
}
