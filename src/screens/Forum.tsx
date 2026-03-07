import React, { useState, useEffect, useCallback } from "react";
import {
  getForumCategories,
  getForumTopics,
  getForumTopic,
  createForumTopic,
  createForumPost,
  deleteForumTopic,
  deleteForumPost,
  updateForumPost,
} from "../utils/api";
import { useHeroStore } from "../state/heroStore";
import { useCharacterStore } from "../state/characterStore";
import { getNickColorStyle } from "../utils/nickColor";
import { PlayerNameWithEmblem } from "../components/PlayerNameWithEmblem";
import { showToast } from "../state/toastStore";

interface ForumProps {
  navigate: (path: string) => void;
}

const inputCl =
  "text-sm py-1 px-2 rounded bg-black/40 border border-[#c7ad80]/30 text-white placeholder-gray-500";

function formatTime(dateString: string) {
  try {
    return new Date(dateString).toLocaleString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

export default function Forum({ navigate }: ForumProps) {
  const hero = useHeroStore((s) => s.hero);
  const characterId = useCharacterStore((s) => s.characterId);

  const [view, setView] = useState<"categories" | "topics" | "topic">("categories");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("");
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [topic, setTopic] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [topicsTotal, setTopicsTotal] = useState(0);
  const [postsTotal, setPostsTotal] = useState(0);
  const [topicsPage, setTopicsPage] = useState(1);
  const [postsPage, setPostsPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showNewTopic, setShowNewTopic] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState("");

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getForumCategories();
      setCategories(res.categories || []);
    } catch (e: any) {
      setError(e?.message || "Помилка завантаження");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTopics = useCallback(
    async (page = 1) => {
      if (!selectedCategoryId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await getForumTopics(selectedCategoryId, page, 20);
        setTopics(res.topics || []);
        setTopicsTotal(res.total || 0);
        setTopicsPage(res.page || 1);
      } catch (e: any) {
        setError(e?.message || "Помилка завантаження");
      } finally {
        setLoading(false);
    }
    },
    [selectedCategoryId]
  );

  const loadTopic = useCallback(
    async (page = 1) => {
      if (!selectedTopicId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await getForumTopic(selectedTopicId, page, 15);
        setTopic(res.topic);
        setPosts(res.posts || []);
        setPostsTotal(res.total || 0);
        setPostsPage(res.page || 1);
      } catch (e: any) {
        setError(e?.message || "Помилка завантаження");
      } finally {
        setLoading(false);
    }
    },
    [selectedTopicId]
  );

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (view === "topics" && selectedCategoryId) loadTopics(1);
  }, [view, selectedCategoryId, loadTopics]);

  useEffect(() => {
    if (view === "topic" && selectedTopicId) loadTopic(1);
  }, [view, selectedTopicId, loadTopic]);

  const handleCategoryClick = (cat: any) => {
    setSelectedCategoryId(cat.id);
    setSelectedCategoryName(cat.name);
    setView("topics");
  };

  const handleTopicClick = (t: any) => {
    setSelectedTopicId(t.id);
    setView("topic");
  };

  const handleBackToCategories = () => {
    setView("categories");
    setSelectedCategoryId(null);
    setSelectedTopicId(null);
  };

  const handleBackToTopics = () => {
    setView("topics");
    setSelectedTopicId(null);
  };

  const handleCreateTopic = async () => {
    if (!selectedCategoryId || !newTitle.trim() || !newMessage.trim() || !characterId) return;
    setSending(true);
    try {
      await createForumTopic({
        categoryId: selectedCategoryId,
        title: newTitle.trim(),
        message: newMessage.trim(),
        characterId,
      });
      setNewTitle("");
      setNewMessage("");
      setShowNewTopic(false);
      await loadTopics(1);
    } catch (e: any) {
      showToast(e?.message || "Помилка створення теми", "error");
    } finally {
      setSending(false);
    }
  };

  const handleReply = async () => {
    if (!selectedTopicId || !replyMessage.trim() || !characterId) return;
    setSending(true);
    try {
      await createForumPost({
        topicId: selectedTopicId,
        message: replyMessage.trim(),
        characterId,
      });
      setReplyMessage("");
      await loadTopic(postsPage);
    } catch (e: any) {
      showToast(e?.message || "Помилка відправки", "error");
    } finally {
      setSending(false);
    }
  };

  const heroId = hero?.id || characterId;
  const canPost = !!heroId && !!characterId;
  const isForumAdmin = !!hero?.name && String(hero.name).toLowerCase().trim() === "existence";

  const handleDeleteTopic = async (e: React.MouseEvent, topicId: string) => {
    e.stopPropagation();
    if (!characterId || !confirm("Видалити цю тему і всі повідомлення?")) return;
    setSending(true);
    try {
      await deleteForumTopic(topicId, characterId);
      await loadTopics(topicsPage);
    } catch (err: any) {
      showToast(err?.message || "Помилка видалення", "error");
    } finally {
      setSending(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!characterId || !confirm("Видалити це повідомлення?")) return;
    setSending(true);
    try {
      await deleteForumPost(postId, characterId);
      await loadTopic(postsPage);
    } catch (err: any) {
      showToast(err?.message || "Помилка видалення", "error");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteTopicFromView = async () => {
    if (!selectedTopicId || !characterId || !confirm("Видалити цю тему і всі повідомлення?")) return;
    setSending(true);
    try {
      await deleteForumTopic(selectedTopicId, characterId);
      handleBackToTopics();
    } catch (err: any) {
      showToast(err?.message || "Помилка видалення", "error");
    } finally {
      setSending(false);
    }
  };

  const startEditPost = (p: { id: string; message: string }) => {
    setEditingPostId(p.id);
    setEditMessage(p.message);
  };

  const cancelEditPost = () => {
    setEditingPostId(null);
    setEditMessage("");
  };

  const handleSaveEditPost = async () => {
    if (!editingPostId || !characterId || !editMessage.trim()) return;
    setSending(true);
    try {
      await updateForumPost(editingPostId, characterId, editMessage.trim());
      cancelEditPost();
      await loadTopic(postsPage);
    } catch (err: any) {
      showToast(err?.message || "Помилка збереження", "error");
    } finally {
      setSending(false);
    }
  };

  const canDeleteTopic = (topicCharId: string | undefined) => isForumAdmin || topicCharId === characterId;
  const canDeleteOrEditPost = (postCharId: string | undefined) => isForumAdmin || postCharId === characterId;

  return (
    <div className="w-full text-white px-3 py-4">
      <div className="max-w-[360px] mx-auto border border-white/50 rounded-lg p-4 bg-[#1a0b0b]/30">
        <div className="flex items-center justify-between mb-3">
          <div>
            {view !== "categories" && (
              <button
                onClick={view === "topic" ? handleBackToTopics : handleBackToCategories}
                className="text-gray-400 hover:text-white text-[9px] mr-2"
              >
                ← Назад
              </button>
            )}
            <div className="text-lg font-bold text-[#ffe9c0]">Форум сервера</div>
            <div className="text-xs text-orange-400/90">
              {view === "categories" && "Обговорення, питання та спілкування гравців."}
              {view === "topics" && selectedCategoryName}
              {view === "topic" && topic?.title}
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-gray-600 mb-3" />

        {error && (
          <div className="text-red-400 text-xs mb-2">{error}</div>
        )}

        {view === "categories" && (
          <>
            {loading ? (
              <div className="text-gray-400 text-sm">Завантаження...</div>
            ) : categories.length === 0 ? (
              <div className="text-gray-500 text-sm">Немає категорій</div>
            ) : (
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat)}
                    className="flex justify-between items-center p-3 border border-white/30 rounded cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-[#c7ad80]">{cat.name}</div>
                      <div className="text-xs text-gray-400">{cat.description}</div>
                    </div>
                    <div className="text-gray-500 text-xs">{cat._count?.topics ?? 0} тем</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {view === "topics" && (
          <>
            {canPost && (
              <button
                onClick={() => setShowNewTopic(true)}
                className="mb-3 w-full py-1.5 rounded bg-[#c7ad80]/20 text-[#c7ad80] hover:bg-[#c7ad80]/30 text-sm font-bold"
              >
                Нова тема
              </button>
            )}
            {showNewTopic && (
              <div className="mb-4 p-3 border border-[#c7ad80]/40 rounded bg-black/30">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Назва теми"
                  className={`${inputCl} w-full mb-2`}
                  maxLength={120}
                />
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Перше повідомлення..."
                  className={`${inputCl} w-full min-h-[80px]`}
                  rows={4}
                  maxLength={2000}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleCreateTopic}
                    disabled={!newTitle.trim() || !newMessage.trim() || sending}
                    className="text-green-400 hover:text-green-300 text-sm font-bold disabled:opacity-50"
                  >
                    {sending ? "..." : "Створити"}
                  </button>
                  <button
                    onClick={() => {
                      setShowNewTopic(false);
                      setNewTitle("");
                      setNewMessage("");
                    }}
                    className="text-gray-400 hover:text-gray-300 text-sm"
                  >
                    Скасувати
                  </button>
                </div>
              </div>
            )}
            {loading ? (
              <div className="text-gray-400 text-sm">Завантаження...</div>
            ) : topics.length === 0 ? (
              <div className="text-gray-500 text-sm">Ще немає тем. Створіть першу!</div>
            ) : (
              <div className="space-y-1">
                {topics.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleTopicClick(t)}
                    className="flex flex-col p-2 border-b border-white/30 cursor-pointer hover:bg-white/5"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-[#c7ad80] text-sm">{t.title}</span>
                      <div className="flex items-center gap-1">
                        {canDeleteTopic(t.character?.id) && (
                          <button
                            onClick={(e) => handleDeleteTopic(e, t.id)}
                            disabled={sending}
                            className="text-red-400/80 hover:text-red-400 text-[10px] px-1 py-0 rounded"
                            title="Видалити тему"
                          >
                            ✕
                          </button>
                        )}
                        <span className="text-gray-500 text-xs">{t.postCount}</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span
                        style={getNickColorStyle(t.character?.name, hero, t.character?.nickColor)}
                      >
                        {t.character?.name ?? "—"}
                      </span>
                      <span>{formatTime(t.updatedAt || t.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {topicsTotal > 20 && (
              <div className="flex justify-center gap-2 mt-3 text-xs">
                <button
                  onClick={() => loadTopics(topicsPage - 1)}
                  disabled={topicsPage <= 1}
                  className="text-[#c7ad80] disabled:opacity-50"
                >
                  ←
                </button>
                <span>{topicsPage} / {Math.ceil(topicsTotal / 20)}</span>
                <button
                  onClick={() => loadTopics(topicsPage + 1)}
                  disabled={topicsPage * 20 >= topicsTotal}
                  className="text-[#c7ad80] disabled:opacity-50"
                >
                  →
                </button>
              </div>
            )}
          </>
        )}

        {view === "topic" && topic && (
          <>
            <div className="flex justify-between items-center mb-3 p-2 bg-black/20 rounded text-xs text-gray-400">
              <div>
                Автор:{" "}
                <span
                  className="cursor-pointer hover:underline"
                  style={getNickColorStyle(topic.character?.name, hero, topic.character?.nickColor)}
                  onClick={() => topic.character?.id && navigate(`/player/${topic.character.id}`)}
                >
                  {topic.character?.name ?? "—"}
                </span>
                {" · "}
                {topic.postCount} постів
              </div>
              {canDeleteTopic(topic.character?.id) && (
                <button
                  onClick={handleDeleteTopicFromView}
                  disabled={sending}
                  className="text-red-400 hover:text-red-300 text-[10px] px-1.5 py-0.5 rounded border border-red-500/50 hover:bg-red-500/20 disabled:opacity-50"
                >
                  Видалити тему
                </button>
              )}
            </div>
            {loading ? (
              <div className="text-gray-400 text-sm">Завантаження...</div>
            ) : (
              <div className="space-y-2 mb-4">
                {posts.map((p) => (
                  <div key={p.id} className="border-b border-white/20 pb-2">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <PlayerNameWithEmblem
                          playerName={p.character?.name ?? "—"}
                          hero={hero}
                          nickColor={p.character?.nickColor}
                          size={11}
                          className="font-semibold text-yellow-400 cursor-pointer hover:opacity-80"
                          onClick={() => p.character?.id && navigate(`/player/${p.character.id}`)}
                        />
                        {canDeleteOrEditPost(p.character?.id) && (
                          <>
                            <button
                              onClick={() => startEditPost(p)}
                              disabled={sending || !!editingPostId}
                              className="text-amber-400/80 hover:text-amber-400 text-[9px] px-1 py-0 rounded"
                              title="Редагувати"
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => handleDeletePost(p.id)}
                              disabled={sending}
                              className="text-red-400/80 hover:text-red-400 text-[9px] px-1 py-0 rounded"
                              title="Видалити"
                            >
                              ✕
                            </button>
                          </>
                        )}
                      </div>
                      <span className="text-gray-500 text-[9px]">{formatTime(p.createdAt)}</span>
                    </div>
                    {editingPostId === p.id ? (
                      <div className="mt-1">
                        <textarea
                          value={editMessage}
                          onChange={(e) => setEditMessage(e.target.value)}
                          className={`${inputCl} w-full min-h-[60px] text-[11px]`}
                          rows={3}
                          maxLength={2000}
                          autoFocus
                        />
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={handleSaveEditPost}
                            disabled={!editMessage.trim() || sending}
                            className="text-green-400 hover:text-green-300 text-[10px] font-bold disabled:opacity-50"
                          >
                            Зберегти
                          </button>
                          <button onClick={cancelEditPost} className="text-gray-400 hover:text-gray-300 text-[10px]">
                            Скасувати
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-white text-[11px] whitespace-pre-wrap">{p.message}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {canPost && (
              <div className="border-t border-white/30 pt-3">
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Відповідь..."
                  className={`${inputCl} w-full min-h-[60px] mb-2`}
                  rows={3}
                  maxLength={2000}
                />
                <button
                  onClick={handleReply}
                  disabled={!replyMessage.trim() || sending}
                  className="w-full py-1.5 rounded bg-green-700/50 text-green-300 hover:bg-green-700/70 font-bold text-sm disabled:opacity-50"
                >
                  {sending ? "..." : "Відповісти"}
                </button>
              </div>
            )}
            {postsTotal > 15 && (
              <div className="flex justify-center gap-2 mt-3 text-xs">
                <button
                  onClick={() => loadTopic(postsPage - 1)}
                  disabled={postsPage <= 1}
                  className="text-[#c7ad80] disabled:opacity-50"
                >
                  ←
                </button>
                <span>{postsPage} / {Math.ceil(postsTotal / 15)}</span>
                <button
                  onClick={() => loadTopic(postsPage + 1)}
                  disabled={postsPage * 15 >= postsTotal}
                  className="text-[#c7ad80] disabled:opacity-50"
                >
                  →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
