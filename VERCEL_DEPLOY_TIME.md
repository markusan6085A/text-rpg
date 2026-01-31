# ⏱️ Час деплою Frontend на Vercel

## Оцінка часу:

### Швидкий варіант (якщо вже є аккаунт Vercel):
- ⏱️ **5-7 хвилин**

**Розбивка:**
1. Підключення GitHub репозиторію: ~1 хвилина
2. Налаштування (Framework, Build, Environment Variables): ~2-3 хвилини
3. Build та деплой: ~2-3 хвилини

### Якщо потрібно створити аккаунт:
- ⏱️ **7-10 хвилин**

**Розбивка:**
1. Реєстрація через GitHub: ~1-2 хвилини
2. Підключення репозиторію: ~1 хвилина
3. Налаштування: ~2-3 хвилини
4. Build та деплой: ~2-3 хвилини

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Швидкий гайд (5 хвилин):

### Крок 1: Відкрити Vercel (1 хвилина)
1. https://vercel.com
2. Натиснути **"Add New..."** → **"Project"**

### Крок 2: Підключити GitHub (1 хвилина)
1. Вибрати репозиторій `text-rpg`
2. Натиснути **"Import"**

### Крок 3: Налаштування (2 хвилини)
1. **Framework Preset:** Vite (автоматично)
2. **Root Directory:** `./` (за замовчуванням)
3. **Build Command:** `npm run build` (за замовчуванням)
4. **Output Directory:** `dist` (за замовчуванням)
5. **Environment Variables:**
   - `VITE_API_URL` = `https://l2dop.com`
6. Натиснути **"Deploy"**

### Крок 4: Дочекатися деплою (2-3 хвилини)
- Vercel автоматично збудує та задеплоїть
- Отримаєте URL типу `text-rpg.vercel.app`

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## ✅ Готово!

**Всього: 5-7 хвилин!**

Vercel дуже швидкий для React/Vite проектів - build займає ~1-2 хвилини.
