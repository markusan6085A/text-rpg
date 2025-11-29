type Navigate = (p: string) => void;

export default function Stats({ navigate }: { navigate: Navigate }) {
  return (
    <div className="min-h-dvh w-full bg-[#0f0f0f] text-neutral-100 flex justify-center p-2">
      <div className="w-full max-w-[380px]">
        <div className="rounded-t-[10px] bg-gradient-to-b from-[#2e2618] to-[#5a4429] px-3 py-2 text-center text-[14px] font-semibold">
          Статус / Характеристики
        </div>
        <div className="rounded-b-[10px] bg-[#181818] ring-1 ring-white/10 p-3">
          <div className="text-[12px] opacity-80">Тут з'являться характеристики персонажа.</div>
        </div>
      </div>
    </div>
  );
}
