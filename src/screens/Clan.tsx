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
  setClanAnnouncement,
  leaveClan,
  transferClanLeadership,
  getClanApplicationsList,
  acceptClanApplication,
  declineClanApplication,
  CLAN_CHAT_MARK_READ_EVENT,
  type Clan,
  type ClanMember,
  type ClanChatMessage,
  type ClanLog,
  type ClanWarehouseItem,
  type ClanApplication,
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
import ClanAnnouncementModal from "./clan/modals/ClanAnnouncementModal";
import ClanApplicationsModal from "./clan/modals/ClanApplicationsModal";
import ConfirmModal from "../components/ConfirmModal";
import { showToast } from "../state/toastStore";
import { getCityUiVariant } from "../utils/cityUiVariant";

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
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [applications, setApplications] = useState<ClanApplication[]>([]);
  const [confirm, setConfirm] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  // 🔥 КРИТИЧНО: Використовуємо useCallback для стабілізації функцій
  const loadChatMessages = useCallback(async () => {
    if (!clan) return;
    if (getRateLimitRemainingMs() > 0) return;

    try {
      const response = await getClanChat(clan.id, chatPage, 10);
      if (response.ok) {
        // Як у useClanChatChannel / вкладці «Клан» у Chat: новіші зверху
        setChatMessages([...response.messages].reverse());
        setChatTotalPages(response.pagination.totalPages);
      }
    } catch (err) {
      console.error("[Clan] Failed to load chat messages:", err);
    }
  }, [clan?.id, chatPage]); // 🔥 Мінімальні dependencies - тільки clan.id та chatPage (примітиви)

  // Завантажуємо клан при зміні clanId або hero (hero може підвантажитися пізніше)
  useEffect(() => {
    if (clanId) {
      loadClan();
    }
  }, [clanId, hero?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Позначаємо повідомлення як прочитані при заході в клан
  useEffect(() => {
    if (clan?.id && activeTab === "chat") {
      const lastVisitKey = `clan_last_visit_${clan.id}`;
      localStorage.setItem(lastVisitKey, Date.now().toString());
      window.dispatchEvent(
        new CustomEvent(CLAN_CHAT_MARK_READ_EVENT, { detail: { clanId: clan.id } }),
      );
    }
  }, [clan?.id, activeTab, chatMessages.length, chatMessages[0]?.id]);

  // Завантажуємо чат при зміні сторінки
  useEffect(() => {
    if (activeTab === "chat" && clan) {
      loadChatMessages();
    }
  }, [activeTab, clan?.id, chatPage, loadChatMessages]); // 🔥 Мінімальні dependencies

  // Автооновлення чату кожні 15 секунд (тільки на першій сторінці, щоб не лагати)
  useEffect(() => {
    if (activeTab !== "chat" || !clan?.id || chatPage !== 1) return;
    const interval = setInterval(() => loadChatMessages(), 15000);
    return () => clearInterval(interval);
  }, [activeTab, clan?.id, chatPage, loadChatMessages]);

  const loadClan = async (retryCount = 0) => {
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
    } catch (err: any) {
      console.error("[Clan] Failed to load clan:", err);
      // Повторна спроба при тимчасових помилках (мережа, 429 тощо)
      if (retryCount < 1 && err?.status !== 404) {
        await new Promise((r) => setTimeout(r, 1500));
        return loadClan(retryCount + 1);
      }
      showToast("Клан не найден");
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

  const handleDeleteClan = () => {
    if (!clan) return;
    setConfirm({
      title: "Удалить клан",
      message: `Вы уверены, что хотите удалить клан "${clan.name}"? Это действие нельзя отменить!`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          const response = await deleteClan(clan.id);
          if (response.ok) {
            showToast("Клан успешно удален");
            navigate("/clans");
          }
        } catch (err: any) {
          console.error("[Clan] Failed to delete clan:", err);
          showToast(err.message || "Ошибка при удалении клана");
        }
      },
    });
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
      showToast(err.message || "Ошибка при отправке сообщения");
    }
  };

  const handleDepositAdena = async () => {
    if (!clan || !hero) return;
    
    const amount = parseInt(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast("Введите корректную сумму!");
      return;
    }
    if (amount > (hero.adena || 0)) {
      showToast("У вас недостаточно адены!");
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
      showToast(err.message || "Ошибка при пополнении адены");
    }
  };

  const handleWithdrawAdena = async () => {
    if (!clan || !hero) return;
    
    const amount = parseInt(withdrawAdenaAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast("Введите корректную сумму!");
      return;
    }
    if (amount > clan.adena) {
      showToast("В клане недостаточно адены!");
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
      showToast(err.message || "Ошибка при выводе адены");
    }
  };

  const handleCoinLuckAction = async () => {
    if (!clan || !hero) return;
    
    const amount = parseInt(coinLuckAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast("Введите корректную сумму!");
      return;
    }
    if (coinLuckAction === "deposit") {
      if (amount > (hero.coinOfLuck || 0)) {
        showToast("У вас недостаточно Coin of Luck!");
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
        showToast(err.message || "Ошибка при пополнении Coin of Luck");
      }
    } else {
      if (amount > clan.coinLuck) {
        showToast("В клане недостаточно Coin of Luck!");
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
        showToast(err.message || "Ошибка при выводе Coin of Luck");
      }
    }
  };

  const handleKickMember = (characterId: string, characterName: string) => {
    if (!clan) return;
    setConfirm({
      title: "Исключить из клана",
      message: `Вы уверены, что хотите исключить ${characterName} из клана?`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          const response = await kickClanMember(clan.id, characterId);
          if (response.ok) {
            loadMembers();
            loadLogs();
            showToast(`${characterName} исключен из клана`);
          }
        } catch (err: any) {
          console.error("[Clan] Failed to kick member:", err);
          showToast(err.message || "Ошибка при исключении члена");
        }
      },
    });
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
      showToast(err.message || "Ошибка при изменении титула");
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
      showToast(err.message || "Ошибка при изменении статуса заместителя");
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
    setShowAnnouncementModal(true);
  };

  const handleSaveAnnouncement = async (announcement: string) => {
    if (!clan) return;
    await setClanAnnouncement(clan.id, announcement);
    loadClan();
  };

  const handleLeaveClan = () => {
    if (!clan) return;
    setConfirm({
      title: "Выйти из клана",
      message: "Ви впевнені, що хочете вийти з клану?",
      onConfirm: async () => {
        setConfirm(null);
        try {
          await leaveClan(clan.id);
          navigate("/clans");
        } catch (err: any) {
          showToast(err?.message || "Помилка при виході");
        }
      },
    });
  };

  const handleTransferLeadership = (characterId: string) => {
    if (!clan) return;
    setConfirm({
      title: "Передать лидерство",
      message: "Передати лідерство? Цю дію не можна скасувати.",
      onConfirm: async () => {
        setConfirm(null);
        try {
          await transferClanLeadership(clan.id, characterId);
          loadMembers();
          loadClan();
        } catch (err: any) {
          showToast(err?.message || "Помилка при передачі");
        }
      },
    });
  };

  const handleShowApplications = async () => {
    if (!clan) return;
    try {
      const res = await getClanApplicationsList(clan.id);
      setApplications(res.applications);
      setShowApplicationsModal(true);
    } catch (err) {
      console.error("[Clan] Failed to load applications:", err);
    }
  };

  const handleAcceptApplication = async (characterId: string) => {
    if (!clan) return;
    await acceptClanApplication(clan.id, characterId);
    setApplications((prev) => prev.filter((a) => a.characterId !== characterId));
    loadMembers();
    loadLogs();
  };

  const handleDeclineApplication = async (characterId: string) => {
    if (!clan) return;
    await declineClanApplication(clan.id, characterId);
    setApplications((prev) => prev.filter((a) => a.characterId !== characterId));
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
      showToast(err.message || "Ошибка при установке эмблемы");
    }
  };

  const handleAcademy = () => {
    showToast("Создать академию - в разработке");
  };

  const handleLevelUp = () => {
    showToast("Повысить уровень клана - в разработке");
  };

  const handleSkillTree = () => {
    showToast("Древо умений - в разработке");
  };

  const handleDragonLair = () => {
    showToast("Логово дракона - в разработке");
  };

  const isL2 = getCityUiVariant() === "l2";
  const l2Frame =
    "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.28)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";
  const innerPanel = isL2
    ? "w-full max-w-[420px] mx-auto rounded-xl border border-[#5c4a32]/75 bg-black/25 shadow-[inset_0_1px_0_rgba(199,173,128,0.08)] p-4"
    : "";

  if (!hero) {
    return (
      <div
        className={
          isL2
            ? `${l2Frame} w-full min-w-0 my-1 px-3 py-4 flex justify-center text-[#d4c4a8]`
            : "w-full text-white flex justify-center px-3 py-4"
        }
      >
        <div className="w-full max-w-[420px]">
          <div className={isL2 ? "text-center text-[#8a7a60]" : "text-center text-[#dec28e]"}>
            Загрузка персонажа...
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={
          isL2
            ? `${l2Frame} w-full min-w-0 my-1 px-3 py-4 flex justify-center text-[#d4c4a8]`
            : "w-full text-white flex justify-center px-3 py-4"
        }
      >
        <div className="w-full max-w-[420px]">
          <div className={isL2 ? "text-center text-[#8a7a60]" : "text-center text-[#dec28e]"}>Загрузка...</div>
        </div>
      </div>
    );
  }

  if (!clan) {
    return (
      <div
        className={
          isL2
            ? `${l2Frame} w-full min-w-0 my-1 px-3 py-4 flex justify-center text-[#d4c4a8]`
            : "w-full text-white flex justify-center px-3 py-4"
        }
      >
        <div className="w-full max-w-[420px]">
          <div className={isL2 ? "text-center text-[#8a7a60]" : "text-center text-[#dec28e]"}>Клан не найден</div>
        </div>
      </div>
    );
  }

  const isLeader = clan.isLeader || false;

  return (
    <div
      className={
        isL2 ? `${l2Frame} w-full min-w-0 my-1 px-3 py-4 text-[#d4c4a8]` : "w-full text-white px-4 py-2"
      }
    >
      <div className={isL2 ? innerPanel : "w-full max-w-[360px] mx-auto"}>
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
              onLeave={handleLeaveClan}
              onTransferLeadership={handleTransferLeadership}
              onShowApplications={handleShowApplications}
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
          onClose={() => setShowDepositItemsModal(false)}
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

      {showAnnouncementModal && clan && (
        <ClanAnnouncementModal
          clan={clan}
          onSave={handleSaveAnnouncement}
          onClose={() => setShowAnnouncementModal(false)}
        />
      )}

      {showApplicationsModal && clan && (
        <ClanApplicationsModal
          applications={applications}
          onAccept={handleAcceptApplication}
          onDecline={handleDeclineApplication}
          onClose={() => setShowApplicationsModal(false)}
        />
      )}

      {confirm && (
        <ConfirmModal
          isOpen={true}
          title={confirm.title}
          message={confirm.message}
          confirmLabel="Да"
          cancelLabel="Нет"
          onConfirm={() => {
            setConfirm(null);
            confirm.onConfirm();
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
