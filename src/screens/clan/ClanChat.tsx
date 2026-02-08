import React from "react";
import { type ClanChatMessage } from "../../utils/api";
import { PlayerNameWithEmblem } from "../../components/PlayerNameWithEmblem";
import { useHeroStore } from "../../state/heroStore";

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
  
  return (
    <div className="space-y-2">
      {/* Чат */}
      <div className="text-[12px] text-[#c7ad80] mb-2">Чат клана:</div>
      <div className="bg-[#1a1a1a] border border-white/40 rounded p-2 max-h-64 overflow-y-auto space-y-1">
        {messages.length === 0 ? (
          <div className="text-[11px] text-[#9f8d73]">Нет сообщений</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="text-[11px]">
              <PlayerNameWithEmblem
                playerName={msg.characterName}
                hero={hero}
                clan={msg.emblem ? { emblem: msg.emblem } as any : null}
                nickColor={msg.nickColor || undefined}
                size={12}
                className="font-semibold"
              />
              <span className="text-white">: {msg.message}</span>
            </div>
          ))
        )}
      </div>
      {/* Пагінація чату */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 text-[11px] text-[#c7ad80]">
          <button
            onClick={() => {
              if (page > 1) {
                onPageChange(page - 1);
              }
            }}
            disabled={page === 1}
            className={`px-2 py-1 ${page === 1 ? "text-gray-500 cursor-not-allowed" : "text-[#c7ad80] hover:text-[#f4e2b8]"}`}
          >
            &lt;
          </button>
          <span className="text-white">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => {
              if (page < totalPages) {
                onPageChange(page + 1);
              }
            }}
            disabled={page === totalPages}
            className={`px-2 py-1 ${page === totalPages ? "text-gray-500 cursor-not-allowed" : "text-[#c7ad80] hover:text-[#f4e2b8]"}`}
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
          className="flex-1 px-2 py-1 bg-[#2a2a2a] border border-white/50 text-[12px] text-white rounded"
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
