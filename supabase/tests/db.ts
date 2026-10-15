/**
 * Harness test DB: tạo database mới, áp shim + migrations + seed, cung cấp asUser().
 * Cần biến môi trường DATABASE_URL trỏ tới Postgres 15+ (user có quyền CREATE DATABASE).
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { buildSeedSql } from "../../scripts/seed-sql.ts";

const root = fileURLToPath(new URL("..", import.meta.url));

export const ADMIN_URL = process.env.DATABASE_URL;

export async function createTestDb(name: string): Promise<pg.Pool> {
  if (!ADMIN_URL) throw new Error("Thiếu DATABASE_URL");
  const admin = new pg.Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query(`drop database if exists ${name} with (force)`);
  await admin.query(`create database ${name}`);
  await admin.end();

  const url = new URL(ADMIN_URL);
  url.pathname = `/${name}`;
  const pool = new pg.Pool({ connectionString: url.toString(), max: 4 });
  const files = [
    `${root}/tests/supabase_shim.sql`,
    ...readdirSync(`${root}/migrations`).filter((f) => f.endsWith(".sql")).sort().map((f) => `${root}/migrations/${f}`),
  ];
  for (const f of files) await pool.query(readFileSync(f, "utf8"));
  await pool.query(buildSeedSql());
  return pool;
}

export async function dropTestDb(pool: pg.Pool, name: string): Promise<void> {
  await pool.end();
  const admin = new pg.Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query(`drop database if exists ${name} with (force)`);
  await admin.end();
}

export interface Claims {
  sub: string;
  active_assignment_id?: string;
}

/** Chạy fn trong transaction với role `authenticated` + JWT claims giống PostgREST. Luôn rollback. */
export async function asUser<T>(
  pool: pg.Pool,
  claims: Claims | null,
  fn: (q: <R extends pg.QueryResultRow = Record<string, unknown>>(sql: string, params?: unknown[]) => Promise<R[]>) => Promise<T>,
  today = "2026-10-15",
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("set local role authenticated");
    await client.query("select set_config('request.jwt.claims', $1, true), set_config('app.today', $2, true)", [
      claims ? JSON.stringify({ role: "authenticated", ...claims }) : "", today,
    ]);
    return await fn(async (sql, params) => (await client.query(sql, params)).rows);
  } finally {
    await client.query("rollback");
    client.release();
  }
}
