import React from "react";

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
    onPageChange(newPage);
    if (newPage !== page) {
      onRefresh();
    }
    messagesTopRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
      {page > 1 && (
        <button
          onClick={() => handlePageClick(page - 1)}
          disabled={loading}
          className="hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          &lt;
        </button>
      )}

      {totalPages <= 2 ? (
        Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => handlePageClick(p)}
            disabled={loading}
            className={`hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${
              page === p ? "text-white font-bold" : ""
            }`}
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
              className={`hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${
                page === p ? "text-white font-bold" : ""
              }`}
            >
              {p}
            </button>
          ));
        })()
      )}

      {hasMore && (
        <button
          onClick={() => handlePageClick(page + 1)}
          disabled={loading}
          className="hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          &gt;
        </button>
      )}
    </div>
  );
}
