/**
 * Permission registry — NGUỒN CHÂN LÝ DUY NHẤT cho quyền.
 *
 * Mã quyền: `<module>.<resource>.<action>`
 *   action: view | create | update | approve | export | manage | personal (đọc dữ liệu cá nhân)
 *
 * File này được dùng bởi:
 *  - Frontend (ẩn/hiện menu, nút) — chỉ để trải nghiệm, KHÔNG phải lớp bảo mật.
 *  - scripts/gen-seed.ts → sinh supabase/seed.sql (iam.permission, iam.role_permission)
 *    để RLS trong Postgres dùng đúng cùng bộ quyền.
 */

export const PERMISSIONS = {
  // org — Tổ chức
  "org.unit.view": "Xem đơn vị",
  "org.unit.manage": "Quản trị đơn vị (tạo/sửa/ngừng)",
  "org.class.view": "Xem lớp học",
  "org.class.manage": "Quản trị lớp học",
  "org.person.view": "Xem danh sách người (tên, vai trò)",
  "org.person.personal": "Xem dữ liệu cá nhân chi tiết (ngày sinh, liên hệ)",
  "org.person.manage": "Quản trị hồ sơ người",
  // iam — Tài khoản & phân quyền
  "iam.account.view": "Xem tài khoản",
  "iam.account.manage": "Quản trị tài khoản & gán vai trò",
  "iam.role.view": "Xem vai trò & quyền",
  "iam.role.manage": "Tạo/sửa vai trò tùy chỉnh",
  "iam.guardian.request": "Gửi yêu cầu liên kết con",
  "iam.guardian.approve": "Xác minh liên kết phụ huynh",
  "iam.grant.manage": "Cấp/thu hồi quyền dữ liệu cho nhà cung cấp",
  // cfg — Cấu hình
  "cfg.setting.view": "Xem cấu hình",
  "cfg.setting.manage": "Sửa cấu hình đơn vị",
  // audit
  "audit.log.view": "Xem nhật ký hệ thống",
  // plan — Kế hoạch & chỉ tiêu
  "plan.target.view": "Xem chỉ tiêu",
  "plan.target.manage": "Ban hành/giao chỉ tiêu",
  "plan.plan.view": "Xem kế hoạch STEM",
  "plan.plan.create": "Lập/sửa kế hoạch STEM",
  "plan.plan.approve": "Duyệt kế hoạch STEM",
  // activity — Hoạt động & minh chứng
  "activity.activity.view": "Xem hoạt động STEM",
  "activity.activity.create": "Ghi nhận hoạt động STEM",
  "activity.activity.approve": "Duyệt hoạt động/minh chứng",
  // resource — Phòng & thiết bị
  "resource.room.view": "Xem phòng & thiết bị",
  "resource.room.manage": "Quản trị phòng & thiết bị",
  "resource.booking.create": "Đặt phòng/thiết bị",
  "resource.booking.approve": "Duyệt đặt phòng/xử lý xung đột",
  // assess — Nhiệm vụ & đánh giá
  "assess.task.view": "Xem nhiệm vụ/dự án",
  "assess.task.create": "Giao nhiệm vụ/dự án",
  "assess.task.submit": "Nộp bài/sản phẩm",
  "assess.evaluation.create": "Đánh giá, nhận xét",
  // training — Năng lực GV
  "training.course.view": "Xem tập huấn",
  "training.course.manage": "Quản lý tập huấn",
  // provider — Nhà cung cấp
  "provider.profile.manage": "Quản lý hồ sơ nhà cung cấp",
  "provider.offering.view": "Xem sản phẩm/học liệu đã công bố",
  "provider.offering.create": "Tạo/sửa sản phẩm, học liệu",
  "provider.offering.approve": "Thẩm định/công bố sản phẩm, học liệu",
  "provider.deployment.view": "Xem tiến độ triển khai",
  "provider.ticket.handle": "Xử lý yêu cầu hỗ trợ",
  // report — Báo cáo
  "report.dashboard.view": "Xem dashboard",
  "report.submission.create": "Lập/nộp báo cáo",
  "report.submission.approve": "Tiếp nhận/duyệt báo cáo",
  "report.export": "Xuất dữ liệu",
  "report.directive.manage": "Giao nhiệm vụ/yêu cầu giải trình",
  "report.directive.respond": "Phản hồi nhiệm vụ/giải trình",
  // portal — Cổng HS/PH
  "portal.child.view": "Xem tình hình học tập của con",
  "portal.message.send": "Trao đổi với nhà trường",
  "portal.event.register": "Đăng ký hoạt động/sự kiện",
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];

export function isPermission(code: string): code is Permission {
  return code in PERMISSIONS;
}
