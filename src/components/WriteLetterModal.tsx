import React, { useState } from "react";
import { sendLetter } from "../utils/api";

interface WriteLetterModalProps {
  toCharacterId?: string;
  toCharacterName?: string;
  onClose: () => void;
  onSent: () => void;
}

export default function WriteLetterModal({
  toCharacterId,
  toCharacterName,
  onClose,
  onSent,
}: WriteLetterModalProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!message.trim()) {
      setError("Текст повідомлення обов'язковий");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await sendLetter({
        toCharacterId,
        toCharacterName,
        subject: subject.trim() || "",
        message: message.trim(),
      });
      onSent();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Помилка відправки листа");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a0b0b] border border-[#5c1a1a]/70 rounded-lg p-4 max-w-[360px] w-full text-white">
        {/* Заголовок - схожий на TargetCard */}
        <div className="flex items-baseline justify-start gap-2 mb-3">
          <div className="text-sm font-semibold text-[#ffe9c0]">Написать письмо</div>
          {toCharacterName && (
            <div className="text-xs text-[#caa777]">для {toCharacterName}</div>
          )}
        </div>

        {/* Риска */}
        <div className="w-full h-px bg-gray-600 mb-3"></div>

        {/* Тема (опціональна) */}
        <div className="mb-3">
          <label className="block text-xs text-gray-400 mb-1">Тема (необов'язково)</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-[#0b0806] border border-[#5b4726] rounded px-2 py-1 text-sm text-white"
            placeholder="Тема листа..."
            maxLength={100}
          />
        </div>

        {/* Повідомлення */}
        <div className="mb-3">
          <label className="block text-xs text-gray-400 mb-1">Повідомлення</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-[#0b0806] border border-[#5b4726] rounded px-2 py-1 text-sm text-white resize-none"
            placeholder="Введіть текст листа..."
            rows={6}
            maxLength={1000}
          />
          <div className="text-xs text-gray-500 mt-1 text-right">
            {message.length}/1000
          </div>
        </div>

        {/* Помилка */}
        {error && (
          <div className="text-red-400 text-xs mb-3">{error}</div>
        )}

        {/* Риска */}
        <div className="w-full h-px bg-gray-600 mb-3"></div>

        {/* Кнопки */}
        <div className="flex items-center gap-2 justify-end text-xs">
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            Отмена
          </button>
          <span className="text-gray-600">|</span>
          <button
            onClick={handleSend}
            disabled={loading || !message.trim()}
            className="text-green-400 hover:text-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold"
          >
            {loading ? "Отправка..." : "Отправить"}
          </button>
        </div>
      </div>
    </div>
  );
}
