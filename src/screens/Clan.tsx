import React, { useState, useEffect, useRef } from "react";
import { useHeroStore } from "../state/heroStore";
import {
  getClan,
  deleteClan,
  getClanChat,
  postClanChatMessage,
  getClanLogs,
  getClanMembers,
  kickClanMember,
  changeClanMemberTitle,
  setClanMemberDeputy,
  type Clan,
  type ClanMember,
  type ClanChatMessage,
  type ClanLog,
} from "../utils/api";

interface ClanProps {
  navigate: (path: string) => void;
  clanId?: string;
}

export default function Clan({ navigate, clanId }: ClanProps) {
  const hero = useHeroStore((s) => s.hero);
  const [clan, setClan] = useState<Clan | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"chat" | "history" | "members">("chat");
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ClanChatMessage[]>([]);
  const [logs, setLogs] = useState<ClanLog[]>([]);
  const [members, setMembers] = useState<ClanMember[]>([]);
  const [editingTitle, setEditingTitle] = useState<{ characterId: string; title: string | null } | null>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Завантажуємо клан
  useEffect(() => {
    if (clanId) {
      loadClan();
    }
  }, [clanId, hero]);

  // Автооновлення чату кожні 3 секунди
  useEffect(() => {
    if (activeTab === "chat" && clan) {
      loadChatMessages();
      const interval = setInterval(loadChatMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab, clan]);

  // Автоскрол до останнього повідомлення
  useEffect(() => {
    if (activeTab === "chat") {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeTab]);

  const loadClan = async () => {
    if (!clanId || !hero) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await getClan(clanId);
      if (response.ok) {
        setClan(response.clan);
        // Завантажуємо дані для активного табу
        if (activeTab === "chat") {
          loadChatMessages();
        } else if (activeTab === "history") {
          loadLogs();
        } else if (activeTab === "members") {
          loadMembers();
        }
      }
    } catch (err) {
      console.error("[Clan] Failed to load clan:", err);
      alert("Клан не найден");
      navigate("/clans");
    } finally {
      setLoading(false);
    }
  };

  const loadChatMessages = async () => {
    if (!clan) return;

    try {
      const response = await getClanChat(clan.id, 1, 50);
      if (response.ok) {
        setChatMessages(response.messages);
      }
    } catch (err) {
      console.error("[Clan] Failed to load chat messages:", err);
    }
  };

  const loadLogs = async () => {
    if (!clan) return;

    try {
      const response = await getClanLogs(clan.id, 1, 50);
      if (response.ok) {
        setLogs(response.logs);
      }
    } catch (err) {
      console.error("[Clan] Failed to load logs:", err);
    }
  };

  const loadMembers = async () => {
    if (!clan) return;

    try {
      const response = await getClanMembers(clan.id);
      if (response.ok) {
        setMembers(response.members);
      }
    } catch (err) {
      console.error("[Clan] Failed to load members:", err);
    }
  };

  const handleDeleteClan = async () => {
    if (!clan) return;

    if (!window.confirm(`Вы уверены, что хотите удалить клан "${clan.name}"? Это действие нельзя отменить!`)) {
      return;
    }

    try {
      const response = await deleteClan(clan.id);
      if (response.ok) {
        alert("Клан успешно удален");
        navigate("/clans");
      }
    } catch (err: any) {
      console.error("[Clan] Failed to delete clan:", err);
      alert(err.message || "Ошибка при удалении клана");
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatMessage.trim() || !clan) return;

    try {
      const response = await postClanChatMessage(clan.id, chatMessage.trim());
      if (response.ok) {
        setChatMessage("");
        loadChatMessages();
      }
    } catch (err: any) {
      console.error("[Clan] Failed to send chat message:", err);
      alert(err.message || "Ошибка при отправке сообщения");
    }
  };

  const handleKickMember = async (characterId: string, characterName: string) => {
    if (!clan) return;

    if (!window.confirm(`Вы уверены, что хотите исключить ${characterName} из клана?`)) {
      return;
    }

    try {
      const response = await kickClanMember(clan.id, characterId);
      if (response.ok) {
        loadMembers();
        loadLogs();
        alert(`${characterName} исключен из клана`);
      }
    } catch (err: any) {
      console.error("[Clan] Failed to kick member:", err);
      alert(err.message || "Ошибка при исключении члена");
    }
  };

  const handleChangeTitle = async (characterId: string, newTitle: string | null) => {
    if (!clan) return;

    try {
      const response = await changeClanMemberTitle(clan.id, characterId, newTitle);
      if (response.ok) {
        loadMembers();
        loadLogs();
        setEditingTitle(null);
      }
    } catch (err: any) {
      console.error("[Clan] Failed to change title:", err);
      alert(err.message || "Ошибка при изменении титула");
    }
  };

  const handleSetDeputy = async (characterId: string, isDeputy: boolean) => {
    if (!clan) return;

    try {
      const response = await setClanMemberDeputy(clan.id, characterId, isDeputy);
      if (response.ok) {
        loadMembers();
        loadLogs();
      }
    } catch (err: any) {
      console.error("[Clan] Failed to set deputy:", err);
      alert(err.message || "Ошибка при изменении статуса заместителя");
    }
  };

  const handleTabChange = (tab: "chat" | "history" | "members") => {
    setActiveTab(tab);
    if (tab === "chat") {
      loadChatMessages();
    } else if (tab === "history") {
      loadLogs();
    } else if (tab === "members") {
      loadMembers();
    }
  };

  if (!hero) {
    return (
      <div className="w-full text-white flex justify-center px-3 py-4">
        <div className="w-full max-w-[420px]">
          <div className="text-center text-[#dec28e]">Загрузка персонажа...</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full text-white flex justify-center px-3 py-4">
        <div className="w-full max-w-[420px]">
          <div className="text-center text-[#dec28e]">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (!clan) {
    return (
      <div className="w-full text-white flex justify-center px-3 py-4">
        <div className="w-full max-w-[420px]">
          <div className="text-center text-[#dec28e]">Клан не найден</div>
          <button
            onClick={() => navigate("/clans")}
            className="mt-4 px-4 py-2 bg-[#5a4424] text-white rounded"
          >
            Вернуться к списку кланов
          </button>
        </div>
      </div>
    );
  }

  const isLeader = clan.isLeader || false;

  return (
    <div className="w-full text-white px-4 py-2">
      <div className="w-full max-w-[360px] mx-auto">
        <div className="space-y-3">
          {/* Назва клану */}
          <div className="text-center text-[16px] font-semibold text-[#f4e2b8]">
            {clan.name}
          </div>

          {/* Емблема клану (збільшена) */}
          <div className="flex justify-center">
            <img
              src="/icons/clann.jpg"
              alt="Клан"
              className="w-48 h-48 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/icons/clan.jpg";
              }}
            />
          </div>

          {/* Статистика клану */}
          <div className="space-y-1 text-[12px]">
            <div className="flex justify-between">
              <span className="text-[#c7ad80]">Уровень:</span>
              <span className="text-white">{clan.level}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#c7ad80]">Лидер:</span>
              <span className="text-white">{clan.creator.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#c7ad80]">Репутация:</span>
              <span className="text-white">{clan.reputation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#c7ad80]">Основан:</span>
              <span className="text-white">
                {new Date(clan.createdAt).toLocaleDateString("ru-RU")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#c7ad80]">Адена:</span>
              <span className="text-white">{clan.adena.toLocaleString("ru-RU")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#c7ad80]">Coin of Luck:</span>
              <span className="text-white">{clan.coinLuck}</span>
            </div>
          </div>

          <div className="border-t border-gray-600"></div>

          {/* Меню навігації */}
          <div className="space-y-1 text-[12px]">
            <div
              className={`cursor-pointer hover:text-[#f4e2b8] ${
                activeTab === "chat" ? "text-[#f4e2b8]" : "text-[#c7ad80]"
              }`}
              onClick={() => handleTabChange("chat")}
            >
              • Чат
            </div>
            <div
              className={`cursor-pointer hover:text-[#f4e2b8] ${
                activeTab === "history" ? "text-[#f4e2b8]" : "text-[#c7ad80]"
              }`}
              onClick={() => handleTabChange("history")}
            >
              • История
            </div>
            <div className="text-[#c7ad80]">• Склад (0/200)</div>
            {isLeader && (
              <div className="pl-4 space-y-1">
                <div className="text-[#c7ad80]">- Управление кланом</div>
                <div
                  className="text-red-500 cursor-pointer hover:text-red-400"
                  onClick={handleDeleteClan}
                >
                  - Удалить клан
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-600"></div>

          {/* Контент табів */}
          {activeTab === "chat" && (
            <div className="space-y-2">
              {/* Чат */}
              <div className="text-[12px] text-[#c7ad80] mb-2">Чат клана:</div>
              <div className="bg-[#1a1a1a] border border-[#3b2614] rounded p-2 max-h-64 overflow-y-auto space-y-1">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="text-[11px]">
                    <span
                      style={msg.nickColor ? { color: msg.nickColor } : {}}
                      className="font-semibold"
                    >
                      {msg.characterName}:
                    </span>{" "}
                    <span className="text-white">{msg.message}</span>
                  </div>
                ))}
                <div ref={chatMessagesEndRef} />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSendChatMessage();
                    }
                  }}
                  className="flex-1 px-2 py-1 bg-[#2a2a2a] border border-[#5a4424] text-[12px] text-white rounded"
                  placeholder="Введите сообщение..."
                />
                <button
                  onClick={handleSendChatMessage}
                  className="px-3 py-1 bg-[#5a4424] text-[12px] text-white rounded hover:bg-[#6a5434]"
                >
                  Отправить
                </button>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-2">
              <div className="text-[12px] text-[#c7ad80] mb-2">История клана:</div>
              <div className="bg-[#1a1a1a] border border-[#3b2614] rounded p-2 max-h-64 overflow-y-auto space-y-1">
                {logs.length === 0 ? (
                  <div className="text-[11px] text-[#9f8d73]">История пуста</div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="text-[11px] text-[#9f8d73] border-b border-dotted border-[#3b2614] pb-1">
                      {log.message}
                      <span className="text-[10px] text-gray-500 ml-2">
                        {new Date(log.createdAt).toLocaleString("ru-RU")}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "members" && (
            <div className="space-y-2">
              <div
                className="text-[12px] text-[#c7ad80] mb-2 cursor-pointer hover:text-[#f4e2b8]"
                onClick={() => handleTabChange("members")}
              >
                Состав ({members.length}/30)
              </div>
              <div className="bg-[#1a1a1a] border border-[#3b2614] rounded p-2 max-h-64 overflow-y-auto space-y-1">
                {members.map((member) => {
                  const isOnline = member.isOnline;
                  const titleDisplay = member.title || "Нет титула";
                  const roles = [];
                  if (member.isLeader) roles.push("Глава клана");
                  if (member.isDeputy) roles.push("Заместитель главы");
                  const rolesDisplay = roles.length > 0 ? `, ${roles.join(", ")}` : "";

                  return (
                    <div
                      key={member.id}
                      className="text-[11px] border-b border-dotted border-[#3b2614] pb-1"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <span className={isOnline ? "text-green-500" : "text-red-500"}>
                            {member.characterName} [{isOnline ? "On" : "Off"}]
                          </span>
                          <div className="text-[#9f8d73] mt-0.5">
                            {titleDisplay}
                            {rolesDisplay}
                          </div>
                        </div>
                      </div>
                      {isLeader && !member.isLeader && (
                        <div className="mt-1 flex gap-2 text-[10px]">
                          <span
                            className="text-red-500 cursor-pointer hover:text-red-400"
                            onClick={() => handleKickMember(member.characterId, member.characterName)}
                          >
                            Исключить
                          </span>
                          <span
                            className="text-[#c7ad80] cursor-pointer hover:text-[#f4e2b8]"
                            onClick={() =>
                              setEditingTitle({
                                characterId: member.characterId,
                                title: member.title,
                              })
                            }
                          >
                            Изм. титул
                          </span>
                          {member.isDeputy ? (
                            <span
                              className="text-[#c7ad80] cursor-pointer hover:text-[#f4e2b8]"
                              onClick={() => handleSetDeputy(member.characterId, false)}
                            >
                              Снять с зам.
                            </span>
                          ) : (
                            <span
                              className="text-[#c7ad80] cursor-pointer hover:text-[#f4e2b8]"
                              onClick={() => handleSetDeputy(member.characterId, true)}
                            >
                              Назначить зам.
                            </span>
                          )}
                        </div>
                      )}
                      {isLeader && member.isLeader && (
                        <div className="mt-1 text-[10px]">
                          <span
                            className="text-[#c7ad80] cursor-pointer hover:text-[#f4e2b8]"
                            onClick={() =>
                              setEditingTitle({
                                characterId: member.characterId,
                                title: member.title,
                              })
                            }
                          >
                            Изм. титул
                          </span>
                        </div>
                      )}
                      {editingTitle?.characterId === member.characterId && (
                        <div className="mt-1 flex gap-2">
                          <input
                            type="text"
                            value={editingTitle.title || ""}
                            onChange={(e) =>
                              setEditingTitle({
                                ...editingTitle,
                                title: e.target.value || null,
                              })
                            }
                            className="flex-1 px-1 py-0.5 bg-[#2a2a2a] border border-[#5a4424] text-[11px] text-white rounded"
                            placeholder="Титул (пусто = нет титула)"
                            maxLength={20}
                          />
                          <button
                            onClick={() => handleChangeTitle(member.characterId, editingTitle.title)}
                            className="px-2 py-0.5 bg-[#5a4424] text-[11px] text-white rounded hover:bg-[#6a5434]"
                          >
                            OK
                          </button>
                          <button
                            onClick={() => setEditingTitle(null)}
                            className="px-2 py-0.5 bg-[#3a3a3a] text-[11px] text-white rounded hover:bg-[#4a4a4a]"
                          >
                            Отмена
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Риска вище тексту */}
          <div className="border-t border-gray-600"></div>

          {/* Текст внизу */}
          <div className="text-[11px] text-[#9f8d73] space-y-1 pt-4">
            <div>
              Клан - это группа людей, объединенных общими идеями развития своих персонажей, целями их развития и средствами для их осуществления.
            </div>
            <div className="text-center">
              Именно ты можешь изменить ход истории
            </div>
          </div>

          {/* Риска нижче тексту */}
          <div className="border-b border-gray-600"></div>

          {/* Кнопка назад */}
          <div className="mt-4 flex justify-center">
            <span
              onClick={() => navigate("/city")}
              className="text-sm text-red-600 cursor-pointer hover:text-red-500"
            >
              В город
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
