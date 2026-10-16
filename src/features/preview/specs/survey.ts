import type { PreviewSpec } from "../types";
import { b, mute, ok, pct, warn } from "./_h";

/** Phân hệ 0.2 · Khảo sát */
const RESPOND: PreviewSpec = {
  intro: "Phiếu khảo sát bạn được mời trả lời. Câu trả lời được tổng hợp ẩn danh theo cài đặt của từng phiếu.",
  blocks: [
    { kind: "cards", title: "Phiếu đang mở", items: [
      { title: "Mức độ hài lòng với hoạt động STEM — HK I", meta: "Sở GD&ĐT · Hạn 30/11 · 12 câu · ~5 phút", badge: b("Chưa trả lời", "info") },
      { title: "Nhu cầu bồi dưỡng năm 2027", meta: "Sở GD&ĐT · Hạn 15/11 · 8 câu", badge: ok("Đã trả lời") },
    ] },
  ],
};

export const SURVEY: Record<string, PreviewSpec> = {
  "so:khao-sat": {
    intro: "Thiết kế phiếu khảo sát (hiện trạng Bước 1, hài lòng Bước 4), phát cho đối tượng theo vai trò/đơn vị, xem kết quả tổng hợp.",
    actions: ["Tạo phiếu", "Dùng mẫu"],
    kpis: [{ label: "Phiếu đang mở", value: 2 }, { label: "Lượt trả lời", value: "9.840" }, { label: "Tỷ lệ phản hồi", value: "61%" }, { label: "Điểm hài lòng", value: "4,1/5" }],
    blocks: [
      { kind: "table", title: "Phiếu khảo sát", columns: ["Phiếu", "Đối tượng", "Bước", "Hạn", "Phản hồi", "Trạng thái"], rows: [
        ["Hiện trạng phòng & thiết bị STEM", "QTV trường", "1", "30/09", pct(100), mute("Đã đóng")],
        ["Mức độ hài lòng với hoạt động STEM — HK I", "HS, PH, GV", "4", "30/11", pct(38), ok("Đang mở")],
        ["Nhu cầu bồi dưỡng năm 2027", "GV", "4", "15/11", pct(55), ok("Đang mở")],
      ] },
      { kind: "bars", title: "Hài lòng HK I — kết quả sơ bộ (thang 5)", items: [
        { label: "Học sinh", value: 4.2, max: 5, suffix: "/5" }, { label: "Phụ huynh", value: 4.0, max: 5, suffix: "/5" }, { label: "Giáo viên", value: 3.7, max: 5, suffix: "/5", tone: "warning" },
      ] },
    ],
  },
  "truong:khao-sat": {
    intro: "Phiếu Sở phát cho trường (theo dõi tỷ lệ phản hồi của GV, HS, PH) và phiếu trường tự tạo.",
    actions: ["Tạo phiếu của trường"],
    blocks: [
      { kind: "table", title: "Tỷ lệ phản hồi tại trường", columns: ["Phiếu", "Đối tượng", "Phản hồi", "Hạn", "Trạng thái"], rows: [
        ["Hài lòng hoạt động STEM — HK I", "HS (128)", pct(52), "30/11", ok("Đang mở")],
        ["Hài lòng hoạt động STEM — HK I", "PH (96)", pct(21), "30/11", warn("Thấp")],
        ["Góp ý CLB Robotics", "HS CLB (24)", pct(88), "25/10", ok("Đang mở")],
      ] },
    ],
  },
  "khao-sat": RESPOND,
};
