import type { PreviewSpec } from "../types";
import { b, bad, mute, ok, pct, warn } from "./_h";

/** Phân hệ 0.1 · Dashboard & báo cáo */
export const REPORT: Record<string, PreviewSpec> = {
  "so:canh-bao": {
    intro: "Trường cần hỗ trợ: tự động phát hiện từ bộ chỉ số (chậm tiến độ, thiếu minh chứng, phòng ít dùng, hài lòng thấp).",
    kpis: [{ label: "Trường có cảnh báo", value: 14 }, { label: "Mức cao", value: 3 }, { label: "Mới trong tuần", value: 4 }, { label: "Đã xử lý", value: 9 }],
    blocks: [
      { kind: "table", title: "Cảnh báo", columns: ["Trường", "Cảnh báo", "Chỉ số", "Mức", "Phát hiện", "Xử lý"], rows: [
        ["THCS Hòa An", "Buổi dạy STEM đạt 13% kế hoạch tháng", "CS04", bad("Cao"), "15/10", mute("Chưa")],
        ["THCS Hòa An", "Kế hoạch bị trả lại chưa nộp lại", "CS01", bad("Cao"), "12/10", b("Đã giao nhiệm vụ", "info")],
        ["TH Tây An", "Hiệu suất phòng STEM 22%", "CS11", warn("Trung bình"), "01/10", mute("Chưa")],
        ["THPT Thanh Sơn", "Minh chứng buổi dạy 78%", "CS05", warn("Trung bình"), "14/10", mute("Chưa")],
      ] },
    ],
  },
  "so:ky-bao-cao": {
    intro: "Kỳ báo cáo định kỳ: mẫu báo cáo, hạn nộp, tỷ lệ trường đã nộp; số liệu tự điền từ hệ thống.",
    actions: ["Mở kỳ báo cáo", "Tổng hợp & xuất"],
    blocks: [
      { kind: "table", title: "Kỳ báo cáo", columns: ["Kỳ", "Mẫu", "Hạn", "Đã nộp", "Tiến độ", "Trạng thái"], rows: [
        ["Tháng 9/2026", "Mẫu BC-01 (tháng)", "05/10", "112/112", pct(100), ok("Đã đóng")],
        ["Tháng 10/2026", "Mẫu BC-01 (tháng)", "05/11", "0/112", pct(0), b("Mở", "info")],
        ["Học kỳ I", "Mẫu BC-02 (học kỳ)", "10/01/2027", "—", pct(0), mute("Chưa mở")],
      ] },
    ],
  },
  "so:de-xuat-cai-tien": {
    intro: "Bước 5: tổng hợp đề xuất cải tiến từ trường, khảo sát, cảnh báo — chọn đưa vào kế hoạch năm sau.",
    actions: ["Thêm đề xuất"],
    blocks: [
      { kind: "cards", title: "Đề xuất đang xem xét", items: [
        { title: "Ghép lịch phòng STEM liên trường", meta: "Từ cảnh báo CS11 · 11 trường", body: "Trường có phòng ít dùng mở cho trường lân cận chưa có phòng.", badge: warn("Đang đánh giá") },
        { title: "Bồi dưỡng thiết bị số cho GV mức 1", meta: "Từ bản đồ năng lực", body: "39% GV chưa tự tin dùng cảm biến, vi điều khiển.", badge: ok("Đưa vào KH 2027–2028") },
        { title: "Rút gọn mẫu báo cáo tháng", meta: "Từ khảo sát CBQL", body: "Bỏ 6 chỉ tiêu đã tự động lấy từ hệ thống.", badge: b("Mới", "info") },
      ] },
    ],
  },
  "so:chat-luong-du-lieu": {
    intro: "Chất lượng dữ liệu các trường: đầy đủ, đúng chuẩn QĐ 2768, cập nhật kịp thời.",
    kpis: [{ label: "Điểm chất lượng TB", value: "86/100" }, { label: "Trường < 70 điểm", value: 7 }, { label: "Lỗi chuẩn mã", value: 41 }, { label: "Hồ sơ thiếu", value: 312 }],
    blocks: [
      { kind: "bars", title: "Theo tiêu chí", items: [
        { label: "Đủ trường bắt buộc", value: 92, tone: "success" }, { label: "Đúng danh mục chuẩn", value: 88 },
        { label: "Mã định danh hợp lệ", value: 79, tone: "warning" }, { label: "Cập nhật trong 30 ngày", value: 84 },
      ] },
      { kind: "table", title: "Lỗi cần sửa", columns: ["Trường", "Loại lỗi", "Số bản ghi", "Ví dụ"], rows: [
        ["THCS Hòa An", "Thiếu ngày sinh học sinh", 86, "ngaySinhNh trống"], ["THPT Thanh Sơn", "Giới tính không theo ISO 5218", 12, "gioiTinh = 'N'"],
      ] },
    ],
  },
  "truong:bao-cao": {
    intro: "Báo cáo định kỳ gửi Sở: số liệu tự điền từ hệ thống, trường bổ sung nhận xét, BGH ký duyệt rồi nộp.",
    actions: ["Lập báo cáo tháng 10"],
    blocks: [
      { kind: "table", title: "Báo cáo của trường", columns: ["Kỳ", "Hạn", "Tự điền", "Trạng thái"], rows: [
        ["Tháng 9/2026", "05/10", "18/20 chỉ tiêu", ok("Đã nộp 03/10")], ["Tháng 10/2026", "05/11", "17/20 chỉ tiêu", mute("Chưa lập")],
      ] },
    ],
  },
  "ncc:bao-cao-trien-khai": {
    intro: "Báo cáo triển khai chương trình tại các trường hợp tác (số liệu tổng hợp theo quyền được cấp).",
    actions: ["Lập báo cáo"],
    blocks: [
      { kind: "table", title: "Theo trường", columns: ["Trường", "Chương trình", "Lớp tham gia", "Buổi đã dạy", "Bảo hành mở"], rows: [
        ["THCS Bình Minh", "Robotics cơ bản", 4, 12, 1], ["THCS Hòa An", "Robotics cơ bản", 3, 5, 1], ["THPT Phú Lộc", "IoT ứng dụng", 2, 8, 0],
      ] },
    ],
  },
};
