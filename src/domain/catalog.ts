/**
 * DANH MỤC DÙNG CHUNG (phân hệ 0.5) — ADR-013.
 * Nguồn chính thức: CSDL ngành của Bộ GD&ĐT. Khi chưa có file, danh mục ở trạng thái NOI_BO_TAM.
 *
 * File này là nguồn của seed (catalog.*) và là bản phản chiếu TS của RPC catalog.import_code_list()
 * (supabase/migrations/20261016000700_catalog.sql) — dùng cho chế độ demo; test đối chiếu quy tắc.
 */

export type CatalogSource = "CSDL_NGANH" | "ISO_5218" | "NOI_BO_TAM";

export interface CodeList {
  code: string; // = tên kỹ thuật thuật ngữ QĐ 2768
  name: string;
  termCode: string; // BG_…
  source: CatalogSource;
  version?: string;
  syncedAt?: string;
  note?: string;
}

export interface CodeValue {
  listCode: string;
  code: string;
  name: string;
  sort: number;
  validFrom?: string;
  validTo?: string;
  deprecated: boolean;
}

export interface ValueMap {
  table: string;
  column: string;
  internalValue: string;
  listCode: string;
  code: string;
}

export interface ImportBatch {
  id: number;
  listCode: string;
  version: string;
  source: CatalogSource;
  fileName?: string;
  inserted: number;
  updated: number;
  deprecated: number;
  importedBy?: string;
  importedAt: string;
}

export interface CatalogState {
  lists: CodeList[];
  values: CodeValue[];
  maps: ValueMap[];
  batches: ImportBatch[];
}

export const SOURCE_LABEL: Record<CatalogSource, string> = {
  CSDL_NGANH: "CSDL ngành (chính thức)",
  ISO_5218: "ISO/IEC 5218 (chuẩn quốc tế)",
  NOI_BO_TAM: "Nội bộ tạm — chờ nạp từ CSDL ngành",
};

const v = (listCode: string, rows: [string, string][]): CodeValue[] =>
  rows.map(([code, name], i) => ({ listCode, code, name, sort: i, deprecated: false }));

/** Trạng thái khởi tạo — KHÔNG tự đặt mã chính thức; danh mục chưa có nguồn để trống. */
export function initialCatalog(): CatalogState {
  const lists: CodeList[] = [
    { code: "gioiTinh", name: "Giới tính", termCode: "BG_00010", source: "ISO_5218", version: "ISO/IEC 5218", note: "QĐ 2768 viện dẫn chuẩn ISO/IEC 5218" },
    { code: "capHoc", name: "Cấp học", termCode: "BG_00422", source: "NOI_BO_TAM" },
    { code: "loaiHinhCsgd", name: "Loại hình cơ sở giáo dục", termCode: "BG_00429", source: "NOI_BO_TAM" },
    { code: "khoi", name: "Khối", termCode: "BG_00506", source: "NOI_BO_TAM" },
    { code: "trangThaiNh", name: "Trạng thái người học", termCode: "BG_00090", source: "NOI_BO_TAM" },
    { code: "monHoc", name: "Môn học", termCode: "BG_00818", source: "NOI_BO_TAM", note: "Chưa có giá trị — nạp từ CSDL ngành" },
    { code: "danToc", name: "Dân tộc", termCode: "BG_00027", source: "NOI_BO_TAM", note: "Chưa có giá trị — nạp từ CSDL ngành (CDE-CN-004)" },
    { code: "chucVuTaiCoQuanCongTac", name: "Chức vụ", termCode: "BG_00326", source: "NOI_BO_TAM", note: "Chưa có giá trị — nạp từ CSDL ngành" },
  ];
  const values: CodeValue[] = [
    ...v("gioiTinh", [["0", "Không xác định"], ["1", "Nam"], ["2", "Nữ"], ["9", "Không áp dụng"]]),
    ...v("capHoc", [["MN", "Mầm non"], ["TH", "Tiểu học"], ["THCS", "Trung học cơ sở"], ["THPT", "Trung học phổ thông"], ["LIEN_CAP", "Liên cấp"]]),
    ...v("loaiHinhCsgd", [["CONG_LAP", "Công lập"], ["DAN_LAP", "Dân lập"], ["TU_THUC", "Tư thục"]]),
    ...v("khoi", Array.from({ length: 12 }, (_, i): [string, string] => [String(i + 1), `Khối ${i + 1}`])),
    ...v("trangThaiNh", [["STUDYING", "Đang học"], ["TRANSFERRED", "Chuyển trường"], ["GRADUATED", "Đã tốt nghiệp"]]),
  ];
  const map = (table: string, column: string, listCode: string, pairs: [string, string][]): ValueMap[] =>
    pairs.map(([internalValue, code]) => ({ table, column, internalValue, listCode, code }));
  const maps: ValueMap[] = [
    ...map("iam.person", "gender", "gioiTinh", [["NAM", "1"], ["NU", "2"]]),
    ...map("org.unit", "school_level", "capHoc", [["MN", "MN"], ["TH", "TH"], ["THCS", "THCS"], ["THPT", "THPT"], ["LIEN_CAP", "LIEN_CAP"]]),
    ...map("org.unit", "loai_hinh_csgd", "loaiHinhCsgd", [["Công lập", "CONG_LAP"], ["Dân lập", "DAN_LAP"], ["Tư thục", "TU_THUC"]]),
    ...map("org.class", "grade", "khoi", Array.from({ length: 12 }, (_, i): [string, string] => [String(i + 1), String(i + 1)])),
    ...map("org.enrollment", "status", "trangThaiNh", [["STUDYING", "STUDYING"], ["TRANSFERRED", "TRANSFERRED"], ["GRADUATED", "GRADUATED"]]),
  ];
  return { lists, values, maps, batches: [] };
}

// ---------------------------------------------------------------------------
// Đọc file CSV danh mục (UTF-8, dấu phân cách "," hoặc ";", có/không dòng tiêu đề)
// Cột: mã, tên, [hiệu lực từ], [hiệu lực đến]. Excel: "Lưu thành CSV UTF-8".
// ---------------------------------------------------------------------------
export interface ParsedRow { line: number; code: string; name: string; validFrom?: string; validTo?: string }
export interface ParseResult { rows: ParsedRow[]; errors: string[] }

function splitCsvLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c;
    } else if (c === '"') q = true;
    else if (c === sep) { out.push(cur); cur = ""; } else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

const HEADER = /^(ma|mã|code|ma_?gia_?tri|mã giá trị)$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseCodeCsv(text: string): ParseResult {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);
  const first = lines.find((l) => l.trim()) ?? "";
  const sep = (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: ParsedRow[] = [];
  const errors: string[] = [];
  const seen = new Map<string, number>();
  lines.forEach((raw, i) => {
    if (!raw.trim()) return;
    const [code = "", name = "", from = "", to = ""] = splitCsvLine(raw, sep);
    if (rows.length === 0 && errors.length === 0 && HEADER.test(code)) return; // dòng tiêu đề
    const line = i + 1;
    if (!code || !name) return void errors.push(`Dòng ${line}: thiếu mã hoặc tên`);
    if (code.length > 50) return void errors.push(`Dòng ${line}: mã dài quá 50 ký tự`);
    if (name.length > 255) return void errors.push(`Dòng ${line}: tên dài quá 255 ký tự`);
    if (from && !DATE.test(from)) return void errors.push(`Dòng ${line}: ngày hiệu lực "${from}" phải dạng YYYY-MM-DD`);
    if (to && !DATE.test(to)) return void errors.push(`Dòng ${line}: ngày hết hiệu lực "${to}" phải dạng YYYY-MM-DD`);
    if (seen.has(code)) return void errors.push(`Dòng ${line}: mã "${code}" trùng với dòng ${seen.get(code)}`);
    seen.set(code, line);
    rows.push({ line, code, name, validFrom: from || undefined, validTo: to || undefined });
  });
  if (rows.length === 0 && errors.length === 0) errors.push("File không có dòng dữ liệu");
  return { rows, errors };
}

// ---------------------------------------------------------------------------
// Quy tắc nạp — mirror catalog.import_code_list()
// ---------------------------------------------------------------------------
export interface ImportInput {
  list: string;
  version: string;
  source: "CSDL_NGANH" | "ISO_5218";
  fileName?: string;
  values: { code: string; name: string; validFrom?: string; validTo?: string }[];
}

export function applyImport(state: CatalogState, input: ImportInput, actor: string | undefined, now: string): CatalogState {
  const list = state.lists.find((l) => l.code === input.list);
  if (!list) throw new Error(`Danh mục "${input.list}" không tồn tại`);
  if (!input.version.trim()) throw new Error("Thiếu phiên bản danh mục");
  if (input.values.length === 0) throw new Error("Danh sách giá trị rỗng");
  if (input.values.some((x) => !x.code.trim() || !x.name.trim())) throw new Error("Có dòng thiếu mã hoặc tên");
  if (new Set(input.values.map((x) => x.code.trim())).size !== input.values.length) throw new Error("Có mã bị trùng trong file");

  const incoming = new Map(input.values.map((x, i) => [x.code.trim(), { ...x, sort: i }]));
  let inserted = 0;
  let updated = 0;
  let deprecated = 0;
  const others = state.values.filter((x) => x.listCode !== input.list);
  const existing = state.values.filter((x) => x.listCode === input.list);
  const next: CodeValue[] = existing.map((x) => {
    const n = incoming.get(x.code);
    if (n) {
      updated++;
      return { ...x, name: n.name.trim(), sort: n.sort, validFrom: n.validFrom, validTo: n.validTo, deprecated: false };
    }
    if (!x.deprecated) deprecated++;
    return { ...x, deprecated: true };
  });
  for (const [code, n] of incoming) {
    if (existing.some((x) => x.code === code)) continue;
    inserted++;
    next.push({ listCode: input.list, code, name: n.name.trim(), sort: n.sort, validFrom: n.validFrom, validTo: n.validTo, deprecated: false });
  }
  const batch: ImportBatch = {
    id: (state.batches[0]?.id ?? 0) + 1, listCode: input.list, version: input.version.trim(), source: input.source,
    fileName: input.fileName, inserted, updated, deprecated, importedBy: actor, importedAt: now,
  };
  return {
    lists: state.lists.map((l) => (l.code === input.list ? { ...l, source: input.source, version: batch.version, syncedAt: now, note: undefined } : l)),
    values: [...others, ...next.sort((a, b) => Number(a.deprecated) - Number(b.deprecated) || a.sort - b.sort)],
    maps: state.maps,
    batches: [batch, ...state.batches],
  };
}

/** Quy đổi giá trị nội bộ của một cột → mã chuẩn (undefined nếu chưa có hoặc mã đã ngừng dùng). */
export function toStandard(state: CatalogState, table: string, column: string, internal: string): string | undefined {
  const m = state.maps.find((x) => x.table === table && x.column === column && x.internalValue === internal);
  if (!m) return undefined;
  const val = state.values.find((x) => x.listCode === m.listCode && x.code === m.code);
  return val && !val.deprecated ? val.code : undefined;
}
