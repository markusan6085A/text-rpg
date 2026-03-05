import type { FastifyInstance } from "fastify";
import { prisma } from "./db";
import { getAuth } from "./routes/character/auth";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_TITLE_LENGTH = 120;

export async function forumRoutes(app: FastifyInstance) {
  // GET /forum/categories — список категорій
  app.get("/forum/categories", async (req, reply) => {
    const auth = getAuth(req);
    if (!auth) return reply.code(401).send({ error: "unauthorized" });

    const categories = await prisma.forumCategory.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        sortOrder: true,
        _count: { select: { topics: true } },
      },
    });
    return { ok: true, categories };
  });

  // GET /forum/categories/:categoryId/topics — теми в категорії
  app.get<{ Params: { categoryId: string }; Querystring: { page?: string; limit?: string } }>(
    "/forum/categories/:categoryId/topics",
    async (req, reply) => {
      const auth = getAuth(req);
      if (!auth) return reply.code(401).send({ error: "unauthorized" });

      const categoryId = String((req.params as any).categoryId ?? "").trim();
      const page = Math.max(1, Number((req.query as any)?.page ?? "1") || 1);
      const limit = Math.min(50, Math.max(1, Number((req.query as any)?.limit ?? "20") || 20));
      const skip = (page - 1) * limit;

      const [topics, total] = await Promise.all([
        prisma.forumTopic.findMany({
          where: { categoryId },
          orderBy: { updatedAt: "desc" },
          skip,
          take: limit,
          select: {
            id: true,
            title: true,
            postCount: true,
            createdAt: true,
            updatedAt: true,
            character: {
              select: { id: true, name: true, nickColor: true },
            },
          },
        }),
        prisma.forumTopic.count({ where: { categoryId } }),
      ]);

      return { ok: true, topics, total, page, limit };
    }
  );

  // GET /forum/topics/:topicId — тема з постами
  app.get<{ Params: { topicId: string }; Querystring: { page?: string; limit?: string } }>(
    "/forum/topics/:topicId",
    async (req, reply) => {
      const auth = getAuth(req);
      if (!auth) return reply.code(401).send({ error: "unauthorized" });

      const topicId = String((req.params as any).topicId ?? "").trim();
      const page = Math.max(1, Number((req.query as any)?.page ?? "1") || 1);
      const limit = Math.min(50, Math.max(1, Number((req.query as any)?.limit ?? "15") || 15));
      const skip = (page - 1) * limit;

      const topic = await prisma.forumTopic.findUnique({
        where: { id: topicId },
        select: {
          id: true,
          title: true,
          postCount: true,
          createdAt: true,
          updatedAt: true,
          categoryId: true,
          category: { select: { id: true, name: true } },
          character: {
            select: { id: true, name: true, nickColor: true },
          },
        },
      });
      if (!topic) return reply.code(404).send({ error: "topic not found" });

      const [posts, total] = await Promise.all([
        prisma.forumPost.findMany({
          where: { topicId },
          orderBy: { createdAt: "asc" },
          skip,
          take: limit,
          select: {
            id: true,
            message: true,
            createdAt: true,
            character: {
              select: { id: true, name: true, nickColor: true },
            },
          },
        }),
        prisma.forumPost.count({ where: { topicId } }),
      ]);

      return { ok: true, topic, posts, total, page, limit };
    }
  );

  // POST /forum/topics — створити тему
  app.post<{ Body: { categoryId?: string; title?: string; message?: string; characterId?: string } }>(
    "/forum/topics",
    async (req, reply) => {
      const auth = getAuth(req);
      if (!auth) return reply.code(401).send({ error: "unauthorized" });

      const body = req.body as any;
      const categoryId = String(body?.categoryId ?? "").trim();
      const title = String(body?.title ?? "").trim().slice(0, MAX_TITLE_LENGTH);
      const message = String(body?.message ?? "").trim().slice(0, MAX_MESSAGE_LENGTH);
      const characterId = String(body?.characterId ?? "").trim();

      if (!categoryId || !title || !message) {
        return reply.code(400).send({ error: "categoryId, title and message are required" });
      }
      if (!characterId) {
        return reply.code(400).send({ error: "characterId is required" });
      }

      const char = await prisma.character.findFirst({
        where: { id: characterId, accountId: auth.accountId },
        select: { id: true },
      });
      if (!char) return reply.code(403).send({ error: "character not found or not yours" });

      const category = await prisma.forumCategory.findUnique({
        where: { id: categoryId },
        select: { id: true },
      });
      if (!category) return reply.code(404).send({ error: "category not found" });

      const newTopic = await prisma.forumTopic.create({
        data: {
          categoryId,
          characterId: char.id,
          title,
          postCount: 1,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          title: true,
          createdAt: true,
          character: { select: { id: true, name: true, nickColor: true } },
        },
      });

      await prisma.forumPost.create({
        data: {
          topicId: newTopic.id,
          characterId: char.id,
          message,
        },
      });

      return { ok: true, topic: newTopic };
    }
  );

  // POST /forum/posts — відповісти в тему
  app.post<{ Body: { topicId?: string; message?: string; characterId?: string } }>(
    "/forum/posts",
    async (req, reply) => {
      const auth = getAuth(req);
      if (!auth) return reply.code(401).send({ error: "unauthorized" });

      const body = req.body as any;
      const topicId = String(body?.topicId ?? "").trim();
      const message = String(body?.message ?? "").trim().slice(0, MAX_MESSAGE_LENGTH);
      const characterId = String(body?.characterId ?? "").trim();

      if (!topicId || !message) {
        return reply.code(400).send({ error: "topicId and message are required" });
      }
      if (!characterId) {
        return reply.code(400).send({ error: "characterId is required" });
      }

      const char = await prisma.character.findFirst({
        where: { id: characterId, accountId: auth.accountId },
        select: { id: true },
      });
      if (!char) return reply.code(403).send({ error: "character not found or not yours" });

      const topic = await prisma.forumTopic.findUnique({
        where: { id: topicId },
        select: { id: true },
      });
      if (!topic) return reply.code(404).send({ error: "topic not found" });

      const [post] = await prisma.$transaction([
        prisma.forumPost.create({
          data: {
            topicId,
            characterId: char.id,
            message,
          },
          select: {
            id: true,
            message: true,
            createdAt: true,
            character: { select: { id: true, name: true, nickColor: true } },
          },
        }),
        prisma.forumTopic.update({
          where: { id: topicId },
          data: { postCount: { increment: 1 }, updatedAt: new Date() },
        }),
      ]);

      return { ok: true, post };
    }
  );

  const FORUM_ADMIN_NAME = "existence"; // нік адміна форуму (case-insensitive)

  function isForumAdmin(characterName: string | null | undefined): boolean {
    return !!characterName && String(characterName).toLowerCase().trim() === FORUM_ADMIN_NAME;
  }

  // DELETE /forum/topics/:topicId — видалити тему (тільки Existence)
  app.delete<{ Params: { topicId: string }; Querystring: { characterId?: string } }>(
    "/forum/topics/:topicId",
    async (req, reply) => {
      const auth = getAuth(req);
      if (!auth) return reply.code(401).send({ error: "unauthorized" });

      const topicId = String((req.params as any).topicId ?? "").trim();
      const characterId = String((req.query as any)?.characterId ?? "").trim();
      if (!characterId) return reply.code(400).send({ error: "characterId is required" });
      if (!topicId) return reply.code(400).send({ error: "topicId is required" });

      const char = await prisma.character.findFirst({
        where: { id: characterId, accountId: auth.accountId },
        select: { id: true, name: true },
      });
      if (!char) return reply.code(403).send({ error: "character not found or not yours" });
      if (!isForumAdmin(char.name)) return reply.code(403).send({ error: "only forum admin can delete topics" });

      const topic = await prisma.forumTopic.findUnique({ where: { id: topicId }, select: { id: true } });
      if (!topic) return reply.code(404).send({ error: "topic not found" });

      await prisma.forumPost.deleteMany({ where: { topicId } });
      await prisma.forumTopic.delete({ where: { id: topicId } });
      return { ok: true };
    }
  );

  // DELETE /forum/posts/:postId — видалити пост (тільки Existence)
  app.delete<{ Params: { postId: string }; Querystring: { characterId?: string } }>(
    "/forum/posts/:postId",
    async (req, reply) => {
      const auth = getAuth(req);
      if (!auth) return reply.code(401).send({ error: "unauthorized" });

      const postId = String((req.params as any).postId ?? "").trim();
      const characterId = String((req.query as any)?.characterId ?? "").trim();
      if (!characterId) return reply.code(400).send({ error: "characterId is required" });
      if (!postId) return reply.code(400).send({ error: "postId is required" });

      const char = await prisma.character.findFirst({
        where: { id: characterId, accountId: auth.accountId },
        select: { id: true, name: true },
      });
      if (!char) return reply.code(403).send({ error: "character not found or not yours" });
      if (!isForumAdmin(char.name)) return reply.code(403).send({ error: "only forum admin can delete posts" });

      const post = await prisma.forumPost.findUnique({
        where: { id: postId },
        select: { id: true, topicId: true },
      });
      if (!post) return reply.code(404).send({ error: "post not found" });

      await prisma.forumPost.delete({ where: { id: postId } });
      await prisma.forumTopic.update({
        where: { id: post.topicId },
        data: { postCount: { decrement: 1 }, updatedAt: new Date() },
      });
      return { ok: true };
    }
  );
}
