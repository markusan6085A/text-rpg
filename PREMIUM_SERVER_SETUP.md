# 🚀 Premium Production Server Setup (Найкращий варіант)

## 🎯 Для чого потрібен premium сервер:
- ✅ Автоматичний деплой з GitHub
- ✅ Моніторинг та логи в реальному часі
- ✅ Автоматичне масштабування
- ✅ Backup та відновлення
- ✅ Простий робочий процес (git push → deploy)
- ✅ SSL сертифікати автоматично
- ✅ CDN для швидкості

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## 🌟 Варіант 1: Railway Pro + Vercel (РЕКОМЕНДОВАНО) ⭐

### Чому Railway Pro:
- ✅ Автоматичний деплой з GitHub
- ✅ Моніторинг, метрики, логи
- ✅ Автоматичне масштабування
- ✅ Private Networking
- ✅ Безліміт bandwidth
- ✅ $20/місяць (або pay-as-you-go)

### Налаштування Backend на Railway Pro:

#### Крок 1: Оновити проєкт до Pro
1. Зареєструватися на https://railway.app
2. Перейти на **Pro Plan** ($20/місяць)
3. Створити новий проєкт → **Deploy from GitHub repo**

#### Крок 2: Налаштувати сервіс
1. **Service Name:** `text-rpg-api`
2. **Root Directory:** `server`
3. **Build Command:** `npm install && npm run prisma:generate && npm run build`
4. **Start Command:** `npm start`

#### Крок 3: Environment Variables
В Settings → Variables додати:
```
DATABASE_URL=postgresql://... (з Supabase)
JWT_SECRET=ваш-секретний-ключ
NODE_ENV=production
PORT=3000
```

#### Крок 4: Налаштувати Custom Domain
1. Settings → Networking → **Generate Domain** (або додати custom domain)
2. Railway автоматично налаштує SSL

#### Крок 5: Налаштувати Autoscaling (опціонально)
1. Settings → Scaling
2. Включити Auto-scaling
3. Мінімум 1 instance, максимум 3-5 (залежно від навантаження)

#### Крок 6: Налаштувати Monitoring
1. Railway автоматично збирає метрики
2. Dashboard → Metrics (CPU, Memory, Requests)
3. Dashboard → Logs (логи в реальному часі)

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## 🌟 Варіант 2: Render Pro (Альтернатива)

### Налаштування Backend на Render Pro:

#### Крок 1: Створити Web Service
1. Зареєструватися на https://render.com
2. Перейти на **Pro Plan** ($25/місяць)
3. **New** → **Web Service**
4. Підключити GitHub репозиторій

#### Крок 2: Налаштування
- **Name:** `text-rpg-api`
- **Root Directory:** `server`
- **Environment:** `Node`
- **Build Command:** `npm install && npm run prisma:generate && npm run build`
- **Start Command:** `npm start`
- **Instance Type:** Standard ($25/міс) або Professional ($85/міс)

#### Крок 3: Environment Variables
```
DATABASE_URL=...
JWT_SECRET=...
NODE_ENV=production
```

#### Крок 4: Custom Domain
- Settings → **Custom Domain**
- Render автоматично налаштує SSL

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## 🌟 Варіант 3: AWS/GCP/Azure (Максимальна потужність)

### AWS ECS Fargate (Рекомендовано для AWS)

**Переваги:**
- ✅ Масштабованість до тисяч інстансів
- ✅ Автоматичне масштабування
- ✅ Load balancing
- ✅ Моніторинг через CloudWatch
- ✅ CI/CD через GitHub Actions

**Мінуси:**
- ⚠️ Складніше налаштувати
- ⚠️ Потрібен Docker

**Ціна:** $15-50/місяць (залежно від навантаження)

### Google Cloud Run (Рекомендовано для GCP)

**Переваги:**
- ✅ Serverless (платиш тільки за використання)
- ✅ Автоматичне масштабування
- ✅ Простіше ніж AWS
- ✅ CI/CD через Cloud Build

**Ціна:** Pay-as-you-go (~$10-30/місяць)

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## 🎯 Рекомендація: Railway Pro + Vercel

### Чому саме ця комбінація:

1. **Railway Pro для Backend:**
   - Автоматичний деплой (git push → deploy)
   - Моніторинг вбудований
   - Логи в реальному часі
   - Автоматичне масштабування
   - Private networking
   - $20/місяць

2. **Vercel для Frontend:**
   - Автоматичний деплой
   - CDN глобально
   - Edge functions
   - Analytics вбудований
   - Безкоштовно (або Pro $20/міс для більших проектів)

3. **Supabase для Database:**
   - Вже налаштовано
   - Масштабується автоматично
   - Backup автоматичний
   - Безкоштовний план (або Pro $25/міс)

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## 📋 Детальна інструкція: Railway Pro Setup

### Крок 1: Оновити проєкт до Pro

1. Перейти на https://railway.app
2. Dashboard → **Settings** → **Billing**
3. Обрати **Pro Plan** ($20/місяць)
4. Підключити кредитну картку

### Крок 2: Створити/оновити сервіс

1. **New Project** → **Deploy from GitHub repo**
2. Вибрати репозиторій `text-rpg`
3. Після створення → Settings → **Root Directory** → `server`

### Крок 3: Налаштувати Build & Deploy

**Settings → Deploy:**
- **Build Command:** `npm install && npm run prisma:generate && npm run build`
- **Start Command:** `npm start`
- **Watch Paths:** `server/**` (щоб передеплоїти тільки при змінах в server/)

### Крок 4: Environment Variables

**Settings → Variables:**
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@[SUPABASE-HOST]:5432/postgres
JWT_SECRET=[згенерувати довгий ключ]
NODE_ENV=production
PORT=3000
```

**Генерація JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Крок 5: Custom Domain + SSL

1. **Settings → Networking**
2. Натиснути **Generate Domain** (або **Add Custom Domain**)
3. Railway автоматично налаштує SSL через Let's Encrypt

**Якщо маєте свій домен:**
1. Додати custom domain: `api.ваш-домен.com`
2. Railway покаже DNS записи
3. Додати CNAME запис в DNS провайдера
4. Railway автоматично налаштує SSL

### Крок 6: Налаштувати Autoscaling

1. **Settings → Scaling**
2. Включити **Auto-scaling**
3. **Min Instances:** 1
4. **Max Instances:** 3 (можна збільшити пізніше)
5. **CPU Threshold:** 70%
6. **Memory Threshold:** 80%

### Крок 7: Налаштувати Monitoring

**Dashboard → Metrics:**
- CPU використання
- Memory використання
- Network I/O
- Request rate
- Response time

**Dashboard → Logs:**
- Логи в реальному часі
- Фільтрація по рівнях
- Пошук по тексту

### Крок 8: Налаштувати GitHub Integration

1. **Settings → Source**
2. Підключити GitHub репозиторій (якщо ще не підключено)
3. **Auto Deploy:** Enabled (автоматичний деплой при push)
4. **Branch:** `main` (або `master`)

**Тепер робочий процес:**
```bash
# Зробити зміни в коді
git add .
git commit -m "Update backend"
git push

# Railway автоматично:
# 1. Визначить зміни
# 2. Запустить build
# 3. Задеплоїть нову версію
# 4. Покаже статус в GitHub
```

### Крок 9: Налаштувати Health Checks

Railway автоматично перевіряє health endpoint (`/health`), але можна налаштувати:

**Settings → Health:**
- **Path:** `/health`
- **Interval:** 30 seconds
- **Timeout:** 5 seconds

### Крок 10: Налаштувати Backup (для бази даних)

Якщо використовуєте Supabase:
- Supabase автоматично робить backup
- Pro план: Point-in-time recovery

Якщо використовуєте Railway PostgreSQL:
- Settings → **Backups**
- Включити автоматичні backup

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## 🚀 Frontend на Vercel Pro (Опціонально)

### Безкоштовний план Vercel достатньо, але Pro дає:

1. **Vercel Pro ($20/місяць):**
   - Більше bandwidth
   - Password Protection
   - Team collaboration
   - Advanced Analytics
   - Custom domains безкоштовно

### Налаштування:

1. Перейти на https://vercel.com
2. **New Project** → Підключити GitHub репозиторій
3. **Framework Preset:** Vite
4. **Root Directory:** `./`
5. **Build Command:** `npm run build`
6. **Output Directory:** `dist`

### Environment Variables:
```
VITE_API_URL=https://ваш-railway-url.railway.app
```

### Custom Domain:
1. **Settings → Domains**
2. Додати domain: `ваш-домен.com`
3. Vercel автоматично налаштує SSL
4. Додати DNS записи в DNS провайдера

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## 🔄 Робочий процес для розробки:

### Backend:
```bash
# 1. Зробити зміни локально
cd server
# ... редагувати код ...

# 2. Перевірити локально
npm run dev

# 3. Закомітити та запушити
git add .
git commit -m "Feature: add new endpoint"
git push

# 4. Railway автоматично задеплоїть
# 5. Перевірити в Railway Dashboard → Logs
```

### Frontend:
```bash
# 1. Зробити зміни
# ... редагувати код ...

# 2. Перевірити локально
npm run dev

# 3. Закомітити та запушити
git add .
git commit -m "Feature: update UI"
git push

# 4. Vercel автоматично задеплоїть
# 5. Перевірити в Vercel Dashboard
```

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## 📊 Моніторинг та Analytics:

### Railway:
- **Metrics:** CPU, Memory, Network, Requests
- **Logs:** Реальний час, пошук, фільтрація
- **Deployments:** Історія деплоїв, rollback
- **Alerts:** Email/Slack нотифікації

### Vercel:
- **Analytics:** Page views, visitors, performance
- **Speed Insights:** Core Web Vitals
- **Logs:** Function logs, edge logs

### Supabase:
- **Database:** Query performance, connections
- **API:** Request logs, errors
- **Auth:** User activity

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## 🔒 Безпека:

1. **SSL/TLS:** Автоматично через Railway/Vercel
2. **Environment Variables:** Шифруються
3. **Private Networking:** Railway Pro підтримує
4. **Rate Limiting:** Можна додати через middleware
5. **CORS:** Налаштовано правильно
6. **JWT:** Безпечне зберігання токенів

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## 💰 Орієнтовна вартість:

| Сервіс | План | Ціна/місяць |
|--------|------|-------------|
| Railway Pro | Backend | $20 |
| Vercel | Frontend | $0 (або $20 Pro) |
| Supabase | Database | $0 (або $25 Pro) |
| **Всього** | | **$20-65/місяць** |

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## ✅ Переваги цього підходу:

1. ✅ **Автоматичний деплой:** Git push → автоматичний deploy
2. ✅ **Моніторинг:** Всі метрики в одному місці
3. ✅ **Масштабованість:** Автоматичне масштабування
4. ✅ **Безпека:** SSL автоматично, backup автоматично
5. ✅ **Зручність:** Всі налаштування через веб-інтерфейс
6. ✅ **Швидкість:** CDN для frontend, оптимізований backend
7. ✅ **Надійність:** 99.9% uptime гарантія

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## 🎯 Фінальна рекомендація:

**Для вашого випадку (проект буде розвиватися):**

1. **Railway Pro ($20/міс)** для backend
   - Автоматичний деплой
   - Моніторинг
   - Масштабування
   - Легко оновлювати

2. **Vercel (безкоштовно або Pro $20/міс)** для frontend
   - Глобальний CDN
   - Автоматичний деплой
   - Швидкий

3. **Supabase Pro ($25/міс)** для бази даних (коли проект зросте)
   - Backup автоматичний
   - Point-in-time recovery
   - Більше ресурсів

**Всього: $20-65/місяць** за потужний, масштабований, зручний для розробки стек.
