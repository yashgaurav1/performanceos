import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    preserveSymlinks: true,
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./src/empty.ts", import.meta.url)),
    },
  },
  test: { globals: true, environment: "node", include: ["src/**/*.test.ts"] },
});
