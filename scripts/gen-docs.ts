import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buildPermissionMatrixMd } from "./permission-matrix-md.ts";

const out = fileURLToPath(new URL("../docs/PERMISSION_MATRIX.md", import.meta.url));
writeFileSync(out, buildPermissionMatrixMd());
console.log(`Đã ghi ${out}`);
