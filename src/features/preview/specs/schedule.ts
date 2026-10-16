import type { PreviewSpec } from "../types";
import { b, bad, mute, ok, warn } from "./_h";

const WEEK_TRUONG = [
  { day: "Thứ Hai 19/10", items: [{ time: "07:30–09:00", label: "6A1 · Tưới cây tự động", meta: "STEM 1 · Ngô Thị Hương" }, { time: "14:00–16:00", label: "CLB Robotics", meta: "STEM 1 · Vũ Đức Anh", tone: "info" as const }] },
  { day: "Thứ Ba 20/10", items: [{ time: "09:15–10:45", label: "8A1 · Nhà chống lũ", meta: "STEM 2 · Hoàng Thị Lan" }] },
  { day: "Thứ Tư 21/10", items: [{ time: "07:30–09:00", label: "7A1 · Máy bắn đá mini", meta: "STEM 1 · Vũ Đức Anh" }, { time: "07:30–09:00", label: "9A1 · Trạm quan trắc", meta: "STEM 1 · trùng phòng!", tone: "danger" as const }] },
  { day: "Thứ Năm 22/10", items: [{ time: "14:00–15:30", label: "Sinh hoạt chuyên môn tổ KHTN", meta: "STEM 2", tone: "warning" as const }] },
  { day: "Thứ Sáu 23/10", items: [{ time: "14:00–16:00", label: "CLB Robotics", meta: "STEM 1", tone: "info" as const }] },
];

/** Phân hệ 5 · Kế hoạch & lịch dạy */
export const SCHEDULE: Record<string, PreviewSpec> = {
  "truong:lich-day": {
    intro: "Lịch dạy STEM toàn trường theo tuần: lớp, phòng, giáo viên; phát hiện trùng phòng/giáo viên/thiết bị.",
    actions: ["Xếp lịch", "Xuất lịch tuần"],
    filters: ["Tuần 7 (19–25/10)", "Phòng: Tất cả", "Khối: Tất cả"],
    blocks: [{ kind: "week", title: "Lịch tuần", days: WEEK_TRUONG }],
  },
  "truong:dat-lich": {
    intro: "Duyệt yêu cầu đặt phòng/mượn thiết bị; hệ thống phát hiện xung đột và gợi ý khung giờ thay thế (W4).",
    kpis: [{ label: "Chờ duyệt", value: 3 }, { label: "Xung đột", value: 1 }, { label: "Đã duyệt tuần này", value: 12 }, { label: "Tự động từ chối", value: 1 }],
    blocks: [
      { kind: "table", title: "Yêu cầu đặt lịch", columns: ["Người yêu cầu", "Nội dung", "Phòng/thiết bị", "Thời gian", "Kiểm tra", "Trạng thái"], rows: [
        ["Vũ Đức Anh", "9A1 · Trạm quan trắc", "STEM 1 + 10 bộ kit", "T4 21/10 07:30", bad("Trùng 7A1"), warn("Chờ duyệt")],
        ["Hoàng Thị Lan", "8A1 · Nhà chống lũ", "STEM 2", "T3 20/10 09:15", ok("Không xung đột"), ok("Đã duyệt")],
        ["Ngô Thị Hương", "6A1 · Kính tiềm vọng", "STEM 2 + 4 kính hiển vi", "T6 23/10 07:30", warn("Thiếu 1 kính (đang hỏng)"), warn("Chờ duyệt")],
      ] },
      { kind: "note", title: "Gợi ý cho yêu cầu trùng", text: "STEM 2 còn trống T4 21/10 07:30–09:00, hoặc STEM 1 trống T4 09:15–10:45.", tone: "warning" },
    ],
  },
  "to:lich-day": {
    intro: "Lịch dạy STEM của giáo viên trong tổ, theo dõi tiến độ so với kế hoạch tổ.",
    blocks: [{ kind: "week", title: "Lịch tuần của tổ KHTN", days: WEEK_TRUONG.map((d) => ({ ...d, items: d.items.filter((x) => /Hương|Lan|KHTN/.test(x.meta ?? "")) })) }],
  },
  "gv:lich-day": {
    intro: "Lịch dạy STEM của bạn; mở buổi dạy để điểm danh và nộp minh chứng.",
    blocks: [
      { kind: "week", title: "Tuần này", days: WEEK_TRUONG.map((d) => ({ ...d, items: d.items.filter((x) => /Hương/.test(x.meta ?? "")) })) },
      { kind: "list", title: "Sắp tới", items: [
        { title: "6A1 · Tưới cây tự động", meta: "Thứ Hai 19/10 · 07:30 · Phòng STEM 1", badge: ok("Đã đặt phòng") },
        { title: "6A1 · Kính tiềm vọng", meta: "Thứ Sáu 23/10 · 07:30 · Phòng STEM 2", badge: warn("Chờ duyệt phòng") },
      ] },
    ],
  },
  "gv:dat-phong": {
    intro: "Đặt phòng STEM và mượn thiết bị cho buổi dạy; hệ thống kiểm tra trùng lịch ngay khi chọn.",
    actions: ["Đặt phòng mới"],
    blocks: [
      { kind: "form", title: "Yêu cầu đặt phòng", fields: [
        { label: "Lớp", value: "6A1" }, { label: "Bài học", value: "Kính tiềm vọng" }, { label: "Phòng", value: "Phòng STEM 2" },
        { label: "Thời gian", value: "Thứ Sáu 23/10 · 07:30–09:00" }, { label: "Thiết bị mượn", value: "Kính hiển vi điện tử × 4", wide: true },
      ], submit: "Gửi yêu cầu" },
      { kind: "note", title: "Kiểm tra trước khi gửi", text: "Kính hiển vi: còn 3/4 (1 chiếc đang hỏng — phiếu BT-0915). Gợi ý: giảm xuống 3 nhóm.", tone: "warning" },
    ],
  },
  "hs:lich-hoc": {
    intro: "Lịch học STEM và hoạt động câu lạc bộ, sự kiện em có thể đăng ký.",
    blocks: [
      { kind: "list", title: "Tuần này", items: [
        { title: "Bài học STEM: Hệ thống tưới cây tự động", meta: "Thứ Hai 19/10 · 07:30 · Phòng STEM 1", badge: b("Lớp 6A1", "info") },
        { title: "CLB Robotics", meta: "Thứ Hai & Thứ Sáu · 14:00", badge: ok("Đã đăng ký") },
      ] },
      { kind: "cards", title: "Hoạt động mở đăng ký", items: [
        { title: "Ngày hội STEM cấp trường", meta: "28/11/2026 · 60 suất", badge: b("Còn 14 suất", "warning") },
        { title: "Cuộc thi KHKT cấp tỉnh — vòng trường", meta: "Hạn đăng ký ý tưởng 30/11", badge: b("Mở", "info") },
      ] },
    ],
  },
  "ph:dang-ky": {
    intro: "Lịch hoạt động STEM của con và các sự kiện phụ huynh có thể đăng ký cho con hoặc tham dự.",
    blocks: [
      { kind: "cards", title: "Sự kiện sắp tới", items: [
        { title: "Ngày hội STEM — THCS Bình Minh", meta: "28/11/2026 · Phụ huynh được mời tham dự", badge: b("Đăng ký", "info") },
        { title: "Trải nghiệm Robotics cuối tuần", meta: "Thứ Bảy 07/11 · có phí vật tư", badge: mute("Chưa đăng ký") },
      ] },
      { kind: "list", title: "Lịch STEM của Trần Khánh Huy (6A1)", items: [
        { title: "Hệ thống tưới cây tự động", meta: "Thứ Hai 19/10 · 07:30" }, { title: "CLB Robotics", meta: "Thứ Hai & Thứ Sáu · 14:00" },
      ] },
    ],
  },
};
