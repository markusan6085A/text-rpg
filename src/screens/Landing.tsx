import React, { useState } from "react";
import { getJSON } from "../state/persistence";
import { login, listCharacters } from "../utils/api";
import { useAuthStore } from "../state/authStore";
import { useAdminStore } from "../state/adminStore";
import { useCharacterStore } from "../state/characterStore";
import { loadHeroFromAPI } from "../state/heroStore/heroLoadAPI";
import { showToast } from "../state/toastStore";
import { getCityUiVariant } from "../utils/cityUiVariant";

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
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setCharacterId = useCharacterStore((s) => s.setCharacterId);
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nickError, setNickError] = useState<string | null>(null);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  // ЛОГІН ЧЕРЕЗ API
  // -----------------------------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const nick = username.trim();
      const pass = password.trim();

      if (!nick || !pass) {
        setError("Введите логин и пароль");
        setIsLoading(false);
        return;
      }

      const nickValidationError = validateNick(nick);
      if (nickValidationError) {
        setError(nickValidationError);
        setIsLoading(false);
        return;
      }

      // 1. Логін через API
      const accessToken = await login(nick, pass);
      setAccessToken(accessToken);
      // Перевіряємо адмін-сесію: якщо є валідний адмін-кукі — кнопка «Адмін» з’явиться в місті
      useAdminStore.getState().checkAdmin().catch((err) => {
        console.error("Admin check failed after login:", err);
      });

      // 2. Отримуємо список персонажів
      const characters = await listCharacters();
      if (characters.length === 0) {
        setError("У аккаунта нет персонажей. Перейдите на страницу регистрации для создания персонажа.");
        setIsLoading(false);
        // Автоматично перенаправляємо на реєстрацію через 2 секунди
        setTimeout(() => {
          navigate("/register");
        }, 2000);
        return;
      }

      // 3. Використовуємо першого персонажа (якщо їх кілька - можна додати вибір пізніше)
      const character = characters[0];
      setCharacterId(character.id);

      // 4. Завантажуємо героя з API
      const loadedHero = await loadHeroFromAPI();
      if (loadedHero) {
        onLogin(loadedHero);
      } else {
        // Fallback: пробуємо завантажити з localStorage
        const accounts = getJSON<any[]>("l2_accounts_v2", []);
        const acc = accounts.find((a: any) => a.username === nick);
        if (acc && acc.hero) {
          onLogin(acc.hero);
        } else {
          setError("Ошибка: не удалось загрузить персонажа");
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      console.error('Error details:', {
        message: err?.message,
        status: err?.status,
        stack: err?.stack,
        error: err
      });
      
      // ❗ Покращена обробка помилок - показуємо зрозумілі повідомлення
      let errorMessage = "Ошибка входа. Проверьте логин и пароль.";
      
      if (err?.status === 401) {
        errorMessage = "Неверный логин или пароль";
      } else if (err?.status === 500) {
        errorMessage = "Ошибка сервера. Попробуйте позже.";
      } else if (err?.message) {
        // Якщо повідомлення не "Internal Server Error", показуємо його
        if (err.message !== "Internal Server Error" && !err.message.includes("Internal")) {
          errorMessage = err.message;
        } else {
          errorMessage = "Ошибка сервера. Попробуйте позже.";
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------------------

  const isL2 = getCityUiVariant() === "l2";
  const l2Frame =
    "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.55)] bg-[radial-gradient(ellipse_100%_40%_at_50%_-10%,rgba(120,90,45,0.22)_0%,transparent_45%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";
  const shell = isL2
    ? "flex justify-center p-4 min-h-[100dvh] bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(90,70,40,0.35)_0%,transparent_55%),linear-gradient(180deg,#12100c_0%,#0a0907_100%)]"
    : "flex justify-center p-4";
  const labelCls = isL2 ? "text-sm text-[#d4c4a8]" : "text-sm text-white";
  const mutedCls = isL2 ? "text-[#8a7a60]" : "text-gray-400";
  const errCls = isL2 ? "text-[#d4786a]" : "text-red-400";
  const inputCls = isL2
    ? "w-full max-w-[280px] mx-auto block text-sm text-[#e8dcc8] placeholder-[#6a6048] bg-[#0f0a06] border border-[#5c4a32]/60 rounded-md px-2 py-2"
    : "l2-input";
  const btnL2 =
    "block w-full max-w-[280px] mx-auto py-2.5 px-4 rounded-md text-sm font-medium bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 text-[#e8c56e] shadow-[inset_0_1px_0_rgba(199,173,128,0.1)] hover:border-[#c7ad80]/50 active:scale-[0.99] transition-[border-color,transform] disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <div className={shell}>
      <div className={`w-full max-w-[400px] space-y-4 text-center ${isL2 ? "py-2" : ""}`}>
        <div className={isL2 ? `${l2Frame} p-3 sm:p-4 space-y-4` : "space-y-4"}>
          {/* Картинка */}
          <div className={`relative ${isL2 ? "-mt-1" : "-mt-8"} rounded-lg overflow-hidden border border-black/40`}>
            <img src="/landing-hero1.jpg" className="w-full" alt="Lineage 2" />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ boxShadow: "inset 0 0 40px 20px rgba(0, 0, 0, 0.5)" }}
            />
          </div>

          <button
            type="button"
            className={isL2 ? btnL2 : "l2-btn mt-2"}
            onClick={() => navigate("/register")}
          >
            Начать игру
          </button>

          {/* Логин форма */}
          <form onSubmit={handleLogin} className="space-y-3 mt-2 text-center">
            <div className={labelCls}>Ник:</div>
            <div>
              <input
                id="landing-username"
                name="username"
                value={username}
                onChange={handleUsernameChange}
                className={inputCls}
                maxLength={MAX_NICK_LENGTH}
                placeholder={`5-${MAX_NICK_LENGTH} символів`}
                autoComplete="username"
              />
              {nickError && <div className={`${errCls} text-xs mt-1`}>{nickError}</div>}
              {!nickError && username.length > 0 && (
                <div className={`${mutedCls} text-xs mt-1`}>
                  {username.length}/{MAX_NICK_LENGTH} символів
                </div>
              )}
            </div>

            <div className={`${labelCls} mt-1`}>Пароль:</div>
            <input
              id="landing-password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              autoComplete="current-password"
            />

            {error && <div className={`${errCls} text-sm`}>{error}</div>}
            <button type="submit" className={isL2 ? `${btnL2} mt-3` : "l2-btn mt-3"} disabled={isLoading}>
              {isLoading ? "Вход..." : "Войти в игру"}
            </button>
          </form>

          <button type="button" className={isL2 ? btnL2 : "l2-btn mt-2"} onClick={() => navigate("/register")}>
            Регистрация
          </button>

          <button type="button" className={isL2 ? btnL2 : "l2-btn mt-2"} onClick={() => setShowAboutModal(true)}>
            Об игре
          </button>

          <button type="button" className={isL2 ? btnL2 : "l2-btn mt-2"} onClick={() => showToast("Недоступно", "info")}>
            Забыли пароль?
          </button>
        </div>
      </div>

      {/* Модальне вікно "Про гру" */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4" onClick={() => setShowAboutModal(false)}>
          <div
            className={
              isL2
                ? `max-w-[600px] w-full max-h-[90vh] overflow-y-auto ${l2Frame} p-5 sm:p-6`
                : "bg-[#14110c] border border-white/40 rounded-lg p-6 max-w-[600px] w-full max-h-[90vh] overflow-y-auto"
            }
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={
                isL2
                  ? "flex justify-between items-center mb-4 border-b border-[#5c4a32]/45 pb-3"
                  : "flex justify-between items-center mb-4"
              }
            >
              <h2 className={isL2 ? "text-[#e8c56e] font-bold text-base sm:text-lg pr-2" : "text-yellow-400 font-bold text-lg"}>
                ⚔️ L2MOBI.DOP — світ, де вирішує твій вибір
              </h2>
              <button
                type="button"
                onClick={() => setShowAboutModal(false)}
                className={
                  isL2
                    ? "text-[#8a7a60] hover:text-[#e8dcc8] text-2xl font-bold shrink-0"
                    : "text-gray-400 hover:text-white text-2xl font-bold shrink-0"
                }
              >
                ×
              </button>
            </div>

            <div className={isL2 ? "text-[#d4c4a8] text-sm space-y-4 leading-relaxed" : "text-white text-sm space-y-4 leading-relaxed"}>
              <p>
                Ласкаво просимо у мобільний онлайн-світ Lineage II, створений для тих, хто любить свободу розвитку, різноманіття контенту та справжній хардкор.
              </p>
              
              <p>
                Наш сервер працює з рейтами x5 — ідеальний баланс між динамікою та глибиною гри.
                Ти сам вирішуєш, ким бути і як розвиватися.
              </p>

              <div>
                <h3 className={isL2 ? "text-[#c9a44c] font-semibold mb-2" : "text-yellow-300 font-semibold mb-2"}>
                  🧬 Унікальна система розвитку
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Сотні предметів на вибір</li>
                  <li>Сет-бонуси, що реально впливають на стиль гри</li>
                  <li>Додаткові скіли від інших рас — унікальна механіка, якої ти не бачив раніше</li>
                  <li>Гнучкі білді та експерименти без обмежень</li>
                </ul>
              </div>

              <div>
                <h3 className={isL2 ? "text-[#c9a44c] font-semibold mb-2" : "text-yellow-300 font-semibold mb-2"}>✨ Комфортний старт</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Безкоштовний баф для новачків</li>
                  <li>Швидке входження в гру без втрати інтересу</li>
                  <li>Зручна адаптація як для соло-гравців, так і для партій</li>
                </ul>
              </div>

              <div>
                <h3 className={isL2 ? "text-[#c9a44c] font-semibold mb-2" : "text-yellow-300 font-semibold mb-2"}>
                  🐉 Масштабний PvE-контент
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Велика кількість рейд-босів</li>
                  <li>Полювання на небезпечних істот</li>
                  <li>Крафт, ресурси, економіка</li>
                  <li>Риболовля для тих, хто цінує спокій і прибуток</li>
                </ul>
              </div>

              <div>
                <h3 className={isL2 ? "text-[#c9a44c] font-semibold mb-2" : "text-yellow-300 font-semibold mb-2"}>⚔️ Справжній PvP</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Олімпіада — докажи, що ти кращий</li>
                  <li>TvT-битви — командна тактика та драйв</li>
                  <li>Захоплення замків — влада, податки та престиж</li>
                </ul>
              </div>

              <div>
                <h3 className={isL2 ? "text-[#c9a44c] font-semibold mb-2" : "text-yellow-300 font-semibold mb-2"}>📜 Активності щодня</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Щоденні завдання</li>
                  <li>Недельні квести</li>
                  <li>Постійні цілі та нагороди</li>
                  <li>Гра ніколи не стоїть на місці</li>
                </ul>
              </div>

              <div>
                <h3 className={isL2 ? "text-[#c9a44c] font-semibold mb-2" : "text-yellow-300 font-semibold mb-2"}>🔥 Для кого ця гра?</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Для фанатів класичної Lineage II</li>
                  <li>Для тих, хто любить розвиток, PvP і свободу</li>
                  <li>Для гравців, яким важливо, щоб кожен клас і кожен вибір мав значення</li>
                </ul>
              </div>

              <p
                className={
                  isL2 ? "text-[#e8c56e] font-semibold text-center mt-6" : "text-yellow-300 font-semibold text-center mt-6"
                }
              >
                L2MOBI.DOP — це не просто сервер.<br />
                Це світ, у якому ти залишаєш свій слід.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
