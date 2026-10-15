import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildPermissionMatrixMd } from "../../scripts/permission-matrix-md.ts";

describe("docs/PERMISSION_MATRIX.md", () => {
  it("đồng bộ với roles.ts/permissions.ts (chạy `npm run gen:docs` nếu lệch)", () => {
    const onDisk = readFileSync(new URL("../../docs/PERMISSION_MATRIX.md", import.meta.url), "utf8");
    expect(onDisk).toBe(buildPermissionMatrixMd());
  });
});
