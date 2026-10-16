import type { PreviewSpec } from "../types";
import { b, mute, ok, pct, warn } from "./_h";

/** Phân hệ 1 · Đào tạo & đánh giá năng lực GV */
export const TRAINING: Record<string, PreviewSpec> = {
  "so:tap-huan": {
    intro: "Kế hoạch bồi dưỡng giáo viên STEM toàn tỉnh: khóa học, đơn vị tổ chức (Sở hoặc nhà cung cấp), đăng ký và kết quả.",
    actions: ["Tạo khóa bồi dưỡng", "Phân bổ chỉ tiêu cho trường"],
    kpis: [
      { label: "Khóa trong năm", value: 5 }, { label: "GV đăng ký", value: 640 },
      { label: "Hoàn thành", value: 412, hint: "64%" }, { label: "Điểm hài lòng", value: "4,4/5" },
    ],
    blocks: [
      { kind: "table", title: "Khóa bồi dưỡng năm học 2026–2027", columns: ["Khóa", "Đơn vị tổ chức", "Hình thức", "Thời gian", "Học viên", "Trạng thái"], rows: [
        ["GV cốt cán STEM — đợt 1", "Sở GD&ĐT", "Trực tiếp", "05–07/10/2026", "120/120", ok("Đã kết thúc")],
        ["Robotics cơ bản cho GV THCS", "KDI Education (demo)", "Kết hợp", "20/10–15/11/2026", "180/200", warn("Đang diễn ra")],
        ["Thiết kế bài học STEM theo quy trình 5E", "Sở GD&ĐT", "Trực tuyến", "11/2026", "210/250", b("Mở đăng ký", "info")],
        ["IoT ứng dụng cho GV THPT", "Công ty Robotic Việt (demo)", "Trực tiếp", "01/2027", "0/80", mute("Dự kiến")],
      ] },
    ],
  },
  "so:nang-luc-gv": {
    intro: "Bản đồ năng lực STEM của giáo viên toàn tỉnh theo khung 4 mức, phát hiện nhu cầu bồi dưỡng theo trường, môn.",
    filters: ["Cấp học: THCS", "Môn: Tất cả", "Huyện/xã: Tất cả"],
    kpis: [
      { label: "GV dạy STEM", value: 2196 }, { label: "Đạt mức 2 trở lên", value: "58%" },
      { label: "Có chứng chỉ STEM", value: 1430 }, { label: "Cần bồi dưỡng gấp", value: 214 },
    ],
    blocks: [
      { kind: "bars", title: "Phân bố mức năng lực (khung 4 mức)", items: [
        { label: "Mức 1 — Làm quen", value: 42, tone: "warning" }, { label: "Mức 2 — Vận dụng", value: 35 },
        { label: "Mức 3 — Thành thạo", value: 18, tone: "success" }, { label: "Mức 4 — Dẫn dắt", value: 5, tone: "info" },
      ] },
      { kind: "bars", title: "Tỷ lệ đạt mức 2+ theo năng lực thành phần", items: [
        { label: "Thiết kế bài học STEM", value: 61 }, { label: "Tổ chức hoạt động nhóm", value: 66 },
        { label: "Sử dụng thiết bị số/robotics", value: 39, tone: "warning" }, { label: "Đánh giá năng lực HS", value: 47, tone: "warning" },
      ] },
    ],
  },
  "truong:tap-huan": {
    intro: "Cử giáo viên tham gia bồi dưỡng, theo dõi chứng chỉ và năng lực STEM của đội ngũ trong trường.",
    actions: ["Cử GV tham gia khóa", "Tự đánh giá năng lực"],
    kpis: [{ label: "GV dạy STEM", value: 14 }, { label: "Đã bồi dưỡng năm nay", value: 7 }, { label: "Có chứng chỉ", value: 9 }, { label: "Đạt mức 2+", value: "64%" }],
    blocks: [
      { kind: "table", title: "Đội ngũ & bồi dưỡng", columns: ["Giáo viên", "Tổ", "Mức năng lực", "Khóa đã học", "Đang học"], rows: [
        ["Hoàng Thị Lan", "Tổ KHTN", b("Mức 3", "success"), 4, "Robotics cơ bản cho GV THCS"],
        ["Ngô Thị Hương", "Tổ KHTN", b("Mức 2"), 2, "—"],
        ["Vũ Đức Anh", "Tổ Toán – Tin", b("Mức 2"), 3, "Robotics cơ bản cho GV THCS"],
        ["Trịnh Văn Bảo", "Tổ Toán – Tin", warn("Mức 1"), 0, "—"],
      ] },
    ],
  },
  "to:nang-luc-gv": {
    intro: "Năng lực STEM của giáo viên trong tổ, kế hoạch bồi dưỡng và hỗ trợ đồng nghiệp.",
    blocks: [
      { kind: "cards", title: "Giáo viên trong tổ", items: [
        { title: "Hoàng Thị Lan", meta: "Tổ trưởng · Mức 3", body: "Thế mạnh: thiết kế bài học, đánh giá theo rubric.", progress: 80 },
        { title: "Ngô Thị Hương", meta: "Mức 2", body: "Cần hỗ trợ: sử dụng cảm biến, vi điều khiển.", progress: 55 },
      ] },
      { kind: "list", title: "Đề xuất bồi dưỡng", items: [
        { title: "Ngô Thị Hương → Robotics cơ bản cho GV THCS", meta: "Đề xuất bởi tổ trưởng · chờ BGH", badge: warn("Chờ duyệt") },
      ] },
    ],
  },
  "gv:ho-so": {
    intro: "Hồ sơ bồi dưỡng cá nhân: khóa học, chứng chỉ, tự đánh giá năng lực STEM và kế hoạch phát triển.",
    actions: ["Đăng ký khóa học", "Tự đánh giá năng lực"],
    kpis: [{ label: "Mức năng lực", value: "Mức 2" }, { label: "Khóa đã hoàn thành", value: 2 }, { label: "Giờ bồi dưỡng", value: "36 giờ" }, { label: "Chứng chỉ", value: 2 }],
    blocks: [
      { kind: "list", title: "Chứng chỉ & khóa học", items: [
        { title: "GV cốt cán STEM — đợt 1", meta: "Sở GD&ĐT · 07/10/2026 · 24 giờ", badge: ok("Đạt") },
        { title: "Thiết kế bài học STEM cơ bản", meta: "Sở GD&ĐT · 05/2026 · 12 giờ", badge: ok("Đạt") },
        { title: "Robotics cơ bản cho GV THCS", meta: "KDI Education (demo) · 20/10–15/11/2026", badge: warn("Đang học") },
      ] },
      { kind: "bars", title: "Tự đánh giá năng lực (thang 4)", items: [
        { label: "Thiết kế bài học", value: 3, max: 4, suffix: "/4" }, { label: "Tổ chức hoạt động", value: 3, max: 4, suffix: "/4" },
        { label: "Thiết bị số", value: 2, max: 4, suffix: "/4", tone: "warning" }, { label: "Đánh giá HS", value: 2, max: 4, suffix: "/4", tone: "warning" },
      ] },
    ],
  },
  "ncc:tap-huan": {
    intro: "Khóa bồi dưỡng nhà cung cấp tổ chức cho giáo viên các trường đã hợp tác: lịch, danh sách học viên, điểm danh, kết quả.",
    actions: ["Tạo khóa", "Gửi Sở phê duyệt"],
    kpis: [{ label: "Khóa đang mở", value: 1 }, { label: "Học viên", value: 180 }, { label: "Chuyên cần TB", value: "91%" }, { label: "Hài lòng", value: "4,5/5" }],
    blocks: [
      { kind: "table", title: "Khóa học của đơn vị", columns: ["Khóa", "Trường tham gia", "Buổi", "Học viên", "Tiến độ", "Phê duyệt"], rows: [
        ["Robotics cơ bản cho GV THCS", "18 trường", "6", 180, pct(50), ok("Sở đã duyệt")],
        ["Lập trình Scratch cho GV Tiểu học", "—", "4", 0, pct(0), warn("Chờ Sở duyệt")],
      ] },
    ],
  },
};
