import React from "react";

interface PhoneFrameProps {
  children: React.ReactNode;
}

export default function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div className="min-h-screen bg-black flex justify-center">
      {/* Проста рамка для мобільної версії */}
      <div className="w-full max-w-[420px] min-h-screen border-x-4 border-white/40 bg-black">
        {children}
      </div>
    </div>
  );
}

