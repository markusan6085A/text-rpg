/**
 * Одноразово: тягне з l2elo HTML для списку item id (біжутерія магазину),
 * парсить M.Def та MP → виводить JSON для src/data/shop/jewelryStatsByItemId.ts
 *
 * Запуск: node tools/fetch-l2elo-jewelry-stats.mjs
 */
const IDS = process.argv[2] === "--quick" ? [889, 879, 847, 910] : [
  879, 880, 881, 882, 890, 847, 848, 849, 850, 851, 910, 911, 912, 913, 914,
  883, 884, 885, 886, 888, 852, 853, 854, 855, 857, 915, 916, 917, 919, 918,
  887, 891, 892, 894, 895, 896, 897, 898, 900, 901, 904, 905,
  856, 859, 860, 861, 863, 864, 865, 866, 867, 869, 870, 873, 874,
  921, 922, 923, 925, 926, 927, 928, 929, 931, 932, 935, 936,
  893, 899, 902, 903, 862, 868, 871, 872, 924, 930, 933, 934,
  889, 858, 920,
  119,
];

const unique = [...new Set(IDS)];

async function fetchOne(id) {
  const url = `https://l2elo.com/en/database/items/${id}`;
  const res = await fetch(url, { headers: { "User-Agent": "text-rpg-dev/1.0" } });
  if (!res.ok) throw new Error(`${id} ${res.status}`);
  const html = await res.text();
  const mDefBlock = html.match(/M\.Def[\s\S]{0,200}?font-bold[^>]*>(\d+)/i);
  const mpBlock = html.match(/MP<!--[\s\S]{0,120}?font-bold[^>]*>\+?(\d+)/i) || html.match(/>MP<[\s\S]{0,200}?font-bold[^>]*>\+?(\d+)/i);
  let mDef = mDefBlock ? parseInt(mDefBlock[1], 10) : null;
  let maxMp = mpBlock ? parseInt(mpBlock[1], 10) : 0;
  if (mDef == null) {
    const t = html.match(/"m def"[^|]*\|\s*(\d+)/i);
    if (t) mDef = parseInt(t[1], 10);
  }
  if (!maxMp) {
    const t = html.match(/"mp"[^|]*\|\s*(\d+)/i);
    if (t) maxMp = parseInt(t[1], 10);
  }
  return { id, mDef: mDef ?? 0, maxMp: maxMp || undefined };
}

async function main() {
  const out = {};
  for (const id of unique.sort((a, b) => a - b)) {
    try {
      const r = await fetchOne(id);
      out[id] = { mDef: r.mDef };
      if (r.maxMp) out[id].maxMp = r.maxMp;
      console.error(`ok ${id} mDef=${r.mDef} mp=${r.maxMp ?? 0}`);
    } catch (e) {
      console.error(`fail ${id}`, e.message);
      out[id] = { mDef: 0 };
    }
    await new Promise((r) => setTimeout(r, 350));
  }
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
