import React from "react";
import { type ClanInvite } from "../../../utils/api";

interface ClanInvitesModalProps {
  invites: ClanInvite[];
  onRespond: (inviteId: string, accept: boolean) => Promise<void>;
  onClose: () => void;
}

export default function ClanInvitesModal({ invites, onRespond, onClose }: ClanInvitesModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] border border-white/50 rounded p-4 max-w-[360px] w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="text-[14px] text-[#f4e2b8] mb-3">Запрошення в клан</div>
        {invites.length === 0 ? (
          <div className="text-[12px] text-[#9f8d73]">Немає запрошень</div>
        ) : (
          <div className="space-y-2">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="p-2 bg-[#2a2a2a] border border-white/30 rounded flex justify-between items-center"
              >
                <div>
                  <span className="text-[12px] text-white font-medium">{inv.clanName}</span>
                  <span className="text-[11px] text-[#9f8d73] ml-1">(рівень {inv.clanLevel})</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => onRespond(inv.id, true)}
                    className="px-2 py-0.5 text-[11px] bg-green-700 text-white rounded hover:bg-green-600"
                  >
                    Прийняти
                  </button>
                  <button
                    onClick={() => onRespond(inv.id, false)}
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
