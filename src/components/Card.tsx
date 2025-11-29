import type { PropsWithChildren } from "react";

export default function Card({ children }: PropsWithChildren) {
  return (
    <div className="rounded-2xl border border-yellow-900/40 bg-[#121212] p-4 shadow-inner">
      {children}
    </div>
  );
}
