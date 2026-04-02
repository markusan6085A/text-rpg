import { apiRequest } from "./core";

// News API
export interface NewsItem {
  id: string;
  type: "new_player" | "premium_purchase" | "raid_boss_kill" | "return_to_world" | "broadcast";
  characterId?: string;
  characterName?: string;
  emblem?: string; // Clan emblem
  metadata: {
    hours?: number;
    bossName?: string;
    bossLevel?: number;
    bossDrops?: any[];
    actualDroppedItems?: Array<{ id: string; name: string; count: number }>;
    /** Фактично отримано з тіла РБ (нові новини); без таблиці можливого дропу */
    killRewards?: { adena: number; exp: number; sp: number };
    hoursAbsent?: number;
    subject?: string;
    messagePreview?: string;
  };
  createdAt: string;
}

export interface NewsResponse {
  ok: boolean;
  news: NewsItem[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export async function getNews(params?: { page?: number; limit?: number }): Promise<NewsResponse> {
  const q = new URLSearchParams();
  if (params?.page != null) q.set("page", String(params.page));
  if (params?.limit != null) q.set("limit", String(params.limit));
  const query = q.toString();
  const response = await apiRequest<NewsResponse>(`/news${query ? `?${query}` : ""}`, {
    method: "GET",
  });
  return response;
}

export async function reportRaidBossKill(params: {
  characterId: string;
  characterName?: string;
  bossName: string;
  bossLevel?: number;
  /** Не надсилати — у новинах показуємо лише фактичний дроп і killRewards */
  bossDrops?: any[];
  actualDroppedItems?: Array<{ id: string; name: string; count: number }>;
  killRewards: { adena: number; exp: number; sp: number };
}): Promise<{ ok: boolean }> {
  const response = await apiRequest<{ ok: boolean }>('/news/raid-boss-kill', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return response;
}

// Forum API
export async function getForumCategories(): Promise<{ ok: boolean; categories: any[] }> {
  return apiRequest<{ ok: boolean; categories: any[] }>('/forum/categories', { method: 'GET' });
}

export async function getForumTopics(categoryId: string, page = 1, limit = 20): Promise<{
  ok: boolean; topics: any[]; total: number; page: number; limit: number;
}> {
  return apiRequest(`/forum/categories/${encodeURIComponent(categoryId)}/topics?page=${page}&limit=${limit}`, { method: 'GET' });
}

export async function getForumTopic(topicId: string, page = 1, limit = 15): Promise<{
  ok: boolean; topic: any; posts: any[]; total: number; page: number; limit: number;
}> {
  return apiRequest(`/forum/topics/${encodeURIComponent(topicId)}?page=${page}&limit=${limit}`, { method: 'GET' });
}

export async function createForumTopic(params: {
  categoryId: string;
  title: string;
  message: string;
  characterId: string;
}): Promise<{ ok: boolean; topic: any }> {
  return apiRequest('/forum/topics', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function createForumPost(params: {
  topicId: string;
  message: string;
  characterId: string;
}): Promise<{ ok: boolean; post: any }> {
  return apiRequest('/forum/posts', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function deleteForumTopic(topicId: string, characterId: string): Promise<{ ok: boolean }> {
  return apiRequest(`/forum/topics/${encodeURIComponent(topicId)}?characterId=${encodeURIComponent(characterId)}`, {
    method: 'DELETE',
  });
}

export async function deleteForumPost(postId: string, characterId: string): Promise<{ ok: boolean }> {
  return apiRequest(`/forum/posts/${encodeURIComponent(postId)}?characterId=${encodeURIComponent(characterId)}`, {
    method: 'DELETE',
  });
}

export async function updateForumPost(
  postId: string,
  characterId: string,
  message: string
): Promise<{ ok: boolean; post: { id: string; message: string; createdAt: string; character?: { id: string; name: string; nickColor?: string } } }> {
  return apiRequest(`/forum/posts/${encodeURIComponent(postId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ characterId, message }),
  });
}
