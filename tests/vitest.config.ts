import { defineConfig } from "vitest/config";

process.env.GEMINI_API_KEY = "mock-api-key";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    globals: false,
  },
});
