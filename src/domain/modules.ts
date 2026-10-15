/**
 * REGISTRY 14 PHÂN HỆ — nguồn chân lý cho cấu trúc hệ thống (docs/ARCHITECTURE_PLAN.md §2).
 *
 * Dung hòa 3 nguồn:
 *  - Hình "Kiến trúc tổng thể": Nghiệp vụ & API gồm 14 phân hệ.
 *  - Hình "Phân hệ theo tầng" (Sở ↔ Trường): Tầng 1–5, phân hệ 1–8 và 0.1–0.5.
 *  - Quy trình 5 bước triển khai đề án.
 * Phân hệ "0 · Định hướng & kế hoạch đề án" là phân hệ thứ 14, bổ sung để phủ Bước 1–2
 * (hình phân hệ chưa thể hiện), cần xác nhận (DECISIONS.md ADR-009).
 *
 * Mỗi phân hệ khai báo miền dữ liệu (MOETxx) và thuật ngữ chuẩn (BG_xxxxx) theo
 * QĐ 2768/QĐ-BGDĐT — test kiểm tra mọi mã đều có trong từ điển.
 */

export type StepNo = 1 | 2 | 3 | 4 | 5;

export const DE_AN_STEPS: readonly { no: StepNo; name: string; owner: string; outputs: string[] }[] = [
  {
    no: 1, name: "Định hướng từ Tỉnh/Sở", owner: "Sở GD&ĐT",
    outputs: ["Đề án/kế hoạch STEM năm học cấp tỉnh", "Bộ chỉ số & chỉ tiêu giao cho cơ sở giáo dục", "Khung chương trình STEM cấp tỉnh", "Khảo sát hiện trạng cơ sở giáo dục", "Cấu hình bắt buộc cho cấp dưới"],
  },
  {
    no: 2, name: "Lập kế hoạch", owner: "Cơ sở giáo dục (Sở duyệt)",
    outputs: ["Tiếp nhận chỉ tiêu", "Kế hoạch STEM năm học của trường", "Hồ sơ tổ chức dạy học (lớp, GV, HS, PH)", "Kế hoạch & lịch dạy STEM", "Kế hoạch bồi dưỡng GV, thiết bị & vật tư"],
  },
  {
    no: 3, name: "Đào tạo và triển khai", owner: "Trường · Nhà cung cấp",
    outputs: ["Bồi dưỡng, tập huấn giáo viên", "Triển khai chương trình & học liệu", "Chuẩn bị phòng STEM, thiết bị, vật tư", "Tổ chức buổi dạy, điểm danh, nhật ký & minh chứng"],
  },
  {
    no: 4, name: "Đánh giá vận hành", owner: "Trường · Tổ · Sở giám sát",
    outputs: ["Đánh giá năng lực & sản phẩm học sinh", "Đánh giá, xếp loại năng lực giáo viên", "Hiệu quả sử dụng phòng & thiết bị", "Khảo sát mức độ hài lòng", "Giám sát qua dashboard"],
  },
  {
    no: 5, name: "Tổng hợp báo cáo và đề xuất cải tiến", owner: "Trường → Sở",
    outputs: ["Báo cáo định kỳ trường → Sở", "Tổng hợp toàn tỉnh", "Đề xuất cải tiến", "Điều chỉnh đề án năm học sau"],
  },
];

export type TierCode = "T0" | "T1" | "T2" | "T3" | "T4" | "T5" | "X";

export const TIERS: readonly { code: TierCode; name: string }[] = [
  { code: "T0", name: "Định hướng & kế hoạch đề án" },
  { code: "T1", name: "Đào tạo & đánh giá năng lực giáo viên" },
  { code: "T2", name: "Chương trình & học liệu" },
  { code: "T3", name: "Vật tư, thiết bị dạy & học" },
  { code: "T4", name: "Vận hành giảng dạy & đánh giá học sinh" },
  { code: "T5", name: "Hệ thống quản lý vận hành" },
  { code: "X", name: "Áp dụng xuyên suốt" },
];

export type ModuleCode =
  | "plan" | "training" | "program" | "resource" | "org" | "schedule" | "session" | "assess"
  | "workflow" | "report" | "survey" | "integration" | "iam" | "platform";

export type Milestone = "M0" | "M1b" | "M2" | "M3" | "M4" | "M5" | "M6" | "M7" | "M8" | "M9";

export interface ModuleDef {
  code: ModuleCode;
  /** Số hiệu theo hình phân hệ */
  no: string;
  tier: TierCode;
  name: string;
  /** Tên ngắn cho nhóm menu */
  short: string;
  description: string;
  /** Chi tiết bên trong phân hệ */
  features: string[];
  /** Bước đề án mà phân hệ tham gia */
  steps: StepNo[];
  /** Miền dữ liệu QĐ 2768 */
  dataDomains: string[];
  /** Thuật ngữ chuẩn chính (mã BG) */
  keyTerms: string[];
  /** Vai trò của Nhà cung cấp / Phụ huynh trong phân hệ (nếu có) */
  partners?: string;
  canDisable: boolean;
  /** Mốc triển khai phần nghiệp vụ chính */
  milestone: Milestone;
  /** Phân hệ đầu vào (mũi tên trong hình) */
  inputs?: ModuleCode[];
}

export const MODULE_LIST: readonly ModuleDef[] = [
  {
    code: "plan", no: "0", tier: "T0", short: "Định hướng & kế hoạch", name: "Định hướng & kế hoạch đề án",
    description: "Sở ban hành đề án, bộ chỉ số, giao chỉ tiêu; trường tiếp nhận và lập kế hoạch STEM năm học; theo dõi tiến trình 5 bước.",
    features: ["Đề án/kế hoạch STEM năm học cấp tỉnh", "Bộ chỉ số & giao chỉ tiêu cho cơ sở giáo dục", "Trường tiếp nhận, kiến nghị điều chỉnh", "Kế hoạch STEM năm học/học kỳ của trường, phân bổ theo khối, tổ", "Tiến trình 5 bước triển khai đề án"],
    steps: [1, 2, 5], dataDomains: ["MOET30", "MOET34"], keyTerms: ["BG_00821", "BG_00419", "BG_00628"],
    canDisable: false, milestone: "M3",
  },
  {
    code: "training", no: "1", tier: "T1", short: "Đào tạo & năng lực GV", name: "Đào tạo & đánh giá năng lực giáo viên",
    description: "Khóa bồi dưỡng, tập huấn, chứng nhận và xếp loại năng lực STEM của giáo viên.",
    features: ["Nhu cầu & kế hoạch bồi dưỡng", "Khóa bồi dưỡng/tập huấn (trực tiếp, trực tuyến), ghi danh, điểm danh", "Chứng chỉ sau bồi dưỡng", "Đánh giá, xếp loại năng lực STEM (gắn chuẩn nghề nghiệp)", "Thống kê cán bộ/nhà giáo hoàn thành tập huấn"],
    steps: [2, 3, 4], dataDomains: ["MOET19", "MOET22", "MOET24"],
    keyTerms: ["BG_00346", "BG_00347", "BG_00335", "BG_00333", "BG_00334", "BG_00350", "BG_00351", "BG_00270", "BG_00389", "BG_00390", "BG_00391"],
    partners: "Nhà cung cấp tổ chức tập huấn; chuyên gia đánh giá", canDisable: true, milestone: "M5",
  },
  {
    code: "program", no: "2", tier: "T2", short: "Chương trình & học liệu", name: "Chương trình & học liệu STEM",
    description: "Khung chương trình, bài học/chủ đề, kế hoạch bài dạy mẫu và thư viện học liệu có thẩm định.",
    features: ["Khung chương trình STEM theo cấp học, khối, môn học", "Chủ đề, bài học, kế hoạch bài dạy mẫu", "Thư viện học liệu có phiên bản", "Thẩm định & công bố (Sở/trường duyệt học liệu nhà cung cấp)"],
    steps: [1, 2, 3], dataDomains: ["MOET39", "MOET40"], keyTerms: ["BG_00818", "BG_00817", "BG_00821", "BG_00856", "BG_00422", "BG_00506"],
    partners: "Nhà cung cấp gửi học liệu thẩm định", canDisable: true, milestone: "M5",
  },
  {
    code: "resource", no: "3", tier: "T3", short: "Thiết bị, vật tư & phòng", name: "Thiết bị, vật tư & phòng STEM",
    description: "Phòng STEM/phòng thí nghiệm, thiết bị, vật tư tiêu hao (kho, tồn), bảo trì, bảo hành.",
    features: ["Phòng STEM, phòng thí nghiệm, phòng/xưởng thực hành", "Danh mục thiết bị, tài sản, nguyên giá", "Vật tư tiêu hao: nhập – xuất – tồn kho", "Bảo trì, bảo hành, sự cố (gửi nhà cung cấp)", "Kiểm kê, hiệu suất sử dụng"],
    steps: [2, 3, 4], dataDomains: ["MOET32"],
    keyTerms: ["BG_00551", "BG_00557", "BG_00558", "BG_00568", "BG_00571", "BG_00573", "BG_00574", "BG_00613", "BG_00615", "BG_00616"],
    partners: "Nhà cung cấp xử lý bảo hành", canDisable: true, milestone: "M6",
  },
  {
    code: "org", no: "4", tier: "T4", short: "Tổ chức dạy học", name: "Tổ chức dạy học",
    description: "Hồ sơ cơ sở giáo dục, cán bộ/nhà giáo, người học, lớp, tổ chuyên môn, phụ huynh và liên kết xác minh.",
    features: ["Hồ sơ cơ sở giáo dục, điểm trường", "Hồ sơ cán bộ/nhà giáo, tổ chuyên môn", "Hồ sơ người học, lớp, khối", "Phụ huynh & liên kết đã xác minh", "Phân công giảng dạy, giáo viên chủ nhiệm", "Import/đồng bộ theo từ điển dữ liệu"],
    steps: [2], dataDomains: ["MOET07", "MOET10", "MOET18", "MOET20", "MOET30", "MOET31"],
    keyTerms: ["BG_00419", "BG_00421", "BG_00422", "BG_00429", "BG_00504", "BG_00505", "BG_00506", "BG_00007", "BG_00009", "BG_00010", "BG_00090", "BG_00238", "BG_00240", "BG_00297", "BG_00311"],
    partners: "Phụ huynh: liên kết & xác minh con", canDisable: false, milestone: "M2",
  },
  {
    code: "schedule", no: "5", tier: "T4", short: "Kế hoạch & lịch dạy", name: "Kế hoạch & lịch dạy",
    description: "Kế hoạch dạy học STEM theo lớp/khối; phân công giáo viên, phòng, thiết bị; lịch và xung đột.",
    features: ["Kế hoạch dạy học STEM từ khung chương trình (phân hệ 2)", "Phân công giáo viên, phòng, thiết bị (phân hệ 3)", "Lịch dạy STEM, phát hiện xung đột phòng/GV/thiết bị", "Đăng ký mượn thiết bị", "Sự kiện, đăng ký hoạt động"],
    steps: [2, 3], dataDomains: ["MOET31"], keyTerms: ["BG_00520", "BG_00299", "BG_00551", "BG_00297"],
    canDisable: true, milestone: "M6", inputs: ["program", "resource", "org"],
  },
  {
    code: "session", no: "6", tier: "T4", short: "Buổi dạy & điểm danh", name: "Buổi dạy & điểm danh",
    description: "Check-in giáo viên, điểm danh người học, nhật ký buổi dạy, minh chứng; dùng được khi mất mạng.",
    features: ["Check-in giáo viên", "Điểm danh người học (có phép/không phép)", "Nhật ký buổi dạy, minh chứng ảnh/video", "Ghi nhận thiết bị/vật tư đã dùng (trừ tồn kho)", "Ngoại tuyến: ghi trên máy, đồng bộ khi có mạng"],
    steps: [3], dataDomains: ["MOET11", "MOET31"], keyTerms: ["BG_00106", "BG_00107", "BG_00099"],
    canDisable: true, milestone: "M7", inputs: ["schedule"],
  },
  {
    code: "assess", no: "7", tier: "T4", short: "Đánh giá năng lực & sản phẩm", name: "Đánh giá năng lực & sản phẩm",
    description: "Rubric, mức đạt, nhận xét năng lực/phẩm chất, sản phẩm và hồ sơ năng lực của người học.",
    features: ["Rubric theo năng lực, phẩm chất", "Mức đạt, điểm đánh giá thường xuyên/định kỳ, nhận xét", "Sản phẩm, dự án STEM của học sinh", "Hồ sơ năng lực, kết quả cuộc thi", "Phụ huynh xem kết quả đã công bố"],
    steps: [4], dataDomains: ["MOET11", "MOET16"],
    keyTerms: ["BG_00113", "BG_00120", "BG_00121", "BG_00122", "BG_00119", "BG_00117", "BG_00116", "BG_00115", "BG_00137", "BG_00138", "BG_00143", "BG_00134"],
    partners: "Phụ huynh xem kết quả của con", canDisable: true, milestone: "M7", inputs: ["session"],
  },
  {
    code: "workflow", no: "8", tier: "X", short: "Quy trình & thông báo", name: "Quy trình & thông báo",
    description: "Phê duyệt, nhắc việc, cảnh báo, giao nhiệm vụ/giải trình; thông báo trong hệ thống, email, ứng dụng.",
    features: ["Bộ máy quy trình phê duyệt có phiên bản", "Nhắc việc, hạn xử lý (SLA)", "Cảnh báo", "Giao nhiệm vụ & giải trình", "Thông báo in-app, email, ứng dụng; trao đổi PH – trường"],
    steps: [1, 2, 3, 4, 5], dataDomains: ["MOET05"], keyTerms: [],
    canDisable: false, milestone: "M3",
  },
  {
    code: "report", no: "0.1", tier: "T5", short: "Dashboard & báo cáo", name: "Dashboard & báo cáo",
    description: "Dashboard theo vai trò, kỳ báo cáo định kỳ, tổng hợp lên Sở, xuất Excel/PDF, đề xuất cải tiến.",
    features: ["Dashboard theo vai trò, tiến trình đề án", "Kỳ báo cáo, mẫu báo cáo, nộp & tiếp nhận", "Tổng hợp toàn tỉnh (số liệu tổng hợp)", "Chất lượng dữ liệu", "Đề xuất cải tiến (Bước 5)"],
    steps: [4, 5], dataDomains: ["MOET33", "MOET34"], keyTerms: ["BG_00628", "BG_00620", "BG_00621", "BG_00770", "BG_00772"],
    partners: "Nhà cung cấp nộp báo cáo triển khai", canDisable: false, milestone: "M8",
  },
  {
    code: "survey", no: "0.2", tier: "T5", short: "Khảo sát", name: "Khảo sát",
    description: "Phiếu khảo sát hiện trạng, nhu cầu, mức độ hài lòng cho CBQL, GV, HS, PH, nhà cung cấp; tổng hợp kết quả.",
    features: ["Ngân hàng câu hỏi; mẫu phiếu của Sở (bắt buộc) + câu hỏi riêng của trường", "Phát hành theo phạm vi & đối tượng; ẩn danh tùy chọn", "Thu thập, nhắc trả lời, theo dõi tỷ lệ phản hồi", "Tổng hợp, so sánh theo đơn vị; xuất dữ liệu"],
    steps: [1, 4, 5], dataDomains: ["MOET34"], keyTerms: [],
    canDisable: true, milestone: "M4",
  },
  {
    code: "integration", no: "0.3", tier: "T5", short: "Tích hợp dữ liệu & AI", name: "Tích hợp dữ liệu & AI",
    description: "Đồng bộ dữ liệu với LMS, CSDL ngành, hệ thống nội bộ, dịch vụ ngoài theo từ điển dữ liệu; trợ lý AI có kiểm quyền.",
    features: ["Kết nối LMS, CSDL ngành, hệ thống nội bộ", "Ánh xạ trường dữ liệu theo QĐ 2768", "Lịch đồng bộ, nhật ký, đối soát", "Kho phân tích (data warehouse) cho BI", "Trợ lý AI có trích nguồn, chỉ trên dữ liệu được phép"],
    steps: [5], dataDomains: ["MOET34"], keyTerms: [],
    canDisable: true, milestone: "M9",
  },
  {
    code: "iam", no: "0.4", tier: "T5", short: "Người dùng & phân quyền", name: "Quản trị người dùng & phân quyền",
    description: "Đơn vị, tài khoản, vai trò, ngữ cảnh làm việc, quyền truy cập của nhà cung cấp, bảo mật, nhật ký.",
    features: ["Cây đơn vị Sở → trường → tổ", "Tài khoản, nhiều vai trò, ngữ cảnh làm việc", "Ma trận quyền, vai trò tùy chỉnh", "Cấp/thu hồi quyền dữ liệu cho nhà cung cấp", "Nhật ký append-only"],
    steps: [1, 2, 3, 4, 5], dataDomains: ["MOET29", "MOET30"], keyTerms: ["BG_00417", "BG_00420"],
    canDisable: false, milestone: "M0",
  },
  {
    code: "platform", no: "0.5", tier: "T5", short: "Quản trị nền tảng", name: "Quản trị nền tảng",
    description: "Cấu hình kế thừa, bật/tắt phân hệ, danh mục dùng chung, từ điển dữ liệu ngành, thuật ngữ.",
    features: ["Cấu hình kế thừa Bắt buộc / Kế thừa & mở rộng / Tự chủ", "Bật/tắt phân hệ theo đơn vị", "Danh mục dùng chung", "Từ điển dữ liệu QĐ 2768 & ánh xạ", "Đổi thuật ngữ hiển thị theo đơn vị"],
    steps: [1], dataDomains: ["MOET01"], keyTerms: [],
    canDisable: false, milestone: "M0",
  },
];

export const MODULES: Record<ModuleCode, ModuleDef> = Object.fromEntries(MODULE_LIST.map((m) => [m.code, m])) as Record<ModuleCode, ModuleDef>;

export const STEP_BY_NO: Record<StepNo, (typeof DE_AN_STEPS)[number]> = Object.fromEntries(DE_AN_STEPS.map((s) => [s.no, s])) as never;

/** Nhãn nhóm quyền theo tiền tố mã quyền (dùng ở Ma trận quyền). */
export const PERMISSION_GROUP_LABEL: Record<string, string> = {
  ...Object.fromEntries(MODULE_LIST.map((m) => [m.code, `${m.no} · ${m.name}`])),
  org: "4 · Tổ chức dạy học (hồ sơ, đơn vị)",
  iam: "0.4 · Người dùng & phân quyền",
  cfg: "0.5 · Quản trị nền tảng (cấu hình)",
  audit: "0.4 · Nhật ký hệ thống",
};
