import React from "react";

interface ForumProps {
  navigate: (path: string) => void;
}

export default function Forum({ navigate }: ForumProps) {
  return (
    <div className="w-full text-white px-3 py-4">
      <div className="max-w-[360px] mx-auto">
        <div className="text-lg font-bold mb-2">Форум сервера</div>
        <div className="text-sm text-orange-400">
          Обговорення, питання та спілкування гравців.
        </div>
      </div>
    </div>
  );
}
