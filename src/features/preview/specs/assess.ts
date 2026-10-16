import type { PreviewSpec } from "../types";
import { b, mute, ok, warn } from "./_h";

/** Phân hệ 7 · Đánh giá năng lực & sản phẩm */
export const ASSESS: Record<string, PreviewSpec> = {
  "so:ket-qua-danh-gia": {
    intro: "Kết quả đánh giá năng lực STEM của học sinh toàn tỉnh (số liệu tổng hợp, không có tên học sinh).",
    filters: ["Học kỳ I", "Cấp học: THCS", "Khối: Tất cả"],
    kpis: [{ label: "HS được đánh giá", value: "18.420" }, { label: "Đạt trở lên", value: "82%" }, { label: "Tốt", value: "27%" }, { label: "Dự án KHKT", value: 146 }],
    blocks: [
      { kind: "bars", title: "Mức đạt theo năng lực thành phần", items: [
        { label: "Giải quyết vấn đề", value: 79 }, { label: "Sáng tạo", value: 74 }, { label: "Hợp tác", value: 88, tone: "success" },
        { label: "Vận dụng kiến thức liên môn", value: 69, tone: "warning" }, { label: "Sử dụng công cụ, thiết bị", value: 71 },
      ] },
    ],
  },
  "truong:danh-gia": {
    intro: "Kết quả đánh giá theo lớp, theo rubric; sản phẩm tiêu biểu của học sinh.",
    blocks: [
      { kind: "table", title: "Theo lớp", columns: ["Lớp", "Nhiệm vụ đã chấm", "Tốt", "Đạt", "Chưa đạt", "Đã công bố"], rows: [
        ["6A1", 2, "34%", "59%", "7%", ok("Đã công bố")], ["7A1", 1, "21%", "70%", "9%", ok("Đã công bố")],
        ["8A1", 1, "—", "—", "—", warn("Đang chấm")], ["9A1", 1, "28%", "66%", "6%", mute("Chưa công bố")],
      ] },
      { kind: "cards", title: "Sản phẩm tiêu biểu", items: [
        { title: "Hệ thống tưới cây tự động — Nhóm 1, 6A1", meta: "Rubric 18/20", badge: b("Tốt", "success") },
        { title: "Trạm đo nhiệt độ phòng học — Nhóm 3, 9A1", meta: "Rubric 17/20", badge: b("Tốt", "success") },
      ] },
    ],
  },
  "to:danh-gia": {
    intro: "Kết quả đánh giá các lớp tổ phụ trách; thống nhất rubric trong tổ.",
    blocks: [{ kind: "table", title: "Rubric đang dùng", columns: ["Rubric", "Tiêu chí", "Dùng cho", "Trạng thái"], rows: [
      ["Sản phẩm STEM THCS (4 mức)", 5, "Khối 6–9", ok("Tổ thống nhất")], ["Thuyết trình nhóm", 4, "Khối 8–9", warn("Dự thảo")],
    ] }],
  },
  "gv:danh-gia": {
    intro: "Giao nhiệm vụ/dự án (cá nhân, nhóm), chấm theo rubric, nhận xét và công bố cho học sinh, phụ huynh (W9).",
    actions: ["Giao nhiệm vụ", "Chấm bài"],
    blocks: [
      { kind: "table", title: "Nhiệm vụ của tôi", columns: ["Nhiệm vụ", "Lớp", "Hình thức", "Hạn", "Đã nộp", "Trạng thái"], rows: [
        ["Bản thiết kế hệ thống tưới", "6A1", "Nhóm (8)", "20/10", "8/8", ok("Đã chấm")],
        ["Sản phẩm hoàn thiện + video", "6A1", "Nhóm (8)", "02/11", "3/8", warn("Đang nộp")],
        ["Nhật ký kỹ thuật", "6A1", "Cá nhân", "02/11", "11/32", warn("Đang nộp")],
      ] },
      { kind: "note", title: "Công bố kết quả", text: "Kết quả chỉ hiển thị cho học sinh và phụ huynh sau khi giáo viên bấm Công bố." },
    ],
  },
  "hs:du-an": {
    intro: "Dự án và nhiệm vụ STEM của em: nộp bài nhiều phiên bản, xem nhận xét của thầy cô.",
    blocks: [
      { kind: "cards", title: "Đang thực hiện", items: [
        { title: "Sản phẩm hoàn thiện + video", meta: "Nhóm 1 · Hạn 02/11", badge: warn("Phiên bản 1 đã nộp"), progress: 60 },
        { title: "Nhật ký kỹ thuật", meta: "Cá nhân · Hạn 02/11", badge: mute("Chưa nộp"), progress: 20 },
      ] },
      { kind: "list", title: "Đã có kết quả", items: [
        { title: "Bản thiết kế hệ thống tưới", meta: "Nhận xét: Ý tưởng tốt, cần ghi rõ thông số cảm biến.", badge: b("Tốt", "success") },
      ] },
    ],
  },
  "hs:ho-so-nang-luc": {
    intro: "Hồ sơ năng lực STEM tích lũy qua các năm: kỹ năng, sản phẩm, giải thưởng.",
    blocks: [
      { kind: "bars", title: "Năng lực STEM (thang 4)", items: [
        { label: "Giải quyết vấn đề", value: 3, max: 4, suffix: "/4" }, { label: "Sáng tạo", value: 3, max: 4, suffix: "/4" },
        { label: "Hợp tác", value: 4, max: 4, suffix: "/4", tone: "success" }, { label: "Công cụ, thiết bị", value: 2, max: 4, suffix: "/4", tone: "warning" },
      ] },
      { kind: "list", title: "Sản phẩm & thành tích", items: [
        { title: "Hệ thống tưới cây tự động", meta: "Năm học 2026–2027 · Nhóm 1", badge: b("Tốt", "success") },
      ] },
    ],
  },
  "ph:ket-qua": {
    intro: "Kết quả và nhận xét giáo viên đã công bố cho con.",
    blocks: [
      { kind: "list", title: "Trần Khánh Huy · 6A1", items: [
        { title: "Bản thiết kế hệ thống tưới (nhóm)", meta: "Cô Ngô Thị Hương: Huy dẫn dắt nhóm tốt, cần cẩn thận hơn khi đo đạc.", badge: b("Tốt", "success") },
      ] },
      { kind: "note", title: "Lưu ý", text: "Chỉ hiển thị kết quả giáo viên đã công bố; điểm chi tiết từng tiêu chí xem trong sổ liên lạc của trường." },
    ],
  },
};
