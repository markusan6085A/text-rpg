import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../db";
import { getAuth } from "../character/auth";
import { validateHeroJson, addVersioning } from "../../heroJsonValidator";
import { rateLimiters, rateLimitMiddleware } from "../../rateLimiter";
import { enqueuePlayerActivityLog, getClientIp } from "../../playerActivityLog";

const LISTING_TTL_MS = 24 * 60 * 60 * 1000;
const MARKET_KIND_COIN_LUCK = "coin_luck";
/** Звичайний предмет на ринку (щоб фільтр «предмети» не покладався на NOT + NULL у JSON — PostgreSQL відсіює такі рядки). */
const MARKET_KIND_ITEM = "item";
const MAX_LISTINGS_PER_SELLER = 40;
const MAX_PAGE = 50;
const INV_MIN = 100;
const INV_MAX = 500;
const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);

/** Після проксі/Vercel поля інколи приходять рядком — інакше Number() дає NaN → invalid price */
function parsePositiveIntInput(v: unknown): number | null {
  if (v === undefined || v === null) return null;
  if (typeof v === "bigint") {
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  }
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string") {
    const t = v.replace(/\s/g, "").trim();
    if (!t) return null;
    const n = Number(t);
    if (!Number.isFinite(n)) return null;
    return Math.trunc(n);
  }
  return null;
}

function hasExplicitBodyField(body: Record<string, unknown>, key: string): boolean {
  const v = body[key];
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v.trim() !== "";
  return true;
}

type Tx = Prisma.TransactionClient;

function inventoryCap(heroJson: any): number {
  const cap = heroJson?.inventoryCapacity;
  if (typeof cap !== "number" || cap < INV_MIN) return INV_MIN;
  return Math.min(cap, INV_MAX);
}

function ensureHeroJsonBase(
  c: { name: string; race: string; classId: string; level: number },
  hj: any
): any {
  const base = { ...(hj || {}) };
  base.name = base.name || c.name;
  base.race = base.race || c.race;
  base.classId = base.classId || base.klass || c.classId;
  base.klass = base.klass || base.classId || c.classId;
  base.level = base.level ?? c.level;
  return base;
}

function serializeCharacter(c: any) {
  return {
    ...c,
    exp: Number(c.exp),
    adena: Number(c.adena ?? 0),
    aa: Number(c.aa ?? 0),
    coinLuck: Number(c.coinLuck ?? 0),
    coinsSilver: Number(c.coinsSilver ?? 0),
  };
}

function rowItemId(x: any): string {
  return String(x?.id ?? x?.itemId ?? "").trim();
}

function stackCountOf(item: any): number {
  const n = Math.floor(Number(item?.count) || 1);
  return n >= 1 ? n : 1;
}

/** Знімає `take` шт. зі слота: решта лишається в тому ж індексі або рядок видаляється. */
function takeStackFromSlot(
  arr: any[],
  idx: number,
  take: number
): { nextArr: any[]; snapshot: any } | { err: string } {
  if (idx < 0 || idx >= arr.length) return { err: "invalid_item_index" };
  const row = arr[idx];
  if (!row || typeof row !== "object") return { err: "invalid_item" };
  const sc = stackCountOf(row);
  if (take < 1 || take > sc) return { err: "invalid_amount" };
  const next = [...arr];
  if (take === sc) {
    next.splice(idx, 1);
  } else {
    next[idx] = { ...row, count: sc - take };
  }
  const snapshot = JSON.parse(JSON.stringify({ ...row, count: take }));
  return { nextArr: next, snapshot };
}

async function applyItemReturnToHero(
  tx: Tx,
  seller: { id: string; name: string; race: string; classId: string; level: number; heroJson: any },
  item: any
) {
  const hj0 = ensureHeroJsonBase(seller, (seller.heroJson as any) || {});
  const cap = inventoryCap(hj0);
  const inv = [...(hj0.inventory || [])];
  const overflow = [...(hj0.overflowChest || [])];
  if (inv.length < cap) {
    inv.push(item);
  } else {
    overflow.push(item);
  }
  const next = { ...hj0, inventory: inv, overflowChest: overflow };
  const validation = validateHeroJson(next);
  if (!validation.valid) {
    throw new Error(`invalid_hero_json: ${validation.errors.join("; ")}`);
  }
  const oldRevision = Number(hj0.heroRevision || 0);
  const versioned = addVersioning(next, oldRevision);
  await tx.character.update({
    where: { id: seller.id },
    data: { heroJson: versioned as any, lastActivityAt: new Date() },
  });
}

function isCoinLuckListingSnap(snap: unknown): boolean {
  return Boolean(snap && typeof snap === "object" && (snap as Record<string, unknown>)._marketKind === MARKET_KIND_COIN_LUCK);
}

async function applyCoinLuckReturnToSeller(
  tx: Tx,
  seller: { id: string; name: string; race: string; classId: string; level: number; heroJson: any; coinLuck: bigint | number | null },
  amount: number
) {
  const amt = Math.max(1, Math.floor(Number(amount) || 0));
  if (amt < 1) throw new Error("invalid_coin_luck_amount");
  const cur = BigInt((seller as any).coinLuck ?? 0);
  const next = cur + BigInt(amt);
  if (next > MAX_SAFE) throw new Error("currency_overflow");
  const hj0 = ensureHeroJsonBase(seller, (seller.heroJson as any) || {});
  const nextHj = { ...hj0, coinOfLuck: Number(next) };
  const validation = validateHeroJson(nextHj);
  if (!validation.valid) {
    throw new Error(`invalid_hero_json: ${validation.errors.join("; ")}`);
  }
  const oldRevision = Number(hj0.heroRevision || 0);
  const versioned = addVersioning(nextHj, oldRevision);
  await tx.character.update({
    where: { id: seller.id },
    data: { coinLuck: next, heroJson: versioned as any, lastActivityAt: new Date() },
  });
}

async function expireStaleListings(app: FastifyInstance) {
  const now = new Date();
  const stale = await prisma.playerMarketListing.findMany({
    where: { status: "active", expiresAt: { lt: now } },
  });
  for (const listing of stale) {
    try {
      await prisma.$transaction(async (tx) => {
        const row = await tx.playerMarketListing.findUnique({ where: { id: listing.id } });
        if (!row || row.status !== "active") return;
        const seller = await tx.character.findUnique({ where: { id: row.sellerCharacterId } });
        if (!seller) {
          await tx.playerMarketListing.update({ where: { id: row.id }, data: { status: "expired" } });
          return;
        }
        const snap = row.itemSnapshot as any;
        if (isCoinLuckListingSnap(snap)) {
          const sc = Math.max(1, Math.floor(Number(snap?.count) || 1));
          await applyCoinLuckReturnToSeller(tx, seller as any, sc);
        } else {
          await applyItemReturnToHero(tx, seller as any, row.itemSnapshot as any);
        }
        await tx.playerMarketListing.update({ where: { id: row.id }, data: { status: "expired" } });
      });
    } catch (e) {
      app.log.error(e, `[market] expire listing ${listing.id}`);
    }
  }
}

/** Періодичний job з server/index — повернення предметів без заходу на /market */
export async function runMarketExpireStaleListings(app: FastifyInstance) {
  await expireStaleListings(app);
}

export async function marketRoutes(app: FastifyInstance) {
  // GET /market/listings
  app.get("/market/listings", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    await expireStaleListings(app);

    const q = req.query as { page?: string; limit?: string; kind?: string };
    const page = Math.max(1, parseInt(String(q.page || "1"), 10) || 1);
    const limit = Math.min(MAX_PAGE, Math.max(1, parseInt(String(q.limit || "20"), 10) || 20));
    const skip = (page - 1) * limit;
    const now = new Date();

    const kind = String(q.kind || "all").trim().toLowerCase();
    const baseWhere = { status: "active" as const, expiresAt: { gt: now } };
    const where =
      kind === "coin_luck"
        ? {
            ...baseWhere,
            itemSnapshot: { path: ["_marketKind"], equals: MARKET_KIND_COIN_LUCK },
          }
        : kind === "items"
          ? {
              ...baseWhere,
              itemSnapshot: { path: ["_marketKind"], equals: MARKET_KIND_ITEM },
            }
          : baseWhere;

    const [rows, total] = await Promise.all([
      prisma.playerMarketListing.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          sellerCharacterId: true,
          sellerName: true,
          itemSnapshot: true,
          currency: true,
          price: true,
          createdAt: true,
          expiresAt: true,
        },
      }),
      prisma.playerMarketListing.count({ where }),
    ]);

    const listings = rows.map((r) => ({
      id: r.id,
      sellerCharacterId: r.sellerCharacterId,
      sellerName: r.sellerName,
      itemSnapshot: r.itemSnapshot,
      currency: r.currency,
      price: r.price.toString(),
      createdAt: r.createdAt.toISOString(),
      expiresAt: r.expiresAt.toISOString(),
    }));

    return { ok: true, listings, total, page, limit };
  });

  // GET /market/my-listings?characterId=
  app.get("/market/my-listings", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    await expireStaleListings(app);

    const characterId = String((req.query as any)?.characterId || "").trim();
    if (!characterId) return reply.code(400).send({ error: "characterId required" });

    const owner = await prisma.character.findFirst({
      where: { id: characterId, accountId: auth.accountId },
    });
    if (!owner) return reply.code(404).send({ error: "character not found" });

    const now = new Date();
    const rows = await prisma.playerMarketListing.findMany({
      where: { sellerCharacterId: characterId, status: "active", expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
    });

    const listings = rows.map((r) => ({
      id: r.id,
      sellerCharacterId: r.sellerCharacterId,
      sellerName: r.sellerName,
      itemSnapshot: r.itemSnapshot,
      currency: r.currency,
      price: r.price.toString(),
      createdAt: r.createdAt.toISOString(),
      expiresAt: r.expiresAt.toISOString(),
    }));

    return { ok: true, listings };
  });

  // POST /market/listings  { characterId, inventoryItemId, currency, unitPrice, amount?, itemSource?, itemIndex? }
  // або legacy: price (загальна сума за весь стек), без unitPrice
  // itemSource: "inventory" | "overflowChest" + itemIndex — точний слот (стек риби/ресурсів у overflow)
  app.post(
    "/market/listings",
    {
      preHandler: async (req, reply) => {
        await rateLimitMiddleware(rateLimiters.characterUpdate, "market")(req, reply);
      },
    },
    async (req, reply) => {
      const auth = getAuth(req);
      if (!auth) return reply.code(401).send({ error: "unauthorized" });

      await expireStaleListings(app);

      const body = req.body as {
        characterId?: string;
        inventoryItemId?: string;
        listingKind?: string;
        expectedRevision?: number;
        currency?: string;
        /** Загальна ціна лоту (старий клієнт): за весь стек одним платежем */
        price?: number;
        /** Ціна за 1 шт.; разом з amount дає total = unitPrice * amount */
        unitPrice?: number;
        /** Скільки шт. виставити (стек); за замовчуванням — увесь стек */
        amount?: number;
        itemSource?: string;
        itemIndex?: number;
      };
      const characterId = String(body.characterId || "").trim();
      const inventoryItemId = String(body.inventoryItemId || "").trim();
      const listingKind = String(body.listingKind || "").trim();
      const isColListing = listingKind === "coin_luck";
      const currency = String(body.currency || "").trim();
      const bodyRec = body as Record<string, unknown>;
      const unitP = parsePositiveIntInput(bodyRec.unitPrice);
      const amtP = parsePositiveIntInput(bodyRec.amount);
      const legacyP = parsePositiveIntInput(bodyRec.price);
      const useUnitPrice = unitP !== null && unitP >= 1;
      const explicitAmount = hasExplicitBodyField(bodyRec, "amount");
      const expectedRevision = Number(body.expectedRevision);

      if (!characterId) {
        return reply.code(400).send({ error: "characterId required" });
      }
      if (!isColListing && !inventoryItemId) {
        return reply.code(400).send({ error: "characterId and inventoryItemId required" });
      }
      if (!Number.isFinite(expectedRevision) || expectedRevision < 0) {
        return reply.code(400).send({ error: "expectedRevision required" });
      }
      if (!isColListing && inventoryItemId === "seven_seals_medal") {
        return reply.code(400).send({ error: "seven_seals_medal cannot be listed" });
      }
      if (isColListing && currency !== "adena") {
        return reply.code(400).send({ error: "coin_luck_listing_must_use_adena_price" });
      }
      if (currency !== "adena" && currency !== "coinLuck") {
        return reply.code(400).send({ error: "currency must be adena or coinLuck" });
      }

      try {
        const result = await prisma.$transaction(async (tx) => {
          const lockedSeller = await tx.$queryRaw<Array<{ id: string; heroJson: any }>>`
            SELECT "id", "heroJson"
            FROM "Character"
            WHERE "id" = ${characterId} AND "accountId" = ${auth.accountId}
            FOR UPDATE
          `;
          if (lockedSeller.length === 0) return { err: 404 as const, msg: "character not found" };
          const sellerCurrentRevision = Number((lockedSeller[0]?.heroJson as any)?.heroRevision ?? 0);
          if (sellerCurrentRevision !== expectedRevision) {
            return {
              err: 409 as const,
              msg: "revision_conflict",
              revision: sellerCurrentRevision,
            };
          }
          const seller = await tx.character.findUnique({ where: { id: characterId } });
          if (!seller) return { err: 404 as const, msg: "character not found" };

          const activeCount = await tx.playerMarketListing.count({
            where: {
              sellerCharacterId: characterId,
              status: "active",
              expiresAt: { gt: new Date() },
            },
          });
          if (activeCount >= MAX_LISTINGS_PER_SELLER) {
            return { err: 400 as const, msg: "too_many_active_listings" };
          }

          if (isColListing) {
            if (!useUnitPrice || unitP === null || unitP < 1) {
              return { err: 400 as const, msg: "unitPrice required for coin_luck" };
            }
            if (!explicitAmount || amtP === null || amtP < 1) {
              return { err: 400 as const, msg: "amount required for coin_luck" };
            }
            const listAmount = amtP;
            const up = unitP;
            const sellerCoin = BigInt((seller as any).coinLuck ?? 0);
            if (sellerCoin < BigInt(listAmount)) {
              return { err: 400 as const, msg: "not_enough_coin_luck" };
            }
            const prod = BigInt(up) * BigInt(listAmount);
            if (prod < 1n || prod > MAX_SAFE) {
              return { err: 400 as const, msg: "invalid price" };
            }
            const nextCoin = sellerCoin - BigInt(listAmount);
            const hj0 = ensureHeroJsonBase(seller, (seller.heroJson as any) || {});
            const nextHj = { ...hj0, coinOfLuck: Number(nextCoin) };
            const validation = validateHeroJson(nextHj);
            if (!validation.valid) {
              return { err: 400 as const, msg: "invalid_hero_json", errors: validation.errors };
            }
            const oldRevision = Number(hj0.heroRevision || 0);
            const versioned = addVersioning(nextHj, oldRevision);
            const expiresAt = new Date(Date.now() + LISTING_TTL_MS);
            const snapshot = {
              _marketKind: MARKET_KIND_COIN_LUCK,
              count: listAmount,
              id: "coin_of_luck",
              itemId: "coin_of_luck",
              name: "Coin of Luck",
              icon: "/icons/col (1).png",
            };
            const createdListing = await tx.playerMarketListing.create({
              data: {
                sellerCharacterId: characterId,
                sellerName: seller.name,
                itemSnapshot: snapshot as any,
                currency: "adena",
                price: prod,
                status: "active",
                expiresAt,
              },
            });
            const updated = await tx.character.update({
              where: { id: characterId },
              data: {
                coinLuck: nextCoin,
                heroJson: versioned as any,
                lastActivityAt: new Date(),
              },
              select: {
                id: true,
                name: true,
                race: true,
                classId: true,
                sex: true,
                level: true,
                exp: true,
                sp: true,
                adena: true,
                aa: true,
                coinLuck: true,
                coinsSilver: true,
                heroJson: true,
                createdAt: true,
                updatedAt: true,
              },
            });
            return {
              err: null,
              character: updated,
              listMeta: {
                listingId: createdListing.id,
                listAmount,
                currency: "adena",
                price: prod.toString(),
                itemId: "coin_of_luck",
                itemName: "Coin of Luck",
              },
            };
          }

          const hj0 = ensureHeroJsonBase(seller, (seller.heroJson as any) || {});
          const inv = [...(hj0.inventory || [])];
          const overflow = [...(hj0.overflowChest || [])];

          const src =
            body.itemSource === "overflowChest"
              ? ("overflowChest" as const)
              : body.itemSource === "inventory"
                ? ("inventory" as const)
                : null;
          const ix =
            typeof body.itemIndex === "number" && Number.isFinite(body.itemIndex)
              ? Math.floor(body.itemIndex)
              : null;

          let removed: any;
          let slotKind: "inventory" | "overflowChest" = "inventory";
          let slotIndex = -1;

          if (src !== null && ix !== null) {
            if (src === "inventory") {
              if (ix < 0 || ix >= inv.length) return { err: 400 as const, msg: "invalid_item_index" };
              removed = inv[ix];
              const rid = rowItemId(removed);
              if (!rid) return { err: 400 as const, msg: "invalid_item" };
              if (rid === "overflow_chest") return { err: 400 as const, msg: "cannot_list_overflow_chest" };
              if (rid !== inventoryItemId) return { err: 400 as const, msg: "item_id_mismatch" };
              const eq = hj0.equipment || {};
              for (const k of Object.keys(eq)) {
                if (eq[k] === rid) return { err: 400 as const, msg: "item_is_equipped" };
              }
              slotKind = "inventory";
              slotIndex = ix;
            } else {
              if (ix < 0 || ix >= overflow.length) return { err: 400 as const, msg: "invalid_item_index" };
              removed = overflow[ix];
              const rid = rowItemId(removed);
              if (!rid) return { err: 400 as const, msg: "invalid_item" };
              if (rid === "overflow_chest") return { err: 400 as const, msg: "cannot_list_overflow_chest" };
              if (rid !== inventoryItemId) return { err: 400 as const, msg: "item_id_mismatch" };
              slotKind = "overflowChest";
              slotIndex = ix;
            }
          } else {
            let idx = inv.findIndex((x: any) => x && rowItemId(x) === inventoryItemId);
            if (idx >= 0) {
              removed = inv[idx];
              if (rowItemId(removed) === "overflow_chest") {
                return { err: 400 as const, msg: "cannot_list_overflow_chest" };
              }
              const eq = hj0.equipment || {};
              for (const k of Object.keys(eq)) {
                if (eq[k] === inventoryItemId) {
                  return { err: 400 as const, msg: "item_is_equipped" };
                }
              }
              slotKind = "inventory";
              slotIndex = idx;
            } else {
              idx = overflow.findIndex((x: any) => x && rowItemId(x) === inventoryItemId);
              if (idx < 0) return { err: 400 as const, msg: "item_not_in_inventory" };
              removed = overflow[idx];
              if (rowItemId(removed) === "overflow_chest") {
                return { err: 400 as const, msg: "cannot_list_overflow_chest" };
              }
              slotKind = "overflowChest";
              slotIndex = idx;
            }
          }

          const sc = stackCountOf(removed);

          let listAmount: number;
          let price: bigint;

          if (useUnitPrice && unitP !== null) {
            const up = unitP;
            if (explicitAmount) {
              if (amtP === null || amtP < 1) {
                return { err: 400 as const, msg: "invalid_amount" };
              }
              listAmount = amtP;
            } else {
              listAmount = sc;
            }
            if (listAmount < 1 || listAmount > sc) {
              return { err: 400 as const, msg: "invalid_amount" };
            }
            const prod = BigInt(up) * BigInt(listAmount);
            if (prod < 1n || prod > MAX_SAFE) {
              return { err: 400 as const, msg: "invalid price" };
            }
            price = prod;
          } else {
            if (legacyP === null || legacyP < 1 || legacyP > Number.MAX_SAFE_INTEGER) {
              return { err: 400 as const, msg: "invalid price" };
            }
            listAmount = sc;
            price = BigInt(legacyP);
          }

          const arr = slotKind === "inventory" ? inv : overflow;
          const taken = takeStackFromSlot(arr, slotIndex, listAmount);
          if ("err" in taken) {
            const m = taken.err;
            if (m === "invalid_amount") return { err: 400 as const, msg: "invalid_amount" };
            return { err: 400 as const, msg: m };
          }
          const nextInv = slotKind === "inventory" ? taken.nextArr : inv;
          const nextOverflow = slotKind === "overflowChest" ? taken.nextArr : overflow;

          const snapshot = taken.snapshot;
          if (!snapshot.id && snapshot.itemId) snapshot.id = snapshot.itemId;
          delete (snapshot as Record<string, unknown>)._marketKind;
          (snapshot as Record<string, unknown>)._marketKind = MARKET_KIND_ITEM;

          const nextHj = { ...hj0, inventory: nextInv, overflowChest: nextOverflow };
          const validation = validateHeroJson(nextHj);
          if (!validation.valid) {
            return { err: 400 as const, msg: "invalid_hero_json", errors: validation.errors };
          }
          const oldRevision = Number(hj0.heroRevision || 0);
          const versioned = addVersioning(nextHj, oldRevision);

          const expiresAt = new Date(Date.now() + LISTING_TTL_MS);
          const createdListing = await tx.playerMarketListing.create({
            data: {
              sellerCharacterId: characterId,
              sellerName: seller.name,
              itemSnapshot: snapshot as any,
              currency,
              price,
              status: "active",
              expiresAt,
            },
          });

          const updated = await tx.character.update({
            where: { id: characterId },
            data: { heroJson: versioned as any, lastActivityAt: new Date() },
            select: {
              id: true,
              name: true,
              race: true,
              classId: true,
              sex: true,
              level: true,
              exp: true,
              sp: true,
              adena: true,
              aa: true,
              coinLuck: true,
              coinsSilver: true,
              heroJson: true,
              createdAt: true,
              updatedAt: true,
            },
          });

          return {
            err: null,
            character: updated,
            listMeta: {
              listingId: createdListing.id,
              listAmount,
              currency,
              price: price.toString(),
              itemId: rowItemId(snapshot),
              itemName: String((snapshot as any)?.name || ""),
            },
          };
        });

        if (result.err) {
          const code = result.err;
          const payload: any = { error: result.msg };
          if ((result as any).revision !== undefined) payload.revision = (result as any).revision;
          if ((result as any).errors) payload.errors = (result as any).errors;
          return reply.code(code === 404 ? 404 : code === 409 ? 409 : 400).send(payload);
        }

        const lm = (result as any).listMeta as {
          listingId: string;
          listAmount: number;
          currency: string;
          price: string;
          itemId: string;
          itemName: string;
        };
        enqueuePlayerActivityLog({
          accountId: auth.accountId,
          characterId,
          characterName: result.character.name,
          action: "market.list",
          metadata: lm,
          clientIp: getClientIp(req),
        });

        return { ok: true, character: serializeCharacter(result.character) };
      } catch (e: any) {
        app.log.error(e, "[market] create listing");
        return reply.code(500).send({ error: e.message || "Internal server error" });
      }
    }
  );

  // POST /market/listings/:id/buy  { buyerCharacterId, quantity? } — quantity ≤ stack; без поля = увесь стек
  app.post(
    "/market/listings/:id/buy",
    {
      preHandler: async (req, reply) => {
        await rateLimitMiddleware(rateLimiters.characterUpdate, "market-buy")(req, reply);
      },
    },
    async (req, reply) => {
      const auth = getAuth(req);
      if (!auth) return reply.code(401).send({ error: "unauthorized" });

      await expireStaleListings(app);

      const listingId = String((req.params as any)?.id || "").trim();
      const body = req.body as { buyerCharacterId?: string; expectedRevision?: number; quantity?: unknown };
      const buyerCharacterId = String(body.buyerCharacterId || "").trim();
      const expectedRevision = Number(body.expectedRevision);
      const qtyRequested = parsePositiveIntInput((body as Record<string, unknown>).quantity);
      if (!listingId || !buyerCharacterId) {
        return reply.code(400).send({ error: "listing id and buyerCharacterId required" });
      }
      if (!Number.isFinite(expectedRevision) || expectedRevision < 0) {
        return reply.code(400).send({ error: "expectedRevision required" });
      }

      try {
        const out = await prisma.$transaction(async (tx) => {
          const now = new Date();

          const listing = await tx.playerMarketListing.findUnique({ where: { id: listingId } });
          if (!listing || listing.status !== "active" || listing.expiresAt <= now) {
            return { err: 404 as const, msg: "listing_not_available" };
          }
          if (listing.sellerCharacterId === buyerCharacterId) {
            return { err: 400 as const, msg: "cannot_buy_own_listing" };
          }

          const lockedBuyer = await tx.$queryRaw<Array<{ id: string; heroJson: any }>>`
            SELECT "id", "heroJson"
            FROM "Character"
            WHERE "id" = ${buyerCharacterId} AND "accountId" = ${auth.accountId}
            FOR UPDATE
          `;
          if (lockedBuyer.length === 0) return { err: 404 as const, msg: "buyer not found" };
          const buyerCurrentRevision = Number((lockedBuyer[0]?.heroJson as any)?.heroRevision ?? 0);
          if (buyerCurrentRevision !== expectedRevision) {
            return { err: 409 as const, msg: "revision_conflict", revision: buyerCurrentRevision };
          }
          const buyer = await tx.character.findUnique({ where: { id: buyerCharacterId } });
          if (!buyer) return { err: 404 as const, msg: "buyer not found" };

          const seller = await tx.character.findUnique({ where: { id: listing.sellerCharacterId } });
          if (!seller) {
            return { err: 500 as const, msg: "seller_missing" };
          }

          const snap = JSON.parse(JSON.stringify(listing.itemSnapshot)) as Record<string, unknown>;
          const isColLot = isCoinLuckListingSnap(snap);
          if (isColLot && listing.currency !== "adena") {
            return { err: 400 as const, msg: "invalid_coin_luck_listing" };
          }
          const sc = Math.max(1, Math.floor(Number(snap?.count) || 1));
          let qty = sc;
          if (qtyRequested !== null) {
            if (qtyRequested < 1) return { err: 400 as const, msg: "invalid_quantity" };
            qty = Math.min(qtyRequested, sc);
          }

          const totalP = listing.price;
          const currency = listing.currency;
          let pay: bigint;
          if (totalP % BigInt(sc) === 0n) {
            const perUnit = totalP / BigInt(sc);
            pay = perUnit * BigInt(qty);
          } else {
            if (qty !== sc) {
              return { err: 400 as const, msg: "partial_purchase_unsupported" };
            }
            pay = totalP;
          }

          let buyerAdena = BigInt(buyer.adena ?? 0);
          let buyerCoin = BigInt(buyer.coinLuck ?? 0);
          let sellerAdena = BigInt(seller.adena ?? 0);
          let sellerCoin = BigInt(seller.coinLuck ?? 0);

          if (currency === "adena") {
            if (buyerAdena < pay) {
              return { err: 400 as const, msg: "not_enough_adena" };
            }
            buyerAdena -= pay;
            sellerAdena += pay;
          } else {
            if (buyerCoin < pay) {
              return { err: 400 as const, msg: "not_enough_coin_luck" };
            }
            buyerCoin -= pay;
            sellerCoin += pay;
          }

          if (isColLot) {
            buyerCoin += BigInt(qty);
          }
          if (sellerAdena > MAX_SAFE || buyerAdena < 0n || sellerCoin > MAX_SAFE || buyerCoin < 0n || buyerCoin > MAX_SAFE) {
            return { err: 400 as const, msg: "currency_overflow" };
          }

          const buyerHj0 = ensureHeroJsonBase(buyer, (buyer.heroJson as any) || {});
          let buyerNext: Record<string, unknown>;
          if (isColLot) {
            buyerNext = {
              ...buyerHj0,
              adena: Number(buyerAdena),
              coinOfLuck: Number(buyerCoin),
            };
          } else {
            const cap = inventoryCap(buyerHj0);
            const inv = [...(buyerHj0.inventory || [])];
            const overflow = [...(buyerHj0.overflowChest || [])];
            const item = { ...snap, count: qty };
            if (inv.length < cap) {
              inv.push(item);
            } else {
              overflow.push(item);
            }
            buyerNext = {
              ...buyerHj0,
              inventory: inv,
              overflowChest: overflow,
              adena: Number(buyerAdena),
              coinOfLuck: Number(buyerCoin),
            };
          }
          const buyerVal = validateHeroJson(buyerNext);
          if (!buyerVal.valid) {
            return { err: 400 as const, msg: "invalid_buyer_hero", errors: buyerVal.errors };
          }
          const buyerVersioned = addVersioning(buyerNext, Number(buyerHj0.heroRevision || 0));

          const sellerHj0 = ensureHeroJsonBase(seller, (seller.heroJson as any) || {});
          const sellerNext = {
            ...sellerHj0,
            adena: Number(sellerAdena),
            coinOfLuck: Number(sellerCoin),
          };
          const sellerVal = validateHeroJson(sellerNext);
          if (!sellerVal.valid) {
            return { err: 500 as const, msg: "invalid_seller_hero" };
          }
          const sellerVersioned = addVersioning(sellerNext, Number(sellerHj0.heroRevision || 0));

          if (qty === sc) {
            const claimed = await tx.playerMarketListing.updateMany({
              where: { id: listingId, status: "active", expiresAt: { gt: now } },
              data: {
                status: "sold",
                buyerCharacterId,
                soldAt: now,
              },
            });
            if (claimed.count !== 1) {
              return { err: 409 as const, msg: "listing_already_sold_or_expired" };
            }
          } else {
            const newCount = sc - qty;
            const newPrice = totalP - pay;
            const shrunk = await tx.playerMarketListing.updateMany({
              where: { id: listingId, status: "active", expiresAt: { gt: now } },
              data: {
                price: newPrice,
                itemSnapshot: { ...snap, count: newCount } as object,
              },
            });
            if (shrunk.count !== 1) {
              return { err: 409 as const, msg: "listing_already_sold_or_expired" };
            }
          }

          const buyerRow = await tx.character.update({
            where: { id: buyer.id },
            data: {
              adena: buyerAdena,
              coinLuck: buyerCoin,
              heroJson: buyerVersioned as any,
              lastActivityAt: new Date(),
            },
            select: {
              id: true,
              name: true,
              race: true,
              classId: true,
              sex: true,
              level: true,
              exp: true,
              sp: true,
              adena: true,
              aa: true,
              coinLuck: true,
              coinsSilver: true,
              heroJson: true,
              createdAt: true,
              updatedAt: true,
            },
          });

          const sellerRow = await tx.character.update({
            where: { id: seller.id },
            data: {
              adena: sellerAdena,
              coinLuck: sellerCoin,
              heroJson: sellerVersioned as any,
              lastActivityAt: new Date(),
            },
            select: {
              id: true,
              name: true,
              race: true,
              classId: true,
              sex: true,
              level: true,
              exp: true,
              sp: true,
              adena: true,
              aa: true,
              coinLuck: true,
              coinsSilver: true,
              heroJson: true,
              createdAt: true,
              updatedAt: true,
            },
          });

          return {
            err: null,
            buyer: buyerRow,
            seller: sellerRow,
            buyMeta: {
              listingId,
              qty,
              pay: pay.toString(),
              currency,
              itemId: rowItemId(snap),
              itemName: String((snap as any)?.name || ""),
            },
          };
        });

        if (out.err) {
          const status =
            out.err === 404 ? 404 : out.err === 409 ? 409 : out.err === 500 ? 500 : 400;
          const payload: any = { error: out.msg };
          if ((out as any).revision !== undefined) payload.revision = (out as any).revision;
          if ((out as any).errors) payload.errors = (out as any).errors;
          return reply.code(status).send(payload);
        }

        const bm = (out as any).buyMeta as {
          listingId: string;
          qty: number;
          pay: string;
          currency: string;
          itemId: string;
          itemName: string;
        };
        enqueuePlayerActivityLog({
          accountId: auth.accountId,
          characterId: buyerCharacterId,
          characterName: out.buyer.name,
          action: "market.buy",
          metadata: {
            ...bm,
            sellerId: out.seller.id,
            sellerName: out.seller.name,
          },
          clientIp: getClientIp(req),
        });

        return {
          ok: true,
          buyer: serializeCharacter(out.buyer),
          seller: serializeCharacter(out.seller),
        };
      } catch (e: any) {
        app.log.error(e, "[market] buy");
        return reply.code(500).send({ error: e.message || "Internal server error" });
      }
    }
  );

  // DELETE /market/listings/:id?characterId=
  app.delete(
    "/market/listings/:id",
    {
      preHandler: async (req, reply) => {
        await rateLimitMiddleware(rateLimiters.characterUpdate, "market-cancel")(req, reply);
      },
    },
    async (req, reply) => {
      const auth = getAuth(req);
      if (!auth) return reply.code(401).send({ error: "unauthorized" });

      await expireStaleListings(app);

      const listingId = String((req.params as any)?.id || "").trim();
      const characterId = String((req.query as any)?.characterId || "").trim();
      const expectedRevision = Number((req.query as any)?.expectedRevision);
      if (!listingId || !characterId) {
        return reply.code(400).send({ error: "listing id and characterId required" });
      }
      if (!Number.isFinite(expectedRevision) || expectedRevision < 0) {
        return reply.code(400).send({ error: "expectedRevision required" });
      }

      try {
        const result = await prisma.$transaction(async (tx) => {
          const lockedSeller = await tx.$queryRaw<Array<{ id: string; heroJson: any }>>`
            SELECT "id", "heroJson"
            FROM "Character"
            WHERE "id" = ${characterId} AND "accountId" = ${auth.accountId}
            FOR UPDATE
          `;
          if (lockedSeller.length === 0) return { err: 404 as const, msg: "character not found" };
          const sellerCurrentRevision = Number((lockedSeller[0]?.heroJson as any)?.heroRevision ?? 0);
          if (sellerCurrentRevision !== expectedRevision) {
            return { err: 409 as const, msg: "revision_conflict", revision: sellerCurrentRevision };
          }

          const listing = await tx.playerMarketListing.findUnique({ where: { id: listingId } });
          if (!listing || listing.status !== "active") {
            return { err: 404 as const, msg: "listing_not_found" };
          }
          if (listing.sellerCharacterId !== characterId) {
            return { err: 403 as const, msg: "not_your_listing" };
          }

          const seller = await tx.character.findFirst({
            where: { id: characterId, accountId: auth.accountId },
          });
          if (!seller) return { err: 404 as const, msg: "character not found" };

          const cSnap = listing.itemSnapshot as any;
          if (isCoinLuckListingSnap(cSnap)) {
            const sc = Math.max(1, Math.floor(Number(cSnap?.count) || 1));
            await applyCoinLuckReturnToSeller(tx, seller as any, sc);
          } else {
            await applyItemReturnToHero(tx, seller as any, listing.itemSnapshot as any);
          }
          await tx.playerMarketListing.update({
            where: { id: listingId },
            data: { status: "cancelled" },
          });

          const updated = await tx.character.findUnique({
            where: { id: characterId },
            select: {
              id: true,
              name: true,
              race: true,
              classId: true,
              sex: true,
              level: true,
              exp: true,
              sp: true,
              adena: true,
              aa: true,
              coinLuck: true,
              coinsSilver: true,
              heroJson: true,
              createdAt: true,
              updatedAt: true,
            },
          });
          return { err: null, character: updated };
        });

        if (result.err) {
          const code = result.err === 403 ? 403 : result.err === 409 ? 409 : 404;
          const payload: any = { error: result.msg };
          if ((result as any).revision !== undefined) payload.revision = (result as any).revision;
          return reply.code(code).send(payload);
        }

        const ch = result.character;
        if (ch) {
          enqueuePlayerActivityLog({
            accountId: auth.accountId,
            characterId,
            characterName: ch.name,
            action: "market.cancel",
            metadata: { listingId },
            clientIp: getClientIp(req),
          });
        }

        return { ok: true, character: serializeCharacter(result.character) };
      } catch (e: any) {
        app.log.error(e, "[market] cancel");
        return reply.code(500).send({ error: e.message || "Internal server error" });
      }
    }
  );
}
