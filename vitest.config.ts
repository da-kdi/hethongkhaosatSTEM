import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "./src") } },
  test: {
    projects: [
      {
        extends: true,
        test: { name: "unit", include: ["src/**/*.test.{ts,tsx}"], environment: "node" },
      },
      {
        extends: true,
        test: {
          name: "db",
          include: ["supabase/tests/**/*.test.ts"],
          environment: "node",
          // Cần Postgres: DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres
          testTimeout: 60_000,
          hookTimeout: 120_000,
          fileParallelism: false,
        },
      },
    ],
  },
});
