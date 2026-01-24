# 🔒 Чек-лист безпеки VPS

## ✅ Що вже працює:

1. **Rate Limiting** ✅
   - `/auth/login`: 5 спроб/хвилину
   - `/auth/register`: 3 спроби/хвилину
   - `/chat/messages`: 10 повідомлень/хвилину
   - `/letters`: 5 листів/хвилину

2. **JWT** ✅
   - `expiresIn: "30d"` (не вічні токени)
   - Secret з `.env` (не в коді)

3. **Валідація** ✅
   - Login: мінімум 3 символи
   - Password: мінімум 6 символів
   - Body limit: 1MB

4. **Помилки** ✅
   - Stack trace тільки в `development`
   - Production не віддає деталі

5. **База даних** ✅
   - PostgreSQL на `localhost:5432`
   - Не відкрита назовні
   - Пароль в `.env`

6. **PM2** ✅
   - Автозапуск налаштовано

---

## ⚠️ Що потрібно виправити:

### 1. CORS (КРИТИЧНО) 🔴

**Проблема:** `origin: true` дозволяє ВСІ домени

**Виправлено в коді:** Обмежено до `l2dop.com` доменів

**Що зробити на VPS:**
```bash
cd /opt/text-rpg
git pull
cd server
npm run build
pm2 restart text-rpg-api
```

---

### 2. Security Headers в Nginx

**Додати в `/etc/nginx/sites-available/text-rpg` (в server block для 443):**

```nginx
add_header X-Content-Type-Options nosniff always;
add_header X-Frame-Options DENY always;
add_header Referrer-Policy no-referrer-when-downgrade always;
add_header X-XSS-Protection "1; mode=block" always;
```

**Потім:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

### 3. UFW (Firewall) - ПЕРЕВІРИТИ НА VPS

**Виконати на VPS:**

```bash
# Перевірити статус
sudo ufw status

# Якщо не активний - налаштувати:
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Перевірити знову
sudo ufw status verbose
```

**Має бути:**
- ✅ 22/tcp (SSH) - ALLOW
- ✅ 80/tcp (HTTP) - ALLOW
- ✅ 443/tcp (HTTPS) - ALLOW
- ❌ 3000/tcp - НЕ має бути (закритий)

---

### 4. SSH Безпека - ПЕРЕВІРИТИ НА VPS

**Перевірити `/etc/ssh/sshd_config`:**

```bash
sudo nano /etc/ssh/sshd_config
```

**Має бути:**
```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

**Якщо змінили - перезапустити:**
```bash
sudo systemctl restart ssh
```

**⚠️ УВАГА:** Переконайтеся, що у вас є SSH ключ перед вимкненням паролів!

---

### 5. Автопатчі (опціонально, але рекомендовано)

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

---

### 6. Перевірка HTTPS редіректу

```bash
curl -I http://api.l2dop.com/health
```

**Має бути:** `301 Moved Permanently` або `308 Permanent Redirect` на `https://`

---

## 🎯 Пріоритети:

1. **CORS** 🔴 - виправити зараз (код готовий, потрібно задеплоїти)
2. **UFW** 🔴 - перевірити на VPS (5 хвилин)
3. **Security Headers** 🟡 - додати в Nginx (2 хвилини)
4. **SSH** 🟡 - перевірити налаштування (5 хвилин)
5. **Автопатчі** 🟢 - опціонально (10 хвилин)

---

## 📝 Швидкий чек-лист для VPS:

```bash
# 1. Оновити код (CORS fix)
cd /opt/text-rpg && git pull && cd server && npm run build && pm2 restart text-rpg-api

# 2. Перевірити UFW
sudo ufw status verbose

# 3. Перевірити SSH
sudo grep -E "PermitRootLogin|PasswordAuthentication|PubkeyAuthentication" /etc/ssh/sshd_config

# 4. Перевірити HTTPS редірект
curl -I http://api.l2dop.com/health

# 5. Додати security headers (відредагувати nginx config)
sudo nano /etc/nginx/sites-available/text-rpg
# (додати headers, див. вище)
sudo nginx -t && sudo systemctl reload nginx
```

---

## ✅ Після виконання:

- CORS обмежено до l2dop.com
- UFW закриває зайві порти
- Security headers додані
- SSH захищений
- HTTPS редірект працює
