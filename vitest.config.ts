import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.spec.ts", "server/**/*.test.ts", "server/**/*.spec.ts"],
    globals: false,
  },
});
