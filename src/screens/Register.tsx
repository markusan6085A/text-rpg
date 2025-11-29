// src/screens/Register.tsx
import React, { useState } from "react";
import { createNewHero } from "../state/heroFactory";
import { useHeroStore } from "../state/heroStore";

interface RegisterProps {
  navigate: (path: string) => void;
}

export default function Register({ navigate }: RegisterProps) {
  const loadHero = useHeroStore((s) => s.loadHero);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [race, setRace] = useState("Человек");
  const [clazz, setClazz] = useState("Воин");
  const [gender, setGender] = useState("Мужчина");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const accounts = JSON.parse(localStorage.getItem("l2_accounts_v2") || "[]");

    if (accounts.find((acc: any) => acc.username === username)) {
      alert("Аккаунт уже существует!");
      return;
    }

    if (password !== password2) {
      alert("Пароли не совпадают!");
      return;
    }

    // Создаём героя через фабрику
    const coreHero = createNewHero({
      id: `hero_${Date.now()}`,
      name: username,
      username,
      race,
      klass: clazz,
      gender,
    });

    // Записываем аккаунт в localStorage
    accounts.push({
      username,
      password,
      hero: coreHero,
    });

    localStorage.setItem("l2_accounts_v2", JSON.stringify(accounts));

    // Загружаем героя в global store
    loadHero();

    navigate("/city");
  };

  return (
    <div className="min-h-screen bg-black flex justify-center p-4">
      <div className="register-panel w-full max-w-[380px] p-6">
        <h1 className="text-white text-lg font-bold text-center mb-4">
          Создание персонажа
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-white text-sm w-[100px] text-right">Ник:</span>
            <input
              className="l2-input w-[50%] rounded-md"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-white text-sm w-[100px] text-right">
              Пароль:
            </span>
            <input
              type="password"
              className="l2-input w-[50%] rounded-md"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-white text-sm w-[100px] text-right">
              Повтор:
            </span>
            <input
              type="password"
              className="l2-input w-[50%] rounded-md"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-white text-sm w-[100px] text-right">Раса:</span>
            <select
              className="l2-input w-[50%] rounded-md"
              value={race}
              onChange={(e) => setRace(e.target.value)}
            >
              <option value="Человек">Человек</option>
              <option value="Эльф">Эльф</option>
              <option value="Темный Эльф">Темный Эльф</option>
              <option value="Орк">Орк</option>
              <option value="Гном">Гном</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-white text-sm w-[100px] text-right">Класс:</span>
            <select
              className="l2-input w-[50%] rounded-md"
              value={clazz}
              onChange={(e) => setClazz(e.target.value)}
            >
              <option value="Воин">Воин</option>
              <option value="Маг">Маг</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-white text-sm w-[100px] text-right">Стать:</span>
            <select
              className="l2-input w-[50%] rounded-md"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="Мужчина">Мужчина</option>
              <option value="Женщина">Женщина</option>
            </select>
          </div>

          <button type="submit" className="l2-btn mt-2 w-full">
            Создать персонажа
          </button>
        </form>

        <button className="l2-btn mt-4 w-full" onClick={() => navigate("/")}>
          ← Назад
        </button>
      </div>
    </div>
  );
}
