# ✅ Деплой з main (найпростіше)

## Просто натисніть Deploy!

**Що має працювати:**
- ✅ Backend вже працює на Railway (`text-rpg-production.up.railway.app`)
- ✅ Frontend задеплоїться з `main` (там є весь frontend код)
- ✅ Environment Variable `VITE_API_URL` вже додано в Vercel

## Що робити:

1. **Перевірити Environment Variable:**
   - `VITE_API_URL` = `https://text-rpg-production.up.railway.app`
   - Якщо є - ОК!

2. **Натиснути "Deploy"** (чорна кнопка внизу)

3. Дочекатися завершення (1-2 хвилини)

4. Отримаєте URL типу: `text-rpg-a8yr.vercel.app`

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Після деплою:

- Frontend працює на Vercel
- Backend працює на Railway
- Всі API запити йдуть на Railway backend
- Гра доступна онлайн!

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Примітка:

Папка `server/` не потрібна для frontend деплою - вона тільки для backend (який вже на Railway). Frontend задеплоїться нормально з `main`.
