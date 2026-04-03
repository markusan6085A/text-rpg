// GM-шоп: повні «blessed» заряди — однаково для фіз. і маг. ударів, +100% до урону (×2) на клієнті
import type { ItemDefinition } from "./itemsDB.types";

const ICON = (g: string) =>
  `/items/drops/resources/Br_cash_pack_of_blessed_spiritshot_${g}_i00_0.jpg`;

const DESC =
  "Повний заряд (blessed): дає +100% до урону автоатаки та ударних скілів — для воїнів і магів. Грейд має збігатися з грейдом зброї. Ставте на панель зарядів як soulshot/spiritshot.";

export const itemsDBGmBlessedCharges: Record<string, ItemDefinition> = {
  gm_blessed_charge_d: {
    id: "gm_blessed_charge_d",
    name: "Повний заряд (D-grade)",
    kind: "consumable",
    slot: "consumable",
    icon: ICON("d"),
    description: `${DESC} D-grade.`,
    grade: "D",
  },
  gm_blessed_charge_c: {
    id: "gm_blessed_charge_c",
    name: "Повний заряд (C-grade)",
    kind: "consumable",
    slot: "consumable",
    icon: ICON("c"),
    description: `${DESC} C-grade.`,
    grade: "C",
  },
  gm_blessed_charge_b: {
    id: "gm_blessed_charge_b",
    name: "Повний заряд (B-grade)",
    kind: "consumable",
    slot: "consumable",
    icon: ICON("b"),
    description: `${DESC} B-grade.`,
    grade: "B",
  },
  gm_blessed_charge_a: {
    id: "gm_blessed_charge_a",
    name: "Повний заряд (A-grade)",
    kind: "consumable",
    slot: "consumable",
    icon: ICON("a"),
    description: `${DESC} A-grade.`,
    grade: "A",
  },
  gm_blessed_charge_s: {
    id: "gm_blessed_charge_s",
    name: "Повний заряд (S-grade)",
    kind: "consumable",
    slot: "consumable",
    icon: ICON("s"),
    description: `${DESC} S-grade.`,
    grade: "S",
  },
};
