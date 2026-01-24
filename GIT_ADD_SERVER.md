# Додавання папки server в Git

Папка `server/` є локально, але не додана в GitHub репозиторій.

## Що потрібно зробити:

### 1. Додати server в git:
```bash
git add server
```

### 2. Закомітити:
```bash
git commit -m "Add backend server"
```

### 3. Запушити на GitHub:

**Варіант А: Запушити в поточну гілку (2025-12-23-zsq5):**
```bash
git push origin 2025-12-23-zsq5
```

**Варіант Б: Переключитися на main і змержити:**
```bash
# Переключитися на main
git checkout main

# Змержити змінки з вашої гілки
git merge 2025-12-23-zsq5

# Або додати server напряму в main:
git add server
git commit -m "Add backend server"
git push origin main
```

### 4. Після push - Railway зможе побачити server папку!

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## Важливо:

Переконайтеся, що `server/.env` НЕ додається в git (він вже в `.gitignore`).
