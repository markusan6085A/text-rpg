/**
 * Людяна назва внутрішнього id ресурсу для дропу/спойлу (без mold_/metal_/double_ тощо).
 * id у грі лишається незмінним; змінюється лише відображення.
 */

/** Довші спочатку — знімаємо лише один префікс. */
const RESOURCE_ID_STRIP_PREFIXES: readonly string[] = [
  "high_grade_",
  "compound_",
  "adamantite_",
  "oriharukon_",
  "metallic_",
  "braided_",
  "durable_",
  "animal_",
  "crafted_",
  "mithril_",
  "metal_",
  "mold_",
  "double_",
  "coarse_",
];

function humanizeSnakeId(id: string): string {
  return id
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function resourceLootDisplayName(id: string): string {
  if (!id || id.startsWith("l2item_")) return id;
  let rest = id;
  for (const p of RESOURCE_ID_STRIP_PREFIXES) {
    if (rest.startsWith(p)) {
      rest = rest.slice(p.length);
      break;
    }
  }
  if (!rest) return humanizeSnakeId(id);
  return humanizeSnakeId(rest);
}
