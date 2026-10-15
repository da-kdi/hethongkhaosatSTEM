/**
 * Test RLS trên Postgres thật.
 *  1. ĐỐI CHIẾU: với MỌI assignment demo, tập đơn vị/lớp/người/dữ liệu cá nhân mà Postgres trả về
 *     phải TRÙNG KHỚP với bộ máy TS (src/domain/access.ts). Đảm bảo UI demo = bảo mật thật.
 *  2. Kịch bản bảo mật: giả mạo ngữ cảnh, khóa cấu hình, audit append-only, token hook.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type pg from "pg";
import { asUser, createTestDb, dropTestDb, ADMIN_URL } from "./db.ts";
import { buildAccess } from "../../src/domain/access.ts";
import { A, createDemoDataset, DEMO_TODAY, P, R, U } from "../../src/demo/seed.ts";

const DB = "stem_test_rls";
const ds = createDemoDataset();
let pool: pg.Pool;

describe.skipIf(!ADMIN_URL)("RLS · Postgres", () => {
  beforeAll(async () => {
    pool = await createTestDb(DB);
  });
  afterAll(async () => {
    if (pool) await dropTestDb(pool, DB);
  });

  describe("Đối chiếu TS ↔ SQL cho mọi ngữ cảnh demo", () => {
    for (const asg of ds.assignments) {
      it(`${asg.roleCode} @ ${ds.units.find((u) => u.id === asg.scopeUnitId)?.code} (${asg.id.slice(-3)})`, async () => {
        const access = buildAccess(ds, asg.accountId, asg.id, DEMO_TODAY);
        expect(access).not.toBeNull();
        const sql = await asUser(pool, { sub: asg.accountId, active_assignment_id: asg.id }, async (q) => ({
          units: (await q<{ id: string }>("select id from org.unit")).map((r) => r.id).sort(),
          classes: (await q<{ id: string }>("select id from org.class")).map((r) => r.id).sort(),
          persons: (await q<{ id: string }>("select id from iam.person")).map((r) => r.id).sort(),
          personal: (await q<{ person_id: string }>("select person_id from iam.person_private")).map((r) => r.person_id).sort(),
        }));
        const ts = {
          units: ds.units.filter((u) => access!.canSeeUnit(u.id)).map((u) => u.id).sort(),
          classes: ds.classes.filter((c) => access!.canSeeClass(c.id)).map((c) => c.id).sort(),
          persons: ds.persons.filter((p) => access!.canSeePerson(p.id)).map((p) => p.id).sort(),
          personal: ds.persons.filter((p) => access!.canSeePersonal(p.id)).map((p) => p.id).sort(),
        };
        expect(sql).toEqual(ts);
      });
    }
  });

  describe("Kịch bản bảo mật", () => {
    it("không có JWT / không chọn ngữ cảnh → không thấy gì", async () => {
      const n = await asUser(pool, { sub: A.bmPrincipal }, async (q) => (await q("select id from org.unit")).length);
      expect(n).toBe(0);
    });

    it("giả mạo active_assignment_id của người khác → không thấy gì", async () => {
      const n = await asUser(pool, { sub: A.bmAnh, active_assignment_id: R.bmPrincipal }, async (q) =>
        (await q("select id from iam.person")).length);
      expect(n).toBe(0);
    });

    it("claim sai định dạng không gây lỗi, chỉ trả rỗng", async () => {
      const n = await asUser(pool, { sub: A.bmAnh, active_assignment_id: "x'; drop table iam.person; --" }, async (q) =>
        (await q("select id from iam.person")).length);
      expect(n).toBe(0);
    });

    it("authenticated không ghi trực tiếp được vào bảng", async () => {
      await expect(
        asUser(pool, { sub: A.bmAdmin, active_assignment_id: R.bmAdmin }, (q) =>
          q("insert into org.unit (parent_id, type, code, name) values ($1, 'TO', 'X', 'X')", [U.bm])),
      ).rejects.toThrow(/permission denied/);
    });

    it("switch_context chỉ chấp nhận ngữ cảnh của chính mình", async () => {
      await asUser(pool, { sub: A.tsNgoc, active_assignment_id: R.tsNgocTeacher }, async (q) => {
        const ctxs = await q<{ role_code: string }>("select role_code from iam.my_contexts()");
        expect(ctxs.map((c) => c.role_code).sort()).toEqual(["GUARDIAN", "TEACHER"]);
        await q("select iam.switch_context($1)", [R.tsNgocGuardian]);
      });
      await expect(
        asUser(pool, { sub: A.tsNgoc }, (q) => q("select iam.switch_context($1)", [R.bmPrincipal])),
      ).rejects.toThrow(/Ngữ cảnh không hợp lệ/);
    });

    it("custom access token hook đưa ngữ cảnh đã chọn vào JWT", async () => {
      const client = await pool.connect();
      try {
        await client.query("begin");
        await client.query("update iam.account set current_assignment_id = $1 where id = $2", [R.bmLanHead, A.bmLan]);
        await client.query("set local role supabase_auth_admin");
        const { rows } = await client.query("select iam.custom_access_token_hook($1::jsonb) as e", [
          JSON.stringify({ user_id: A.bmLan, claims: { sub: A.bmLan, role: "authenticated" } }),
        ]);
        expect(rows[0].e.claims.active_assignment_id).toBe(R.bmLanHead);
      } finally {
        await client.query("rollback");
        client.release();
      }
    });

    it("Sở khóa MANDATORY → trường không tắt được module Kế hoạch", async () => {
      await expect(
        asUser(pool, { sub: A.bmAdmin, active_assignment_id: R.bmAdmin }, (q) =>
          q("select cfg.set_setting($1, 'module.plan', '{\"enabled\": false}', 'AUTONOMOUS')", [U.bm])),
      ).rejects.toThrow(/đã bị cấp trên khóa/);
    });

    it("QTV trường bật/tắt module trong phạm vi → có version & audit", async () => {
      await asUser(pool, { sub: A.bmAdmin, active_assignment_id: R.bmAdmin }, async (q) => {
        const [row] = await q<{ version: number }>(
          "select (cfg.set_setting($1, 'module.assess', '{\"enabled\": false}', 'AUTONOMOUS')).version", [U.bm]);
        expect(row.version).toBe(1);
        const [again] = await q<{ version: number }>(
          "select (cfg.set_setting($1, 'module.assess', '{\"enabled\": true}', 'AUTONOMOUS')).version", [U.bm]);
        expect(again.version).toBe(2);
        const logs = await q("select 1 from audit.log where entity = 'cfg.setting' and unit_id = $1 and actor_account = $2", [U.bm, A.bmAdmin]);
        expect(logs.length).toBe(2);
      });
    });

    it("QTV trường không sửa được cấu hình trường khác", async () => {
      await expect(
        asUser(pool, { sub: A.bmAdmin, active_assignment_id: R.bmAdmin }, (q) =>
          q("select cfg.set_setting($1, 'module.assess', '{\"enabled\": false}', 'AUTONOMOUS')", [U.ts])),
      ).rejects.toThrow(/Không có quyền/);
    });

    it("EXTEND: trường không đổi được kiểu dữ liệu danh mục của Sở", async () => {
      await expect(
        asUser(pool, { sub: A.bmAdmin, active_assignment_id: R.bmAdmin }, (q) =>
          q("select cfg.set_setting($1, 'catalog.activity_types', '{\"x\": 1}', 'EXTEND')", [U.bm])),
      ).rejects.toThrow(/cùng kiểu/);
    });

    it("audit.log append-only và không lưu giá trị dữ liệu cá nhân", async () => {
      const client = await pool.connect();
      try {
        await client.query("begin");
        await expect(client.query("delete from audit.log")).rejects.toThrow(/append-only/);
        await client.query("rollback");
        const { rows } = await client.query(
          "select summary from audit.log where entity = 'iam.person_private' limit 1");
        expect(rows[0].summary).toHaveProperty("changed");
        expect(rows[0].summary).not.toHaveProperty("new");
        expect(JSON.stringify(rows[0].summary)).not.toMatch(/09000/);
      } finally {
        client.release();
      }
    });

    it("cấu hình hiệu lực khớp bản TS (EXTEND hợp nhất danh mục)", async () => {
      const [row] = await asUser(pool, { sub: A.bmPrincipal, active_assignment_id: R.bmPrincipal }, (q) =>
        q<{ value: string[]; mode: string }>("select value, mode from cfg.effective($1, 'catalog.activity_types')", [U.bm]));
      expect(row.mode).toBe("EXTEND");
      expect(row.value).toEqual(["Bài học STEM", "Hoạt động trải nghiệm STEM", "Nghiên cứu khoa học kỹ thuật", "CLB Robotics"]);
    });

    it("module Phòng & thiết bị tắt ở Sao Mai, bật ở Bình Minh (cfg.my_modules)", async () => {
      const sm = await asUser(pool, { sub: A.smPrincipal, active_assignment_id: R.smPrincipal }, (q) =>
        q<{ module: string; enabled: boolean }>("select * from cfg.my_modules()"));
      expect(sm.find((m) => m.module === "resource")?.enabled).toBe(false);
      const gv = await asUser(pool, { sub: A.bmAnh, active_assignment_id: R.bmAnh }, (q) =>
        q<{ module: string; enabled: boolean }>("select * from cfg.my_modules()"));
      expect(gv.find((m) => m.module === "resource")?.enabled).toBe(true);
    });

    it("từ điển QĐ 2768: người dùng có ngữ cảnh đọc được, chưa chọn ngữ cảnh thì không", async () => {
      const n = await asUser(pool, { sub: A.bmHuong, active_assignment_id: R.bmHuong }, async (q) =>
        (await q<{ n: string }>("select count(*)::text as n from cfg.data_term"))[0].n);
      expect(n).toBe("892");
      const none = await asUser(pool, { sub: A.bmHuong }, async (q) => (await q("select 1 from cfg.data_term")).length);
      expect(none).toBe(0);
      const mapped = await asUser(pool, { sub: A.bmHuong, active_assignment_id: R.bmHuong }, (q) =>
        q<{ technical_name: string }>(`select t.technical_name from cfg.data_term_mapping m join cfg.data_term t on t.code = m.term_code
           where m.table_name = 'org.class' and m.column_name = 'ma_lop'`));
      expect(mapped.map((r) => r.technical_name)).toEqual(["maLop"]);
    });

    it("ràng buộc định dạng theo chuẩn: số định danh cá nhân 12 số, mã định danh trường ≤ 15 ký tự", async () => {
      const client = await pool.connect();
      try {
        await client.query("begin");
        await expect(client.query("update iam.person_private set so_dinh_danh_ca_nhan = '12345' where person_id = $1", [P.bmPrincipal]))
          .rejects.toThrow(/check constraint/);
        await client.query("rollback");
        await client.query("begin");
        await expect(client.query("update org.unit set ma_dinh_danh = 'AH0001020100000X' where id = $1", [U.bm]))
          .rejects.toThrow(/check constraint/);
      } finally {
        await client.query("rollback");
        client.release();
      }
    });

    it("cfg.my_modules trả đúng 8 phân hệ bật/tắt được; Sở bắt buộc Khảo sát nên trường không tắt được", async () => {
      const mods = await asUser(pool, { sub: A.bmPrincipal, active_assignment_id: R.bmPrincipal }, (q) =>
        q<{ module: string }>("select module from cfg.my_modules()"));
      expect(mods.map((m) => m.module).sort()).toEqual(["assess", "integration", "program", "resource", "schedule", "session", "survey", "training"]);
      await expect(
        asUser(pool, { sub: A.bmAdmin, active_assignment_id: R.bmAdmin }, (q) =>
          q("select cfg.set_setting($1, 'module.survey', '{\"enabled\": false}', 'AUTONOMOUS')", [U.bm])),
      ).rejects.toThrow(/đã bị cấp trên khóa/);
    });

    it("nạp danh mục: QTV Sở bị từ chối; QTV nền tảng nạp được, giá trị cũ ngừng dùng, có nhật ký", async () => {
      const p = { list: "capHoc", version: "CSDL 10/2026", source: "CSDL_NGANH", fileName: "caphoc.csv",
        values: [{ code: "THCS", name: "Trung học cơ sở" }, { code: "02", name: "Tiểu học" }] };
      await expect(asUser(pool, { sub: A.soAdmin, active_assignment_id: R.soAdmin }, (q) =>
        q("select catalog.import_code_list($1)", [JSON.stringify(p)]))).rejects.toThrow(/Chỉ Quản trị nền tảng/);
      await asUser(pool, { sub: A.platformAdmin, active_assignment_id: R.platformAdmin }, async (q) => {
        const [b] = await q<{ b: { inserted: number; updated: number; deprecated: number } }>(
          "select to_jsonb(catalog.import_code_list($1)) as b", [JSON.stringify(p)]);
        expect(b.b).toMatchObject({ inserted: 1, updated: 1, deprecated: 4 });
        const vals = await q<{ code: string; deprecated: boolean }>("select code, deprecated from catalog.code_value where list_code = 'capHoc' order by code");
        expect(vals.filter((v) => !v.deprecated).map((v) => v.code).sort()).toEqual(["02", "THCS"]);
        expect(vals).toHaveLength(6);
        const [l] = await q<{ source: string }>("select source from catalog.code_list where code = 'capHoc'");
        expect(l.source).toBe("CSDL_NGANH");
        expect(await q("select 1 from audit.log where action = 'IMPORT' and entity_id = 'capHoc'")).toHaveLength(1);
        await expect(q("select catalog.import_code_list($1)", [JSON.stringify({ ...p, values: [{ code: "A", name: "x" }, { code: "A", name: "y" }] })]))
          .rejects.toThrow(/trùng/);
      });
    });

    it("danh mục chỉ đọc với người dùng thường; ghi trực tiếp bị chặn", async () => {
      const n = await asUser(pool, { sub: A.bmHuong, active_assignment_id: R.bmHuong }, async (q) =>
        (await q("select 1 from catalog.code_value where list_code = 'gioiTinh'")).length);
      expect(n).toBe(4);
      await expect(asUser(pool, { sub: A.platformAdmin, active_assignment_id: R.platformAdmin }, (q) =>
        q("insert into catalog.code_value (list_code, code, name) values ('danToc', '01', 'Kinh')"))).rejects.toThrow(/permission denied/);
    });

    it("M2b · QTV trường ghi hồ sơ qua RPC; kết quả hiện qua RLS; có nhật ký; trường khác bị chặn", async () => {
      await asUser(pool, { sub: A.bmAdmin, active_assignment_id: R.bmAdmin }, async (q) => {
        const [{ id: dept }] = await q<{ id: string }>("select org.upsert_department($1) as id", [JSON.stringify({ schoolId: U.bm, name: "Tổ Ngữ văn" })]);
        const [{ id: gv }] = await q<{ id: string }>("select org.upsert_teacher($1) as id",
          [JSON.stringify({ unitId: dept, fullName: "Trịnh  Văn Bảo", gender: "NAM", position: "Giáo viên", phone: "0900099999" })]);
        const [{ id: cls }] = await q<{ id: string }>("select org.upsert_class($1) as id",
          [JSON.stringify({ schoolId: U.bm, name: "6A2", grade: 6, departmentId: dept, homeroomPersonId: gv })]);
        await q("select org.set_teaching($1)", [JSON.stringify({ personId: gv, classId: cls, subject: "Ngữ văn" })]);
        const [{ id: hs }] = await q<{ id: string }>("select org.upsert_student($1) as id",
          [JSON.stringify({ classId: cls, fullName: "Lê Minh Khang", gender: "NAM", studentCode: "hs9001" })]);
        expect((await q<{ full_name: string }>("select full_name from iam.person where id = $1", [gv]))[0].full_name).toBe("Trịnh Văn Bảo");
        expect((await q<{ student_code: string }>("select student_code from org.enrollment where student_person_id = $1", [hs]))[0].student_code).toBe("HS9001");
        expect(await q("select 1 from org.class where id = $1", [cls])).toHaveLength(1);
        await q("savepoint dup");
        await expect(q("select org.upsert_student($1)", [JSON.stringify({ classId: cls, fullName: "Ai Đó", studentCode: "HS9001" })])).rejects.toThrow(/đã tồn tại/);
        await q("rollback to savepoint dup");
        await q("select org.set_student_status($1, 'TRANSFERRED')", [hs]);
        // Sau khi chuyển trường, RLS (chỉ xét học sinh đang học) ẩn hồ sơ với trường cũ — tối thiểu dữ liệu (DECISIONS: câu hỏi mở)
        expect(await q("select 1 from org.enrollment where student_person_id = $1", [hs])).toHaveLength(0);
        expect((await q("select 1 from audit.log where entity = 'org.class' and unit_id = $1", [U.bm])).length).toBeGreaterThan(0);
        const pii = await q<{ summary: Record<string, unknown> }>("select summary from audit.log where entity = 'iam.person' and entity_id = $1", [gv]);
        expect(pii[0].summary).not.toHaveProperty("new");
      });
      await expect(asUser(pool, { sub: A.bmAdmin, active_assignment_id: R.bmAdmin }, (q) =>
        q("select org.upsert_class($1)", [JSON.stringify({ schoolId: U.ts, name: "10A9", grade: 10 })]))).rejects.toThrow(/Không có quyền/);
      await expect(asUser(pool, { sub: A.bmPrincipal, active_assignment_id: R.bmPrincipal }, (q) =>
        q("select org.upsert_department($1)", [JSON.stringify({ schoolId: U.bm, name: "Tổ X" })]))).rejects.toThrow(/Không có quyền/);
      await expect(asUser(pool, { sub: A.bmAdmin, active_assignment_id: R.bmAdmin }, (q) =>
        q("select org.upsert_teacher($1)", [JSON.stringify({ personId: P.tsNgoc, unitId: U.bm, fullName: "Đinh Thị Ngọc" })]))).rejects.toThrow(/trường của bạn/);
      await expect(asUser(pool, { sub: A.bmAdmin, active_assignment_id: R.bmAdmin }, (q) =>
        q("select org.upsert_department($1)", [JSON.stringify({ id: U.bmKhtn, name: "Tổ KHTN", status: "INACTIVE" })]))).rejects.toThrow(/còn quản lý lớp/);
    });

    it("grant NCC hết hạn: trước hạn thấy lớp, sau hạn không thấy", async () => {
      const before = await asUser(pool, { sub: A.kdiAdmin, active_assignment_id: R.kdiAdmin },
        async (q) => (await q("select id from org.class")).length, "2026-06-01");
      const after = await asUser(pool, { sub: A.kdiAdmin, active_assignment_id: R.kdiAdmin },
        async (q) => (await q("select id from org.class")).length);
      expect(before).toBe(2);
      expect(after).toBe(0);
    });
  });
});
