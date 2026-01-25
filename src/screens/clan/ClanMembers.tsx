import React from "react";
import { type Clan, type ClanMember } from "../../utils/api";

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
}: ClanMembersProps) {
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

  return (
    <div className="space-y-2">
      <div
        className="text-[12px] text-[#c7ad80] mb-2 cursor-pointer hover:text-[#f4e2b8]"
        onClick={onTabChange}
      >
        Состав ({members.length}/{maxMembers})
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
                    onClick={() => onKickMember(member.characterId, member.characterName)}
                  >
                    Исключить
                  </span>
                  <span
                    className="text-[#c7ad80] cursor-pointer hover:text-[#f4e2b8]"
                    onClick={() =>
                      onEditingTitleChange({
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
                      onClick={() => onSetDeputy(member.characterId, false)}
                    >
                      Снять с зам.
                    </span>
                  ) : (
                    <span
                      className="text-[#c7ad80] cursor-pointer hover:text-[#f4e2b8]"
                      onClick={() => onSetDeputy(member.characterId, true)}
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
                      onEditingTitleChange({
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
                      onEditingTitleChange({
                        ...editingTitle,
                        title: e.target.value || null,
                      })
                    }
                    className="flex-1 px-1 py-0.5 bg-[#2a2a2a] border border-[#5a4424] text-[11px] text-white rounded"
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
