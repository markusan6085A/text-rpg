// Валідація структури heroJson на backend
// Захищає від зламаних даних та конфліктів версій

export interface HeroJsonStructure {
  name?: string;
  race?: string;
  classId?: string;
  level?: number;
  exp?: number;
  inventory?: any[];
  equipment?: any;
  skills?: any[];
  heroBuffs?: any[];
  location?: string;
  heroJsonVersion?: number; // Версія схеми heroJson
  heroRevision?: number; // Ревізія для optimistic locking
}

// Мінімальна валідація структури heroJson
export function validateHeroJson(heroJson: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!heroJson || typeof heroJson !== 'object') {
    return { valid: false, errors: ['heroJson must be an object'] };
  }

  // Обов'язкові поля
  if (!heroJson.name || typeof heroJson.name !== 'string' || heroJson.name.trim().length === 0) {
    errors.push('heroJson.name is required and must be a non-empty string');
  }

  if (!heroJson.race || typeof heroJson.race !== 'string') {
    errors.push('heroJson.race is required and must be a string');
  }

  if (!heroJson.classId || typeof heroJson.classId !== 'string') {
    errors.push('heroJson.classId is required and must be a string');
  }

  // Перевірка типів числових полів
  if (heroJson.level !== undefined && (typeof heroJson.level !== 'number' || heroJson.level < 1)) {
    errors.push('heroJson.level must be a number >= 1');
  }

  if (heroJson.exp !== undefined && typeof heroJson.exp !== 'number') {
    errors.push('heroJson.exp must be a number');
  }

  // Перевірка масивів
  if (heroJson.inventory !== undefined && !Array.isArray(heroJson.inventory)) {
    errors.push('heroJson.inventory must be an array');
  }

  if (heroJson.skills !== undefined && !Array.isArray(heroJson.skills)) {
    errors.push('heroJson.skills must be an array');
  }

  if (heroJson.heroBuffs !== undefined && !Array.isArray(heroJson.heroBuffs)) {
    errors.push('heroJson.heroBuffs must be an array');
  }

  // Перевірка equipment (має бути об'єктом або undefined)
  if (heroJson.equipment !== undefined && (typeof heroJson.equipment !== 'object' || Array.isArray(heroJson.equipment))) {
    errors.push('heroJson.equipment must be an object');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Додає/оновлює версію та ревізію в heroJson
// ❗ ВАЖЛИВО: Сервер завжди сам генерує нову ревізію, не довіряє клієнту
export function addVersioning(heroJson: any, oldRevision?: number): any {
  const versioned = { ...heroJson };
  
  // Встановлюємо версію схеми (можна збільшувати при зміні структури)
  versioned.heroJsonVersion = versioned.heroJsonVersion || 1;
  
  // ❗ КРИТИЧНО: Сервер завжди генерує нову ревізію сам
  // Використовуємо timestamp + мікросекунди для унікальності
  // oldRevision використовується тільки для перевірки, не для встановлення
  const newRevision = Date.now();
  
  // Перевіряємо, що нова ревізія більша за стару (захист від "підміни")
  if (oldRevision && newRevision <= oldRevision) {
    // Якщо timestamp не збільшився (дуже рідкісний випадок) - додаємо 1 мс
    versioned.heroRevision = oldRevision + 1;
  } else {
    versioned.heroRevision = newRevision;
  }
  
  return versioned;
}

// Перевіряє optimistic locking (чи ревізія збігається)
export function checkRevision(heroJson: any, expectedRevision?: number): { valid: boolean; conflict: boolean } {
  // Якщо клієнт не передав ревізію - дозволяємо (backward compatibility)
  if (expectedRevision === undefined) {
    return { valid: true, conflict: false };
  }

  const currentRevision = heroJson.heroRevision || 0;
  
  // Якщо ревізії не збігаються - конфлікт
  if (currentRevision !== expectedRevision) {
    return { valid: false, conflict: true };
  }

  return { valid: true, conflict: false };
}
