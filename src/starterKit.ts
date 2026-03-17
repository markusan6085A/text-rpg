type GameItem = {
  id: string;
  name: string;
  type: string;
  slot?: string;
  icon?: string;
  stats?: {
    patk?: number;
    matk?: number;
    cast_speed?: number;
    accuracy?: number;
    mp_restore?: number;
    hp_restore?: number;
    [key: string]: number | undefined;
  };
  description?: string;

  // 👇 додали те, чого не вистачало
  count?: number;
  cooldownMs?: number;
};



// Сколько адены даём при старте
export const STARTER_ADENA = 200;

// Оружие в зависимости от класса
function getStarterWeapon(klass: string): GameItem {
  const isMage = klass === "Маг";

  return isMage
    ? {
        id: "ng_staff_mage",
        name: "Посох новичка",
        type: "weapon",
        slot: "weapon",
        icon: "/items/staff.png",
        stats: {
          patk: 40,
          matk: 65,
          cast_speed: 80,
          accuracy: 1,
          weight: 700,
        },
        description: "Простой магический посох для начинающих магов.",
      }
    : {
        id: "ng_sword_warrior",
        name: "Меч новичка",
        type: "weapon",
        slot: "weapon",
        icon: "/items/sword.png",
        stats: {
          patk: 85,
          atk_speed: 379,
          accuracy: 2,
          weight: 900,
        },
        description: "Стартовый меч для новичков-воинов.",
      };
}

// Основной стартовый набор
export function getStarterKit(klass: string): GameItem[] {
  const weapon = getStarterWeapon(klass);

  const helmet: GameItem = {
    id: "ng_helmet_light",
    name: "Шлем новичка",
    type: "helmet",
    slot: "helmet",
    icon: "/items/helmet.png",
    stats: {
      pdef: 52,
      mdef: 6,
      weight: 100,
    },
    description: "Начальный шлем. Дает минимальную защиту.",
  };

  const boots: GameItem = {
    id: "ng_boots_light",
    name: "Ботинки новичка",
    type: "boots",
    slot: "boots",
    icon: "/items/boots.png",
    stats: {
      pdef: 30,
      speed: 1,
      weight: 80,
    },
    description: "Лёгкие ботинки. Чуть увеличивают скорость.",
  };

  const cloak: GameItem = {
    id: "ng_cloak_light",
    name: "Плащ новичка",
    type: "cloak",
    slot: "cloak",
    icon: "/items/cloak.png",
    stats: {
      pdef: 130,
      mdef: 120,
      weight: 60,
    },
    description: "Плащ путника. Немного защищает от магии.",
  };

  // Soulshot / Spiritshot + банки
  const isMage = klass === "Маг";
  
  const soulshot: GameItem = {
    id: "soulshot_ng",
    name: "Soulshot NG (x200)",
    type: "consumable",
    slot: "none",
    icon: "/items/drops/resourcesss/etc_spirit_bullet_white_i00.png",
    stats: {},
    description: "Боевые заряды для физического оружия. Количество: 200.",
  };

  const spiritshot: GameItem = {
    id: "spiritshot_ng",
    name: "Spiritshot NG (x200)",
    type: "consumable",
    slot: "none",
    icon: "/items/drops/resourcesss/Etc_spell_shot_white_i01_0.jpg",
    stats: {},
    description: "Магические заряды для посохов. Количество: 200.",
  };

  const hpPotion: GameItem = {
  id: "hp_potion",
  name: "Банка HP",
  type: "consumable",
  slot: "none",
  icon: "/items/hp_potion.png",
  stats: {
    hp_restore: 500,
  },
  count: 20,
  cooldownMs: 2000, // 2 секунди
  description: "Миттєво відновлює 500 HP. Кількість: 20.",
};

const mpPotion: GameItem = {
  id: "mp_potion",
  name: "Банка MP",
  type: "consumable",
  slot: "none",
  icon: "/items/mp_potion.png",
  stats: {
    mp_restore: 400,
  },
  count: 20,
  cooldownMs: 2000, // 2 секунди
  description: "Миттєво відновлює 400 MP. Кількість: 20.",
};



  // Для магів даємо спрітшот, для воїнів - соулшот
  const shots = isMage ? [spiritshot] : [soulshot];

  return [
    weapon,
    helmet,
    boots,
    cloak,
    ...shots,
    hpPotion,
    mpPotion,
  ];
}
