/**
 * Menu theo cổng (vai trò), nhóm theo 14 PHÂN HỆ (src/domain/modules.ts).
 *
 * Menu hiển thị = mục thuộc cổng của vai trò đang hoạt động
 *               ∩ phân hệ được BẬT tại đơn vị của ngữ cảnh (cfg kế thừa)
 *               ∩ quyền của vai trò.
 * Không hard-code theo từng trường: bật/tắt phân hệ là cấu hình.
 */
import type { Permission } from "./permissions.ts";
import type { Portal } from "./roles.ts";
import { MODULES, type Milestone, type ModuleCode } from "./modules.ts";

export { MODULES, type ModuleCode } from "./modules.ts";

/** Mốc "M0" = đã dùng được trong bản hiện tại. */
export const READY: Milestone = "M0";

export interface NavItem {
  slug: string;
  label: string;
  icon: string;
  /** Cần có quyền này (bất kỳ trong mảng) */
  perms?: Permission[];
  module: ModuleCode;
  milestone: Milestone;
  /** Mô tả phạm vi (hiển thị ở trang "đang phát triển") */
  scope?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Nhóm menu theo phân hệ: "3 · Thiết bị, vật tư & phòng" */
const ph = (code: ModuleCode, items: NavItem[]): NavGroup => ({ label: `${MODULES[code].no} · ${MODULES[code].short}`, items });

const it = (slug: string, label: string, icon: string, module: ModuleCode, milestone: Milestone, perms?: Permission[], scope?: string): NavItem =>
  ({ slug, label, icon, module, milestone, perms, scope });

const OVERVIEW = (label: string, withProgress: boolean): NavGroup => ({
  label: "Tổng quan",
  items: [
    it("tong-quan", label, "gauge", "platform", READY),
    ...(withProgress ? [it("tien-trinh", "Tiến trình đề án (5 bước)", "route", "plan", READY, ["plan.plan.view"])] : []),
  ],
});

const ADMIN = (): NavGroup => ({
  label: "Quản trị hệ thống (0.4 · 0.5)",
  items: [
    it("don-vi", "Đơn vị", "network", "iam", READY, ["org.unit.view"]),
    it("tai-khoan", "Tài khoản & vai trò", "users", "iam", READY, ["iam.account.view"]),
    it("vai-tro", "Ma trận quyền", "shield", "iam", READY, ["iam.role.view"]),
    it("cau-hinh", "Phân hệ & cấu hình", "sliders", "platform", READY, ["cfg.setting.view"]),
    it("giao-dien", "Giao diện đơn vị", "palette", "platform", READY, ["cfg.setting.manage"], "Logo, màu nhận diện, tên hiển thị theo từng đơn vị (white-label)."),
    it("ban-do-phan-he", "Bản đồ phân hệ", "map", "platform", READY, ["cfg.setting.view"]),
    it("tu-dien", "Từ điển dữ liệu ngành", "book-a", "platform", READY, ["cfg.setting.view"]),
    it("danh-muc", "Danh mục dùng chung", "list", "platform", READY, ["cfg.setting.view"]),
    it("nhat-ky", "Nhật ký hệ thống", "scroll", "iam", READY, ["audit.log.view"]),
  ],
});

/** Nhóm khảo sát cho đơn vị quản lý (Sở, Trường) — theo các module của hệ thống khảo sát KDI (khaosat-kdi) */
const SURVEY_ADMIN = (scope: string): NavItem[] => [
  it("khao-sat", "Tổng quan khảo sát", "clipboard-check", "survey", "M4", ["survey.form.view"], scope),
  it("khao-sat-tao", "Khảo sát & trình tạo phiếu", "pencil", "survey", "M4", ["survey.form.manage"], "Tạo trống/từ mẫu/nhân bản; 33 loại câu hỏi; logic hiển thị; phiên bản bất biến."),
  it("khao-sat-mau", "Thư viện mẫu", "book", "survey", "M4", ["survey.form.view"]),
  it("khao-sat-phan-phoi", "Phân phối & lời mời", "link", "survey", "M4", ["survey.form.manage"], "Link công khai, mã truy cập, lời mời riêng dùng một lần, QR, lịch mở/đóng."),
  it("khao-sat-phan-tich", "Phản hồi & phân tích", "bars", "survey", "M4", ["survey.form.view"], "Danh sách phản hồi, biểu đồ theo câu, cross-tab, phễu bỏ dở, xuất Excel/Power BI."),
];

const SURVEY_RESPOND = (): NavGroup => ph("survey", [
  it("khao-sat", "Khảo sát của tôi", "clipboard-check", "survey", "M4", ["survey.response.submit"], "Trả lời phiếu khảo sát được phát hành cho bạn; xem tiến độ."),
]);

export const NAVIGATION: Record<Portal, NavGroup[]> = {
  platform: [
    OVERVIEW("Tổng quan nền tảng", false),
    ph("integration", [it("tich-hop", "Kết nối & đồng bộ dữ liệu", "plug", "integration", "M9", ["integration.connector.view"])]),
    ADMIN(),
  ],

  so: [
    OVERVIEW("Điều hành toàn tỉnh", true),
    ph("plan", [
      it("de-an", "Đề án & kế hoạch năm học", "flag", "plan", "M3", ["plan.plan.view"], "Ban hành đề án/kế hoạch STEM năm học cấp tỉnh (Bước 1)."),
      it("bo-chi-so", "Bộ chỉ số", "target", "plan", "M3", ["plan.target.view"], "Định nghĩa chỉ số trên dữ liệu chuẩn (metric registry)."),
      it("giao-chi-tieu", "Giao chỉ tiêu & duyệt kế hoạch", "send", "plan", "M3", ["plan.target.manage"], "Giao chỉ tiêu cho cơ sở giáo dục, theo dõi tiếp nhận, duyệt kế hoạch trường (Bước 1–2)."),
    ]),
    ph("training", [
      it("tap-huan", "Kế hoạch & khóa bồi dưỡng", "graduation", "training", "M5", ["training.course.view"]),
      it("nang-luc-gv", "Năng lực giáo viên toàn tỉnh", "badge", "training", "M5", ["training.course.view"], "Tổng hợp xếp loại, chứng chỉ, tỷ lệ hoàn thành bồi dưỡng."),
    ]),
    ph("program", [
      it("khung-chuong-trinh", "Khung chương trình STEM", "book", "program", "M5", ["program.content.view"]),
      it("tham-dinh", "Thẩm định & công bố học liệu", "check", "program", "M5", ["program.content.approve"], "Duyệt/trả lại học liệu của nhà cung cấp trước khi công bố."),
      it("chuong-trinh-trien-khai", "Chương trình STEM đang triển khai", "rocket", "program", "M5", ["program.content.view"], "Chương trình/gói STEM theo trường, nhà cung cấp, mức bao phủ."),
    ]),
    ph("resource", [it("hieu-qua-thiet-bi", "Hiệu quả phòng & thiết bị", "box", "resource", "M6", ["resource.room.view"])]),
    ph("org", [it("truong-hoc", "Danh sách cơ sở giáo dục", "school", "org", READY, ["org.unit.view"])]),
    ph("session", [it("giam-sat-buoi-day", "Giám sát buổi dạy & chuyên cần", "user-check", "session", "M7", ["session.attendance.view"], "Số liệu tổng hợp theo trường — không xem danh sách học sinh.")]),
    ph("assess", [it("ket-qua-danh-gia", "Kết quả đánh giá năng lực HS", "star", "assess", "M7", ["assess.task.view"], "Phân bố mức đạt năng lực theo trường/khối — số liệu tổng hợp.")]),
    ph("workflow", [
      it("nhiem-vu", "Nhiệm vụ & giải trình", "clipboard", "workflow", "M3", ["workflow.directive.manage"]),
      it("thong-bao", "Thông báo & nhắc việc", "bell", "workflow", "M3"),
    ]),
    ph("report", [
      it("canh-bao", "Cảnh báo & trường cần hỗ trợ", "alert", "report", "M8", ["report.dashboard.view"]),
      it("ky-bao-cao", "Kỳ báo cáo", "calendar", "report", "M8", ["report.submission.approve"], "Mở kỳ, điền sẵn từ dữ liệu, tiếp nhận/yêu cầu giải trình, khóa số liệu (Bước 5)."),
      it("de-xuat-cai-tien", "Đề xuất cải tiến", "lightbulb", "report", "M8", ["report.dashboard.view"]),
      it("chat-luong-du-lieu", "Chất lượng dữ liệu", "check", "report", "M8", ["report.dashboard.view"]),
      it("xep-hang", "Xếp hạng & phân loại", "trophy", "report", "M8", ["report.dashboard.view"], "Chỉ số STEM theo trường, xã/phường; phân loại Tốt/Khá/Đạt/Cần hỗ trợ."),
      it("bao-cao-bo", "Báo cáo Bộ GD&ĐT", "send", "report", "M8", ["report.submission.approve"], "Tổng hợp số liệu theo mẫu của Bộ, ký số và gửi."),
    ]),
    ph("survey", SURVEY_ADMIN("Khảo sát hiện trạng (Bước 1), hài lòng (Bước 4); phát cho trường theo vai trò, tổng hợp theo đơn vị.")),
    ph("integration", [it("tich-hop", "Tích hợp dữ liệu & AI", "plug", "integration", "M9", ["integration.connector.view"])]),
    ADMIN(),
  ],

  truong: [
    OVERVIEW("Dashboard trường", true),
    ph("plan", [
      it("chi-tieu", "Chỉ tiêu được giao", "target", "plan", "M3", ["plan.target.view"]),
      it("ke-hoach", "Kế hoạch STEM năm học", "flag", "plan", "M3", ["plan.plan.view"], "Kế hoạch năm/kỳ, phân bổ theo khối/tổ/GV, gửi Sở duyệt (Bước 2)."),
    ]),
    ph("training", [it("tap-huan", "Bồi dưỡng & năng lực GV", "graduation", "training", "M5", ["training.course.view"])]),
    ph("program", [
      it("hoc-lieu", "Chương trình & học liệu", "book", "program", "M5", ["program.content.view"]),
      it("goi-stem", "Chương trình STEM triển khai", "rocket", "program", "M5", ["program.content.view"], "Chương trình/gói STEM trường đang triển khai, nhà cung cấp, lớp tham gia."),
      it("ppct", "Phân phối chương trình STEM", "list", "program", "M5", ["program.content.view"], "Phân phối chủ đề/tiết STEM theo tuần cho từng khối."),
    ]),
    ph("resource", [
      it("co-so", "Tòa nhà & phòng học", "building", "resource", "M6", ["resource.room.view"]),
      it("phong-thiet-bi", "Phòng STEM & thiết bị", "box", "resource", "M6", ["resource.room.view"]),
      it("vat-tu", "Vật tư & tồn kho", "package", "resource", "M6", ["resource.stock.manage"]),
      it("bao-tri", "Bảo trì & bảo hành", "wrench", "resource", "M6", ["resource.room.manage"]),
    ]),
    ph("org", [
      it("ho-so-truong", "Hồ sơ nhà trường", "school", "org", "M2", ["org.unit.view"], "Thông tin cơ sở giáo dục theo chuẩn QĐ 2768, điểm trường, quy mô."),
      it("hoc-sinh", "Lớp & học sinh", "users", "org", READY, ["org.class.view"]),
      it("nhan-su", "Giáo viên & tổ chuyên môn", "id", "org", READY, ["org.person.view"]),
      it("nhap-xuat-ho-so", "Nhập/xuất hồ sơ", "upload", "org", READY, ["org.person.manage", "report.export"], "Nhập/xuất Excel học sinh, giáo viên theo tên kỹ thuật QĐ 2768; kiểm tra toàn tệp trước khi ghi."),
      it("lien-ket-phu-huynh", "Liên kết phụ huynh", "link", "org", READY, ["iam.guardian.approve"], "Phát mã mời, xác minh, thu hồi liên kết (W8)."),
      it("doi-tac", "Nhà cung cấp & cấp quyền", "handshake", "org", "M2", ["iam.grant.manage"]),
    ]),
    ph("schedule", [
      it("lich-day", "Kế hoạch & lịch dạy STEM", "calendar", "schedule", "M6", ["schedule.lesson.view"]),
      it("tkb", "Thời khóa biểu & tiết học", "clock", "schedule", "M6", ["schedule.lesson.view"], "Cấu hình ca/tiết, thời khóa biểu STEM theo tuần."),
      it("dat-lich", "Đặt phòng/thiết bị & xung đột", "calendar-clock", "schedule", "M6", ["schedule.booking.approve"], "Phát hiện trùng phòng/GV/thiết bị, chọn ưu tiên, tự từ chối kèm gợi ý (W4)."),
    ]),
    ph("session", [
      it("buoi-day", "Buổi dạy & điểm danh", "user-check", "session", "M7", ["session.attendance.view"]),
      it("duyet-minh-chung", "Duyệt minh chứng buổi dạy", "check", "session", "M7", ["session.evidence.approve"]),
    ]),
    ph("assess", [it("danh-gia", "Kết quả đánh giá năng lực", "star", "assess", "M7", ["assess.task.view"])]),
    ph("workflow", [it("nhiem-vu", "Nhiệm vụ từ Sở", "clipboard", "workflow", "M3", ["workflow.directive.respond"])]),
    ph("report", [it("bao-cao", "Báo cáo định kỳ", "upload", "report", "M8", ["report.submission.create"])]),
    ph("survey", [
      ...SURVEY_ADMIN("Khảo sát của trường: phiếu Sở phát và phiếu trường tự tạo cho GV, HS, PH."),
      it("tra-loi", "Phiếu cần trả lời", "send", "survey", "M4", ["survey.response.submit"]),
    ]),
    ph("integration", [it("tich-hop", "Đồng bộ dữ liệu", "plug", "integration", "M9", ["integration.connector.view"])]),
    ADMIN(),
  ],

  to: [
    OVERVIEW("Tổng quan tổ", false),
    ph("plan", [it("ke-hoach", "Kế hoạch chuyên môn", "flag", "plan", "M3", ["plan.plan.view"])]),
    ph("training", [it("nang-luc-gv", "Năng lực GV của tổ", "badge", "training", "M5", ["training.competency.evaluate"])]),
    ph("program", [it("hoc-lieu", "Học liệu của tổ", "book", "program", "M5", ["program.content.view"])]),
    ph("org", [it("lop-cua-to", "Lớp & giáo viên của tổ", "users", "org", READY, ["org.class.view"])]),
    ph("schedule", [it("lich-day", "Kế hoạch & lịch dạy", "calendar", "schedule", "M6", ["schedule.lesson.view"])]),
    ph("session", [it("duyet-minh-chung", "Rà soát buổi dạy & minh chứng", "check", "session", "M7", ["session.evidence.approve"], "Nhật ký, minh chứng chờ tổ rà soát; góp ý, trả lại.")]),
    ph("assess", [it("danh-gia", "Kết quả đánh giá của tổ", "star", "assess", "M7", ["assess.task.view"])]),
    SURVEY_RESPOND(),
  ],

  gv: [
    OVERVIEW("Hôm nay", false),
    ph("training", [it("ho-so", "Bồi dưỡng & chứng chỉ", "graduation", "training", "M5", ["training.course.view"])]),
    ph("program", [it("hoc-lieu", "Học liệu & kế hoạch bài dạy", "book", "program", "M5", ["program.content.view"])]),
    ph("org", [it("lop-cua-toi", "Lớp của tôi", "users", "org", READY, ["org.class.view"])]),
    ph("schedule", [
      it("lich-day", "Lịch dạy STEM", "calendar", "schedule", "M6", ["schedule.lesson.view"]),
      it("dat-phong", "Đặt phòng/mượn thiết bị", "box", "schedule", "M6", ["schedule.booking.create"]),
    ]),
    ph("session", [it("buoi-day", "Buổi dạy & điểm danh", "user-check", "session", "M7", ["session.attendance.record"], "Check-in, điểm danh, nhật ký, minh chứng; dùng được khi mất mạng.")]),
    ph("assess", [it("danh-gia", "Nhiệm vụ & đánh giá", "star", "assess", "M7", ["assess.task.create"])]),
    ph("workflow", [it("thong-bao", "Thông báo & trao đổi", "bell", "workflow", "M3", ["workflow.message.send"])]),
    SURVEY_RESPOND(),
  ],

  hs: [
    OVERVIEW("Trang chủ", false),
    ph("program", [it("hoc-lieu", "Học liệu", "book", "program", "M5", ["program.content.view"])]),
    ph("schedule", [it("lich-hoc", "Lịch học & hoạt động", "calendar", "schedule", "M6", ["schedule.event.register"])]),
    ph("session", [it("chuyen-can", "Chuyên cần", "user-check", "session", "M7", ["session.attendance.view"])]),
    ph("assess", [
      it("du-an", "Dự án STEM", "rocket", "assess", "M7", ["assess.task.view"], "Nhiệm vụ cá nhân/nhóm, nộp sản phẩm, xem nhận xét (W9)."),
      it("ho-so-nang-luc", "Hồ sơ năng lực", "star", "assess", "M7", ["assess.task.view"]),
    ]),
    SURVEY_RESPOND(),
  ],

  ph: [
    OVERVIEW("Tổng quan học tập", false),
    ph("org", [it("lien-ket-con", "Liên kết với con", "link", "org", READY, ["iam.guardian.request"], "Nhập mã mời do nhà trường phát (W8).")]),
    ph("schedule", [it("dang-ky", "Lịch & đăng ký hoạt động", "calendar", "schedule", "M6", ["schedule.event.register"])]),
    ph("session", [it("chuyen-can", "Chuyên cần của con", "user-check", "session", "M7", ["org.child.view"])]),
    ph("assess", [it("ket-qua", "Kết quả & nhận xét", "star", "assess", "M7", ["org.child.view"], "Chỉ hiển thị kết quả giáo viên đã công bố.")]),
    ph("workflow", [it("trao-doi", "Trao đổi với trường", "message", "workflow", "M3", ["workflow.message.send"])]),
    SURVEY_RESPOND(),
  ],

  ncc: [
    OVERVIEW("Tổng quan nhà cung cấp", false),
    ph("org", [
      it("truong-duoc-cap-quyen", "Trường được cấp quyền", "school", "org", READY),
      it("ho-so-ncc", "Hồ sơ nhà cung cấp", "id", "org", READY, ["org.provider.manage"]),
    ]),
    ph("training", [it("tap-huan", "Tổ chức tập huấn", "graduation", "training", "M5", ["training.course.manage"])]),
    ph("program", [it("san-pham", "Chương trình & học liệu", "book", "program", "M5", ["program.content.create"], "Danh mục chương trình, phiên bản, gửi thẩm định (W7).")]),
    ph("resource", [it("ho-tro", "Bảo hành & hỗ trợ thiết bị", "wrench", "resource", "M6", ["resource.ticket.handle"])]),
    ph("report", [it("bao-cao-trien-khai", "Báo cáo triển khai", "upload", "report", "M8", ["report.submission.create"])]),
    SURVEY_RESPOND(),
  ],
};

export function findNavItem(portal: Portal, slug: string): NavItem | undefined {
  for (const g of NAVIGATION[portal]) for (const item of g.items) if (item.slug === slug) return item;
  return undefined;
}
