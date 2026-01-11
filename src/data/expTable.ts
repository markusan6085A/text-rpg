// cumulative EXP required to reach each level (index 0 == level 1)
export const EXP_TABLE: number[] = [
  0, // lvl 1
  68, // lvl 2
  431, // lvl 3
  1595, // lvl 4
  4481, // lvl 5
  10639, // lvl 6
  22285, // lvl 7
  41860, // lvl 8
  72325, // lvl 9
  117367, // lvl 10
  181397, // lvl 11
  269957, // lvl 12
  389302, // lvl 13
  546562, // lvl 14
  749912, // lvl 15
  1008762, // lvl 16
  1333972, // lvl 17
  1737082, // lvl 18
  2230557, // lvl 19
  2828037, // lvl 20
  3544597, // lvl 21
  4397312, // lvl 22
  5404932, // lvl 23
  6587932, // lvl 24
  7968632, // lvl 25
  9571282, // lvl 26
  11422182, // lvl 27
  13549782, // lvl 28
  15984782, // lvl 29
  18760782, // lvl 30
  21914782, // lvl 31
  25487782, // lvl 32
  29525782, // lvl 33
  34080782, // lvl 34
  39210782, // lvl 35
  44980782, // lvl 36
  51462782, // lvl 37
  58736782, // lvl 38
  66890782, // lvl 39
  76020782, // lvl 40
  86230782, // lvl 41
  97632782, // lvl 42
  110347782, // lvl 43
  124506782, // lvl 44
  140251782, // lvl 45
  157736782, // lvl 46
  177128782, // lvl 47
  198606782, // lvl 48
  222362782, // lvl 49
  248601782, // lvl 50
  277541782, // lvl 51
  309413782, // lvl 52
  344463782, // lvl 53
  382953782, // lvl 54
  425161782, // lvl 55
  471381782, // lvl 56
  521924782, // lvl 57
  577118782, // lvl 58
  637309782, // lvl 59
  702861782, // lvl 60
  774158782, // lvl 61
  851606782, // lvl 62
  935633782, // lvl 63
  1026690782, // lvl 64
  1125251782, // lvl 65
  1231815782, // lvl 66
  1346906782, // lvl 67
  1471074782, // lvl 68
  1604896782, // lvl 69
  1748976782, // lvl 70
  1904946782, // lvl 71
  2073468782, // lvl 72
  2255236782, // lvl 73
  2451976782, // lvl 74
  2665446782, // lvl 75
  2897446782, // lvl 76
  3150036782, // lvl 77
  3425446782, // lvl 78
  3726116782, // lvl 79
  5000000000, // lvl 80
];

export const MAX_LEVEL = EXP_TABLE.length;

export function getExpToNext(level: number, rate = 1): number {
  if (level >= MAX_LEVEL) return 0;
  const currentTotal = EXP_TABLE[level - 1] ?? 0;
  const nextTotal = EXP_TABLE[level] ?? currentTotal;
  const need = Math.max(0, nextTotal - currentTotal);
  return Math.round(need * rate);
}
