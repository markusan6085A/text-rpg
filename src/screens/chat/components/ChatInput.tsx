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
    <div className="flex flex-col border-t border-gray-600 pt-2">
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
        className="w-full text-sm text-black placeholder-gray-400 bg-white border border-gray-300 rounded px-2 py-1.5 mb-2"
        maxLength={500}
      />
      <div className="flex items-stretch">
        <button
          onClick={onSend}
          disabled={!messageText.trim() || loading}
          className="flex-1 py-1.5 bg-[#c7ad80] text-black text-xs font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity rounded-l"
        >
          Написать
        </button>
        <span className="w-px bg-gray-600" aria-hidden />
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex-1 py-1.5 bg-[#c7ad80] text-black text-xs font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity rounded-r"
        >
          {loading ? "..." : "Обновить"}
        </button>
      </div>
    </div>
  );
}
