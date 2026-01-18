import React, { useRef, useEffect } from "react";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [messageText]);

  return (
    <div className="flex flex-col">
      <div className="flex gap-2 justify-end mb-1">
        <button
          onClick={onSend}
          disabled={!messageText.trim() || loading}
          className="text-white text-xs font-medium hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          Написать
        </button>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="text-gray-400 text-xs font-medium hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {loading ? "Завантаження..." : "Обновить"}
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={messageText}
        onChange={(e) => {
          onMessageChange(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        placeholder="Введите сообщение..."
        className="w-full text-sm text-black placeholder-gray-500 resize-none overflow-hidden"
        style={{ minHeight: '20px', maxHeight: '200px' }}
        rows={1}
        maxLength={500}
      />
    </div>
  );
}
