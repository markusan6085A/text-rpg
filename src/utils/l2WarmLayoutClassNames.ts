/** Canonical warm L2 Tailwind shells (City, Battle, Market, …). */

export const L2_WARM_OUTER_FRAME =
  "rounded-xl overflow-hidden border border-[#c7ad80]/35 shadow-[0_0_0_1px_rgba(0,0,0,0.85),0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_50%_at_50%_-8%,rgba(120,90,45,0.28)_0%,transparent_50%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";

/** Alias used by Location / older imports. */
export const L2_LOCATION_FRAME = L2_WARM_OUTER_FRAME;

export const L2_LOCATION_MOB_CARD =
  "w-full rounded-md mb-1.5 border border-[#5c4a32]/75 bg-gradient-to-b from-[#2e2619] to-[#14110c] shadow-[inset_0_1px_0_rgba(199,173,128,0.1),0_4px_12px_rgba(0,0,0,0.45)] hover:border-[#c7ad80]/45 hover:brightness-[1.04] active:scale-[0.995] transition-[border-color,transform,filter] duration-150 px-2 py-1.5 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#c7ad80]/40";

/** Location mob detail modal — трохи інший radial, ніж `L2_WARM_OUTER_FRAME`. */
export const L2_WARM_LOCATION_MODAL_LG =
  "rounded-xl border border-[#c7ad80]/35 p-4 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-[0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(120,90,45,0.22)_0%,transparent_55%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";

export const L2_WARM_LOCATION_MODAL_MD =
  "rounded-xl border border-[#c7ad80]/35 p-4 max-w-md w-full shadow-[0_16px_48px_rgba(0,0,0,0.65)] bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(120,90,45,0.22)_0%,transparent_55%),linear-gradient(180deg,#1c1812_0%,#0c0a08_100%)]";

export const L2_WARM_LOCATION_MODAL_MD_SCROLL = `${L2_WARM_LOCATION_MODAL_MD} max-h-[90vh] overflow-y-auto`;
