// cumulative EXP required to reach each level (index 0 == level 1)
// 🔥 Зменшено у 4 рази (4x легше) від оригіналу — менше опыта на лвл
export const EXP_TABLE: number[] = [
  0, // lvl 1
  17, // lvl 2
  108, // lvl 3
  399, // lvl 4
  1120, // lvl 5
  2660, // lvl 6
  5571, // lvl 7
  10465, // lvl 8
  18081, // lvl 9
  29342, // lvl 10
  45349, // lvl 11
  67489, // lvl 12
  97326, // lvl 13
  136641, // lvl 14
  187478, // lvl 15
  252191, // lvl 16
  333493, // lvl 17
  434271, // lvl 18
  557639, // lvl 19
  707009, // lvl 20
  886149, // lvl 21
  1099328, // lvl 22
  1351233, // lvl 23
  1646983, // lvl 24
  1992158, // lvl 25
  2392821, // lvl 26
  2855546, // lvl 27
  3387446, // lvl 28
  3996196, // lvl 29
  4690196, // lvl 30
  5478696, // lvl 31
  6371946, // lvl 32
  7381446, // lvl 33
  8520196, // lvl 34
  9802696, // lvl 35
  11245196, // lvl 36
  12865696, // lvl 37
  14684196, // lvl 38
  16722696, // lvl 39
  19005196, // lvl 40
  21557696, // lvl 41
  24408196, // lvl 42
  27586946, // lvl 43
  31126946, // lvl 44
  35062946, // lvl 45
  39434196, // lvl 46
  44282196, // lvl 47
  49651696, // lvl 48
  55590696, // lvl 49
  62150446, // lvl 50
  69385446, // lvl 51
  77353446, // lvl 52
  86115946, // lvl 53
  95738446, // lvl 54
  106290446, // lvl 55
  117845446, // lvl 56
  130481196, // lvl 57
  144279696, // lvl 58
  159327446, // lvl 59
  175715446, // lvl 60
  193539696, // lvl 61
  212902446, // lvl 62
  233912446, // lvl 63
  256684946, // lvl 64
  281340946, // lvl 65
  308007946, // lvl 66
  336824946, // lvl 67
  367941946, // lvl 68
  401521446, // lvl 69
  437736946, // lvl 70
  476773446, // lvl 71
  518822946, // lvl 72
  563877946, // lvl 73
  609453946, // lvl 74
  661361696, // lvl 75
  715221696, // lvl 76
  781196696, // lvl 77
  851361696, // lvl 78
  931529196, // lvl 79
  1250000000, // lvl 80
];

export const MAX_LEVEL = EXP_TABLE.length;

export function getExpToNext(level: number, rate = 1): number {
  if (level >= MAX_LEVEL) return 0;
  const currentTotal = EXP_TABLE[level - 1] ?? 0;
  const nextTotal = EXP_TABLE[level] ?? currentTotal;
  const need = Math.max(0, nextTotal - currentTotal);
  return Math.round(need * rate);
}
