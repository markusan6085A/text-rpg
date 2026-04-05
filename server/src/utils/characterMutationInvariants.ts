type InvariantInput = {
  heroJson: any;
  adena?: unknown;
  aa?: unknown;
  coinLuck?: unknown;
  coinsSilver?: unknown;
};

type InvariantResult = {
  ok: boolean;
  heroJson: Record<string, any>;
  errors: string[];
};

function toNonNegativeInt(value: unknown, fallback = 0): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

function sanitizeInventoryArray(input: unknown, path: string, errors: string[]): any[] {
  if (!Array.isArray(input)) return [];
  const out: any[] = [];
  for (let i = 0; i < input.length; i++) {
    const row = input[i];
    if (!row || typeof row !== "object") {
      errors.push(`${path}[${i}] invalid object`);
      continue;
    }
    const id = String((row as any).id ?? (row as any).itemId ?? "").trim();
    if (!id) {
      errors.push(`${path}[${i}] missing id`);
      continue;
    }
    const count = toNonNegativeInt((row as any).count, 0);
    if (count <= 0) {
      errors.push(`${path}[${i}] invalid count`);
      continue;
    }
    const next = { ...(row as any), id, count };
    if ((row as any).enchantLevel !== undefined) {
      next.enchantLevel = toNonNegativeInt((row as any).enchantLevel, 0);
    }
    out.push(next);
  }
  return out;
}

export function enforceCharacterMutationInvariants(input: InvariantInput): InvariantResult {
  const errors: string[] = [];
  const source = input.heroJson && typeof input.heroJson === "object" ? (input.heroJson as Record<string, any>) : {};
  const heroJson: Record<string, any> = { ...source };

  heroJson.inventory = sanitizeInventoryArray(source.inventory, "inventory", errors);
  heroJson.overflowChest = sanitizeInventoryArray(source.overflowChest, "overflowChest", errors);

  const equipment =
    source.equipment && typeof source.equipment === "object" && !Array.isArray(source.equipment)
      ? ({ ...source.equipment } as Record<string, any>)
      : {};
  if (source.equipment !== undefined && (typeof source.equipment !== "object" || Array.isArray(source.equipment))) {
    errors.push("equipment invalid object");
  }
  heroJson.equipment = equipment;

  const enchantLevels =
    source.equipmentEnchantLevels &&
    typeof source.equipmentEnchantLevels === "object" &&
    !Array.isArray(source.equipmentEnchantLevels)
      ? ({ ...source.equipmentEnchantLevels } as Record<string, any>)
      : {};
  if (
    source.equipmentEnchantLevels !== undefined &&
    (typeof source.equipmentEnchantLevels !== "object" || Array.isArray(source.equipmentEnchantLevels))
  ) {
    errors.push("equipmentEnchantLevels invalid object");
  }

  for (const slot of Object.keys(enchantLevels)) {
    enchantLevels[slot] = toNonNegativeInt(enchantLevels[slot], 0);
  }
  for (const slot of Object.keys(equipment)) {
    const item = equipment[slot];
    if (!item || typeof item !== "object") continue;
    const itemEnchant = toNonNegativeInt((item as any).enchantLevel, 0);
    const mapped = toNonNegativeInt(enchantLevels[slot], 0);
    if (itemEnchant > mapped) enchantLevels[slot] = itemEnchant;
  }
  heroJson.equipmentEnchantLevels = enchantLevels;

  const currencies: Array<[string, unknown]> = [
    ["adena", input.adena],
    ["aa", input.aa],
    ["coinLuck", input.coinLuck],
    ["coinsSilver", input.coinsSilver],
  ];
  for (const [name, value] of currencies) {
    if (value === undefined) continue;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) {
      errors.push(`${name} invalid`);
    }
  }

  return {
    ok: errors.length === 0,
    heroJson,
    errors,
  };
}

