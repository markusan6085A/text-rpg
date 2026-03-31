import React, { useEffect, useRef } from "react";
import { usePartyStore } from "../state/partyStore";
import { useHeroStore } from "../state/heroStore";
import { respondPartyInvite, leaveParty } from "../utils/api";
import { showToast } from "../state/toastStore";
import { getCityUiVariant, isWarmCityUi } from "../utils/cityUiVariant";
import { formatPartyApiError } from "../utils/partyApiErrors";

/**
 * Запрошення в пати + один рядок складу групи (без вимоги бути в одній локації).
 */
export default function PartyHud() {
  const variant = getCityUiVariant();
  const isL2 = isWarmCityUi(variant);
  const hero = useHeroStore((s) => s.hero);
  const party = usePartyStore((s) => s.party);
  const invites = usePartyStore((s) => s.invites);
  const bootstrap = usePartyStore((s) => s.bootstrap);
  const refreshParty = usePartyStore((s) => s.refreshParty);
  const refreshInvites = usePartyStore((s) => s.refreshInvites);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!hero?.id) return;
    void bootstrap();
    intervalRef.current = setInterval(() => {
      void refreshInvites();
      void refreshParty();
    }, 45_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hero?.id, bootstrap, refreshInvites, refreshParty]);

  if (!hero?.id) return null;

  const panelCls = isL2
    ? "border border-[#5c4a32]/55 rounded-md bg-[#14110c]/95 text-[11px] text-[#e8dcc8]"
    : "border border-[#c7ad80]/40 rounded-md bg-black/80 text-[11px] text-gray-200";

  const btnCls = isL2
    ? "px-2 py-0.5 rounded border border-[#5c4a32]/55 text-[#e8c56e] hover:bg-white/5"
    : "px-2 py-0.5 rounded border border-gray-500 text-amber-200 hover:bg-white/10";

  const dangerCls = isL2
    ? "px-2 py-0.5 rounded border border-red-800/70 text-red-300 hover:bg-red-950/40"
    : "px-2 py-0.5 rounded border border-red-700 text-red-200 hover:bg-red-950/30";

  const onLeave = async () => {
    try {
      await leaveParty();
      showToast("Ви вийшли з пати", "success");
      await refreshParty();
    } catch (e: unknown) {
      showToast(formatPartyApiError(e) || "Не вдалося вийти", "error");
    }
  };

  const onRespond = async (id: string, accept: boolean) => {
    try {
      await respondPartyInvite(id, accept);
      showToast(accept ? "Ви в пати" : "Запрошення відхилено", accept ? "success" : "info");
      await Promise.all([refreshParty(), refreshInvites()]);
    } catch (e: unknown) {
      showToast(formatPartyApiError(e) || "Помилка", "error");
    }
  };

  if (invites.length === 0 && !party) return null;

  return (
    <div className={`${panelCls} px-2 py-1.5 mb-2 space-y-2`}>
      {invites.length > 0 && (
        <div className="space-y-1.5">
          {invites.map((inv) => (
            <div key={inv.id} className="flex flex-wrap items-center gap-1.5 justify-between">
              <span className="text-[10px] sm:text-[11px]">
                <span className="text-[#e8c56e] font-semibold">{inv.fromName}</span> запрошує вас у пати
                {inv.partySize > 1 ? ` (${inv.partySize} у групі)` : ""}
              </span>
              <div className="flex gap-1 shrink-0">
                <button type="button" className={btnCls} onClick={() => void onRespond(inv.id, true)}>
                  Прийняти
                </button>
                <button type="button" className={dangerCls} onClick={() => void onRespond(inv.id, false)}>
                  Відхилити
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {party && party.members.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 justify-between border-t border-[#5c4a32]/35 pt-1.5">
          <div className="text-[10px] sm:text-[11px] min-w-0">
            <span className="text-[#caa777]">Паті </span>
            <span className="text-[#8a7a60]">
              ({party.members.length}/5):{" "}
            </span>
            <span className="break-words">
              {party.members.map((m) => m.name).join(", ")}
            </span>
          </div>
          <button type="button" className={dangerCls + " shrink-0 text-[10px]"} onClick={() => void onLeave()}>
            Вийти
          </button>
        </div>
      )}
    </div>
  );
}
