/**
 * Craft resources (levels 2–4): English names + icons under
 * `public/items/drops/resources/l2dop-by-itemid/`.
 */
import type { ItemDefinition } from "./itemsDB.types";

export const itemsDBCraftResources: Record<string, ItemDefinition> = {
  // ── Базові ресурси NG/D (L2 IDs 1864–1882) ──────────────────────────────
  stem: {
    id: "stem", name: "Stem", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/1864.jpg",
    description: "Гілка рослини. Базовий матеріал для крафту NG-предметів.",
    stackable: true,
  },
  animal_skin: {
    id: "animal_skin", name: "Animal Skin", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/1867.jpg",
    description: "Шкіра тварини. Використовується для виготовлення NG-броні та аксесуарів.",
    stackable: true,
  },
  iron_ore: {
    id: "iron_ore", name: "Iron Ore", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/1869.jpg",
    description: "Залізна руда. Основна сировина для виплавки металевих виробів.",
    stackable: true,
  },
  coal: {
    id: "coal", name: "Coal", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/1870.jpg",
    description: "Вугілля. Паливо для плавки металів і крафту NG-предметів.",
    stackable: true,
  },
  animal_bone: {
    id: "animal_bone", name: "Animal Bone", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/1872.jpg",
    description: "Кістка тварини. Матеріал для крафту примітивної зброї та NG-предметів.",
    stackable: true,
  },
  silver_nugget: {
    id: "silver_nugget", name: "Silver Nugget", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/1873.jpg",
    description: "Зливок срібла. Цінний метал для виготовлення D/C-предметів.",
    stackable: true,
  },
  oriharukon_ore: {
    id: "oriharukon_ore", name: "Oriharukon Ore", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/1874.jpg",
    description: "Руда оріхалкону. Рідкісний метал для крафту потужної A-екіпіровки.",
    stackable: true,
  },
  stone_of_purity: {
    id: "stone_of_purity", name: "Stone of Purity", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/1875.jpg",
    description: "Камінь чистоти. Використовується у виробництві кристалів і ювелірних виробів.",
    stackable: true,
  },
  mithril_ore: {
    id: "mithril_ore", name: "Mithril Ore", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/1876.jpg",
    description: "Руда мітрилу. Легкий і надміцний метал для крафту A-зброї та броні.",
    stackable: true,
  },
  adamantite_nugget: {
    id: "adamantite_nugget", name: "Adamantite Nugget", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/1877.jpg",
    description: "Зливок адамантиту. Надтвердий метал найвищого ґатунку для S-екіпіровки.",
    stackable: true,
  },
  braided_hemp: {
    id: "braided_hemp", name: "Braided Hemp", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/1878.jpg",
    description: "Плетена конопля. Міцне рослинне волокно для виготовлення мотузок та тканини.",
    stackable: true,
  },
  cokes: {
    id: "cokes", name: "Cokes", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/1879.jpg",
    description: "Кокс. Вуглецевий матеріал для виплавки твердої сталі.",
    stackable: true,
  },
  steel: {
    /** L2 item id 1880 — той самий ресурс, що з дропу мобів (processDrops / крафт). */
    id: "steel", name: "Steel", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/1880.jpg",
    description: "Сталь. Міцний метал — ключовий матеріал для крафту D/C-зброї та броні.",
    stackable: true,
  },
  coarse_bone_powder: {
    id: "coarse_bone_powder", name: "Coarse Bone Powder", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/1881.jpg",
    description: "Груба кісткова мука. Перемелені кістки тварин. Матеріал для виготовлення D/C-зброї та броні.",
    stackable: true,
  },
  leather: {
    id: "leather", name: "Leather", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/1882.jpg",
    description: "Шкіра. Оброблена шкіра тварин — основний матеріал для легкої броні.",
    stackable: true,
  },

  // ── Custom ресурси (без стандартного L2 ID) ───────────────────────
  nickel: {
    id: "nickel", name: "Нікель", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/1873.jpg",
    description: "Нікель. Блискучий метал для крафту спеціальних виробів.",
    stackable: true,
  },
  crystal_dye: {
    id: "crystal_dye", name: "Crystal Dye", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/1875.jpg",
    description: "Кристалічний барвник. Рідкісний матеріал для зачарування та фарбування.",
    stackable: true,
  },
  crystal_quality: {
    id: "crystal_quality", name: "Crystal Quality", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/1875.jpg",
    description: "Якісний кристал. Чистий кристал для крафту зачарованих предметів.",
    stackable: true,
  },
  weavers_module: {
    id: "weavers_module", name: "Модуль Ткачів", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/1889.jpg",
    description: "Модуль Ткачів. Спеціальний компонент гільдії ткачів.",
    stackable: true,
  },
  varnish_of_purity: {
    id: "varnish_of_purity", name: "Varnish of Purity", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/4039.jpg",
    description: "Лак чистоти. Очищувальний склад для полірування та захисту предметів.",
    stackable: true,
  },

  // ── Оброблені матеріали C/B ────────────────────────────────────────
  cord: {
    id: "cord", name: "Cord", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/1884.jpg",
    description: "Шнур. Міцна мотузка для скріплення деталей та крафту C-предметів.",
    stackable: true,
  },
  high_grade_suede: {
    id: "high_grade_suede", name: "High Grade Suede", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/5549.jpg",
    description: "Замша вищого ґатунку. Тонко вичинена шкіра для B/A-броні та аксесуарів.",
    stackable: true,
  },
  compound_braid: {
    id: "compound_braid", name: "Compound Braid", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/4042.jpg",
    description: "Складена коса. Переплетене волокно підвищеної міцності для C/B-крафту.",
    stackable: true,
  },
  crafted_leather: {
    id: "crafted_leather", name: "Crafted Leather", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/4041.jpg",
    description: "Оброблена шкіра. Спеціально вичинена шкіра для крафту B-броні.",
    stackable: true,
  },

  // ── Рідкісні матеріали B/A ────────────────────────────────────────
  metal_hardener: {
    id: "metal_hardener", name: "Metal Hardener", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/4038.jpg",
    description: "Затверджувач металу. Речовина для підвищення твердості металевих виробів A-класу.",
    stackable: true,
  },
  metallic_fiber: {
    id: "metallic_fiber", name: "Metallic Fiber", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/4043.jpg",
    description: "Металеве волокно. Тонке волокно з металевих сплавів для A/S-предметів.",
    stackable: true,
  },
  durable_metal_plate: {
    id: "durable_metal_plate", name: "Durable Metal Plate", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/4044.jpg",
    description: "Міцна металева пластина. Пластина з загартованого металу для S-броні.",
    stackable: true,
  },
  metallic_thread: {
    id: "metallic_thread", name: "Metallic Thread", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/4045.jpg",
    description: "Металева нитка. Надтонка нитка з металевого сплаву для A/S-предметів.",
    stackable: true,
  },

  // ── Пресформи (Mold) ───────────────────────────────────────────────
  mold_glue: {
    id: "mold_glue", name: "Mold Glue", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/4039.jpg",
    description: "Клей для форм. Спеціальний склад для скріплення частин пресформи.",
    stackable: true,
  },
  mold_lubricant: {
    id: "mold_lubricant", name: "Mold Lubricant", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/4040.jpg",
    description: "Мастило для форм. Зменшує тертя при литті та полегшує виготовлення форм.",
    stackable: true,
  },
  mold_hardener: {
    id: "mold_hardener", name: "Mold Hardener", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/4041.jpg",
    description: "Затверджувач форм. Зміцнює структуру пресформи для точного лиття.",
    stackable: true,
  },
  enria: {
    id: "enria", name: "Enria", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/4042.jpg",
    description: "Енрія. Рідкісна магічна речовина, необхідна для крафту S-предметів.",
    stackable: true,
  },
  asofe: {
    id: "asofe", name: "Asofe", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/4043.jpg",
    description: "Азофе. Надрідкісна речовина з магічними властивостями. Потрібна для S-крафту.",
    stackable: true,
  },
  thons: {
    id: "thons", name: "Thons", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/4044.jpg",
    description: "Тонс. Найрідкісніший матеріал для виготовлення предметів найвищої якості.",
    stackable: true,
  },

  // ── Спеціальні крафт-компоненти ────────────────────────────────────
  maestro_mold: {
    id: "maestro_mold", name: "Maestro Mold", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/Maestro_Mold.jpg",
    description: "Форма майстра. Унікальна пресформа для виготовлення виробів вищого класу.",
    stackable: true,
  },
  craftsman_mold: {
    id: "craftsman_mold", name: "Craftsman Mold", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/Craftsman_Mold.jpg",
    description: "Форма ремісника. Стандартна пресформа для серійного крафту.",
    stackable: true,
  },
  maestro_holder: {
    id: "maestro_holder", name: "Maestro Holder", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/Maestro_Holder.jpg",
    description: "Тримач майстра. Спеціальний кріпильний елемент для складного виробництва.",
    stackable: true,
  },
  maestro_anvil_lock: {
    id: "maestro_anvil_lock", name: "Maestro Anvil Lock", kind: "resource", slot: "resource",
    icon: "/items/drops/resources/l2dop-by-itemid/Maestro_Anvil_Lock.jpg",
    description: "Замок ковадла майстра. Фіксатор для точного кування предметів.",
    stackable: true,
  },
};
