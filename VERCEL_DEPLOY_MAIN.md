# ✅ Деплой з main (найпростіше)

## Просто натисніть Deploy!

**Що має працювати:**
- ✅ Backend працює на VPS (l2dop.com)
- ✅ Frontend задеплоїться з `main` (там є весь frontend код)
- ✅ Environment Variable `VITE_API_URL` вже додано в Vercel

## Що робити:

1. **Перевірити Environment Variable:**
   - `VITE_API_URL` = `https://l2dop.com`
   - Якщо є - ОК!

2. **Натиснути "Deploy"** (чорна кнопка внизу)

3. Дочекатися завершення (1-2 хвилини)

4. Отримаєте URL типу: `text-rpg-a8yr.vercel.app`

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Після деплою:

- Frontend працює на Vercel
- Backend працює на VPS
- Всі API запити йдуть на backend (l2dop.com)
- Гра доступна онлайн!

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Примітка:

Папка `server/` не потрібна для frontend деплою — вона тільки для backend (на VPS). Frontend задеплоїться нормально з `main`.
