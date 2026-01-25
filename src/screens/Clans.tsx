import React, { useState } from "react";
import { useHeroStore } from "../state/heroStore";

interface Clan {
  id: number;
  name: string;
  level: number;
}

interface ClansProps {
  navigate: (path: string) => void;
}

export default function Clans({ navigate }: ClansProps) {
  const hero = useHeroStore((s) => s.hero);
  const [clans, setClans] = useState<Clan[]>([]); // Спочатку 0 кланів
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [clanName, setClanName] = useState("");
  const itemsPerPage = 10;

  if (!hero) {
    return (
      <div className="w-full text-white flex justify-center px-3 py-4">
        <div className="w-full max-w-[420px]">
          <div className="text-center text-[#dec28e]">Загрузка персонажа...</div>
        </div>
      </div>
    );
  }

  // Розрахунок пагінації
  const totalPages = Math.max(1, Math.ceil(clans.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClans = clans.slice(startIndex, endIndex);

  const handleCreateClan = () => {
    if (!clanName.trim()) {
      alert("Введите название клана!");
      return;
    }

    if (clanName.length < 3 || clanName.length > 16) {
      alert("Название клана должно быть от 3 до 16 символов!");
      return;
    }

    // Створюємо новий клан
    const newClan: Clan = {
      id: Date.now(), // Тимчасовий ID
      name: clanName.trim(),
      level: 1, // Початковий рівень
    };

    setClans([...clans, newClan]);
    setClanName("");
    setShowCreateForm(false);
    alert(`Клан "${newClan.name}" успешно создан!`);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="w-full text-white px-4 py-2">
      <div className="w-full max-w-[360px] mx-auto">
        <div className="space-y-3">
          {/* Риска вище заголовка */}
          <div className="border-t border-gray-600"></div>
          
          {/* Заголовок з кількістю кланів */}
          <div className="text-center text-[16px] font-semibold text-[#f4e2b8]">
            Кланы ({clans.length})
          </div>
          
          {/* Риска нижче заголовка */}
          <div className="border-b border-gray-600"></div>

          {/* clann.jpg - замість clan.png */}
          <div className="flex justify-center">
            <img
              src="/icons/clann.jpg"
              alt="Кланы"
              className="w-32 h-32 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/icons/clan.jpg";
              }}
            />
          </div>

          {/* Кнопка створення клану */}
          <div className="flex justify-center">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="text-[12px] font-semibold text-green-500 hover:text-green-400"
            >
              {showCreateForm ? "Отмена" : "Создать клан"}
            </button>
          </div>

          {/* Форма створення клану */}
          {showCreateForm && (
            <div className="p-3 bg-[#1a1a1a] border border-[#3b2614] rounded-md space-y-2">
              <div className="text-[12px] text-[#f4e2b8]">Название клана:</div>
              <input
                type="text"
                value={clanName}
                onChange={(e) => setClanName(e.target.value)}
                className="w-full px-2 py-1 bg-[#2a2a2a] border border-[#5a4424] text-[12px] text-white rounded"
                placeholder="Введите название (3-16 символов)"
                maxLength={16}
              />
              <button
                onClick={handleCreateClan}
                className="w-full px-3 py-2 bg-gradient-to-r from-[#725024] to-[#c08c3c] text-[12px] font-semibold text-black rounded-md"
              >
                Создать
              </button>
            </div>
          )}

          {/* Список кланів */}
          {clans.length === 0 ? (
            <div className="text-center text-[#9f8d73] text-sm py-4">
              Кланов пока нет
            </div>
          ) : (
            <>
              {/* Заголовки таблиці */}
              <div className="grid grid-cols-2 gap-2 text-[12px] text-[#c7ad80] border-b border-[#3b2614] pb-1">
                <div>Название</div>
                <div className="text-right">Уровень</div>
              </div>

              {/* Список кланів */}
              <div className="space-y-1">
                {currentClans.map((clan) => (
                  <div
                    key={clan.id}
                    className="grid grid-cols-2 gap-2 text-[12px] text-[#d3d3d3] py-1 border-b border-dotted border-[#3b2614]"
                  >
                    <div>{clan.name}</div>
                    <div className="text-right">Level {clan.level}</div>
                  </div>
                ))}
              </div>

              {/* Пагінація */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 text-[12px] text-[#c7ad80]">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className={`px-2 py-1 ${currentPage === 1 ? "text-gray-500 cursor-not-allowed" : "text-[#c7ad80] hover:text-[#f4e2b8]"}`}
                  >
                    &lt;&lt;
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-2 py-1 ${currentPage === 1 ? "text-gray-500 cursor-not-allowed" : "text-[#c7ad80] hover:text-[#f4e2b8]"}`}
                  >
                    &lt;
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-2 py-1 ${
                        currentPage === page
                          ? "text-[#f4e2b8] font-bold"
                          : "text-[#c7ad80] hover:text-[#f4e2b8]"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-2 py-1 ${currentPage === totalPages ? "text-gray-500 cursor-not-allowed" : "text-[#c7ad80] hover:text-[#f4e2b8]"}`}
                  >
                    &gt;
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`px-2 py-1 ${currentPage === totalPages ? "text-gray-500 cursor-not-allowed" : "text-[#c7ad80] hover:text-[#f4e2b8]"}`}
                  >
                    &gt;&gt;
                  </button>
                </div>
              )}
            </>
          )}

          {/* Риска вище тексту */}
          <div className="border-t border-gray-600"></div>
          
          {/* Текст внизу */}
          <div className="text-[11px] text-[#9f8d73] space-y-1 pt-4">
            <div>
              Клан - это группа людей, объединенных общими идеями развития своих персонажей, целями их развития и средствами для их осуществления.
            </div>
            <div className="text-center">
              Именно ты можешь изменить ход истории
            </div>
          </div>
          
          {/* Риска нижче тексту */}
          <div className="border-b border-gray-600"></div>

          {/* Кнопка назад */}
          <div className="mt-4 flex justify-center">
            <span
              onClick={() => navigate("/city")}
              className="text-sm text-red-600 cursor-pointer hover:text-red-500"
            >
              В город
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
