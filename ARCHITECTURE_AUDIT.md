# Архітектурний аудит: чи гра стоїть на твердому фундаменті

**Дата:** 2025-02-17. Тільки аналіз, без змін у коді.

---

## 1) Фінальний вердикт

**Статус фундаменту: 🟡 умовно твердий**

**Чому саме:**

1. **Єдиний потік запису героя** — heroPersistence єдине місце запису в `l2_accounts_v2` (окрім міграцій у heroLoad); setHero не пише в localStorage; loadHero не пише в кінці. Це захищає від випадкового перезатирання.

2. **Захист від не-героя в setHero** — isHeroPayload відсікає клан/порожній об'єкт; null не перетирає героя "порожняком" (при null викликається set({ hero: null }), не підміна існуючого героя).

3. **Bootstrap не зависає назавжди** — 8s fallback timer + finally завжди ставить setIsLoading(false); refresh при 401 не кидає, продовжуємо без токена.

4. **409/429 не губять прогрес** — при 429 зберігається в localStorage + cooldown; при 409 один retry з merge, потім backup у localStorage і alert; критичні зміни в черзі після cooldown.

5. **Merge policy в heroLoadAPI** — local vs server за чіткими критеріями (max для exp/level/sp/adena/mobsKilled/skills, local preferred за lastSavedAt/бафи); equipment/skills/buffs об'єднуються (merge/dedupe), не простий replace.

6. **Після Register** — ставиться тільки `l2_current_user`; запису в `l2_accounts_v2` для нового юзера немає (saveHeroToLocalStorageOnly при accIndex === -1 просто return). Тому loadHero() для щойно зареєстрованого все одно повертає null (немає запису в accounts). Локальний кеш "вмикається" лише після того, як з’явиться запис — зараз його ніде не створюють.

7. **401** — токен скидається, але автоматичного редіректу на логін немає; користувач залишається на екрані, який викликав API; при наступному F5/навігації потрапляє на Landing. Це прийнятно, але не ідеально для UX.

---

## 2) Перевірка 12 критичних інваріантів

| # | Інваріант | Результат | Файл(и) | Пояснення |
|---|-----------|----------|---------|-----------|
| **Auth & Session** |
| 1 | Refresh/login/bootstrap не можуть зациклитися або лишити UI в "Loading" назавжди | **PASS** | `App.tsx` | Один useEffect без залежностей від hero/auth у bootstrap; fallbackTimer 8s (ряд. 166–169); у finally завжди setIsLoading(false) (271–277). Refresh 401 ловиться, не кидає. |
| 2 | Втрата токена/401 не ламає гру, коректно веде до логіну | **PASS** | `api.ts` | При 401: setAccessToken(null), resetAdmin(), throw (151–162). Клієнт отримує помилку; при наступному F5 loadHero() може повернути null, isAuthenticated false → показується Landing. Редірект не примусовий, але стан узгоджений. |
| **Hero Source of Truth** |
| 3 | Є один канонічний hero у heroStore, він не перетирається "порожняком" | **PASS** | `heroStore.ts` | setHero(null) ставить hero: null, не підміняє існуючого. setHero(не-герой) відхиляється isHeroPayload (209–267), return без set. Запис у localStorage тільки через updateHero → heroPersistence. |
| 4 | l2_current_user виставляється після login і після register | **PASS** | `App.tsx`, `Register.tsx` | Login: onLogin колбек setJSON("l2_current_user", loadedHero.username) (322, 540). Register: setJSON("l2_current_user", trimmedUsername) в обох гілках успіху (168, 178). |
| 5 | l2_accounts_v2 пишеться тільки в дозволених місцях | **PASS** | grep по проєкту | setJSON("l2_accounts_v2") тільки в heroLoad.ts (міграції), heroPersistence.ts (усі сценарії save), fixProfession.ts (fixAllHeroProfessions — ніде не викликається). Сторонніх записів немає. |
| **Persistence & Sync** |
| 6 | Після критичних дій прогрес не губиться при F5 | **PASS** (з нюансом) | `heroStore.ts`, `heroPersistence.ts` | Критичні зміни (exp, level, inventory, adena, skills, equipment, buffs тощо) → immediateSave → saveHeroToLocalStorageOnly + saveHeroToLocalStorage. localStorage пишеться синхронно; при F5 loadHero() дає героя з accounts. Нюанс: для щойно зареєстрованого в accounts немає запису, тому перший F5 тримається лише на API. |
| 7 | 409 і 429 не ведуть до втрати прогресу | **PASS** | `heroPersistence.ts` | 429 (464–506): setRateLimitCooldown, запис у localStorage (mergedBuffs), return. 409 (508–696): один retry з GET+merge, якщо ок — saveHeroOnce; інакше backup у localStorage (674–691) + alert. Найгірший кейс: два 409 підряд — прогрес у localStorage, користувач бачить alert і F5. |
| 8 | Merge policy в heroLoadAPI не відкочує exp/level/sp/adena/skills/inventory/buffs | **PASS** | `heroLoadAPI.ts` | localHasMoreProgress включає exp, level, sp, adena, skillLevelsSum, mobsKilled, lastSavedAt, localHasActiveBuffsNotOnServer; при true повертається локальний герой (з recalc), у фоні saveHeroToLocalStorage. При server path: equipment = { ...server, ...local }; skills merge по id з max level; inventory localWins якщо localInvLen >= serverInvLen; buffs dedupe по ключу, max expiresAt. |
| **Economy** |
| 9 | coinOfLuck/coinLuck мапінг правильний, не обнулюється через серіалізацію | **PASS** | `heroLoadAPI.ts`, `heroPersistence.ts`, `heroLoad.ts` | API→Hero: character.coinLuck → fixedHero.coinOfLuck (236, 272). Hero→API: hero.coinOfLuck → updatePayload.coinLuck (396–410), тільки якщо local >= server. localStorage: heroLoad з heroJson.coinOfLuck; heroPersistence buildBackupHeroJson hero.coinOfLuck. Єдине ім’я на клієнті — coinOfLuck. |
| 10 | Правила "coinLuck тільки збільшувати" на сервері не ламають UX | **PASS** | `heroPersistence.ts`, PremiumAccount/About/ColorizeNick | Зменшення лише через POST /premium/buy (та інші POST); клієнт після відповіді оновлює hero з res.character (coinLuck → coinOfLuck) і updateServerState(coinLuck). Користувач бачить актуальне значення після покупки. |
| **Battle & Buffs** |
| 11 | Бафи не пропадають через два джерела (heroJson + battle state) | **PASS** | `heroLoadAPI.ts`, `heroLoad.ts`, `heroPersistence.ts`, `startBattle.ts` | Джерела об’єднуються: heroJson.heroBuffs + loadBattle().heroBuffs; дедуп по ключу id_stackType_name, залишається баф з більшим expiresAt (123–131, 345–355 heroLoadAPI; heroLoad 199–208; heroPersistence 60–63, 228–238). cleanupBuffs фільтрує прострочені та дедуплікацію toggle за stackType/id/name. |
| 12 | Battle → updateHero не створює шторма сейвів або нескінченних PUT | **PASS** | `heroStore.ts` | Кожен updateHero з критичним partial дає один виклик immediateSave або debouncedSave (334–341). immediateSave скасовує debounced та виконує один save; мутекс saving у heroPersistence серіалізує PUT. Шторм можливий лише при дуже частій зміні критичних полів (багато кілів поспіль) → ризик 429, але не нескінченний цикл. |

---

## 3) Top-10 ризиків (P0/P1/P2)

| Пріоритет | Де | Як відтворити | Мінімальне виправлення (без рефактору) |
|-----------|-----|----------------|----------------------------------------|
| **P0** |
| P0-1 | heroPersistence: при accIndex === -1 нічого не пишеться | Новий юзер → Register → дія (покупка) → F5 до відпрацювання PUT. Прогрес лише в пам’яті; якщо PUT ще не пішов — можлива втрата одного батчу. | У Register після setHero додати: отримати accounts, push({ username: trimmedUsername, hero: useHeroStore.getState().hero }), setJSON("l2_accounts_v2", accounts). Тоді перший saveHeroToLocalStorageOnly знайде accIndex. |
| P0-2 | Порожній heroJson з сервера | GET повертає character з heroJson = null/{}; createNewHero + updateCharacter. Якщо десь плутають і перезаписують існуючого героя порожнім — втрата прогресу. | Код вже перевіряє wasEmpty і лише тоді створює героя (heroLoadAPI 214–230). Ризик — якщо хтось викличе setHero з порожнім об’єктом з іншого місця; isHeroPayload це відсікає. Залишається P1. |
| **P1** |
| P1-1 | 401 без редіректу | Будь-який API виклик повертає 401 → токен скидається, кидається помилка. Користувач бачить помилку на поточному екрані, не автоматично на логіні. | Додати в apiRequest після setAccessToken(null): window.location.href = '/' або useNavigate з кореневого місця (потрібен доступ до navigate). Мінімально — один редирект при 401. |
| P1-2 | Після Register loadHero() все одно null | Ми ставимо l2_current_user, але не додаємо запис у l2_accounts_v2. loadHero() робить find(username) у accounts → undefined → return null. | Те саме, що P0-1: у Register додати створення запису в l2_accounts_v2 (один push + setJSON). |
| P1-3 | Два 409 підряд | Два таби/пристрої, обидва змінюють героя; один отримує 409, retry теж 409 → alert, backup у localStorage. Другий таб може перезаписати сервер. Після F5 merge policy вирішить, але користувач бачив alert. | Залишити як є або додати в alert посилання "Оновити сторінку" / кнопку F5. |
| P1-4 | rateLimit cooldown 60s — багато immediateSave підряд | Активна боївка, багато кіллів за короткий час → кілька immediateSave → 429 → cooldown 60s. Наступні критичні зміни йдуть у criticalSaveQueue і виконаються через 60s. Якщо користувач закриє вкладку до того — прогрес у localStorage вже записаний при 429. | Перевірити, що при 429 завжди викликається saveHeroToLocalStorageOnly або запис у localStorage у блоці 429 (зараз так). Ризик мінімальний. |
| **P2** |
| P2-1 | fixAllHeroProfessions ніде не викликається | Якщо колись потрібна глобальна міграція професій, її треба викликати вручну або з одного місця (наприклад bootstrap). | Документувати або викликати один раз при певній умові (наприклад версія схеми). |
| P2-2 | Логування в консоль у prod | Багато console.log у heroStore, heroLoadAPI, heroPersistence. | Згорнути в isDev або залишити; не впливає на стабільність. |
| P2-3 | Різниця імен coinOfLuck vs coinLuck | Мапінг є, але при додаванні нового коду легко помилитися полем. | Залишити як є; правило в .cursor/rules описує мапінг. |
| P2-4 | Легкі сторінки (mail/about/forum) — hero в фоні через 500ms | Якщо користувач дуже швидко йде з сторінки, loadHeroFromAPI може не встигнути. | Прийнятно; при наступній навігації герой підвантажиться. |

---

## 4) Що робити далі: 3 найкорисніші укріплюючі патчі (мінімальні)

1. **Register: додати запис у l2_accounts_v2 після успіху**  
   Після setHero (обидві гілки) взяти `accounts = getJSON("l2_accounts_v2", [])`, перевірити, що немає вже запису з таким username, push `{ username: trimmedUsername, hero: useHeroStore.getState().hero }`, setJSON("l2_accounts_v2", accounts). Один файл — Register.tsx; без змін heroPersistence. Це закриває P0-1 і P1-2.

2. **401: редірект на головну**  
   У api.ts після setAccessToken(null) при 401 викликати `window.location.href = '/'` (або передавати callback redirect з кореневого роутера). Один файл — api.ts. Покращує UX при протуханні сесії.

3. **429: явно зберігати в localStorage перед setRateLimitCooldown**  
   Переконатися (перевірка по коду вже є), що при 429 спочатку запис у l2_accounts_v2 з mergedBuffs, потім setRateLimitCooldown. Якщо порядок десь зміниться — виправити. Мінімальна перевірка/коментар у heroPersistence.

---

*Аудит виконано без змін у коді, тільки аналіз по поточному стану репозиторію та правилам з .cursor/rules.*
