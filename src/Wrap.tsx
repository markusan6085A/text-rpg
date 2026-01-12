import React from "react";

export default function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#e5d9a8]">
      <div className="max-w-md mx-auto p-3">{children}</div>
    </div>
  );
}
