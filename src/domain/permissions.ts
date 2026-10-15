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
  // 0 · Định hướng & kế hoạch đề án
  "plan.target.view": "Xem bộ chỉ số & chỉ tiêu",
  "plan.target.manage": "Ban hành đề án, bộ chỉ số, giao chỉ tiêu",
  "plan.plan.view": "Xem kế hoạch STEM & tiến trình đề án",
  "plan.plan.create": "Lập/sửa kế hoạch STEM",
  "plan.plan.approve": "Duyệt kế hoạch STEM",
  // 1 · Đào tạo & đánh giá năng lực GV
  "training.course.view": "Xem khóa bồi dưỡng, tập huấn",
  "training.course.manage": "Tổ chức khóa bồi dưỡng, cấp chứng chỉ",
  "training.competency.evaluate": "Đánh giá, xếp loại năng lực giáo viên",
  // 2 · Chương trình & học liệu STEM
  "program.content.view": "Xem chương trình & học liệu đã công bố",
  "program.content.create": "Soạn chương trình, bài học, học liệu",
  "program.content.approve": "Thẩm định & công bố học liệu",
  // 3 · Thiết bị, vật tư & phòng STEM
  "resource.room.view": "Xem phòng, thiết bị, vật tư",
  "resource.room.manage": "Quản lý phòng, thiết bị, kiểm kê",
  "resource.stock.manage": "Nhập – xuất – tồn vật tư",
  "resource.ticket.handle": "Xử lý bảo trì, bảo hành",
  // 4 · Tổ chức dạy học (hồ sơ) — mã org.* dùng trong RLS, không đổi
  "org.unit.view": "Xem đơn vị, cơ sở giáo dục",
  "org.unit.manage": "Quản trị đơn vị (tạo/sửa/ngừng)",
  "org.class.view": "Xem lớp học",
  "org.class.manage": "Quản trị lớp học, phân công",
  "org.person.view": "Xem danh sách người (tên, vai trò)",
  "org.person.personal": "Xem dữ liệu cá nhân chi tiết (ngày sinh, liên hệ, định danh)",
  "org.person.manage": "Quản trị hồ sơ người học, cán bộ/nhà giáo",
  "org.provider.manage": "Quản lý hồ sơ nhà cung cấp",
  "org.child.view": "Xem tình hình học tập của con",
  // 5 · Kế hoạch & lịch dạy
  "schedule.lesson.view": "Xem kế hoạch & lịch dạy STEM",
  "schedule.lesson.create": "Lập kế hoạch & lịch dạy, phân công",
  "schedule.booking.create": "Đặt phòng/mượn thiết bị",
  "schedule.booking.approve": "Duyệt đặt phòng, xử lý xung đột",
  "schedule.event.register": "Đăng ký hoạt động, sự kiện",
  // 6 · Buổi dạy & điểm danh
  "session.attendance.view": "Xem buổi dạy & điểm danh",
  "session.attendance.record": "Check-in, điểm danh, nhật ký buổi dạy",
  "session.evidence.approve": "Rà soát, duyệt minh chứng buổi dạy",
  // 7 · Đánh giá năng lực & sản phẩm
  "assess.task.view": "Xem nhiệm vụ, dự án, kết quả",
  "assess.task.create": "Giao nhiệm vụ/dự án",
  "assess.task.submit": "Nộp bài, sản phẩm",
  "assess.evaluation.create": "Đánh giá theo rubric, nhận xét",
  // 8 · Quy trình & thông báo
  "workflow.directive.manage": "Giao nhiệm vụ, yêu cầu giải trình",
  "workflow.directive.respond": "Phản hồi nhiệm vụ, giải trình",
  "workflow.message.send": "Trao đổi, gửi thông báo",
  // 0.1 · Dashboard & báo cáo
  "report.dashboard.view": "Xem dashboard",
  "report.submission.create": "Lập/nộp báo cáo",
  "report.submission.approve": "Tiếp nhận/duyệt báo cáo",
  "report.export": "Xuất dữ liệu",
  // 0.2 · Khảo sát
  "survey.form.view": "Xem phiếu & kết quả khảo sát",
  "survey.form.manage": "Tạo, phát hành phiếu khảo sát",
  "survey.response.submit": "Trả lời khảo sát",
  // 0.3 · Tích hợp dữ liệu & AI
  "integration.connector.view": "Xem kết nối & nhật ký đồng bộ",
  "integration.connector.manage": "Cấu hình kết nối, đồng bộ dữ liệu",
  // 0.4 · Người dùng & phân quyền — mã iam.* dùng trong RLS, không đổi
  "iam.account.view": "Xem tài khoản",
  "iam.account.manage": "Quản trị tài khoản & gán vai trò",
  "iam.role.view": "Xem vai trò & quyền",
  "iam.role.manage": "Tạo/sửa vai trò tùy chỉnh",
  "iam.guardian.request": "Gửi yêu cầu liên kết con",
  "iam.guardian.approve": "Xác minh liên kết phụ huynh",
  "iam.grant.manage": "Cấp/thu hồi quyền dữ liệu cho nhà cung cấp",
  "audit.log.view": "Xem nhật ký hệ thống",
  // 0.5 · Quản trị nền tảng
  "cfg.setting.view": "Xem cấu hình, bản đồ phân hệ, từ điển dữ liệu",
  "cfg.setting.manage": "Sửa cấu hình, bật/tắt phân hệ",
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];

export function isPermission(code: string): code is Permission {
  return code in PERMISSIONS;
}
