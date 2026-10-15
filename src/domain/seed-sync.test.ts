import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildSeedSql } from "../../scripts/seed-sql.ts";

describe("supabase/seed.sql", () => {
  it("đồng bộ với nguồn TypeScript (chạy `npm run gen:seed` nếu lệch)", () => {
    const onDisk = readFileSync(new URL("../../supabase/seed.sql", import.meta.url), "utf8");
    expect(onDisk).toBe(buildSeedSql());
  });
});
