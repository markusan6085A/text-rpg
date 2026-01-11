import React, { useState } from "react";
import { createNewHero } from "../state/heroFactory";
import { useHeroStore } from "../state/heroStore";

interface RegisterProps {
  navigate: (path: string) => void;
}

const raceOptions = [
  { value: "Human", label: "Human" },
  { value: "Dark Elf", label: "Dark Elf" },
  { value: "Elf", label: "Elf" },
  { value: "Dwarf", label: "Dwarf" },
];

const classOptions = [
  { value: "Mystic", label: "Mystic" },
  { value: "Fighter", label: "Fighter" },
];

const genderOptions = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
];

const CONTROL_WRAP = "w-[400px]"; // збільшена ширина для input/select

// Дозволені символи: букви, цифри + 4 спеціальні символи (_, -, ., @)
const ALLOWED_NICK_CHARS = /^[a-zA-Z0-9_\-\.@]+$/;
const MIN_NICK_LENGTH = 5;
const MAX_NICK_LENGTH = 15;

const validateNick = (nick: string): string | null => {
  const trimmed = nick.trim();
  
  if (trimmed.length < MIN_NICK_LENGTH) {
    return `Нік повинен містити мінімум ${MIN_NICK_LENGTH} символів`;
  }
  
  if (trimmed.length > MAX_NICK_LENGTH) {
    return `Нік повинен містити максимум ${MAX_NICK_LENGTH} символів`;
  }
  
  if (!ALLOWED_NICK_CHARS.test(trimmed)) {
    return "Нік може містити тільки букви, цифри та символи: _, -, ., @";
  }
  
  return null;
};

export default function Register({ navigate }: RegisterProps) {
  const loadHero = useHeroStore((s) => s.loadHero);
  const setHero = useHeroStore((s) => s.setHero);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [race, setRace] = useState(raceOptions[0].value);
  const [clazz, setClazz] = useState(classOptions[0].value);
  const [gender, setGender] = useState(genderOptions[0].value);
  const [nickError, setNickError] = useState<string | null>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUsername = username.trim();
    const nickValidationError = validateNick(trimmedUsername);
    
    if (nickValidationError) {
      alert(nickValidationError);
      return;
    }

    const accounts = JSON.parse(localStorage.getItem("l2_accounts_v2") || "[]");

    if (accounts.find((acc: any) => acc.username === trimmedUsername)) {
      alert("Username already exists.");
      return;
    }

    if (password !== password2) {
      alert("Passwords do not match.");
      return;
    }

    const coreHero = createNewHero({
      id: `hero_${Date.now()}`,
      name: trimmedUsername,
      username: trimmedUsername,
      race,
      klass: clazz,
      gender,
    });

    accounts.push({
      username: trimmedUsername,
      password,
      hero: coreHero,
    });

    localStorage.setItem("l2_accounts_v2", JSON.stringify(accounts));
    
    // Встановлюємо поточного користувача
    localStorage.setItem(
      "l2_current_user",
      JSON.stringify(trimmedUsername)
    );
    
    // Встановлюємо героя в store
    setHero(coreHero);
    
    // Переходимо в місто
    navigate("/city");
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
                    placeholder={`5-${MAX_NICK_LENGTH} символів`}
                  />
                  {nickError && (
                    <div className="text-red-400 text-xs mt-1 text-center">
                      {nickError}
                    </div>
                  )}
                  {!nickError && username.length > 0 && (
                    <div className="text-gray-400 text-xs mt-1 text-center">
                      {username.length}/{MAX_NICK_LENGTH} символів
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
              options: classOptions,
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

          <button type="submit" className="l2-btn w-full max-w-[400px] mt-3">
            Зарегистрироваться
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
