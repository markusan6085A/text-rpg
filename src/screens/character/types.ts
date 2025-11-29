// Базовий тип предмета
export interface Item {
  id: number;
  name: string;
  type: string; // наприклад: "armor", "weapon", "resource"
}
