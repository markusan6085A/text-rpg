import React, { useRef } from "react";

interface ChatInputProps {
  messageText: string;
  loading: boolean;
  onMessageChange: (text: string) => void;
  onSend: () => void;
  onRefresh: () => void;
}

export function ChatInput({
  messageText,
  loading,
  onMessageChange,
  onSend,
  onRefresh,
}: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col border-b border-white/50 pb-2">
      <input
        ref={inputRef}
        type="text"
        value={messageText}
        onChange={(e) => onMessageChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        placeholder="Введите сообщение..."
        className="w-full text-sm text-black placeholder-gray-400 bg-white border border-white/60 rounded px-2 py-1.5 mb-2"
        maxLength={500}
      />
      <div className="flex items-center gap-0 text-xs">
        <button
          type="button"
          onClick={onSend}
          disabled={!messageText.trim() || loading}
          className="bg-transparent border-none p-0 cursor-pointer text-[#c7ad80] hover:text-[#d4c49a] disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          Написать
        </button>
        <span className="text-[#c7ad80] px-1 select-none">|</span>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="bg-transparent border-none p-0 cursor-pointer text-[#c7ad80] hover:text-[#d4c49a] disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {loading ? "..." : "Обновить"}
        </button>
      </div>
    </div>
  );
}
