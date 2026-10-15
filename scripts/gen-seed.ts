/**
 * Sinh supabase/seed.sql từ NGUỒN CHÂN LÝ TypeScript:
 *   - src/domain/permissions.ts, src/domain/roles.ts  → iam.permission, iam.role, iam.role_permission
 *   - src/demo/seed.ts                                 → dữ liệu demo xuyên suốt
 *
 * Chạy: npm run gen:seed   (test sẽ báo lỗi nếu seed.sql lệch so với nguồn)
 * ⚠️ seed.sql chứa mật khẩu demo — CHỈ dùng cho môi trường local/dev.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buildSeedSql } from "./seed-sql.ts";

const out = fileURLToPath(new URL("../supabase/seed.sql", import.meta.url));
writeFileSync(out, buildSeedSql());
console.log(`Đã ghi ${out}`);
