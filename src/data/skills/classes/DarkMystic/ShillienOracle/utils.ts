export const heroRequiredLevel = (level: number): number => {
  if (level <= 6) {
    return 20;
  }
  if (level <= 9) {
    return 25;
  }
  if (level <= 12) {
    return 30;
  }
  return 35;
};

