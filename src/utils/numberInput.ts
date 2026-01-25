/**
 * Обробка числових полів вводу - видаляє початковий "0" при введенні числа
 * @param value - поточне значення поля
 * @param newValue - нове значення з onChange
 * @returns оброблене значення
 */
export function handleNumberInput(value: string, newValue: string): string {
  // Якщо поле порожнє, повертаємо нове значення
  if (newValue === "") {
    return "";
  }
  
  // Якщо поле було "0" і вводиться нове число
  if (value === "0" && newValue.length > 1) {
    // Якщо нове значення починається з "0", видаляємо початковий "0"
    if (newValue.startsWith("0")) {
      return newValue.replace(/^0+/, "") || "0";
    }
    // Якщо вводиться число без "0" на початку, замінюємо "0" на нове число
    return newValue;
  }
  
  // Якщо нове значення починається з "0" і має більше одного символу
  if (newValue.startsWith("0") && newValue.length > 1) {
    // Видаляємо початковий "0"
    return newValue.replace(/^0+/, "") || "0";
  }
  
  return newValue;
}

/**
 * Обробка onChange для числових полів
 */
export function handleNumberInputChange(
  currentValue: string,
  newValue: string,
  setValue: (value: string) => void
) {
  const processed = handleNumberInput(currentValue, newValue);
  setValue(processed);
}
