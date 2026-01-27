import React, { useState, useEffect, useRef } from "react";
import { postChatMessage, deleteChatMessage } from "../utils/api";
import type { ChatMessage } from "../utils/api";
import { useHeroStore } from "../state/heroStore";
import { useChatMessages } from "../hooks/useChatMessages";
import { updateDailyQuestProgress } from "../utils/dailyQuests/updateDailyQuestProgress";

// Types
import type { ChatProps, ChatChannel } from "./chat/types";

// Hooks
import { useOutbox, type OutboxMessage } from "./chat/hooks/useOutbox";
import { useDeletedMessages } from "./chat/hooks/useDeletedMessages";

// Components
import { ChatTabs } from "./chat/components/ChatTabs";
import { ChatMessagesList } from "./chat/components/ChatMessagesList";
import { ChatPagination } from "./chat/components/ChatPagination";
import { ChatInput } from "./chat/components/ChatInput";

export default function Chat({ navigate }: ChatProps) {
  const hero = useHeroStore((s) => s.hero);
  const [channel, setChannel] = useState<ChatChannel>("general");
  const [messageText, setMessageText] = useState("");
  const [page, setPage] = useState(1);

  // Hooks
  const [deletedIds, setDeletedIds] = useDeletedMessages(channel);
  const [outbox, setOutbox] = useOutbox(channel);
  const { messages: cachedMessages, loading, error, refresh, totalPages } = useChatMessages({
    channel,
    page,
    limit: 10,
    cacheTtlMs: 30_000,
    autoRefresh: false,
    manual: false,
  });

  // Refs
  const deletingRef = useRef<Set<string>>(new Set());
  const messagesTopRef = useRef<HTMLDivElement>(null);
  const lastTradeMessageTimeRef = useRef<number>(0); // Rate limiting for general and trade channels

  // Reset page when channel changes
  useEffect(() => {
    setPage(1);
    // Очищаємо кеш при зміні каналу, щоб уникнути змішування повідомлень
    // Використовуємо setTimeout, щоб уникнути проблем з залежностями
    setTimeout(() => {
      refresh();
    }, 100);
  }, [channel]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Helpers ----------
  const normName = (s?: string) => (s || "").trim().toLowerCase();
  const normText = (s?: string) => (s || "").trim();

  // Fingerprint for dedupe (no clientId available)
  // Uses author+channel+message and rounded time bucket
  const fingerprint = (m: { characterName?: string; channel?: string; message?: string; createdAt?: string }) => {
    const t = m.createdAt ? new Date(m.createdAt).getTime() : Date.now();
    // 10-second bucket to tolerate server save delay/time differences
    const bucket = Math.floor(t / 10_000);
    return `${normName(m.characterName)}|${m.channel || ""}|${normText(m.message)}|${bucket}`;
  };

  // Build filtered cached messages (remove deleted)
  const filteredCached = React.useMemo(() => {
    return cachedMessages.filter((m) => !deletedIds.has(m.id));
  }, [cachedMessages, deletedIds]);

  // Server fingerprints set for fast dedupe against outbox
  const serverFingerprints = React.useMemo(() => {
    const set = new Set<string>();
    for (const m of filteredCached) {
      set.add(fingerprint(m));
    }
    return set;
  }, [filteredCached]);

  // Combine outbox (pending/sent) + cached, newest on top
  // Show outbox only on page 1
  const messages: ChatMessage[] = React.useMemo(() => {
    // 🔥 Фільтруємо cachedMessages по channel (на випадок якщо в кеші є повідомлення з іншого каналу)
    const filteredByChannel = filteredCached.filter((m) => m.channel === channel);
    
    if (page !== 1) return filteredByChannel;

    // 🔥 Фільтруємо outbox по channel - тільки повідомлення поточного каналу!
    const outboxForChannel = outbox.filter((m) => m.channel === channel);

    // Dedupe outbox against server by fingerprint + also avoid local duplicates in outbox itself
    const seen = new Set<string>();
    const seenIds = new Set<string>(); // Also dedupe by ID to avoid exact duplicates
    const outboxVisible: ChatMessage[] = [];

    for (const m of outboxForChannel) {
      // Hide if server already contains it (confirmed)
      const fp = fingerprint(m);
      if (serverFingerprints.has(fp)) continue;

      // Avoid duplicates inside outbox (same msg sent twice quickly)
      if (seen.has(fp)) continue;
      seen.add(fp);

      // Also check by ID to avoid exact duplicates
      if (seenIds.has(m.id)) continue;
      seenIds.add(m.id);

      outboxVisible.push(m as unknown as ChatMessage);
    }

    // Dedupe cached messages by ID to avoid duplicates
    const cachedIds = new Set<string>();
    const dedupedCached = filteredByChannel.filter((m) => {
      if (cachedIds.has(m.id)) return false;
      cachedIds.add(m.id);
      return true;
    });

    // Ensure newest first: outbox is prepended and should already be newest-first by how we add,
    // but we keep as-is and then add cached.
    const maxCached = Math.max(0, 10 - outboxVisible.length);
    const limitedCached = dedupedCached.slice(0, maxCached);

    // Final dedupe: remove any cached messages that match outbox by fingerprint
    const finalCached = limitedCached.filter((m) => {
      const fp = fingerprint(m);
      return !seen.has(fp);
    });

    return [...outboxVisible, ...finalCached];
  }, [page, outbox, filteredCached, serverFingerprints, channel]);

  // Confirmed delivery cleanup:
  // If an outbox message is marked 'sent' and server now has it (fingerprint match),
  // remove it from outbox. Keep 'pending' until it becomes 'sent' or user retries.
  useEffect(() => {
    if (outbox.length === 0) return;

    setOutbox((prev) => {
      let changed = false;
      const next = prev.filter((m) => {
        const fp = fingerprint(m);
        const isConfirmed = serverFingerprints.has(fp);

        if (isConfirmed) {
          changed = true;
          return false; // remove confirmed
        }
        return true;
      });

      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverFingerprints, setOutbox]); // serverFingerprints changes when cached changes

  // Auto-scroll to top when we add something to outbox (new message)
  useEffect(() => {
    if (page !== 1) return;
    if (outbox.length > 0) {
      setTimeout(() => {
        messagesTopRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [outbox.length, page]);

  // Send message
  const sendMessage = async () => {
    if (!messageText.trim() || !hero) return;

    // Rate limiting for general and trade channels: 5 seconds between messages
    if (channel === "general" || channel === "trade") {
      const now = Date.now();
      const timeSinceLastMessage = now - lastTradeMessageTimeRef.current;
      if (timeSinceLastMessage < 5000) {
        const remainingSeconds = Math.ceil((5000 - timeSinceLastMessage) / 1000);
        alert(`В чаті можна писати не частіше ніж раз на 5 секунд. Зачекайте ще ${remainingSeconds} сек.`);
        return;
      }
      lastTradeMessageTimeRef.current = now;
    }

    const textToSend = messageText.trim();
    const tempId = `temp-${Date.now()}`;

    const pendingMsg: OutboxMessage = {
      id: tempId,
      characterName: hero.name || hero.username || "You",
      channel,
      message: textToSend,
      createdAt: new Date().toISOString(),
      isOwn: true,
      status: "pending",
    };

    // Add to outbox immediately so it survives F5 and shows on top
    setOutbox((prev) => [pendingMsg, ...prev]);
    setMessageText("");

    try {
      await postChatMessage(channel, textToSend);

      // Mark as sent; removal will happen only when server confirms via refresh
      setOutbox((prev) =>
        prev.map((m) => (m.id === tempId ? ({ ...m, status: "sent" } as const) : m))
      );

      // Daily quest progress
      const curHero = useHeroStore.getState().hero;
      if (curHero) {
        const updatedProgress = updateDailyQuestProgress(curHero, "daily_chat", 1);
        if (updatedProgress !== curHero.dailyQuestsProgress) {
          useHeroStore.getState().updateHero({ dailyQuestsProgress: updatedProgress });
        }
      }

      // Не викликаємо refresh() одразу - повідомлення вже в outbox і з'явиться при наступному refresh
      // Це запобігає дублюванню, оскільки повідомлення вже показується з outbox
    } catch (err: any) {
      console.error("Error sending message:", err);

      // Keep in outbox, but leave as pending so it stays visible;
      // user can just hit "Обновить" and resend if you add UI later.
      setOutbox((prev) =>
        prev.map((m) => (m.id === tempId ? ({ ...m, status: "pending" } as const) : m))
      );

      setMessageText(textToSend);
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId: string) => {
    console.log("[chat] handleDeleteMessage called:", { messageId, channel });

    if (channel !== "general" && channel !== "trade") {
      console.warn("[chat] Can only delete messages in general or trade channels");
      return;
    }

    if (deletingRef.current.has(messageId)) {
      console.log("[chat] Delete already in progress for", messageId);
      return;
    }
    deletingRef.current.add(messageId);

    const messageToDelete = [...outbox, ...cachedMessages].find((m: any) => m.id === messageId);
    console.log("[chat] Message to delete:", {
      messageId,
      characterName: messageToDelete?.characterName,
      isOwn: messageToDelete?.isOwn,
    });

    // Optimistic remove from UI
    setDeletedIds((prev) => new Set([...prev, messageId]));
    // Remove from outbox if it's there
    setOutbox((prev) => prev.filter((m) => m.id !== messageId));

    try {
      await deleteChatMessage(messageId);
      console.log("[chat] Message deleted successfully:", messageId);
      // Refresh cache after successful deletion
      refresh();
      setTimeout(() => refresh(), 800);
    } catch (err: any) {
      console.error("[chat] Error deleting message:", err);

      const isNotFound =
        err?.message?.includes("404") ||
        err?.message?.includes("message not found") ||
        err?.message?.includes("not found");

      if (!isNotFound) {
        setDeletedIds((prev) => {
          const next = new Set(prev);
          next.delete(messageId);
          return next;
        });
        alert(err?.message || "Помилка видалення повідомлення");
      }
    } finally {
      deletingRef.current.delete(messageId);
    }
  };

  if (!hero) {
    return <div className="flex items-center justify-center text-xs text-gray-400">Загрузка персонажа...</div>;
  }

  return (
    <div className="flex flex-col h-full w-full text-white">
      <ChatTabs channel={channel} onChannelChange={setChannel} onRefresh={refresh} />

      <ChatMessagesList
        messages={messages}
        hero={hero}
        channel={channel}
        loading={loading}
        messagesTopRef={messagesTopRef}
        onDelete={handleDeleteMessage}
        onReply={setMessageText}
        onNavigate={navigate}
      />

      <ChatPagination
        page={page}
        messagesCount={messages.length}
        totalPages={totalPages}
        loading={loading}
        onPageChange={setPage}
        onRefresh={refresh}
        messagesTopRef={messagesTopRef}
      />

      {error && (
        <div className="text-red-400 text-xs text-center">
          {error}
          <div className="text-[10px] text-gray-500 mt-1">
            Убедитесь, что backend сервер запущен и міграція бази даних виконана
          </div>
        </div>
      )}

      <ChatInput
        messageText={messageText}
        loading={loading}
        onMessageChange={setMessageText}
        onSend={sendMessage}
        onRefresh={refresh}
      />
    </div>
  );
}
