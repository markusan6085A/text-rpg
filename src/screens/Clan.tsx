import React, { useState, useEffect } from "react";
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
  const [activeTab, setActiveTab] = useState<"chat" | "history" | "members" | "storage">("chat");
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ClanChatMessage[]>([]);
  const [chatPage, setChatPage] = useState(1);
  const [chatTotalPages, setChatTotalPages] = useState(1);
  const [logs, setLogs] = useState<ClanLog[]>([]);
  const [members, setMembers] = useState<ClanMember[]>([]);
  const [storageItems, setStorageItems] = useState<any[]>([]);
  const [storagePage, setStoragePage] = useState(1);
  const [storageTotalPages, setStorageTotalPages] = useState(1);
  const [editingTitle, setEditingTitle] = useState<{ characterId: string; title: string | null } | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [coinLuckAmount, setCoinLuckAmount] = useState("");
  const [coinLuckAction, setCoinLuckAction] = useState<"deposit" | "withdraw">("deposit");

  // Завантажуємо клан
  useEffect(() => {
    if (clanId) {
      loadClan();
    }
  }, [clanId, hero]);

  // Позначаємо повідомлення як прочитані при заході в клан
  useEffect(() => {
    if (clan && activeTab === "chat") {
      const lastVisitKey = `clan_last_visit_${clan.id}`;
      localStorage.setItem(lastVisitKey, Date.now().toString());
    }
  }, [clan, activeTab]);

  // Завантажуємо чат при зміні сторінки
  useEffect(() => {
    if (activeTab === "chat" && clan) {
      loadChatMessages();
    }
  }, [activeTab, clan, chatPage]);

  // Автооновлення чату кожні 3 секунди (тільки на першій сторінці)
  useEffect(() => {
    if (activeTab === "chat" && clan && chatPage === 1) {
      const interval = setInterval(() => {
        loadChatMessages();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab, clan, chatPage]);

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
        } else if (activeTab === "storage") {
          loadStorage();
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
      const response = await getClanChat(clan.id, chatPage, 10);
      if (response.ok) {
        setChatMessages(response.messages);
        setChatTotalPages(response.pagination.totalPages);
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

  const loadStorage = async () => {
    if (!clan) return;
    // TODO: Implement storage loading
    setStorageItems([]);
    setStorageTotalPages(1);
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
        // Переходимо на першу сторінку після відправки
        setChatPage(1);
        loadChatMessages();
      }
    } catch (err: any) {
      console.error("[Clan] Failed to send chat message:", err);
      alert(err.message || "Ошибка при отправке сообщения");
    }
  };

  const handleDepositAdena = async () => {
    if (!clan || !hero) return;
    
    const amount = parseInt(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Введите корректную сумму!");
      return;
    }
    if (amount > (hero.adena || 0)) {
      alert("У вас недостаточно адены!");
      return;
    }
    // TODO: Implement API call
    alert("Функция в разработке");
    setDepositAmount("");
  };

  const handleCoinLuckAction = async () => {
    if (!clan || !hero) return;
    
    const amount = parseInt(coinLuckAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Введите корректную сумму!");
      return;
    }
    if (coinLuckAction === "deposit") {
      if (amount > (hero.coinOfLuck || 0)) {
        alert("У вас недостаточно Coin of Luck!");
        return;
      }
    } else {
      if (amount > clan.coinLuck) {
        alert("В клане недостаточно Coin of Luck!");
        return;
      }
    }
    // TODO: Implement API call
    alert("Функция в разработке");
    setCoinLuckAmount("");
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

  const handleTabChange = (tab: "chat" | "history" | "members" | "storage") => {
    setActiveTab(tab);
    if (tab === "chat") {
      setChatPage(1);
      loadChatMessages();
    } else if (tab === "history") {
      loadLogs();
    } else if (tab === "members") {
      loadMembers();
    } else if (tab === "storage") {
      setStoragePage(1);
      loadStorage();
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
          {/* Риска вище назви клану */}
          <div className="border-t border-gray-600"></div>

          {/* Назва клану */}
          <div className="text-center text-[16px] font-semibold text-[#f4e2b8]">
            {clan.name}
          </div>

          {/* Риска нижче назви клану */}
          <div className="border-b border-gray-600"></div>

          {/* Емблема клану (clanns.png) */}
          <div className="flex justify-center">
            <img
              src="/icons/clanns.png"
              alt="Клан"
              className="w-48 h-48 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/icons/clann.jpg";
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
            <div className="flex justify-between items-center">
              <span className="text-[#c7ad80]">Адена:</span>
              <div className="flex items-center gap-2">
                <span className="text-white">{clan.adena.toLocaleString("ru-RU")}</span>
                <button
                  onClick={() => setDepositAmount("0")}
                  className="px-2 py-0.5 bg-green-600 text-[10px] text-white rounded hover:bg-green-700"
                >
                  положить
                </button>
              </div>
            </div>
            {depositAmount !== "" && (
              <div className="flex gap-2 items-center text-[11px]">
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="flex-1 px-2 py-1 bg-[#2a2a2a] border border-[#5a4424] text-white rounded"
                  placeholder="Сумма"
                  autoFocus
                />
                <button
                  onClick={() => {
                    handleDepositAdena();
                  }}
                  className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  OK
                </button>
                <button
                  onClick={() => setDepositAmount("")}
                  className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Отмена
                </button>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-[#c7ad80]">Coin of Luck:</span>
              <div className="flex items-center gap-2">
                <span className="text-white">{clan.coinLuck}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setCoinLuckAction("deposit");
                      setCoinLuckAmount("0");
                    }}
                    className="px-2 py-0.5 bg-green-600 text-[10px] text-white rounded hover:bg-green-700"
                  >
                    поповнить
                  </button>
                  <button
                    onClick={() => {
                      setCoinLuckAction("withdraw");
                      setCoinLuckAmount("0");
                    }}
                    className="px-2 py-0.5 bg-red-600 text-[10px] text-white rounded hover:bg-red-700"
                  >
                    забрать
                  </button>
                </div>
              </div>
            </div>
            {coinLuckAmount !== "" && (
              <div className="flex gap-2 items-center text-[11px]">
                <input
                  type="number"
                  value={coinLuckAmount}
                  onChange={(e) => setCoinLuckAmount(e.target.value)}
                  className="flex-1 px-2 py-1 bg-[#2a2a2a] border border-[#5a4424] text-white rounded"
                  placeholder={`Сумма для ${coinLuckAction === "deposit" ? "пополнения" : "вывода"}`}
                  autoFocus
                />
                <button
                  onClick={() => {
                    handleCoinLuckAction();
                  }}
                  className={`px-2 py-1 text-white rounded hover:opacity-80 ${
                    coinLuckAction === "deposit" ? "bg-green-600" : "bg-red-600"
                  }`}
                >
                  OK
                </button>
                <button
                  onClick={() => setCoinLuckAmount("")}
                  className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Отмена
                </button>
              </div>
            )}
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
            <div
              className={`cursor-pointer hover:text-[#f4e2b8] ${
                activeTab === "storage" ? "text-[#f4e2b8]" : "text-[#c7ad80]"
              }`}
              onClick={() => handleTabChange("storage")}
            >
              • Склад ({storageItems.length}/200)
            </div>
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
                {chatMessages.length === 0 ? (
                  <div className="text-[11px] text-[#9f8d73]">Нет сообщений</div>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className="text-[11px]">
                      <span
                        style={msg.nickColor ? { color: msg.nickColor } : {}}
                        className="font-semibold"
                      >
                        {msg.characterName}:
                      </span>{" "}
                      <span className="text-white">{msg.message}</span>
                    </div>
                  ))
                )}
              </div>
              {/* Пагінація чату */}
              {chatTotalPages > 1 && (
                <div className="flex justify-center items-center gap-2 text-[11px] text-[#c7ad80]">
                  <button
                    onClick={() => {
                      if (chatPage > 1) {
                        setChatPage(chatPage - 1);
                        loadChatMessages();
                      }
                    }}
                    disabled={chatPage === 1}
                    className={`px-2 py-1 ${chatPage === 1 ? "text-gray-500 cursor-not-allowed" : "text-[#c7ad80] hover:text-[#f4e2b8]"}`}
                  >
                    &lt;
                  </button>
                  <span className="text-white">
                    {chatPage} / {chatTotalPages}
                  </span>
                  <button
                    onClick={() => {
                      if (chatPage < chatTotalPages) {
                        setChatPage(chatPage + 1);
                        loadChatMessages();
                      }
                    }}
                    disabled={chatPage === chatTotalPages}
                    className={`px-2 py-1 ${chatPage === chatTotalPages ? "text-gray-500 cursor-not-allowed" : "text-[#c7ad80] hover:text-[#f4e2b8]"}`}
                  >
                    &gt;
                  </button>
                </div>
              )}
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

          {activeTab === "storage" && (
            <div className="space-y-2">
              <div className="text-[12px] text-[#c7ad80] mb-2">Склад клана:</div>
              <div className="bg-[#1a1a1a] border border-[#3b2614] rounded p-2 max-h-64 overflow-y-auto space-y-1">
                {storageItems.length === 0 ? (
                  <div className="text-[11px] text-[#9f8d73]">Склад пуст</div>
                ) : (
                  storageItems.map((item) => (
                    <div key={item.id} className="text-[11px] text-white border-b border-dotted border-[#3b2614] pb-1">
                      {item.name} x{item.qty || 1}
                    </div>
                  ))
                )}
              </div>
              {/* Пагінація складу */}
              {storageTotalPages > 1 && (
                <div className="flex justify-center items-center gap-2 text-[11px] text-[#c7ad80]">
                  <button
                    onClick={() => {
                      if (storagePage > 1) {
                        setStoragePage(storagePage - 1);
                        loadStorage();
                      }
                    }}
                    disabled={storagePage === 1}
                    className={`px-2 py-1 ${storagePage === 1 ? "text-gray-500 cursor-not-allowed" : "text-[#c7ad80] hover:text-[#f4e2b8]"}`}
                  >
                    &lt;
                  </button>
                  <span className="text-white">
                    {storagePage} / {storageTotalPages}
                  </span>
                  <button
                    onClick={() => {
                      if (storagePage < storageTotalPages) {
                        setStoragePage(storagePage + 1);
                        loadStorage();
                      }
                    }}
                    disabled={storagePage === storageTotalPages}
                    className={`px-2 py-1 ${storagePage === storageTotalPages ? "text-gray-500 cursor-not-allowed" : "text-[#c7ad80] hover:text-[#f4e2b8]"}`}
                  >
                    &gt;
                  </button>
                </div>
              )}
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
