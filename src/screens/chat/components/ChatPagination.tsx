import React from "react";
import { getCityUiVariant } from "../../../utils/cityUiVariant";

interface ChatPaginationProps {
  page: number;
  messagesCount: number;
  totalPages?: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  messagesTopRef: React.RefObject<HTMLDivElement>;
}

export function ChatPagination({
  page,
  messagesCount,
  totalPages: propTotalPages,
  loading,
  onPageChange,
  onRefresh,
  messagesTopRef,
}: ChatPaginationProps) {
  const isL2 = getCityUiVariant() === "l2";
  // Використовуємо totalPages з пропсів, якщо є, інакше обчислюємо
  // 🔥 ВАЖЛИВО: Якщо totalPages не передано, використовуємо fallback, але перевіряємо також messagesCount
  // Якщо на поточній сторінці є 10 повідомлень, це означає, що може бути більше сторінок
  const hasMore = messagesCount >= 10;
  // Використовуємо propTotalPages якщо є, інакше обчислюємо на основі messagesCount
  // Якщо на сторінці 2+ є повідомлення, значить є ще сторінки
  const totalPages = propTotalPages !== undefined 
    ? propTotalPages 
    : (hasMore ? Math.max(page + 1, page) : page);

  const handlePageClick = (newPage: number) => {
    console.log('[ChatPagination] Page change:', { from: page, to: newPage, totalPages });
    onPageChange(newPage);
    // 🔥 ВАЖЛИВО: Завжди викликаємо refresh при зміні сторінки, щоб завантажити актуальні дані
    if (newPage !== page) {
      // Невелика затримка, щоб state встиг оновитися
      setTimeout(() => {
        onRefresh();
      }, 50);
    }
    messagesTopRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const pgBase = isL2
    ? "hover:text-[#e8c56e] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    : "hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors";
  const pgActive = isL2 ? "text-[#e8dcc8] font-bold" : "text-white font-bold";

  return (
    <div
      className={
        isL2
          ? "flex items-center justify-center gap-1 text-xs text-[#8a7a60]"
          : "flex items-center justify-center gap-1 text-xs text-gray-400"
      }
    >
      {page > 1 && (
        <button onClick={() => handlePageClick(page - 1)} disabled={loading} className={pgBase}>
          &lt;
        </button>
      )}

      {totalPages <= 2 ? (
        Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => handlePageClick(p)}
            disabled={loading}
            className={`${pgBase} ${page === p ? pgActive : ""}`}
          >
            {p}
          </button>
        ))
      ) : (
        (() => {
          const pages: number[] = [];
          if (page === 1) {
            pages.push(1, 2, 3);
          } else if (page === totalPages) {
            pages.push(totalPages - 2, totalPages - 1, totalPages);
          } else {
            pages.push(page - 1, page, page + 1);
          }

          return pages.map((p) => (
            <button
              key={p}
              onClick={() => handlePageClick(p)}
              disabled={loading}
              className={`${pgBase} ${page === p ? pgActive : ""}`}
            >
              {p}
            </button>
          ));
        })()
      )}

      {hasMore && (
        <button onClick={() => handlePageClick(page + 1)} disabled={loading} className={pgBase}>
          &gt;
        </button>
      )}
    </div>
  );
}
