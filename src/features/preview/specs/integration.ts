import type { PreviewSpec } from "../types";
import { b, bad, mute, ok, warn } from "./_h";

/** Phân hệ 0.3 · Tích hợp dữ liệu & AI */
const CONNECTORS = {
  kind: "table" as const, title: "Kết nối dữ liệu", columns: ["Hệ thống", "Dữ liệu", "Chiều", "Chuẩn", "Lần đồng bộ", "Trạng thái"], rows: [
    ["CSDL ngành GD&ĐT", "Trường, lớp, HS, GV, danh mục", "Nhận", "QĐ 2768", "16/10 02:00", ok("Hoạt động")],
    ["Định danh điện tử (VNeID)", "Xác thực tài khoản", "Nhận", "OIDC", "—", mute("Chưa cấu hình")],
    ["Hệ thống thiết bị NCC", "Bảo hành, tình trạng kit", "Hai chiều", "API riêng", "15/10 23:00", warn("Lỗi 3 bản ghi")],
    ["Kho dữ liệu báo cáo Sở", "Chỉ số tổng hợp", "Gửi", "QĐ 2768", "16/10 03:00", ok("Hoạt động")],
  ],
};

export const INTEGRATION: Record<string, PreviewSpec> = {
  "platform:tich-hop": {
    intro: "Quản lý kết nối với hệ thống ngoài: lịch đồng bộ, ánh xạ trường dữ liệu theo QĐ 2768, nhật ký lỗi.",
    actions: ["Thêm kết nối"],
    blocks: [CONNECTORS, { kind: "list", title: "Nhật ký lỗi gần đây", items: [
      { title: "Hệ thống thiết bị NCC: 3 mã tài sản không khớp", meta: "15/10 23:00 · BM-TB-0012…", badge: bad("Lỗi") },
    ] }],
  },
  "so:tich-hop": {
    intro: "Đồng bộ dữ liệu với CSDL ngành và trợ lý AI phân tích số liệu đề án (gợi ý, tóm tắt báo cáo).",
    blocks: [CONNECTORS, { kind: "chat", title: "Trợ lý phân tích (AI) — thử nghiệm", desc: "Chỉ dùng số liệu tổng hợp trong phạm vi Sở; không gửi dữ liệu cá nhân.", messages: [
      { from: "Trần Thị Mai", me: true, text: "Những trường nào có hiệu suất phòng STEM dưới 30% và chưa có GV mức 3?", at: "09:02" },
      { from: "Trợ lý", text: "Có 4 trường: THCS Hòa An (18%), TH Tây An (22%), THCS Đông Thành (27%), TH Phú Lộc (29%). Gợi ý ưu tiên cử GV dự khóa 'Thiết kế bài học STEM theo 5E'.", at: "09:02" },
    ] }],
  },
  "truong:tich-hop": {
    intro: "Trạng thái đồng bộ dữ liệu của trường với CSDL ngành; lỗi cần trường sửa.",
    blocks: [
      { kind: "list", title: "Đồng bộ gần nhất", items: [
        { title: "Học sinh & lớp từ CSDL ngành", meta: "16/10 02:00 · 128 bản ghi", badge: ok("Thành công") },
        { title: "Giáo viên từ CSDL ngành", meta: "16/10 02:00 · 2 bản ghi thiếu số định danh", badge: b("Cảnh báo", "warning") },
      ] },
    ],
  },
};
