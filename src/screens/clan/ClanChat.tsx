import React from "react";
import { type ClanChatMessage } from "../../utils/api";
import { PlayerNameWithEmblem } from "../../components/PlayerNameWithEmblem";
import { EmojiText } from "../../components/EmojiText";
import { useHeroStore } from "../../state/heroStore";
import { useCharacterStore } from "../../state/characterStore";
import { isWarmCityUi, getCityUiVariant } from "../../utils/cityUiVariant";
import { isAdminCharacter, adminOwnWriteTextStyle } from "../../config/admin";

interface ClanChatProps {
  messages: ClanChatMessage[];
  message: string;
  page: number;
  totalPages: number;
  onMessageChange: (value: string) => void;
  onSendMessage: () => void;
  onPageChange: (page: number) => void;
}

export default function ClanChat({
  messages,
  message,
  page,
  totalPages,
  onMessageChange,
  onSendMessage,
  onPageChange,
}: ClanChatProps) {
  const hero = useHeroStore((s) => s.hero);
  const characterId = useCharacterStore((s) => s.characterId);
  const cid = (characterId || hero?.id || "").trim();
  const isL2 = isWarmCityUi(getCityUiVariant());
  const adminMsgStyle = (msgCid: string) =>
    cid && msgCid === cid && isAdminCharacter(hero?.name) ? adminOwnWriteTextStyle(hero?.name) : undefined;
  const panel = isL2
    ? "bg-black/25 border border-[#5c4a32]/55 rounded p-2 max-h-64 overflow-y-auto space-y-1"
    : "bg-[#1a1a1a] border border-white/40 rounded p-2 max-h-64 overflow-y-auto space-y-1";
  const pgBtn = (disabled: boolean) =>
    disabled
      ? "text-gray-500 cursor-not-allowed"
      : isL2
        ? "text-[#c9a44c] hover:text-[#e8c56e]"
        : "text-[#c7ad80] hover:text-[#f4e2b8]";

  return (
    <div className="space-y-2">
      {/* Чат */}
      <div className={isL2 ? "text-[12px] text-[#e8c56e] mb-2" : "text-[12px] text-[#c7ad80] mb-2"}>Чат клана:</div>
      <div className={panel}>
        {messages.length === 0 ? (
          <div className={isL2 ? "text-[11px] text-[#8a7a60]" : "text-[11px] text-[#9f8d73]"}>Нет сообщений</div>
        ) : (
          messages.map((msg) => {
            const ownSt = adminMsgStyle(msg.characterId);
            return (
            <div key={msg.id} className="text-[11px]">
              <PlayerNameWithEmblem
                playerName={msg.characterName}
                hero={hero}
                clan={msg.emblem ? { emblem: msg.emblem } as any : null}
                nickColor={msg.nickColor || undefined}
                size={12}
                className="font-semibold"
              />
              <span
                className={ownSt ? "" : isL2 ? "text-[#e8dcc8]" : "text-white"}
                style={ownSt}
              >
                : <EmojiText>{msg.message}</EmojiText>
              </span>
            </div>
            );
          })
        )}
      </div>
      {/* Пагінація чату */}
      {totalPages > 1 && (
        <div className={isL2 ? "flex justify-center items-center gap-2 text-[11px] text-[#c9a44c]" : "flex justify-center items-center gap-2 text-[11px] text-[#c7ad80]"}>
          <button
            onClick={() => {
              if (page > 1) {
                onPageChange(page - 1);
              }
            }}
            disabled={page === 1}
            className={`px-2 py-1 ${pgBtn(page === 1)}`}
          >
            &lt;
          </button>
          <span className={isL2 ? "text-[#e8dcc8]" : "text-white"}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => {
              if (page < totalPages) {
                onPageChange(page + 1);
              }
            }}
            disabled={page === totalPages}
            className={`px-2 py-1 ${pgBtn(page === totalPages)}`}
          >
            &gt;
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              onSendMessage();
            }
          }}
          style={adminOwnWriteTextStyle(hero?.name)}
          className={
            isL2
              ? "flex-1 px-2 py-1 bg-[#0f0a06] border border-[#5c4a32]/50 text-[12px] text-[#e8dcc8] rounded placeholder-[#6a6048]"
              : "flex-1 px-2 py-1 bg-[#2a2a2a] border border-white/50 text-[12px] text-white rounded"
          }
          placeholder="Введите сообщение..."
        />
        <button
          onClick={onSendMessage}
          className="px-3 py-1 bg-[#5a4424] text-[12px] text-white rounded hover:bg-[#6a5434]"
        >
          Отправить
        </button>
      </div>
    </div>
  );
}
