/**
 * Unit tests for numberInput — used in clan adena, fishing, etc.
 */
import { describe, it, expect } from "vitest";
import { handleNumberInput } from "./numberInput";

describe("handleNumberInput", () => {
  it("empty newValue → ''", () => {
    expect(handleNumberInput("123", "")).toBe("");
  });

  it("normal input unchanged", () => {
    expect(handleNumberInput("", "5")).toBe("5");
    expect(handleNumberInput("5", "50")).toBe("50");
  });

  it("strips leading zeros", () => {
    expect(handleNumberInput("0", "05")).toBe("5");
    expect(handleNumberInput("0", "007")).toBe("7");
    expect(handleNumberInput("0", "00")).toBe("0");
  });

  it("value '0' replaced by new number", () => {
    expect(handleNumberInput("0", "123")).toBe("123");
  });
});
