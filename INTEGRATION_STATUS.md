# Статус інтеграції Backend API

## ✅ Зроблено:

1. ✅ API client (`src/utils/api.ts`)
2. ✅ Auth store (`src/state/authStore.ts`)
3. ✅ Character store (`src/state/characterStore.ts`)
4. ✅ `heroPersistence.ts` - зберігання через API
5. ✅ `heroLoadAPI.ts` - завантаження з API

## ⏳ Потрібно зробити:

1. ⏳ Оновити `Register.tsx` - реєстрація через API
2. ⏳ Оновити `Landing.tsx` - логін через API  
3. ⏳ Оновити `App.tsx` - ініціалізація stores
4. ⏳ Оновити `heroStore.ts` - async loadHero

## 📝 Детальний план:

### Register.tsx:
- Викликати `register(login, password)` API
- Зберегти token в `useAuthStore`
- Викликати `createCharacter()` API з базовими даними
- Зберегти characterId в `useCharacterStore`
- Створити героя через `createNewHero`
- Зберегти heroJson через `updateCharacter()`
- Завантажити героя в store

### Landing.tsx:
- Викликати `login(login, password)` API
- Зберегти token в `useAuthStore`
- Викликати `listCharacters()` API
- Вибір персонажа (якщо їх кілька) або використання першого
- Зберегти characterId в `useCharacterStore`
- Завантажити героя через `loadHeroFromAPI()`
- Передати героя в `onLogin()`

### App.tsx:
- Ініціалізувати `useAuthStore.initialize()`
- Ініціалізувати `useCharacterStore.initialize()`
- Спробувати завантажити героя з API
- Якщо не вийшло - завантажити з localStorage (backward compatibility)

### heroStore.ts:
- Додати async `loadHeroFromAPI()` виклик
- Можливо зробити `loadHero()` async або створити окрему функцію
