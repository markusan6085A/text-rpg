import React, { useState, useEffect } from "react";
import { getLetters, getLetter, deleteLetter, type Letter } from "../utils/api";
import WriteLetterModal from "../components/WriteLetterModal";

interface MailProps {
  navigate: (path: string) => void;
}

export default function Mail({ navigate }: MailProps) {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id?: string; name?: string } | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadLetters = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLetters(page, 50);
      setLetters(data.letters || []);
      setTotal(data.total || 0);
      setUnreadCount(data.unreadCount || 0);
    } catch (err: any) {
      setError(err?.message || "Помилка завантаження листів");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLetters();
  }, [page]);

  const handleLetterClick = async (letter: Letter) => {
    try {
      const fullLetter = await getLetter(letter.id);
      setSelectedLetter(fullLetter);
      // Оновлюємо список, щоб показати, що лист прочитаний
      setLetters((prev) =>
        prev.map((l) => (l.id === letter.id ? { ...l, isRead: true } : l))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      setError(err?.message || "Помилка завантаження листа");
    }
  };

  const handleDeleteLetter = async (letterId: string) => {
    if (!window.confirm("Видалити цей лист?")) return;
    try {
      await deleteLetter(letterId);
      if (selectedLetter?.id === letterId) {
        setSelectedLetter(null);
      }
      await loadLetters();
    } catch (err: any) {
      setError(err?.message || "Помилка видалення листа");
    }
  };

  const handleReply = (letter: Letter) => {
    setReplyingTo({ id: letter.fromCharacter.id, name: letter.fromCharacter.name });
    setShowWriteModal(true);
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  if (selectedLetter) {
    return (
      <div className="w-full flex flex-col items-center text-white px-3 py-4">
        <div className="w-full max-w-[360px]">
          {/* Заголовок */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setSelectedLetter(null)}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              ← Назад
            </button>
            <button
              onClick={() => handleDeleteLetter(selectedLetter.id)}
              className="text-red-400 hover:text-red-300 transition-colors text-sm"
            >
              Удалить
            </button>
          </div>

          {/* Риска */}
          <div className="w-full h-px bg-gray-600 mb-3"></div>

          {/* Від кого */}
          <div className="mb-2 text-xs text-gray-400">
            От: <span className="text-white">{selectedLetter.fromCharacter.name}</span>
          </div>

          {/* Тема */}
          {selectedLetter.subject && (
            <div className="mb-2 text-sm font-semibold text-yellow-300">
              {selectedLetter.subject}
            </div>
          )}

          {/* Риска */}
          <div className="w-full h-px bg-gray-600 mb-3"></div>

          {/* Текст листа */}
          <div className="mb-4 text-sm whitespace-pre-wrap">{selectedLetter.message}</div>

          {/* Риска */}
          <div className="w-full h-px bg-gray-600 mb-3"></div>

          {/* Дата */}
          <div className="text-xs text-gray-500 mb-3">{formatTime(selectedLetter.createdAt)}</div>

          {/* Кнопка відповіді */}
          <div className="w-full border-t border-b border-gray-600 py-2 mb-3">
            <button
              onClick={() => handleReply(selectedLetter)}
              className="w-full text-center text-green-400 hover:text-green-300 transition-colors text-sm font-bold"
            >
              Ответить
            </button>
          </div>
        </div>

        {/* Модалка написання відповіді */}
        {showWriteModal && replyingTo && (
          <WriteLetterModal
            toCharacterId={replyingTo.id}
            toCharacterName={replyingTo.name}
            onClose={() => {
              setShowWriteModal(false);
              setReplyingTo(null);
            }}
            onSent={() => {
              setShowWriteModal(false);
              setReplyingTo(null);
              loadLetters();
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center text-white px-3 py-4">
      <div className="w-full max-w-[360px]">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-bold text-[#87ceeb]">Почта</div>
          <button
            onClick={() => setShowWriteModal(true)}
            className="text-green-400 hover:text-green-300 transition-colors text-sm font-bold"
          >
            Написать
          </button>
        </div>

        {/* Риска */}
        <div className="w-full h-px bg-gray-600 mb-3"></div>

        {/* Непрочитані */}
        {unreadCount > 0 && (
          <div className="mb-3 text-sm text-green-400">
            Непрочитанных: {unreadCount}
          </div>
        )}

        {/* Список листів */}
        {loading ? (
          <div className="text-center text-gray-400 text-sm py-4">Загрузка...</div>
        ) : error ? (
          <div className="text-center text-red-400 text-sm py-4">{error}</div>
        ) : letters.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-4">Нет писем</div>
        ) : (
          <div className="space-y-1">
            {letters.map((letter) => (
              <div
                key={letter.id}
                onClick={() => handleLetterClick(letter)}
                className={`p-2 border-b border-gray-600 cursor-pointer hover:bg-gray-800/30 transition-colors ${
                  !letter.isRead ? "bg-gray-800/50" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-semibold text-white">
                    {letter.fromCharacter.name}
                  </div>
                  {!letter.isRead && (
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  )}
                </div>
                {letter.subject && (
                  <div className="text-xs text-yellow-300 mb-1">{letter.subject}</div>
                )}
                <div className="text-xs text-gray-400 truncate">{letter.message}</div>
                <div className="text-xs text-gray-500 mt-1">{formatTime(letter.createdAt)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Пагінація */}
        {total > 50 && (
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
            {page > 1 && (
              <button
                onClick={() => setPage(page - 1)}
                className="hover:text-white transition-colors"
              >
                &lt;
              </button>
            )}
            <span>
              {page} / {Math.ceil(total / 50)}
            </span>
            {page < Math.ceil(total / 50) && (
              <button
                onClick={() => setPage(page + 1)}
                className="hover:text-white transition-colors"
              >
                &gt;
              </button>
            )}
          </div>
        )}
      </div>

      {/* Модалка написання нового листа */}
      {showWriteModal && !replyingTo && (
        <WriteLetterModal
          onClose={() => {
            setShowWriteModal(false);
          }}
          onSent={() => {
            setShowWriteModal(false);
            loadLetters();
          }}
        />
      )}
    </div>
  );
}
