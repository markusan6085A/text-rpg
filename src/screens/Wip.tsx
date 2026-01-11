import React from "react";

type GameUser = {
  username: string;
  [key: string]: any;
};

interface WipProps {
  navigate: (path: string) => void;
  user: GameUser | null;
}

const Wip: React.FC<WipProps> = ({ navigate, user }) => {
  const title = localStorage.getItem("l2_last_feature") || "Раздел";

  const goCity = () => {
    if (user) {
      navigate("/city");
    } else {
      navigate("/");
    }
  };

  const goMain = () => {
    navigate("/");
  };

  return (
    <div className="flex items-start justify-center">
      <div className="w-full max-w-md mt-10 mb-10 px-4">
        <div className="rounded-[18px] border border-[#7a6040] bg-gradient-to-b from-[#2b2015] via-[#19130d] to-[#0e0a07] shadow-[0_26px_80px_rgba(0,0,0,0.95)] overflow-hidden">
          <div className="bg-[#20160f] border-b border-black/70 px-4 py-2 text-center text-[11px] text-[#f4e2b8] tracking-[0.12em] uppercase">
            Раздел в разработке
          </div>

          <div className="px-5 py-5 text-[#f4e2b8] text-[13px]">
            <div className="mb-2 font-semibold">{title}</div>
            <div className="text-[12px] text-[#dcc79a] leading-snug">
              Этот раздел ещё находится в разработке. Позже здесь появится
              полноценный функционал, как в браузерной Lineage 2.
            </div>

            <div className="mt-4 text-[12px] text-[#f4e2b8]">
              Текущий персонаж:{" "}
              {user ? (
                <span className="font-semibold">{user.username}</span>
              ) : (
                <span className="italic text-[#c7ad80]">
                  не выполнен вход
                </span>
              )}
            </div>
          </div>

          <div className="px-4 py-3 bg-[#120d08] border-t border-black/80 flex gap-2 text-[11px] text-[#f4e2b8]">
            <button
              onClick={goCity}
              className="flex-1 rounded-full bg-[#20160f] py-1.5 border border-black/60 hover:bg-[#291c12]"
            >
              В город
            </button>
            <button
              onClick={goMain}
              className="flex-1 rounded-full bg-[#20160f] py-1.5 border border-black/60 hover:bg-[#291c12]"
            >
              На главную
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wip;
