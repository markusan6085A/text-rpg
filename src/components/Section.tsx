export default function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-yellow-900/30 bg-[#121212] p-3">
      <div className="font-semibold mb-2">{title}</div>
      {children}
    </div>
  );
}
