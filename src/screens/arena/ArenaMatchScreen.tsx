import React, { useMemo, useState, useEffect, useRef } from "react";
import { useHeroStore } from "../../state/heroStore";
import { useCharacterStore } from "../../state/characterStore";
import {
  getPkSession,
  getPublicCharacter,
  resurrectCharacter,
  leaveArenaField,
  arenaFleePkSession,
  type Character,
  type PkSessionState,
} from "../../utils/api";
import PkProfileView from "../player/PkProfileView";
import { getProfessionDefinition, normalizeProfessionId } from "../../data/skills";
import { usePkSessionCombat } from "./usePkSessionCombat";
import { arenaOuterFrame, minimalOpponentCharacter } from "./arenaTheme";
import { isWarmCityUi, getCityUiVariant } from "../../utils/cityUiVariant";
import { useBattleStore } from "../../state/battle/store";
import { setResurrectInProgress } from "../../state/heroStore";
import { clearDeathGate } from "../../utils/deathGate";
import { effectiveCharacterLevel } from "../../utils/effectiveCharacterLevel";
import { loadHeroFromAPI } from "../../state/heroStore/heroLoadAPI";

interface ArenaMatchScreenProps {
  navigate: (path: string) => void;
  sessionIdFromUrl: string | null;
}

export default function ArenaMatchScreen({ navigate, sessionIdFromUrl }: ArenaMatchScreenProps) {
  const hero = useHeroStore((s) => s.hero);
  const updateHero = useHeroStore((s) => s.updateHero);
  const characterId = useCharacterStore((s) => s.characterId);
  const isL2 = isWarmCityUi(getCityUiVariant());

  const [opponentCharacter, setOpponentCharacter] = useState<Character | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const sessionEndedRef = useRef(false);
  const fledArenaExplicitRef = useRef(false);
  const matchMountGen = useRef(0);
  const sessionKindRef = useRef<"pk" | "arena" | "tvt" | undefined>(undefined);
  const tvtHeroRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fledArenaExplicitRef.current = false;
  }, [sessionIdFromUrl]);

  useEffect(() => {
    if (!sessionIdFromUrl || !hero?.id) return;
    let alive = true;
    (async () => {
      try {
        const res = await getPkSession(sessionIdFromUrl);
        const s = res.session;
        if (!alive || !s) {
          if (alive) setLoadErr("Сессия не найдена");
          return;
        }
        sessionKindRef.current = s.sessionKind;
        if (s.sessionKind !== "arena" && s.sessionKind !== "tvt") {
          if (alive) setLoadErr("Это не арена (откройте бой через поле арены)");
          return;
        }
        const oid = hero.id === s.attackerId ? s.defenderId : s.attackerId;
        try {
          const pub = await getPublicCharacter(oid);
          if (alive) setOpponentCharacter(pub);
        } catch {
          const of = hero.id === s.attackerId ? s.defender : s.attacker;
          if (alive)
            setOpponentCharacter(
              minimalOpponentCharacter({
                id: oid,
                name: String(of?.name || "Противник"),
                level: 1,
              })
            );
        }
      } catch (e: any) {
        if (alive) setLoadErr(e?.message || "Сессия не найдена");
      }
    })();
    return () => {
      alive = false;
    };
  }, [sessionIdFromUrl, hero?.id]);

  const onSessionEnded = (s: PkSessionState) => {
    if (s.sessionKind !== "tvt") return;
    if (tvtHeroRefreshTimerRef.current) clearTimeout(tvtHeroRefreshTimerRef.current);
    tvtHeroRefreshTimerRef.current = setTimeout(() => {
      tvtHeroRefreshTimerRef.current = null;
      void loadHeroFromAPI().catch(() => {});
    }, 750);
  };

  useEffect(() => {
    return () => {
      if (tvtHeroRefreshTimerRef.current) clearTimeout(tvtHeroRefreshTimerRef.current);
    };
  }, []);

  const {
    pkSession,
    pkLoading,
    pkActing,
    pkError,
    serverTimeDrift,
    handlePkUseSkill,
    handlePkAttack,
  } = usePkSessionCombat({
    sessionId: sessionIdFromUrl,
    enabled: Boolean(sessionIdFromUrl && hero?.id),
    onSessionEnded,
  });

  useEffect(() => {
    sessionEndedRef.current = Boolean(pkSession?.ended);
  }, [pkSession?.ended]);

  useEffect(() => {
    sessionKindRef.current = pkSession?.sessionKind;
  }, [pkSession?.sessionKind]);

  /** Уход с экрана боя: соперник видит «… сбежал»; microtask обходит Strict Mode (ложный unmount). */
  useEffect(() => {
    const sid = sessionIdFromUrl;
    if (!sid) return;
    matchMountGen.current += 1;
    const gen = matchMountGen.current;
    return () => {
      queueMicrotask(() => {
        if (matchMountGen.current !== gen) return;
        const explicitFlee = fledArenaExplicitRef.current;
        fledArenaExplicitRef.current = false;
        if (!explicitFlee && !sessionEndedRef.current) {
          void arenaFleePkSession(sid).catch(() => {});
        }
        const cid = (useCharacterStore.getState().characterId || useHeroStore.getState().hero?.id || "").trim();
        if (cid) void leaveArenaField(cid).catch(() => {});
      });
    };
  }, [sessionIdFromUrl]);

  const character = opponentCharacter;

  const heroData = useMemo(() => {
    if (!character) return null;
    const professionRaw = character.heroJson?.profession || character.classId || "duelist";
    return {
      id: character.id,
      name: character.name,
      profession: professionRaw,
      level: effectiveCharacterLevel(character),
      heroJson: character.heroJson || {},
    };
  }, [character]);

  const professionLabel = useMemo(() => {
    if (!character) return "";
    const profId = normalizeProfessionId((character.heroJson?.profession || character.classId || "") as any);
    const def = profId ? getProfessionDefinition(profId) : null;
    return def?.label || character.classId || "Боец";
  }, [character]);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const isTvt = pkSession?.sessionKind === "tvt";

  const handleArenaDefeatToCity = async () => {
    const cidUse = (characterId || hero?.id || "").trim();
    if (!cidUse || !hero) return;
    setResurrectInProgress(true);
    try {
      const expectedRevision = Number((hero as any)?.heroJson?.heroRevision ?? 0);
      const char = await resurrectCharacter(cidUse, 0.7, expectedRevision);
      const hj = (char as any)?.heroJson;
      if (hero.name) clearDeathGate(cidUse, hero.name);
      if (hj) {
        updateHero({
          hp: Number(hj.hp) || 1,
          mp: Number(hj.mp) ?? 0,
          cp: Number(hj.cp) ?? 0,
          heroJson: {
            ...(hero as any)?.heroJson,
            ...hj,
            isDead: false,
            deadAt: 0,
            killedByMobName: undefined,
            killedByMobDamage: undefined,
            heroBuffs: [],
          } as any,
        });
      }
      useBattleStore.getState().reset();
      await leaveArenaField(cidUse);
      navigate(sessionKindRef.current === "tvt" ? "/city" : "/arena");
    } catch (e) {
      console.warn("[ArenaMatch] resurrect failed", e);
    } finally {
      setResurrectInProgress(false);
    }
  };

  const backToArena = async () => {
    useBattleStore.getState().reset();
    const cidUse = (characterId || hero?.id || "").trim();
    fledArenaExplicitRef.current = true;
    if (sessionIdFromUrl) await arenaFleePkSession(sessionIdFromUrl).catch(() => {});
    if (cidUse) await leaveArenaField(cidUse).catch(() => {});
    navigate(sessionKindRef.current === "tvt" ? "/tvt-match" : "/arena");
  };

  if (!sessionIdFromUrl) {
    return (
      <div className={`p-4 ${arenaOuterFrame()}`}>
        <p className={isL2 ? "text-[#d4786a] text-center" : "text-red-400 text-center"}>Нет сессии</p>
        <button type="button" className="mt-3 w-full text-[#c9a44c]" onClick={() => navigate("/arena")}>
          На арену
        </button>
      </div>
    );
  }

  if (!hero || !character || !heroData) {
    return (
      <div className={`p-4 ${arenaOuterFrame()}`}>
        <p className={isL2 ? "text-[#8a7a60] text-center" : "text-gray-400 text-center"}>
          {loadErr || "Загрузка…"}
        </p>
      </div>
    );
  }

  const iLost = Boolean(pkSession?.ended && pkSession.winnerId && hero.id && pkSession.winnerId !== hero.id);

  const matchTitle = isTvt ? "TvT · PvP" : "Арена · PvP";
  const backLabelWin = isTvt ? "К TvT" : "На арену";
  const backLabelLoss = isTvt ? "В город" : "Телепортироваться в город";

  return (
    <div className={`w-full min-w-0 my-1 p-2 sm:p-3 ${arenaOuterFrame()}`}>
      <div
        className={
          isL2
            ? "mb-2 text-center text-[11px] uppercase tracking-[0.2em] text-[#c9a44c]/90"
            : "mb-2 text-center text-xs uppercase tracking-widest text-amber-400/90"
        }
      >
        {matchTitle}
      </div>
      <PkProfileView
        character={character}
        heroData={heroData}
        professionLabel={professionLabel}
        pkSession={pkSession as PkSessionState | null}
        pkLoading={pkLoading}
        pkActing={pkActing}
        pkError={pkError || loadErr}
        now={now}
        serverTimeDrift={serverTimeDrift}
        onUseSkill={handlePkUseSkill}
        onAttack={handlePkAttack}
        onBack={iLost ? handleArenaDefeatToCity : backToArena}
        panelBackLabel={iLost ? backLabelLoss : backLabelWin}
        arenaMode
      />
    </div>
  );
}
