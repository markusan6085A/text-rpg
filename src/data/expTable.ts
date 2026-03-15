// cumulative EXP required to reach each level (index 0 == level 1)
// 🔥 Зменшено вдвічі (2x легше) — менше опыта на лвл
export const EXP_TABLE: number[] = [
  0, // lvl 1
  34, // lvl 2
  215, // lvl 3
  797, // lvl 4
  2240, // lvl 5
  5319, // lvl 6
  11142, // lvl 7
  20930, // lvl 8
  36162, // lvl 9
  58683, // lvl 10
  90698, // lvl 11
  134978, // lvl 12
  194651, // lvl 13
  273281, // lvl 14
  374956, // lvl 15
  504381, // lvl 16
  666986, // lvl 17
  868541, // lvl 18
  1115278, // lvl 19
  1414018, // lvl 20
  1772298, // lvl 21
  2198656, // lvl 22
  2702466, // lvl 23
  3293966, // lvl 24
  3984316, // lvl 25
  4785641, // lvl 26
  5711091, // lvl 27
  6774891, // lvl 28
  7992391, // lvl 29
  9380391, // lvl 30
  10957391, // lvl 31
  12743891, // lvl 32
  14762891, // lvl 33
  17040391, // lvl 34
  19605391, // lvl 35
  22490391, // lvl 36
  25731391, // lvl 37
  29368391, // lvl 38
  33445391, // lvl 39
  38010391, // lvl 40
  43115391, // lvl 41
  48816391, // lvl 42
  55173891, // lvl 43
  62253891, // lvl 44
  70125891, // lvl 45
  78868391, // lvl 46
  88564391, // lvl 47
  99303391, // lvl 48
  111181391, // lvl 49
  124300891, // lvl 50
  138770891, // lvl 51
  154706891, // lvl 52
  172231891, // lvl 53
  191476891, // lvl 54
  212580891, // lvl 55
  235690891, // lvl 56
  260962391, // lvl 57
  288559391, // lvl 58
  318654891, // lvl 59
  351430891, // lvl 60
  387079391, // lvl 61
  425804891, // lvl 62
  467824891, // lvl 63
  513369891, // lvl 64
  562681891, // lvl 65
  616015891, // lvl 66
  673649891, // lvl 67
  735883891, // lvl 68
  803042891, // lvl 69
  875473891, // lvl 70
  953546891, // lvl 71
  1037645891, // lvl 72
  1127755891, // lvl 73
  1218907891, // lvl 74
  1322723391, // lvl 75
  1430443391, // lvl 76
  1562393391, // lvl 77
  1702723391, // lvl 78
  1863058391, // lvl 79
  2500000000, // lvl 80
];

export const MAX_LEVEL = EXP_TABLE.length;

export function getExpToNext(level: number, rate = 1): number {
  if (level >= MAX_LEVEL) return 0;
  const currentTotal = EXP_TABLE[level - 1] ?? 0;
  const nextTotal = EXP_TABLE[level] ?? currentTotal;
  const need = Math.max(0, nextTotal - currentTotal);
  return Math.round(need * rate);
}
