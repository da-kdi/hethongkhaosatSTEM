/**
 * Ánh xạ cột dữ liệu của hệ thống ↔ thuật ngữ chuẩn QĐ 2768/QĐ-BGDĐT (Từ điển dữ liệu dùng chung ngành GDĐT).
 *
 * Quy ước:
 *  - Bảng/cột nội bộ dùng snake_case tiếng Việt không dấu hoặc tiếng Anh ngắn (ổn định cho code).
 *  - Khi trao đổi dữ liệu (import/export Excel, API tích hợp, báo cáo gửi Sở/Bộ) dùng TÊN KỸ THUẬT của thuật ngữ
 *    (ví dụ `tenCsgd`, `capHoc`, `maLop`, `hoTenNh`) — xem docs/DATA_MODEL.md §Từ điển.
 *  - status:
 *      EXACT    — cùng nghĩa, cùng kiểu
 *      PARTIAL  — cùng nghĩa nhưng giá trị/kiểu cần quy đổi (vd. enum nội bộ, quy đổi theo danh mục CSDL ngành của Bộ — ADR-013, M2)
 *  - Một cột có thể ứng với nhiều thuật ngữ theo đối tượng (người học vs. cán bộ/nhà giáo).
 *
 * Nguồn này sinh bảng cfg.data_term_mapping và COMMENT cột trong seed; test kiểm mọi mã BG tồn tại.
 */

export interface FieldMapping {
  table: string;
  column: string;
  terms: string[];
  status: "EXACT" | "PARTIAL";
  note?: string;
  /** Quy đổi giá trị nội bộ → giá trị chuẩn khi trao đổi dữ liệu (chỉ khi văn bản chỉ rõ chuẩn mã) */
  valueMap?: Readonly<Record<string, string>>;
}

/** BG_00010 gioiTinh: mã 1 chữ số theo ISO/IEC 5218 (0 không rõ, 1 nam, 2 nữ, 9 không áp dụng). */
export const GENDER_ISO_5218 = { NAM: "1", NU: "2" } as const;

export const FIELD_MAPPINGS: readonly FieldMapping[] = [
  // ---- Cơ sở giáo dục / đơn vị (MOET29, MOET30) ----
  { table: "org.unit", column: "ma_dinh_danh", terms: ["BG_00419", "BG_00420"], status: "EXACT", note: "Trường: truongId (≤15 ký tự); cơ quan/tổ chức khác: maDinhDanhToChuc (≤35)" },
  { table: "org.unit", column: "name", terms: ["BG_00421"], status: "EXACT", note: "Tên cơ sở giáo dục (tenCsgd, ≤200)" },
  { table: "org.unit", column: "school_level", terms: ["BG_00422"], status: "PARTIAL", note: "Giá trị nội bộ MN/TH/THCS/THPT/LIEN_CAP — quy đổi theo danh mục cấp học của CSDL ngành (M2)" },
  { table: "org.unit", column: "loai_hinh_csgd", terms: ["BG_00429"], status: "PARTIAL", note: "Giá trị theo danh mục loại hình của CSDL ngành (M2)" },
  { table: "org.unit", column: "tinh_thanh", terms: ["BG_00426"], status: "PARTIAL", note: "Chuẩn yêu cầu mã danh mục hành chính CDE-DC-001" },
  { table: "org.unit", column: "ward", terms: ["BG_00427"], status: "PARTIAL", note: "Đang lưu tên xã/phường; chuẩn yêu cầu mã CDE-DC-003" },
  // ---- Năm học, lớp, phân công (MOET31, MOET39) ----
  { table: "org.academic_year", column: "code", terms: ["BG_00821"], status: "EXACT", note: "tenNamHoc, dạng 2026-2027" },
  { table: "org.class", column: "ma_lop", terms: ["BG_00504"], status: "EXACT" },
  { table: "org.class", column: "name", terms: ["BG_00505"], status: "EXACT" },
  { table: "org.class", column: "grade", terms: ["BG_00506"], status: "PARTIAL", note: "Lưu số khối 0–12; chuẩn là danh mục khối của CSDL ngành" },
  { table: "org.class", column: "homeroom_person_id", terms: ["BG_00311"], status: "PARTIAL", note: "Chuẩn lưu tên GVCN; hệ thống lưu khóa tới người" },
  { table: "org.teaching_assignment", column: "subject", terms: ["BG_00297", "BG_00818"], status: "PARTIAL", note: "Đang lưu tên môn; chuẩn là mã môn dạy / danh mục môn học của CSDL ngành" },
  // ---- Người học (MOET07, MOET10) ----
  { table: "iam.person", column: "full_name", terms: ["BG_00007", "BG_00238"], status: "EXACT", note: "hoTenNh (người học) / hoVaTenDoiNgu (cán bộ/nhà giáo)" },
  { table: "iam.person", column: "gender", terms: ["BG_00010"], status: "PARTIAL", note: "gioiTinh String(1), CDE-CN-002, mã ISO/IEC 5218: NAM→1, NU→2", valueMap: GENDER_ISO_5218 },
  { table: "iam.person_private", column: "birth_date", terms: ["BG_00009", "BG_00239"], status: "EXACT" },
  { table: "iam.person_private", column: "phone", terms: ["BG_00043", "BG_00243"], status: "EXACT" },
  { table: "iam.person_private", column: "so_dinh_danh_ca_nhan", terms: ["BG_00011"], status: "EXACT", note: "12 số, CDE-CN-001 — dữ liệu nhạy cảm" },
  { table: "iam.person_private", column: "dan_toc", terms: ["BG_00027"], status: "EXACT", note: "Mã dân tộc 2 ký tự, CDE-CN-004" },
  { table: "iam.person_private", column: "quoc_tich", terms: ["BG_00026"], status: "EXACT", note: "Mã quốc tịch 2 ký tự, CDE-CN-003" },
  { table: "org.enrollment", column: "status", terms: ["BG_00090"], status: "PARTIAL", note: "Nội bộ STUDYING/TRANSFERRED/GRADUATED; chuẩn là danh mục trạng thái người học của CSDL ngành" },
  // ---- Cán bộ/nhà giáo (MOET18, MOET21) ----
  { table: "org.staff_membership", column: "position", terms: ["BG_00326"], status: "PARTIAL", note: "Chuẩn là danh mục chức vụ của CSDL ngành" },
  { table: "iam.account", column: "email", terms: ["BG_00257"], status: "EXACT", note: "emailDn (cán bộ/nhà giáo)" },
];
