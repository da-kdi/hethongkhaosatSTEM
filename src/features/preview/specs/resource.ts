import type { PreviewSpec } from "../types";
import { b, bad, mute, ok, warn } from "./_h";

/** Phân hệ 3 · Thiết bị, vật tư & phòng STEM */
export const RESOURCE: Record<string, PreviewSpec> = {
  "so:hieu-qua-thiet-bi": {
    intro: "Hiệu quả đầu tư phòng STEM và thiết bị toàn tỉnh: hiệu suất sử dụng, tình trạng, chi phí trên giờ sử dụng.",
    filters: ["Năm học 2026–2027", "Cấp học: Tất cả"],
    kpis: [{ label: "Phòng STEM", value: 64 }, { label: "Hiệu suất TB", value: "46%" }, { label: "Thiết bị hỏng", value: "3,1%" }, { label: "Phòng dưới 30%", value: 11 }],
    blocks: [
      { kind: "bars", title: "Hiệu suất sử dụng phòng STEM theo trường (top/bottom)", items: [
        { label: "THPT Phú Lộc", value: 78, tone: "success" }, { label: "THCS Bình Minh", value: 34 },
        { label: "THPT Thanh Sơn", value: 52 }, { label: "THCS Hòa An", value: 18, tone: "danger" }, { label: "TH Tây An", value: 22, tone: "warning" },
      ] },
      { kind: "note", title: "Gợi ý", text: "11 phòng dưới 30%: đề xuất ghép lịch liên trường hoặc tăng tiết CLB buổi chiều.", tone: "warning" },
    ],
  },
  "truong:phong-thiet-bi": {
    intro: "Danh sách phòng STEM, thiết bị theo phòng, mã tài sản, tình trạng và hiệu suất sử dụng.",
    actions: ["Thêm thiết bị", "Kiểm kê"],
    kpis: [{ label: "Phòng STEM", value: 2 }, { label: "Thiết bị", value: 146 }, { label: "Đang hỏng", value: 4 }, { label: "Hiệu suất tháng", value: "34%" }],
    blocks: [
      { kind: "cards", title: "Phòng", items: [
        { title: "Phòng STEM 1 — Tầng 2 nhà A", meta: "40 chỗ · 86 thiết bị", body: "Bàn nhóm, máy in 3D, bộ kit robotics ×10.", progress: 41, badge: ok("Hoạt động") },
        { title: "Phòng STEM 2 — Tầng 1 nhà B", meta: "30 chỗ · 60 thiết bị", body: "Phòng thí nghiệm KHTN kết hợp.", progress: 27, badge: ok("Hoạt động") },
      ] },
      { kind: "table", title: "Thiết bị", columns: ["Mã tài sản", "Tên", "Phòng", "Số lượng", "Nguồn", "Tình trạng"], rows: [
        ["BM-TB-0012", "Bộ kit robotics cơ bản", "STEM 1", 10, "KDI Education (demo)", ok("Tốt")],
        ["BM-TB-0031", "Máy in 3D", "STEM 1", 1, "Ngân sách 2025", warn("Cần bảo trì")],
        ["BM-TB-0044", "Cảm biến độ ẩm đất", "STEM 2", 24, "Ngân sách 2026", ok("Tốt")],
        ["BM-TB-0051", "Kính hiển vi điện tử", "STEM 2", 4, "Xã hội hóa", bad("Hỏng 1")],
      ] },
    ],
  },
  "truong:vat-tu": {
    intro: "Vật tư tiêu hao cho hoạt động STEM: tồn kho, nhập, xuất theo buổi dạy và cảnh báo dưới mức tối thiểu.",
    actions: ["Nhập kho", "Xuất cho buổi dạy"],
    kpis: [{ label: "Mặt hàng", value: 38 }, { label: "Dưới mức tối thiểu", value: 3 }, { label: "Xuất tháng này", value: 126 }, { label: "Giá trị tồn", value: "12,4 tr" }],
    blocks: [
      { kind: "table", title: "Tồn kho", columns: ["Vật tư", "Đơn vị", "Tồn", "Tối thiểu", "Xuất 30 ngày", "Cảnh báo"], rows: [
        ["Dây nối jumper", "bó", 6, 10, 9, bad("Dưới mức")], ["Pin AA", "viên", 120, 50, 64, ok("Đủ")],
        ["Nhựa in 3D PLA", "cuộn", 2, 3, 2, bad("Dưới mức")], ["Bìa cứng A3", "tờ", 200, 100, 40, ok("Đủ")],
        ["Keo nến", "thanh", 30, 40, 22, warn("Sắp hết")],
      ] },
    ],
  },
  "truong:bao-tri": {
    intro: "Phiếu báo hỏng, bảo trì định kỳ và bảo hành với nhà cung cấp.",
    actions: ["Báo hỏng", "Lập lịch bảo trì"],
    blocks: [
      { kind: "table", title: "Phiếu bảo trì & bảo hành", columns: ["Mã phiếu", "Thiết bị", "Mô tả", "Gửi tới", "Ngày", "Trạng thái"], rows: [
        ["BT-0921", "Máy in 3D", "Kẹt đầu in", "Tổ thiết bị trường", "10/10", warn("Đang xử lý")],
        ["BH-0107", "Bộ kit robotics #07", "Động cơ không quay", "KDI Education (demo)", "08/10", b("NCC đã tiếp nhận", "info")],
        ["BT-0915", "Kính hiển vi #3", "Vỡ thấu kính", "—", "02/10", bad("Chờ kinh phí")],
        ["BT-0901", "Máy chiếu STEM 1", "Bảo trì định kỳ", "Tổ thiết bị trường", "25/09", ok("Hoàn thành")],
      ] },
    ],
  },
  "ncc:ho-tro": {
    intro: "Yêu cầu bảo hành, hỗ trợ kỹ thuật từ các trường đã cấp quyền; theo dõi thời gian phản hồi theo cam kết.",
    kpis: [{ label: "Đang mở", value: 5 }, { label: "Quá hạn cam kết", value: 1 }, { label: "Phản hồi TB", value: "9 giờ" }, { label: "Đóng tháng này", value: 21 }],
    blocks: [
      { kind: "table", title: "Yêu cầu hỗ trợ", columns: ["Mã", "Trường", "Thiết bị", "Mô tả", "Hạn cam kết", "Trạng thái"], rows: [
        ["BH-0107", "THCS Bình Minh", "Bộ kit robotics #07", "Động cơ không quay", "15/10", bad("Quá hạn")],
        ["BH-0110", "THCS Hòa An", "Bộ kit robotics #02", "Thiếu cảm biến siêu âm", "18/10", warn("Đang xử lý")],
        ["HT-0045", "THPT Phú Lộc", "Bo mạch IoT", "Hướng dẫn nạp firmware", "17/10", b("Đã phản hồi", "info")],
        ["HT-0041", "THCS Bình Minh", "Phần mềm lập trình khối", "Cấp lại tài khoản", "12/10", mute("Đã đóng")],
      ] },
      { kind: "bars", title: "Tỷ lệ xử lý đúng hạn theo tháng", items: [
        { label: "Tháng 8", value: 92, tone: "success" }, { label: "Tháng 9", value: 88 }, { label: "Tháng 10", value: 81, tone: "warning" },
      ] },
    ],
  },
};
