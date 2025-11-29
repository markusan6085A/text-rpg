export function getStarterItems(klass: string): string[] {
  if (klass === "Воин") return ["ng_sword_001", "ng_armor_light_001"];
  if (klass === "Маг") return ["ng_staff_001", "ng_robe_001"];
  return [];
}
