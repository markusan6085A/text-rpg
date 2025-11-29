// Форматує назву предмета, щоб довгі назви не ламали інтерфейс
export const formatItemName = (name: string): string => {
  return name.length > 12 ? name.slice(0, 12) + "…" : name;
};
