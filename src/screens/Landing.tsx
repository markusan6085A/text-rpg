import React, { useState } from "react";

interface LandingProps {
  navigate: (path: string) => void;
  onLogin: (hero: any) => void;
}

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

export default function Landing({ navigate, onLogin }: LandingProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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

  // -----------------------------------------
  // ПРАВИЛЬНА ПЕРЕВІРКА ЛОГІНУ / ПАРОЛЯ
  // -----------------------------------------
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const nick = username.trim();
    const pass = password.trim();

    if (!nick || !pass) {
      alert("Введите логин и пароль");
      return;
    }

    const nickValidationError = validateNick(nick);
    if (nickValidationError) {
      alert(nickValidationError);
      return;
    }

    // 1. Читаємо аккаунти
    const accounts = JSON.parse(localStorage.getItem("l2_accounts_v2") || "[]");

    // 2. Шукаємо користувача
    const acc = accounts.find((a: any) => a.username === nick);

    if (!acc) {
      alert("Аккаунт не найден");
      return;
    }

    // 3. Перевірка пароля
    if (acc.password !== pass) {
      alert("Неверный пароль");
      return;
    }

    // 4. Якщо все ок → передаємо героя у App.tsx
    if (!acc.hero) {
      alert("Ошибка: у аккаунта нет героя");
      return;
    }

    onLogin(acc.hero);
  };

  // -----------------------------------------

  return (
    <div className="flex justify-center p-4">
      <div className="w-full max-w-[380px] space-y-4 text-center">

        {/* Картинка */}
        <img
          src="/landing-hero.jpg"
          className="w-full rounded"
          alt="Lineage 2"
        />

        <button className="l2-btn mt-2" onClick={() => navigate("/register")}>
          Начать игру
        </button>

        {/* Логин форма */}
        <form onSubmit={handleLogin} className="space-y-3 mt-2 text-center">

          <div className="text-sm text-white">Ник:</div>
          <div>
            <input
              value={username}
              onChange={handleUsernameChange}
              className="l2-input"
              maxLength={MAX_NICK_LENGTH}
              placeholder={`5-${MAX_NICK_LENGTH} символів`}
            />
            {nickError && (
              <div className="text-red-400 text-xs mt-1">
                {nickError}
              </div>
            )}
            {!nickError && username.length > 0 && (
              <div className="text-gray-400 text-xs mt-1">
                {username.length}/{MAX_NICK_LENGTH} символів
              </div>
            )}
          </div>

          <div className="text-sm text-white mt-1">Пароль:</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="l2-input"
          />

          <button type="submit" className="l2-btn mt-3">
            Войти в игру
          </button>
        </form>

        <button className="l2-btn mt-2" onClick={() => navigate("/register")}>
          Регистрация
        </button>

        <button className="l2-btn mt-2" onClick={() => navigate("/about")}>
          Об игре
        </button>

        <button className="l2-btn mt-2" onClick={() => alert("Недоступно")}>
          Забыли пароль?
        </button>
      </div>
    </div>
  );
}
