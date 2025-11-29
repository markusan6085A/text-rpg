type Props = { label: string; sub?: React.ReactNode; last?: boolean; onClick?: () => void };
export default function ButtonLine({ label, sub, last, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-3 text-sm ${!last ? "border-b border-yellow-900/20" : ""} active:bg-yellow-900/20`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="font-medium">{label}</div>
          {sub && <div className="text-xs opacity-70">{sub}</div>}
        </div>
        <div className="text-xs opacity-60">›</div>
      </div>
    </button>
  );
}
