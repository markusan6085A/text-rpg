import React from "react";

type Navigate = (p: string) => void;

export default function About({ navigate }: { navigate: Navigate }) {
  return (
    <div className="w-full flex items-start justify-center text-yellow-200">
      <div className="w-full max-w-[380px] px-4 pt-6 pb-10 mt-8 rounded-[14px]
                      border border-[#3a2e22] bg-[#1a1713]/95
                      shadow-[0_0_0_1px_#000_inset,0_2px_10px_rgba(0,0,0,0.6)]">
        <div className="text-center text-[22px] font-bold mb-4">Розділ “Про гру”</div>
        <p className="text-center text-[15px] text-yellow-100/90 leading-relaxed px-2 mb-6">
          Цей розділ у розробці. Незабаром тут з’явиться інформація про світ, класи,
          раси, рейти, економіку та інше.
        </p>
        <div className="flex justify-center">
          <button
            onClick={() => navigate("/")}
            className="px-5 py-[8px] text-[15px] font-semibold text-yellow-200 rounded-md shadow-md active:brightness-90 transition-all"
            style={{
              backgroundImage: "url(/btn-small.jpg)",
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              filter: "brightness(1.05)",
            }}>
            Назад на головну
          </button>
        </div>
      </div>
    </div>
  );
}
