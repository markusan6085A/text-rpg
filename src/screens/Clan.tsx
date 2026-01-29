import React, { useState, useEffect, useCallback } from "react";
import { useHeroStore, getRateLimitRemainingMs } from "../state/heroStore";
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
  getClanWarehouse,
  depositClanAdena,
  withdrawClanAdena,
  depositClanCoinLuck,
  withdrawClanCoinLuck,
  setClanEmblem,
  type Clan,
  type ClanMember,
  type ClanChatMessage,
  type ClanLog,
  type ClanWarehouseItem,
} from "../utils/api";
import ClanHeader from "./clan/ClanHeader";
import ClanNavigation from "./clan/ClanNavigation";
import ClanChat from "./clan/ClanChat";
import ClanHistory from "./clan/ClanHistory";
import ClanMembers from "./clan/ClanMembers";
import ClanStorage from "./clan/ClanStorage";
import ClanManagement from "./clan/ClanManagement";
import ClanQuests from "./clan/ClanQuests";
import DepositItemsModal from "./clan/modals/DepositItemsModal";
import WithdrawItemsModal from "./clan/modals/WithdrawItemsModal";
import SelectClanEmblemModal from "./clan/modals/SelectClanEmblemModal";

interface ClanProps {
  navigate: (path: string) => void;
  clanId?: string;
}

export default function Clan({ navigate, clanId }: ClanProps) {
  const hero = useHeroStore((s) => s.hero);
  const [clan, setClan] = useState<Clan | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"chat" | "history" | "members" | "storage" | "management" | "quests">("chat");
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ClanChatMessage[]>([]);
  const [chatPage, setChatPage] = useState(1);
  const [chatTotalPages, setChatTotalPages] = useState(1);
  const [logs, setLogs] = useState<ClanLog[]>([]);
  const [members, setMembers] = useState<ClanMember[]>([]);
  const [storageItems, setStorageItems] = useState<ClanWarehouseItem[]>([]);
  const [storagePage, setStoragePage] = useState(1);
  const [storageTotalPages, setStorageTotalPages] = useState(1);
  const [editingTitle, setEditingTitle] = useState<{ characterId: string; title: string | null } | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAdenaAmount, setWithdrawAdenaAmount] = useState("");
  const [coinLuckAmount, setCoinLuckAmount] = useState("");
  const [coinLuckAction, setCoinLuckAction] = useState<"deposit" | "withdraw">("deposit");
  const [showDepositItemsModal, setShowDepositItemsModal] = useState(false);
  const [showWithdrawItemsModal, setShowWithdrawItemsModal] = useState(false);
  const [showEmblemModal, setShowEmblemModal] = useState(false);
  const [selectedItemCategory, setSelectedItemCategory] = useState("all");

  // 🔥 КРИТИЧНО: Використовуємо useCallback для стабілізації функцій
  const loadChatMessages = useCallback(async () => {
    if (!clan) return;
    if (getRateLimitRemainingMs() > 0) return;

    try {
      const response = await getClanChat(clan.id, chatPage, 10);
      if (response.ok) {
        setChatMessages(response.messages);
        setChatTotalPages(response.pagination.totalPages);
      }
    } catch (err) {
      console.error("[Clan] Failed to load chat messages:", err);
    }
  }, [clan?.id, chatPage]); // 🔥 Мінімальні dependencies - тільки clan.id та chatPage (примітиви)

  // Завантажуємо клан
  useEffect(() => {
    if (clanId) {
      loadClan();
    }
  }, [clanId, hero?.name]); // 🔥 Мінімальні dependencies - тільки clanId та hero.name (примітив)

  // Позначаємо повідомлення як прочитані при заході в клан
  useEffect(() => {
    if (clan?.id && activeTab === "chat") {
      const lastVisitKey = `clan_last_visit_${clan.id}`;
      localStorage.setItem(lastVisitKey, Date.now().toString());
    }
  }, [clan?.id, activeTab]); // 🔥 Мінімальні dependencies - тільки clan.id та activeTab (примітиви)

  // Завантажуємо чат при зміні сторінки
  useEffect(() => {
    if (activeTab === "chat" && clan) {
      loadChatMessages();
    }
  }, [activeTab, clan?.id, chatPage, loadChatMessages]); // 🔥 Мінімальні dependencies

  // Автооновлення чату кожні 3 секунди (тільки на першій сторінці)
  useEffect(() => {
    // 🔥 Правильний патерн React: cleanup тільки в return, не перед створенням
    if (activeTab !== "chat" || !clan?.id || chatPage !== 1) {
      return; // Cleanup спрацює автоматично через return нижче
    }
    
    const interval = setInterval(() => {
      loadChatMessages();
    }, 3000);
    
    return () => clearInterval(interval);
  }, [activeTab, clan?.id, chatPage, loadChatMessages]); // 🔥 Мінімальні dependencies - тільки примітиви та стабільна функція

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

  // loadChatMessages визначено вище через useCallback

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

    try {
      const response = await getClanWarehouse(clan.id, storagePage, 10);
      if (response.ok) {
        setStorageItems(response.items);
        setStorageTotalPages(response.pagination.totalPages);
      }
    } catch (err) {
      console.error("[Clan] Failed to load storage:", err);
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

    try {
      const response = await depositClanAdena(clan.id, amount);
      if (response.ok) {
        setDepositAmount("");
        loadClan(); // Оновлюємо дані клану
        // Оновлюємо hero для відображення нової кількості адени
        const heroStore = useHeroStore.getState();
        if (heroStore.hero) {
          heroStore.updateHero({ adena: (heroStore.hero.adena || 0) - amount });
        }
      }
    } catch (err: any) {
      console.error("[Clan] Failed to deposit adena:", err);
      alert(err.message || "Ошибка при пополнении адены");
    }
  };

  const handleWithdrawAdena = async () => {
    if (!clan || !hero) return;
    
    const amount = parseInt(withdrawAdenaAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Введите корректную сумму!");
      return;
    }
    if (amount > clan.adena) {
      alert("В клане недостаточно адены!");
      return;
    }

    try {
      const response = await withdrawClanAdena(clan.id, amount);
      if (response.ok) {
        setWithdrawAdenaAmount("");
        loadClan(); // Оновлюємо дані клану
        // Оновлюємо hero для відображення нової кількості адени
        const heroStore = useHeroStore.getState();
        if (heroStore.hero) {
          heroStore.updateHero({ adena: (heroStore.hero.adena || 0) + amount });
        }
      }
    } catch (err: any) {
      console.error("[Clan] Failed to withdraw adena:", err);
      alert(err.message || "Ошибка при выводе адены");
    }
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

      try {
        const response = await depositClanCoinLuck(clan.id, amount);
        if (response.ok) {
          setCoinLuckAmount("");
          loadClan(); // Оновлюємо дані клану
          // Оновлюємо hero для відображення нової кількості Coin of Luck
          const heroStore = useHeroStore.getState();
          if (heroStore.hero) {
            heroStore.updateHero({ coinOfLuck: (heroStore.hero.coinOfLuck || 0) - amount });
          }
        }
      } catch (err: any) {
        console.error("[Clan] Failed to deposit coin luck:", err);
        alert(err.message || "Ошибка при пополнении Coin of Luck");
      }
    } else {
      if (amount > clan.coinLuck) {
        alert("В клане недостаточно Coin of Luck!");
        return;
      }

      try {
        const response = await withdrawClanCoinLuck(clan.id, amount);
        if (response.ok) {
          setCoinLuckAmount("");
          loadClan(); // Оновлюємо дані клану
          // Оновлюємо hero для відображення нової кількості Coin of Luck
          const heroStore = useHeroStore.getState();
          if (heroStore.hero) {
            heroStore.updateHero({ coinOfLuck: (heroStore.hero.coinOfLuck || 0) + amount });
          }
        }
      } catch (err: any) {
        console.error("[Clan] Failed to withdraw coin luck:", err);
        alert(err.message || "Ошибка при выводе Coin of Luck");
      }
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

  const handleTabChange = (tab: "chat" | "history" | "members" | "storage" | "management" | "quests") => {
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
    } else if (tab === "quests") {
      // Заглушка для квестів
    }
    // management не потребує завантаження даних
  };

  const handleManagementClick = () => {
    setActiveTab("management");
  };

  const handleAnnouncement = () => {
    alert("Вывесить объявление - в разработке");
  };

  const handleEmblem = () => {
    setShowEmblemModal(true);
  };

  const handleSelectEmblem = async (emblem: string) => {
    if (!clan) return;
    
    try {
      const response = await setClanEmblem(clan.id, emblem);
      if (response.ok) {
        setShowEmblemModal(false);
        loadClan(); // Оновлюємо дані клану
      }
    } catch (err: any) {
      console.error("[Clan] Failed to set emblem:", err);
      alert(err.message || "Ошибка при установке эмблемы");
    }
  };

  const handleAcademy = () => {
    alert("Создать академию - в разработке");
  };

  const handleLevelUp = () => {
    alert("Повысить уровень клана - в разработке");
  };

  const handleSkillTree = () => {
    alert("Древо умений - в разработке");
  };

  const handleDragonLair = () => {
    alert("Логово дракона - в разработке");
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
        </div>
      </div>
    );
  }

  const isLeader = clan.isLeader || false;

  return (
    <div className="w-full text-white px-4 py-2">
      <div className="w-full max-w-[360px] mx-auto">
        <div className="space-y-3">
          <ClanHeader
            clan={clan}
            depositAmount={depositAmount}
            withdrawAdenaAmount={withdrawAdenaAmount}
            coinLuckAmount={coinLuckAmount}
            coinLuckAction={coinLuckAction}
            isLeader={isLeader}
            onDepositAmountChange={setDepositAmount}
            onWithdrawAdenaAmountChange={setWithdrawAdenaAmount}
            onCoinLuckAmountChange={setCoinLuckAmount}
            onCoinLuckActionChange={setCoinLuckAction}
            onDepositAdena={handleDepositAdena}
            onWithdrawAdena={handleWithdrawAdena}
            onCoinLuckAction={handleCoinLuckAction}
          />

          <ClanNavigation
            activeTab={activeTab}
            isLeader={isLeader}
            onTabChange={handleTabChange}
            onDeleteClan={handleDeleteClan}
            onManagementClick={handleManagementClick}
          />

          {/* Контент табів */}
          {activeTab === "chat" && (
            <ClanChat
              messages={chatMessages}
              message={chatMessage}
              page={chatPage}
              totalPages={chatTotalPages}
              onMessageChange={setChatMessage}
              onSendMessage={handleSendChatMessage}
              onPageChange={(page) => {
                setChatPage(page);
                loadChatMessages();
              }}
            />
          )}

          {activeTab === "history" && <ClanHistory logs={logs} />}

          {activeTab === "quests" && <ClanQuests />}

          {activeTab === "management" && clan && (
            <ClanManagement
              clan={clan}
              onAnnouncement={handleAnnouncement}
              onEmblem={handleEmblem}
              onAcademy={handleAcademy}
              onLevelUp={handleLevelUp}
              onSkillTree={handleSkillTree}
              onDragonLair={handleDragonLair}
            />
          )}

          {activeTab === "storage" && (
            <ClanStorage
              items={storageItems}
              page={storagePage}
              totalPages={storageTotalPages}
              onPageChange={(page) => {
                setStoragePage(page);
                loadStorage();
              }}
              onDepositClick={() => setShowDepositItemsModal(true)}
              onWithdrawClick={() => setShowWithdrawItemsModal(true)}
            />
          )}

          {activeTab === "members" && (
            <ClanMembers
              clan={clan}
              members={members}
              isLeader={isLeader}
              editingTitle={editingTitle}
              onKickMember={handleKickMember}
              onChangeTitle={handleChangeTitle}
              onSetDeputy={handleSetDeputy}
              onEditingTitleChange={setEditingTitle}
              onTabChange={() => handleTabChange("members")}
            />
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

      {/* Модальні вікна */}
      {showDepositItemsModal && (
        <DepositItemsModal
          clan={clan}
          selectedCategory={selectedItemCategory}
          onCategoryChange={setSelectedItemCategory}
          onClose={() => {
            setShowDepositItemsModal(false);
            setSelectedItemCategory("all");
          }}
          onDepositSuccess={loadStorage}
        />
      )}

      {showWithdrawItemsModal && (
        <WithdrawItemsModal
          clan={clan}
          items={storageItems}
          onClose={() => setShowWithdrawItemsModal(false)}
          onWithdrawSuccess={loadStorage}
        />
      )}

      {showEmblemModal && clan && (
        <SelectClanEmblemModal
          currentEmblem={clan.emblem || null}
          onSelect={handleSelectEmblem}
          onClose={() => setShowEmblemModal(false)}
        />
      )}
    </div>
  );
}
