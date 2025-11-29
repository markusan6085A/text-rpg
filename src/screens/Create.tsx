import { useState } from "react";
import Wrap from "../components/Wrap";
import Card from "../components/Card";
import DockButton from "../components/DockButton";
import { RACES, CLASSES } from "../data/base";
import type { Race, Klass } from "../data/base";


export default function CreateScreen({ onStart }: { onStart: (p: { name: string; race: Race; klass: Klass }) => void; }) {
  const [name, setName] = useState("");
  const [race, setRace] = useState<Race>("Людина");
  const [klass, setKlass] = useState<Klass>("Воїн");

  return (
    <Wrap>
      <h1 className="text-center text-xl font-extrabold mb-3 text-yellow-300">🔥 Створення персонажа</h1>
      <Card>
        <div className="space-y-3">
          <div>
            <div className="text-sm mb-1">Ім’я</div>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#1b1b1b] text-[#f6e5b3] border border-yellow-900/30" placeholder="Введи ім’я"/>
          </div>

          <div>
            <div className="text-sm mb-1">Раса</div>
            <div className="grid grid-cols-3 gap-2">
              {RACES.map(r => (
                <button key={r} onClick={() => setRace(r)}
                  className={`py-2 rounded-xl border ${race === r ? "border-yellow-600 bg-[#1b1b1b]" : "border-yellow-900/30 bg-[#121212]"}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm mb-1">Клас</div>
            <div className="grid grid-cols-3 gap-2">
              {CLASSES.map(k => (
                <button key={k} onClick={() => setKlass(k)}
                  className={`py-2 rounded-xl border ${klass === k ? "border-yellow-600 bg-[#1b1b1b]" : "border-yellow-900/30 bg-[#121212]"}`}>
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
