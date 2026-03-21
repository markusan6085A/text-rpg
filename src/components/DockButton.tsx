import { getCityUiVariant } from "../utils/cityUiVariant";

export default function DockButton({
  onClick,
  children,
}: {
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const isL2 = getCityUiVariant() === "l2";
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        isL2
          ? "px-3 py-2.5 w-full rounded-md text-[13px] font-medium bg-gradient-to-b from-[#2e2619] to-[#14110c] border border-[#5c4a32]/75 text-[#e8c56e] shadow-[inset_0_1px_0_rgba(199,173,128,0.1)] hover:border-[#c7ad80]/50 active:scale-[0.99] transition-[border-color,transform]"
          : "px-3 py-2 w-full rounded-xl bg-[#1b1b1b] text-[#f6e5b3] text-[12px] border border-yellow-900/30 active:scale-[.98]"
      }
    >
      {children}
    </button>
  );
}
