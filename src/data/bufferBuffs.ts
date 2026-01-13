// Визначення бафів від Магической статуи (безкоштовні бафи на 1 годину)
// Ці бафи НЕ є скілами героя, вони додаються як тимчасові бафи з source: "buffer"

export interface BufferBuffDefinition {
  id: number; // Унікальний ID для бафа статуї
  name: string;
  icon: string; // Шлях до іконки з папки "баф"
  stackType: string; // Тип стакування (той самий, що у професійних бафів)
  effects: Array<{
    stat: string;
    mode: "flat" | "percent" | "multiplier";
    value: number;
  }>;
  description: string;
}

// Бафи статуї (11 бафів з іконками)
export const BUFFER_BUFFS: BufferBuffDefinition[] = [
  {
    id: 10001,
    name: "Might",
    icon: "/skills/skill1068.gif",
    stackType: "might",
    effects: [{ stat: "pAtk", mode: "percent", value: 20 }], // Рівень 3 пророка дає 20%
    description: "Увеличивает физ. атаку на 20%",
  },
  {
    id: 10002,
    name: "Shield",
    icon: "/skills/skill1040.gif",
    stackType: "shield",
    effects: [{ stat: "pDef", mode: "percent", value: 15 }], // Рівень 3 пророка дає 15%
    description: "Увеличивает физ. защиту на 15%",
  },
  {
    id: 10003,
    name: "Bless the Body",
    icon: "/skills/skill1045.gif",
    stackType: "bless_the_body",
    effects: [
      { stat: "maxHp", mode: "percent", value: 35 }, // Рівень 1 пророка дає 35%
    ],
    description: "Увеличивает максимальный HP на 35%",
  },
  {
    id: 10004,
    name: "Bless the Soul",
    icon: "/skills/skill1048.gif",
    stackType: "bless_the_soul",
    effects: [
      { stat: "maxMp", mode: "percent", value: 30 }, // Рівень 1 пророка дає 30%
    ],
    description: "Увеличивает максимальный MP на 30%",
  },
  {
    id: 10005,
    name: "Greater Empower",
    icon: "/skills/skill1059.gif",
    stackType: "greater_empower",
    effects: [{ stat: "mAtk", mode: "percent", value: 30 }],
    description: "Увеличивает маг. атаку на 30%",
  },
  {
    id: 10006,
    name: "Berserker Spirit",
    icon: "/skills/skill1062.gif",
    stackType: "berserker",
    effects: [
      { stat: "pAtk", mode: "percent", value: 20 }, // Рівень 2 пророка дає 20%
      { stat: "mAtk", mode: "percent", value: 20 },
      { stat: "attackSpeed", mode: "percent", value: 20 },
      { stat: "castSpeed", mode: "percent", value: 20 },
      { stat: "pDef", mode: "percent", value: -20 }, // Зменшує pDef на 20%
      { stat: "mDef", mode: "percent", value: -20 }, // Зменшує mDef на 20%
    ],
    description: "Увеличивает физ. атаку, маг. атаку, скорость атаки и каста на 20%, но снижает защиту на 20%",
  },
  {
    id: 10007,
    name: "Focus",
    icon: "/skills/skill1077.gif",
    stackType: "focus",
    effects: [{ stat: "critRate", mode: "percent", value: 20 }], // Рівень 2-3 пророка дає 20%
    description: "Увеличивает шанс критической атаки на 20%",
  },
  {
    id: 10008,
    name: "Acumen",
    icon: "/skills/skill1085.gif",
    stackType: "acumen",
    effects: [{ stat: "castSpeed", mode: "percent", value: 30 }], // Рівень 3 пророка дає 30%
    description: "Увеличивает скорость каста на 30%",
  },
  {
    id: 10009,
    name: "Haste",
    icon: "/skills/skill1086.gif",
    stackType: "haste",
    effects: [{ stat: "attackSpeed", mode: "percent", value: 33 }], // Рівень 1-2 пророка дає 33%
    description: "Увеличивает скорость атаки на 33%",
  },
  {
    id: 10010,
    name: "Guidance",
    icon: "/skills/skill1240.gif",
    stackType: "guidance",
    effects: [{ stat: "accuracy", mode: "flat", value: 4 }],
    description: "Увеличивает точность на 4",
  },
];

// Тривалість бафів статуї: 1 година (3600 секунд)
export const BUFFER_BUFF_DURATION_SEC = 3600;

