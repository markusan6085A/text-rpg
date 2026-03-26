import React from "react";

type Navigate = (path: string) => void;

type Props = {
  id: string;
  name: string;
  navigate: Navigate;
  isL2: boolean;
};

/** Клік по нику противника → `/player/:id` (та сама панель, що PvP/арена). Демо-id `demo-*` без переходу. */
export function TvtNickLink({ id, name, navigate, isL2 }: Props) {
  const demo = id.startsWith("demo-");
  const cls = isL2
    ? "text-[#c9a44c] hover:text-[#e8c56e] underline-offset-2"
    : "text-amber-300 hover:text-amber-200 underline-offset-2";

  if (demo) {
    return <span className={isL2 ? "text-[#8a7a60]" : "text-gray-400"}>{name}</span>;
  }

  return (
    <button type="button" className={`${cls} underline bg-transparent border-0 cursor-pointer p-0 text-left`} onClick={() => navigate(`/player/${id}`)}>
      {name}
    </button>
  );
}
