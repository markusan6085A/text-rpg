import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../db";
import { getAuth } from "../character/auth";
import { validateHeroJson, addVersioning } from "../../heroJsonValidator";
import { rateLimiters, rateLimitMiddleware } from "../../rateLimiter";

const LISTING_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_LISTINGS_PER_SELLER = 40;
const MAX_PAGE = 50;
const INV_MIN = 100;
const INV_MAX = 500;
const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);

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
        await applyItemReturnToHero(tx, seller as any, row.itemSnapshot as any);
        await tx.playerMarketListing.update({ where: { id: row.id }, data: { status: "expired" } });
      });
    } catch (e) {
      app.log.error(e, `[market] expire listing ${listing.id}`);
    }
  }
}

export async function marketRoutes(app: FastifyInstance) {
  // GET /market/listings
  app.get("/market/listings", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    await expireStaleListings(app);

    const q = req.query as { page?: string; limit?: string };
    const page = Math.max(1, parseInt(String(q.page || "1"), 10) || 1);
    const limit = Math.min(MAX_PAGE, Math.max(1, parseInt(String(q.limit || "20"), 10) || 20));
    const skip = (page - 1) * limit;
    const now = new Date();

    const where = { status: "active" as const, expiresAt: { gt: now } };

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
      price: Number(r.price),
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
      price: Number(r.price),
      createdAt: r.createdAt.toISOString(),
      expiresAt: r.expiresAt.toISOString(),
    }));

    return { ok: true, listings };
  });

  // POST /market/listings  { characterId, inventoryItemId, currency, price }
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
        currency?: string;
        price?: number;
      };
      const characterId = String(body.characterId || "").trim();
      const inventoryItemId = String(body.inventoryItemId || "").trim();
      const currency = String(body.currency || "").trim();
      const priceNum = typeof body.price === "number" ? body.price : Number(body.price);

      if (!characterId || !inventoryItemId) {
        return reply.code(400).send({ error: "characterId and inventoryItemId required" });
      }
      if (currency !== "adena" && currency !== "coinLuck") {
        return reply.code(400).send({ error: "currency must be adena or coinLuck" });
      }
      if (!Number.isFinite(priceNum) || priceNum < 1 || priceNum > Number.MAX_SAFE_INTEGER) {
        return reply.code(400).send({ error: "invalid price" });
      }
      const price = BigInt(Math.floor(priceNum));

      try {
        const result = await prisma.$transaction(async (tx) => {
          const seller = await tx.character.findFirst({
            where: { id: characterId, accountId: auth.accountId },
          });
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

          const hj0 = ensureHeroJsonBase(seller, (seller.heroJson as any) || {});
          const inv = [...(hj0.inventory || [])];
          const idx = inv.findIndex((x: any) => x && String(x.id) === inventoryItemId);
          if (idx < 0) return { err: 400 as const, msg: "item_not_in_inventory" };

          const removed = inv[idx];
          if (String(removed.id) === "overflow_chest") {
            return { err: 400 as const, msg: "cannot_list_overflow_chest" };
          }

          const eq = hj0.equipment || {};
          for (const k of Object.keys(eq)) {
            if (eq[k] === inventoryItemId) {
              return { err: 400 as const, msg: "item_is_equipped" };
            }
          }

          const snapshot = JSON.parse(JSON.stringify(removed));
          inv.splice(idx, 1);
          const nextHj = { ...hj0, inventory: inv };
          const validation = validateHeroJson(nextHj);
          if (!validation.valid) {
            return { err: 400 as const, msg: "invalid_hero_json", errors: validation.errors };
          }
          const oldRevision = Number(hj0.heroRevision || 0);
          const versioned = addVersioning(nextHj, oldRevision);

          const expiresAt = new Date(Date.now() + LISTING_TTL_MS);
          await tx.playerMarketListing.create({
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

          return { err: null, character: updated };
        });

        if (result.err) {
          const code = result.err;
          const payload: any = { error: result.msg };
          if ((result as any).errors) payload.errors = (result as any).errors;
          return reply.code(code === 404 ? 404 : 400).send(payload);
        }

        return { ok: true, character: serializeCharacter(result.character) };
      } catch (e: any) {
        app.log.error(e, "[market] create listing");
        return reply.code(500).send({ error: e.message || "Internal server error" });
      }
    }
  );

  // POST /market/listings/:id/buy  { buyerCharacterId }
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
      const body = req.body as { buyerCharacterId?: string };
      const buyerCharacterId = String(body.buyerCharacterId || "").trim();
      if (!listingId || !buyerCharacterId) {
        return reply.code(400).send({ error: "listing id and buyerCharacterId required" });
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

          const buyer = await tx.character.findFirst({
            where: { id: buyerCharacterId, accountId: auth.accountId },
          });
          if (!buyer) {
            await tx.playerMarketListing.update({
              where: { id: listingId },
              data: { status: "active", buyerCharacterId: null, soldAt: null },
            });
            return { err: 404 as const, msg: "buyer not found" };
          }

          const seller = await tx.character.findUnique({ where: { id: listing.sellerCharacterId } });
          if (!seller) {
            await tx.playerMarketListing.update({
              where: { id: listingId },
              data: { status: "active", buyerCharacterId: null, soldAt: null },
            });
            return { err: 500 as const, msg: "seller_missing" };
          }

          const price = listing.price;
          const currency = listing.currency;

          let buyerAdena = BigInt(buyer.adena ?? 0);
          let buyerCoin = BigInt(buyer.coinLuck ?? 0);
          let sellerAdena = BigInt(seller.adena ?? 0);
          let sellerCoin = BigInt(seller.coinLuck ?? 0);

          if (currency === "adena") {
            if (buyerAdena < price) {
              await tx.playerMarketListing.update({
                where: { id: listingId },
                data: { status: "active", buyerCharacterId: null, soldAt: null },
              });
              return { err: 400 as const, msg: "not_enough_adena" };
            }
            buyerAdena -= price;
            sellerAdena += price;
          } else {
            if (buyerCoin < price) {
              await tx.playerMarketListing.update({
                where: { id: listingId },
                data: { status: "active", buyerCharacterId: null, soldAt: null },
              });
              return { err: 400 as const, msg: "not_enough_coin_luck" };
            }
            buyerCoin -= price;
            sellerCoin += price;
          }

          if (sellerAdena > MAX_SAFE || buyerAdena < 0n || sellerCoin > MAX_SAFE || buyerCoin < 0n) {
            await tx.playerMarketListing.update({
              where: { id: listingId },
              data: { status: "active", buyerCharacterId: null, soldAt: null },
            });
            return { err: 400 as const, msg: "currency_overflow" };
          }

          const buyerHj0 = ensureHeroJsonBase(buyer, (buyer.heroJson as any) || {});
          const cap = inventoryCap(buyerHj0);
          const inv = [...(buyerHj0.inventory || [])];
          const overflow = [...(buyerHj0.overflowChest || [])];
          const item = JSON.parse(JSON.stringify(listing.itemSnapshot));
          if (inv.length < cap) {
            inv.push(item);
          } else {
            overflow.push(item);
          }
          const buyerNext = {
            ...buyerHj0,
            inventory: inv,
            overflowChest: overflow,
            adena: Number(buyerAdena),
            coinOfLuck: Number(buyerCoin),
          };
          const buyerVal = validateHeroJson(buyerNext);
          if (!buyerVal.valid) {
            await tx.playerMarketListing.update({
              where: { id: listingId },
              data: { status: "active", buyerCharacterId: null, soldAt: null },
            });
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
            await tx.playerMarketListing.update({
              where: { id: listingId },
              data: { status: "active", buyerCharacterId: null, soldAt: null },
            });
            return { err: 500 as const, msg: "invalid_seller_hero" };
          }
          const sellerVersioned = addVersioning(sellerNext, Number(sellerHj0.heroRevision || 0));

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

          return { err: null, buyer: buyerRow, seller: sellerRow };
        });

        if (out.err) {
          const status =
            out.err === 404 ? 404 : out.err === 409 ? 409 : out.err === 500 ? 500 : 400;
          const payload: any = { error: out.msg };
          if ((out as any).errors) payload.errors = (out as any).errors;
          return reply.code(status).send(payload);
        }

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
      if (!listingId || !characterId) {
        return reply.code(400).send({ error: "listing id and characterId required" });
      }

      try {
        const result = await prisma.$transaction(async (tx) => {
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

          await applyItemReturnToHero(tx, seller as any, listing.itemSnapshot as any);
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
          const code = result.err === 403 ? 403 : 404;
          return reply.code(code).send({ error: result.msg });
        }

        return { ok: true, character: serializeCharacter(result.character) };
      } catch (e: any) {
        app.log.error(e, "[market] cancel");
        return reply.code(500).send({ error: e.message || "Internal server error" });
      }
    }
  );
}
