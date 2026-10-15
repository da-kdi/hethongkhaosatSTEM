/**
 * Dựng database local "stem_local" trên Postgres thuần (không cần Supabase CLI/Docker):
 *   shim auth → migrations → seed demo.
 * Chạy: DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres npm run db:reset:local
 * Dùng để xem dữ liệu bằng psql/DBeaver và chạy thử RLS. Với Supabase thật dùng `supabase db reset`.
 */
import { createTestDb } from "../supabase/tests/db.ts";

const name = process.env.LOCAL_DB_NAME ?? "stem_local";
const pool = await createTestDb(name);
const { rows } = await pool.query<{ n: string }>("select count(*)::text as n from org.unit");
console.log(`Đã dựng database "${name}" (${rows[0].n} đơn vị). Kết nối: ${process.env.DATABASE_URL?.replace(/\/[^/]*$/, `/${name}`)}`);
await pool.end();
