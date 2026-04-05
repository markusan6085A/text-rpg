/** Синхронізація heroJson.hp/mp/cp з відсотками — один формат для клієнта після snapshot. */

export function clampPveResource(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

export function syncHeroJsonResourcePercentsToAbsolutes(hj: any) {
  const mh = Math.max(1, Math.floor(Number(hj.maxHp ?? 1)));
  const mm = Math.max(1, Math.floor(Number(hj.maxMp ?? 1)));
  const mc = Math.max(1, Math.floor(Number(hj.maxCp ?? 1)));
  const ch = clampPveResource(Math.floor(Number(hj.hp ?? 0)), 0, mh);
  const cm = clampPveResource(Math.floor(Number(hj.mp ?? 0)), 0, mm);
  const cc = clampPveResource(Math.floor(Number(hj.cp ?? 0)), 0, mc);
  hj.hp = ch;
  hj.mp = cm;
  hj.cp = cc;
  hj.hpPercent = mh > 0 ? ch / mh : 0;
  hj.mpPercent = mm > 0 ? cm / mm : 0;
  hj.cpPercent = mc > 0 ? cc / mc : 0;
}
