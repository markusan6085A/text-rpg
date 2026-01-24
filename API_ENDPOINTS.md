# 📡 API Endpoints Документація

## 🔐 Авторизація (Auth)

### POST /auth/register
Реєстрація нового акаунту.

**Request:**
```json
{
  "login": "testuser",
  "password": "testpass123"
}
```

**Response (200):**
```json
{
  "ok": true,
  "account": {
    "id": "clx...",
    "login": "testuser",
    "createdAt": "2024-01-11T18:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

### POST /auth/login
Авторизація існуючого акаунту.

**Request:**
```json
{
  "login": "testuser",
  "password": "testpass123"
}
```

**Response (200):**
```json
{
  "ok": true,
  "account": {
    "id": "clx...",
    "login": "testuser"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## 👤 Персонажі (Characters)

### GET /characters
Отримати список всіх персонажів поточного акаунту.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "ok": true,
  "characters": [
    {
      "id": "clx...",
      "name": "Hero",
      "race": "human",
      "classId": "warrior",
      "sex": "male",
      "level": 45,
      "exp": "123456",
      "sp": 1000,
      "adena": 50000,
      "aa": 1000,
      "coinLuck": 5,
      "heroJson": { ... },
      "createdAt": "2024-01-11T18:00:00.000Z"
    }
  ]
}
```

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

### GET /characters/:id
Отримати конкретного персонажа.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "ok": true,
  "character": {
    "id": "clx...",
    "name": "Hero",
    "race": "human",
    "classId": "warrior",
    "sex": "male",
    "level": 45,
    "exp": "123456",
    "sp": 1000,
    "adena": 50000,
    "aa": 1000,
    "coinLuck": 5,
    "heroJson": { ... },
    "createdAt": "2024-01-11T18:00:00.000Z",
    "updatedAt": "2024-01-11T18:30:00.000Z"
  }
}
```

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

### POST /characters
Створити нового персонажа.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "name": "Hero",
  "race": "human",
  "classId": "warrior",
  "sex": "male"
}
```

**Response (200):**
```json
{
  "ok": true,
  "character": {
    "id": "clx...",
    "name": "Hero",
    "race": "human",
    "classId": "warrior",
    "sex": "male",
    "level": 1,
    "exp": "0",
    "sp": 0,
    "adena": 0,
    "aa": 0,
    "coinLuck": 0,
    "heroJson": {},
    "createdAt": "2024-01-11T18:00:00.000Z"
  }
}
```

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

### PUT /characters/:id
Оновити дані персонажа.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "heroJson": { ... },
  "level": 46,
  "exp": 130000,
  "sp": 1100,
  "adena": 55000,
  "aa": 1200,
  "coinLuck": 6
}
```

**Примітка:** Всі поля опціональні. Оновлюються тільки передані поля.

**Response (200):**
```json
{
  "ok": true,
  "character": {
    "id": "clx...",
    "name": "Hero",
    "race": "human",
    "classId": "warrior",
    "sex": "male",
    "level": 46,
    "exp": "130000",
    "sp": 1100,
    "adena": 55000,
    "aa": 1200,
    "coinLuck": 6,
    "heroJson": { ... },
    "updatedAt": "2024-01-11T18:35:00.000Z"
  }
}
```

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## 🔍 Health Check

### GET /health
Перевірка статусу сервера.

**Response (200):**
```json
{
  "status": "ok"
}
```

<hr style="border: none; border-top: 2px dotted #C9B36B; margin: 20px 0;">

## 💡 Приклади використання

### JavaScript (Fetch)

```javascript
// Реєстрація
const registerRes = await fetch('http://localhost:3000/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    login: 'testuser',
    password: 'testpass123'
  })
});
const { token } = await registerRes.json();

// Створення персонажа
const createRes = await fetch('http://localhost:3000/characters', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Hero',
    race: 'human',
    classId: 'warrior',
    sex: 'male'
  })
});

// Оновлення персонажа
const updateRes = await fetch('http://localhost:3000/characters/CHARACTER_ID', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    heroJson: { /* дані героя */ },
    level: 46,
    exp: 130000
  })
});
```
