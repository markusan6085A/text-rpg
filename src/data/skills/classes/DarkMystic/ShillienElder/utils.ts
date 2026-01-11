export const heroRequiredLevel = (level: number): number => {
  // Shillien Elder - 2nd profession, starts at level 40
  if (level <= 6) {
    return 40;
  }
  if (level <= 9) {
    return 44;
  }
  if (level <= 12) {
    return 48;
  }
  if (level <= 15) {
    return 52;
  }
  if (level <= 18) {
    return 56;
  }
  if (level <= 21) {
    return 60;
  }
  if (level <= 24) {
    return 64;
  }
  if (level <= 27) {
    return 68;
  }
  return 72;
};


