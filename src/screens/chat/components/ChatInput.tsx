import React, { useRef } from "react";
import { getCityUiVariant } from "../../../utils/cityUiVariant";

interface ChatInputProps {
  messageText: string;
  loading: boolean;
  onMessageChange: (text: string) => void;
  onSend: () => void;
  onRefresh: () => void;
  disabled?: boolean;
  onDisabledClick?: () => void;
  /** Підказка в полі (наприклад клан / мут) */
  placeholder?: string;
}

export function ChatInput({
  messageText,
  loading,
  onMessageChange,
  onSend,
  onRefresh,
  disabled = false,
  onDisabledClick,
  placeholder = "Введите сообщение...",
}: ChatInputProps) {
  const isL2 = getCityUiVariant() === "l2";
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (disabled && onDisabledClick) {
      onDisabledClick();
      return;
    }
    onSend();
  };

  return (
    <div className={isL2 ? "flex flex-col border-b border-[#5c4a32]/45 pb-2" : "flex flex-col border-b border-white/50 pb-2"}>
      <input
        ref={inputRef}
        type="text"
        value={messageText}
        onChange={(e) => !disabled && onMessageChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        onFocus={() => disabled && onDisabledClick?.()}
        placeholder={placeholder}
        className={
          isL2
            ? "w-full text-sm text-[#e8dcc8] placeholder-[#6a6048] bg-[#0f0a06] border border-[#5c4a32]/55 rounded px-2 py-1.5 mb-2 disabled:opacity-70 disabled:cursor-not-allowed"
            : "w-full text-sm text-black placeholder-gray-400 bg-white border border-white/60 rounded px-2 py-1.5 mb-2 disabled:opacity-70 disabled:cursor-not-allowed"
        }
        maxLength={500}
        disabled={disabled}
      />
      <div className="flex items-center gap-0 text-xs">
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled ? false : (!messageText.trim() || loading)}
          className={
            isL2
              ? "bg-transparent border-none p-0 cursor-pointer text-[#c9a44c] hover:text-[#e8c56e] disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              : "bg-transparent border-none p-0 cursor-pointer text-[#c7ad80] hover:text-[#d4c49a] disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          }
        >
          Написать
        </button>
        <span className={isL2 ? "text-[#6a6048] px-1 select-none" : "text-[#c7ad80] px-1 select-none"}>|</span>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading || disabled}
          className={
            isL2
              ? "bg-transparent border-none p-0 cursor-pointer text-[#c9a44c] hover:text-[#e8c56e] disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              : "bg-transparent border-none p-0 cursor-pointer text-[#c7ad80] hover:text-[#d4c49a] disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          }
        >
          {loading ? "..." : "Обновить"}
        </button>
      </div>
    </div>
  );
}
