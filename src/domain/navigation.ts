/**
 * Module registry + menu theo cổng (vai trò).
 *
 * Menu hiển thị = mục thuộc cổng của vai trò đang hoạt động
 *               ∩ module được BẬT tại đơn vị của ngữ cảnh (cfg kế thừa)
 *               ∩ quyền của vai trò.
 * Không hard-code menu theo từng trường: bật/tắt module là cấu hình.
 */
import type { Permission } from "./permissions.ts";
import type { Portal } from "./roles.ts";

export type ModuleCode =
  | "core" | "plan" | "activity" | "resource" | "assess" | "training" | "provider" | "portal" | "report";

export const MODULES: Record<ModuleCode, { name: string; description: string; canDisable: boolean }> = {
  core: { name: "Nền tảng (tổ chức, tài khoản, cấu hình)", description: "Luôn bật", canDisable: false },
  plan: { name: "Kế hoạch & chỉ tiêu STEM", description: "Chỉ tiêu Sở giao, kế hoạch năm/kỳ, phân công", canDisable: true },
  activity: { name: "Hoạt động & minh chứng", description: "Kế hoạch bài dạy, hoạt động thực tế, minh chứng, duyệt", canDisable: true },
  resource: { name: "Phòng STEM & thiết bị", description: "Phòng, thiết bị, đặt lịch, xung đột, bảo trì", canDisable: true },
  assess: { name: "Nhiệm vụ & đánh giá", description: "Bài tập/dự án, rubric, nhận xét, hồ sơ năng lực", canDisable: true },
  training: { name: "Phát triển năng lực GV", description: "Nhu cầu, tập huấn, chứng chỉ", canDisable: true },
  provider: { name: "Hợp tác nhà cung cấp", description: "Danh mục chương trình, học liệu, triển khai, hỗ trợ", canDisable: true },
  portal: { name: "Cổng học sinh & phụ huynh", description: "Lịch, thông báo, trao đổi, đăng ký hoạt động", canDisable: true },
  report: { name: "Báo cáo & dữ liệu", description: "Dashboard, kỳ báo cáo, xuất dữ liệu, chất lượng dữ liệu", canDisable: true },
};

export interface NavItem {
  slug: string;
  label: string;
  icon: string;
  /** Cần có quyền này (bất kỳ trong mảng) */
  perms?: Permission[];
  module: ModuleCode;
  /** Milestone triển khai; "M0" = đã dùng được */
  milestone: "M0" | "M1" | "M2" | "M3" | "M4" | "M5" | "M6" | "M7" | "M8";
  /** Mô tả phạm vi (hiển thị ở trang "đang phát triển") */
  scope?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const ADMIN_GROUP = (extra: NavItem[] = []): NavGroup => ({
  label: "Quản trị",
  items: [
    { slug: "don-vi", label: "Đơn vị", icon: "network", perms: ["org.unit.view"], module: "core", milestone: "M0" },
    { slug: "tai-khoan", label: "Tài khoản & vai trò", icon: "users", perms: ["iam.account.view"], module: "core", milestone: "M0" },
    { slug: "vai-tro", label: "Ma trận quyền", icon: "shield", perms: ["iam.role.view"], module: "core", milestone: "M0" },
    { slug: "cau-hinh", label: "Module & cấu hình", icon: "sliders", perms: ["cfg.setting.view"], module: "core", milestone: "M0" },
    ...extra,
    { slug: "nhat-ky", label: "Nhật ký hệ thống", icon: "scroll", perms: ["audit.log.view"], module: "core", milestone: "M0" },
  ],
});

export const NAVIGATION: Record<Portal, NavGroup[]> = {
  platform: [
    { label: "Tổng quan", items: [{ slug: "tong-quan", label: "Tổng quan nền tảng", icon: "gauge", module: "core", milestone: "M0" }] },
    ADMIN_GROUP(),
  ],
  so: [
    {
      label: "Tổng quan",
      items: [
        { slug: "tong-quan", label: "Điều hành toàn tỉnh", icon: "gauge", module: "core", milestone: "M0" },
        { slug: "canh-bao", label: "Cảnh báo & trường cần hỗ trợ", icon: "alert", perms: ["report.dashboard.view"], module: "report", milestone: "M4", scope: "Trường chưa đạt chỉ tiêu, thiếu dữ liệu, quá hạn báo cáo; drill-down tới trường." },
      ],
    },
    {
      label: "Mạng lưới trường",
      items: [
        { slug: "truong-hoc", label: "Danh sách trường", icon: "school", perms: ["org.unit.view"], module: "core", milestone: "M0" },
        { slug: "so-sanh", label: "So sánh trường/địa bàn", icon: "bars", perms: ["report.dashboard.view"], module: "report", milestone: "M4", scope: "So sánh theo bộ chỉ số cấu hình, lọc theo xã/phường, cấp học." },
      ],
    },
    {
      label: "Kế hoạch & chỉ tiêu",
      items: [
        { slug: "bo-chi-so", label: "Bộ chỉ số", icon: "target", perms: ["plan.target.view"], module: "plan", milestone: "M4", scope: "Định nghĩa chỉ số trên dữ liệu chuẩn (metric registry)." },
        { slug: "giao-chi-tieu", label: "Giao chỉ tiêu", icon: "send", perms: ["plan.target.manage"], module: "plan", milestone: "M4", scope: "Ban hành kế hoạch năm, giao chỉ tiêu cho trường, theo dõi tiếp nhận (W1)." },
      ],
    },
    {
      label: "Giám sát & điều phối",
      items: [
        { slug: "hoat-dong", label: "Hoạt động STEM", icon: "flask", perms: ["activity.activity.view"], module: "activity", milestone: "M4", scope: "Số liệu tổng hợp hoạt động, minh chứng mẫu — không xem dữ liệu cá nhân HS." },
        { slug: "nhiem-vu", label: "Nhiệm vụ & giải trình", icon: "clipboard", perms: ["report.directive.manage"], module: "report", milestone: "M4", scope: "Giao nhiệm vụ, yêu cầu giải trình, theo dõi hạn (W6)." },
        { slug: "tap-huan", label: "Tập huấn & chuyên gia", icon: "graduation", perms: ["training.course.view"], module: "training", milestone: "M6" },
        { slug: "tham-dinh", label: "Thẩm định học liệu NCC", icon: "badge", perms: ["provider.offering.approve"], module: "provider", milestone: "M6", scope: "Duyệt/trả lại sản phẩm, học liệu của nhà cung cấp trước khi công bố (W7)." },
      ],
    },
    {
      label: "Báo cáo & dữ liệu",
      items: [
        { slug: "ky-bao-cao", label: "Kỳ báo cáo", icon: "calendar", perms: ["report.submission.approve"], module: "report", milestone: "M4", scope: "Mở kỳ, điền sẵn từ dữ liệu, tiếp nhận/yêu cầu giải trình, khóa số liệu (W5)." },
        { slug: "chat-luong-du-lieu", label: "Chất lượng dữ liệu", icon: "check", perms: ["report.dashboard.view"], module: "report", milestone: "M4" },
      ],
    },
    ADMIN_GROUP(),
  ],
  truong: [
    {
      label: "Tổng quan",
      items: [{ slug: "tong-quan", label: "Dashboard trường", icon: "gauge", module: "core", milestone: "M0" }],
    },
    {
      label: "Kế hoạch & chương trình",
      items: [
        { slug: "chi-tieu", label: "Chỉ tiêu được giao", icon: "target", perms: ["plan.target.view"], module: "plan", milestone: "M4" },
        { slug: "ke-hoach", label: "Kế hoạch STEM", icon: "calendar", perms: ["plan.plan.view"], module: "plan", milestone: "M3", scope: "Kế hoạch năm/kỳ, phân bổ theo khối/tổ/GV, quy trình duyệt nhiều cấp (W2)." },
      ],
    },
    {
      label: "Hoạt động",
      items: [
        { slug: "hoat-dong", label: "Hoạt động & minh chứng", icon: "flask", perms: ["activity.activity.view"], module: "activity", milestone: "M3", scope: "Ghi nhận hoạt động, minh chứng, duyệt cấp trường (W3)." },
      ],
    },
    {
      label: "Nhân sự & lớp",
      items: [
        { slug: "hoc-sinh", label: "Lớp & học sinh", icon: "users", perms: ["org.class.view"], module: "core", milestone: "M0" },
        { slug: "nhan-su", label: "Giáo viên & tổ", icon: "id", perms: ["org.person.view"], module: "core", milestone: "M2", scope: "Hồ sơ GV, tổ chuyên môn, phân công giảng dạy; import Excel có kiểm tra." },
        { slug: "lien-ket-phu-huynh", label: "Liên kết phụ huynh", icon: "link", perms: ["iam.guardian.approve"], module: "portal", milestone: "M7", scope: "Phát mã mời, xác minh, thu hồi liên kết (W8)." },
      ],
    },
    {
      label: "Phòng & thiết bị",
      items: [
        { slug: "phong-thiet-bi", label: "Phòng STEM & thiết bị", icon: "box", perms: ["resource.room.view"], module: "resource", milestone: "M5" },
        { slug: "dat-lich", label: "Đặt lịch & xung đột", icon: "calendar", perms: ["resource.booking.approve"], module: "resource", milestone: "M5", scope: "Phát hiện trùng phòng/slot, chọn ưu tiên, tự từ chối kèm gợi ý (W4)." },
      ],
    },
    {
      label: "Làm việc với Sở & đối tác",
      items: [
        { slug: "bao-cao", label: "Nộp báo cáo", icon: "upload", perms: ["report.submission.create"], module: "report", milestone: "M4" },
        { slug: "doi-tac", label: "Nhà cung cấp & cấp quyền", icon: "handshake", perms: ["iam.grant.manage"], module: "provider", milestone: "M6" },
        { slug: "tap-huan", label: "Năng lực giáo viên", icon: "graduation", perms: ["training.course.view"], module: "training", milestone: "M6" },
      ],
    },
    ADMIN_GROUP(),
  ],
  to: [
    { label: "Tổng quan", items: [{ slug: "tong-quan", label: "Tổng quan tổ", icon: "gauge", module: "core", milestone: "M0" }] },
    {
      label: "Chuyên môn",
      items: [
        { slug: "lop-cua-to", label: "Lớp & giáo viên của tổ", icon: "users", perms: ["org.class.view"], module: "core", milestone: "M0" },
        { slug: "ke-hoach", label: "Kế hoạch chuyên môn", icon: "calendar", perms: ["plan.plan.view"], module: "plan", milestone: "M3" },
        { slug: "ra-soat", label: "Rà soát & duyệt", icon: "check", perms: ["activity.activity.approve"], module: "activity", milestone: "M3", scope: "KHBD, minh chứng chờ tổ duyệt; góp ý, trả lại, đánh giá theo tiêu chí." },
        { slug: "hoc-lieu", label: "Học liệu của tổ", icon: "book", perms: ["provider.offering.view"], module: "activity", milestone: "M6" },
      ],
    },
  ],
  gv: [
    { label: "Hôm nay", items: [{ slug: "tong-quan", label: "Trang chủ & lịch", icon: "gauge", module: "core", milestone: "M0" }] },
    {
      label: "Giảng dạy",
      items: [
        { slug: "lop-cua-toi", label: "Lớp của tôi", icon: "users", perms: ["org.class.view"], module: "core", milestone: "M0" },
        { slug: "bai-day", label: "Kế hoạch bài dạy", icon: "book", perms: ["plan.plan.create"], module: "activity", milestone: "M3" },
        { slug: "hoat-dong", label: "Hoạt động & minh chứng", icon: "flask", perms: ["activity.activity.create"], module: "activity", milestone: "M3" },
        { slug: "dat-phong", label: "Đặt phòng/thiết bị", icon: "box", perms: ["resource.booking.create"], module: "resource", milestone: "M5" },
        { slug: "danh-gia", label: "Nhiệm vụ & đánh giá", icon: "star", perms: ["assess.task.create"], module: "assess", milestone: "M7" },
      ],
    },
    { label: "Chuyên môn", items: [{ slug: "ho-so", label: "Hồ sơ phát triển chuyên môn", icon: "graduation", perms: ["training.course.view"], module: "training", milestone: "M6" }] },
  ],
  hs: [
    { label: "Học tập", items: [
      { slug: "tong-quan", label: "Trang chủ", icon: "gauge", module: "core", milestone: "M0" },
      { slug: "du-an", label: "Dự án STEM", icon: "rocket", perms: ["assess.task.view"], module: "assess", milestone: "M7", scope: "Nhiệm vụ cá nhân/nhóm, nộp sản phẩm, xem nhận xét (W9)." },
      { slug: "ho-so-nang-luc", label: "Hồ sơ năng lực", icon: "star", perms: ["assess.task.view"], module: "assess", milestone: "M7" },
    ] },
  ],
  ph: [
    { label: "Con của tôi", items: [
      { slug: "tong-quan", label: "Tổng quan học tập", icon: "gauge", module: "core", milestone: "M0" },
      { slug: "trao-doi", label: "Trao đổi với trường", icon: "message", perms: ["portal.message.send"], module: "portal", milestone: "M7" },
      { slug: "dang-ky", label: "Đăng ký hoạt động", icon: "calendar", perms: ["portal.event.register"], module: "portal", milestone: "M7" },
    ] },
  ],
  ncc: [
    { label: "Tổng quan", items: [{ slug: "tong-quan", label: "Tổng quan nhà cung cấp", icon: "gauge", module: "core", milestone: "M0" }] },
    { label: "Hợp tác", items: [
      { slug: "truong-duoc-cap-quyen", label: "Trường được cấp quyền", icon: "school", module: "core", milestone: "M0" },
      { slug: "san-pham", label: "Sản phẩm & học liệu", icon: "book", perms: ["provider.offering.create"], module: "provider", milestone: "M6", scope: "Danh mục chương trình, phiên bản, gửi thẩm định, công bố (W7)." },
      { slug: "trien-khai", label: "Triển khai & hợp đồng", icon: "handshake", perms: ["provider.deployment.view"], module: "provider", milestone: "M6" },
      { slug: "ho-tro", label: "Hỗ trợ & phản hồi", icon: "message", perms: ["provider.ticket.handle"], module: "provider", milestone: "M6" },
    ] },
  ],
};

export function findNavItem(portal: Portal, slug: string): NavItem | undefined {
  for (const g of NAVIGATION[portal]) for (const it of g.items) if (it.slug === slug) return it;
  return undefined;
}
