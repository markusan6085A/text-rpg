import React from "react";
import { type ClanApplication } from "../../../utils/api";

interface ClanApplicationsModalProps {
  applications: ClanApplication[];
  onAccept: (characterId: string) => Promise<void>;
  onDecline: (characterId: string) => Promise<void>;
  onClose: () => void;
}

export default function ClanApplicationsModal({
  applications,
  onAccept,
  onDecline,
  onClose,
}: ClanApplicationsModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] border border-white/50 rounded p-4 max-w-[360px] w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="text-[14px] text-[#f4e2b8] mb-3">Заявки в клан</div>
        {applications.length === 0 ? (
          <div className="text-[12px] text-[#9f8d73]">Немає заявок</div>
        ) : (
          <div className="space-y-2">
            {applications.map((app) => (
              <div
                key={app.id}
                className="p-2 bg-[#2a2a2a] border border-white/30 rounded flex justify-between items-center"
              >
                <div>
                  <span className="text-[12px] text-white font-medium">{app.characterName ?? "?"}</span>
                  {app.characterLevel != null && (
                    <span className="text-[11px] text-[#9f8d73] ml-1">(рівень {app.characterLevel})</span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => onAccept(app.characterId!)}
                    className="px-2 py-0.5 text-[11px] bg-green-700 text-white rounded hover:bg-green-600"
                  >
                    Прийняти
                  </button>
                  <button
                    onClick={() => onDecline(app.characterId!)}
                    className="px-2 py-0.5 text-[11px] bg-[#3a3a3a] text-white rounded hover:bg-[#4a4a4a]"
                  >
                    Відхилити
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={onClose}
          className="mt-3 px-3 py-1 text-[12px] bg-[#3a3a3a] text-white rounded hover:bg-[#4a4a4a]"
        >
          Закрити
        </button>
      </div>
    </div>
  );
}
