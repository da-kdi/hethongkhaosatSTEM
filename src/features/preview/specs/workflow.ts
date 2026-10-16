import type { PreviewSpec } from "../types";
import { b, bad, mute, ok, warn } from "./_h";

/** Phân hệ 8 · Quy trình & thông báo (xuyên suốt) */
export const WORKFLOW: Record<string, PreviewSpec> = {
  "so:nhiem-vu": {
    intro: "Giao nhiệm vụ cho trường (báo cáo, minh chứng, giải trình), theo dõi hạn và phản hồi.",
    actions: ["Giao nhiệm vụ"],
    kpis: [{ label: "Đang mở", value: 4 }, { label: "Trường đã phản hồi", value: "71%" }, { label: "Quá hạn", value: 9 }, { label: "Cần giải trình", value: 3 }],
    blocks: [
      { kind: "table", title: "Nhiệm vụ", columns: ["Nhiệm vụ", "Giao cho", "Hạn", "Phản hồi", "Trạng thái"], rows: [
        ["Báo cáo hiện trạng phòng STEM", "112 trường", "30/10", "80/112", warn("Đang thu")],
        ["Giải trình chậm tiến độ buổi dạy", "THCS Hòa An", "20/10", "0/1", bad("Quá hạn")],
        ["Cử GV dự tập huấn Robotics", "THCS (48 trường)", "15/10", "48/48", ok("Hoàn thành")],
      ] },
    ],
  },
  "so:thong-bao": {
    intro: "Gửi thông báo theo đơn vị/vai trò, nhắc việc tự động theo hạn; theo dõi tỷ lệ đã đọc.",
    actions: ["Soạn thông báo"],
    blocks: [
      { kind: "list", title: "Thông báo đã gửi", items: [
        { title: "Mở đăng ký khóa 'Thiết kế bài học STEM theo 5E'", meta: "Gửi: GV THCS, THPT · 14/10 · đã đọc 63%", badge: ok("Đã gửi") },
        { title: "Nhắc nộp kế hoạch STEM điều chỉnh", meta: "Gửi: THCS Hòa An · 12/10 · đã đọc 100%", badge: ok("Đã gửi") },
        { title: "Lịch Ngày hội STEM toàn tỉnh", meta: "Hẹn gửi 01/11", badge: mute("Hẹn giờ") },
      ] },
      { kind: "table", title: "Nhắc việc tự động", columns: ["Quy tắc", "Đối tượng", "Kênh", "Bật"], rows: [
        ["Trước hạn nhiệm vụ 3 ngày", "Người được giao", "Ứng dụng + email", ok("Bật")],
        ["Buổi dạy chưa có minh chứng sau 48 giờ", "Giáo viên", "Ứng dụng", ok("Bật")],
        ["Phòng STEM dưới 30% hiệu suất tháng", "BGH trường", "Email", mute("Tắt")],
      ] },
    ],
  },
  "truong:nhiem-vu": {
    intro: "Nhiệm vụ Sở giao cho trường: phân công người xử lý, nộp phản hồi và minh chứng.",
    blocks: [
      { kind: "table", title: "Nhiệm vụ từ Sở", columns: ["Nhiệm vụ", "Hạn", "Người xử lý", "Trạng thái"], rows: [
        ["Báo cáo hiện trạng phòng STEM", "30/10", "Đỗ Văn Kiên", warn("Đang làm")],
        ["Cử GV dự tập huấn Robotics", "15/10", "Phạm Thu Hà", ok("Đã nộp")],
      ] },
    ],
  },
  "gv:thong-bao": {
    intro: "Thông báo từ trường, tổ, Sở và trao đổi với phụ huynh lớp chủ nhiệm.",
    blocks: [
      { kind: "list", title: "Thông báo", items: [
        { title: "Mở đăng ký khóa 'Thiết kế bài học STEM theo 5E'", meta: "Sở GD&ĐT · 14/10", badge: b("Mới", "info") },
        { title: "Sinh hoạt chuyên môn tổ KHTN thứ Năm 22/10", meta: "Tổ trưởng Hoàng Thị Lan", badge: mute("Đã đọc") },
      ] },
      { kind: "chat", title: "Trao đổi với phụ huynh — 6A1", messages: [
        { from: "PH Hồ Thị Thu (mẹ Huy)", text: "Cô ơi, tuần sau con cần mang vật liệu gì cho bài tưới cây ạ?", at: "08:12" },
        { from: "Ngô Thị Hương", me: true, text: "Chị cho con mang 1 chai nhựa 1,5L và 1 cái chậu nhỏ ạ, phần cảm biến trường chuẩn bị.", at: "08:30" },
      ] },
    ],
  },
  "ph:trao-doi": {
    intro: "Nhận thông báo và trao đổi với giáo viên của con.",
    blocks: [
      { kind: "chat", title: "Cô Ngô Thị Hương — STEM 6A1", messages: [
        { from: "Hồ Thị Thu", me: true, text: "Cô ơi, tuần sau con cần mang vật liệu gì cho bài tưới cây ạ?", at: "08:12" },
        { from: "Ngô Thị Hương", text: "Chị cho con mang 1 chai nhựa 1,5L và 1 cái chậu nhỏ ạ, phần cảm biến trường chuẩn bị.", at: "08:30" },
      ] },
    ],
  },
};
