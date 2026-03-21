import { useState } from "react";
import Wrap from "../components/Wrap";
import Card from "../components/Card";
import DockButton from "../components/DockButton";
import { RACES, CLASSES } from "../data/base";
import type { Race, Klass } from "../data/base";
import { getCityUiVariant } from "../utils/cityUiVariant";

export default function CreateScreen({ onStart }: { onStart: (p: { name: string; race: Race; klass: Klass }) => void; }) {
  const [name, setName] = useState("");
  const [race, setRace] = useState<Race>("Людина");
  const [klass, setKlass] = useState<Klass>("Воїн");
  const isL2 = getCityUiVariant() === "l2";

  const fieldLbl = isL2 ? "text-sm mb-1 text-[#a89470]" : "text-sm mb-1";
  const inputCls = isL2
    ? "w-full px-3 py-2 rounded-md bg-[#0f0a06] text-[#e8dcc8] placeholder-[#6a6048] border border-[#5c4a32]/60"
    : "w-full px-3 py-2 rounded-xl bg-[#1b1b1b] text-[#f6e5b3] border border-yellow-900/30";
  const choiceBase = "py-2 rounded-md text-xs sm:text-sm transition-[border,background] duration-150";
  const choiceOn = isL2
    ? "border-[#c7ad80]/50 bg-gradient-to-b from-[#3a3224] to-[#1c1810] text-[#e8dcc8]"
    : "border-yellow-600 bg-[#1b1b1b]";
  const choiceOff = isL2
    ? "border-[#5c4a32]/45 bg-black/25 text-[#a89470] hover:border-[#5c4a32]/70"
    : "border-yellow-900/30 bg-[#121212]";

  return (
    <Wrap>
      <h1
        className={
          isL2
            ? "text-center text-xl font-bold mb-3 text-[#e8c56e] [text-shadow:0_1px_2px_rgba(0,0,0,0.75)]"
            : "text-center text-xl font-extrabold mb-3 text-yellow-300"
        }
      >
        🔥 Створення персонажа
      </h1>
      <Card>
        <div className="space-y-3">
          <div>
            <div className={fieldLbl}>Ім’я</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              placeholder="Введи ім’я"
            />
          </div>

          <div>
            <div className={fieldLbl}>Раса</div>
            <div className="grid grid-cols-3 gap-2">
              {RACES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRace(r)}
                  className={`${choiceBase} border ${race === r ? choiceOn : choiceOff}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className={fieldLbl}>Клас</div>
            <div className="grid grid-cols-3 gap-2">
              {CLASSES.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKlass(k)}
                  className={`${choiceBase} border ${klass === k ? choiceOn : choiceOff}`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          <DockButton onClick={() => name.trim() && onStart({ name, race, klass })}>Почати пригоду</DockButton>
        </div>
      </Card>
    </Wrap>
  );
}
