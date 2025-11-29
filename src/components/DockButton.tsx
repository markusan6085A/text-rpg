export default function DockButton({
  onClick,
  children,
}: {
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-2 w-full rounded-xl bg-[#1b1b1b] text-[#f6e5b3] text-[12px] border border-yellow-900/30 active:scale-[.98]"
    >
      {children}
    </button>
  );
}
