# 🔧 Виправлення Build в Railway

## Проблема:
Railway все ще компілює frontend (`src/App.tsx`) замість backend (`server/src/`).

## Перевірте налаштування:

### 1. Root Directory
В Settings → Source:
- **Root Directory:** має бути `server` (не порожньо!)

### 2. Build Command
В Settings → Build & Deploy:
- **Build Command:** `npm install && npm run prisma:generate && npm run build`
- Це має запускатися в папці `server/`

### 3. Start Command
В Settings → Build & Deploy:
- **Start Command:** `npm start`
- Це запустить `node dist/index.js` з папки `server/`

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Якщо Root Directory встановлено, але все одно не працює:

### Варіант 1: Перезапустити деплой
1. Settings → Source
2. Натиснути **"Disconnect"** біля Branch
3. Підключити знову
4. Railway перезапустить деплой

### Варіант 2: Перевірити, чи є файли в server/
1. На GitHub перейти в гілку `2025-12-23-zsq5`
2. Перевірити, що папка `server/` існує
3. Перевірити, що в ній є `package.json`, `tsconfig.json`, `src/`

### Варіант 3: Створити новий сервіс
1. Видалити поточний сервіс
2. Створити новий
3. Під час створення вказати Root Directory = `server`

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Перевірка логів:

Після встановлення Root Directory, в логах має бути:
```
> cd server
> npm install
> npm run prisma:generate
> npm run build
```

А не:
```
> npm run build  (з кореня)
```
