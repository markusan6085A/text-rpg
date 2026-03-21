import React from "react";
import { type Clan, type ClanMember } from "../../utils/api";
import { PlayerNameWithEmblem } from "../../components/PlayerNameWithEmblem";
import { useHeroStore } from "../../state/heroStore";
import { getCityUiVariant } from "../../utils/cityUiVariant";

interface ClanMembersProps {
  clan: Clan;
  members: ClanMember[];
  isLeader: boolean;
  editingTitle: { characterId: string; title: string | null } | null;
  onKickMember: (characterId: string, characterName: string) => void;
  onChangeTitle: (characterId: string, newTitle: string | null) => void;
  onSetDeputy: (characterId: string, isDeputy: boolean) => void;
  onEditingTitleChange: (editing: { characterId: string; title: string | null } | null) => void;
  onTabChange: () => void;
  onLeave?: () => void;
  onTransferLeadership?: (characterId: string) => void;
  onShowApplications?: () => void;
}

export default function ClanMembers({
  clan,
  members,
  isLeader,
  editingTitle,
  onKickMember,
  onChangeTitle,
  onSetDeputy,
  onEditingTitleChange,
  onTabChange,
  onLeave,
  onTransferLeadership,
  onShowApplications,
}: ClanMembersProps) {
  const hero = useHeroStore((s) => s.hero);
  const isL2 = getCityUiVariant() === "l2";
  const panel = isL2
    ? "bg-black/25 border border-[#5c4a32]/55 rounded p-2 max-h-64 overflow-y-auto space-y-1"
    : "bg-[#1a1a1a] border border-white/40 rounded p-2 max-h-64 overflow-y-auto space-y-1";
  const linkCls = isL2 ? "text-[#c9a44c] hover:text-[#e8c56e]" : "text-[#c7ad80] hover:text-[#f4e2b8]";
  const inputCls = isL2
    ? "flex-1 px-1 py-0.5 bg-[#0f0a06] border border-[#5c4a32]/50 text-[11px] text-[#e8dcc8] rounded"
    : "flex-1 px-1 py-0.5 bg-[#2a2a2a] border border-white/50 text-[11px] text-white rounded";
  // Обчислюємо максимум учасників на основі рівня клану
  const getMaxMembers = (level: number): number => {
    if (level >= 8) return 80;
    if (level >= 7) return 70;
    if (level >= 6) return 60;
    if (level >= 5) return 50;
    if (level >= 4) return 40;
    if (level >= 3) return 30;
    if (level >= 2) return 20;
    return 10; // level 1
  };

  const maxMembers = getMaxMembers(clan.level);

  const isDeputy = members.find((m) => m.characterId === hero?.id)?.isDeputy;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-2">
        <div
          className={
            isL2
              ? "text-[12px] text-[#c9a44c] cursor-pointer hover:text-[#e8c56e]"
              : "text-[12px] text-[#c7ad80] cursor-pointer hover:text-[#f4e2b8]"
          }
          onClick={onTabChange}
        >
          Состав ({members.length}/{maxMembers})
        </div>
        <div className="flex gap-2 text-[11px]">
          {(isLeader || isDeputy) && onShowApplications && (
            <span className={`cursor-pointer ${linkCls}`} onClick={onShowApplications}>
              Заявки
            </span>
          )}
          {onLeave && !isLeader && (
            <span className="text-red-500 cursor-pointer hover:text-red-400" onClick={onLeave}>
              Выйти
            </span>
          )}
        </div>
      </div>
      <div className={panel}>
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
              className={
                isL2
                  ? "text-[11px] border-b border-solid border-[#5c4a32]/35 pb-1"
                  : "text-[11px] border-b border-solid border-white/40 pb-1"
              }
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <span className={isOnline ? "text-green-500" : "text-red-500"}>
                    <PlayerNameWithEmblem
                      playerName={member.characterName}
                      hero={hero}
                      clan={clan}
                      size={8}
                    /> [{isOnline ? "On" : "Off"}]
                  </span>
                  <div className={isL2 ? "text-[#8a7a60] mt-0.5" : "text-[#9f8d73] mt-0.5"}>
                    {titleDisplay}
                    {rolesDisplay}
                  </div>
                </div>
              </div>
              {isLeader && !member.isLeader && (
                <div className="mt-1 flex gap-2 text-[10px] flex-wrap">
                  <span
                    className="text-red-500 cursor-pointer hover:text-red-400"
                    onClick={() => onKickMember(member.characterId, member.characterName)}
                  >
                    Исключить
                  </span>
                  <span className={`cursor-pointer ${linkCls}`} onClick={() => onEditingTitleChange({ characterId: member.characterId, title: member.title })}>
                    Изм. титул
                  </span>
                  {member.isDeputy ? (
                    <span className={`cursor-pointer ${linkCls}`} onClick={() => onSetDeputy(member.characterId, false)}>
                      Снять с зам.
                    </span>
                  ) : (
                    <span className={`cursor-pointer ${linkCls}`} onClick={() => onSetDeputy(member.characterId, true)}>
                      Назначить зам.
                    </span>
                  )}
                  {onTransferLeadership && (
                    <span
                      className="text-amber-500 cursor-pointer hover:text-amber-400"
                      onClick={() => onTransferLeadership(member.characterId)}
                    >
                      Передать лидерство
                    </span>
                  )}
                </div>
              )}
              {isLeader && member.isLeader && (
                <div className="mt-1 text-[10px]">
                  <span className={`cursor-pointer ${linkCls}`} onClick={() => onEditingTitleChange({ characterId: member.characterId, title: member.title })}>
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
                      onEditingTitleChange({
                        ...editingTitle,
                        title: e.target.value || null,
                      })
                    }
                    className={inputCls}
                    placeholder="Титул (пусто = нет титула)"
                    maxLength={20}
                  />
                  <button
                    onClick={() => onChangeTitle(member.characterId, editingTitle.title)}
                    className="px-2 py-0.5 bg-[#5a4424] text-[11px] text-white rounded hover:bg-[#6a5434]"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => onEditingTitleChange(null)}
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
  );
}
