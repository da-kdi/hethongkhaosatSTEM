import type { PreviewSpec } from "../types";
import { b, bad, mute, ok, pct, warn } from "./_h";
import { LEVEL_LABEL, LEVEL_RULE, SCHOOL_RANKING, WARDS } from "@/demo/insights";

const LV = { 3: ok, 2: (t: string) => b(t), 1: warn, 0: bad } as const;

/** Mục bổ sung cho cổng Sở và Trường (16/10) */
export const EXTRA: Record<string, PreviewSpec> = {
  // ---------------- SỞ ----------------
  "so:xep-hang": {
    intro: "Chỉ số STEM tổng hợp theo trường và xã/phường; phân loại 4 mức theo ngưỡng Sở cấu hình trong Bộ chỉ số.",
    actions: ["Xuất bảng xếp hạng", "Cấu hình ngưỡng"],
    filters: ["Học kỳ I", "Cấp học: Tất cả", "Xếp theo: Chỉ số STEM"],
    kpis: [
      { label: LEVEL_LABEL[3], value: WARDS.filter((w) => w.level === 3).length, hint: LEVEL_RULE[3] },
      { label: LEVEL_LABEL[2], value: WARDS.filter((w) => w.level === 2).length, hint: LEVEL_RULE[2] },
      { label: LEVEL_LABEL[1], value: WARDS.filter((w) => w.level === 1).length, hint: LEVEL_RULE[1] },
      { label: LEVEL_LABEL[0], value: WARDS.filter((w) => w.level === 0).length, hint: LEVEL_RULE[0] },
    ],
    blocks: [
      { kind: "table", title: "Xếp hạng trường (chỉ số STEM, thang 100)", columns: ["#", "Trường", "Xã/phường", "Chỉ số", "So với kỳ trước", "Phân loại"], rows: SCHOOL_RANKING.map((r, i) => [
        i + 1, r.name, r.ward, pct(r.index), r.delta > 0 ? `+${r.delta}` : String(r.delta),
        r.index >= 80 ? ok("Tốt") : r.index >= 65 ? b("Khá") : r.index >= 40 ? warn("Đạt") : bad("Cần hỗ trợ"),
      ]) },
      { kind: "table", title: "Theo xã/phường", columns: ["Xã/phường", "Số trường", "Bao phủ STEM", "GV đã bồi dưỡng", "Mức"], rows: [...WARDS].sort((a, c) => c.coverage - a.coverage).slice(0, 10).map((w) => [
        w.name, w.schools, pct(w.coverage), pct(w.trained), LV[w.level](LEVEL_LABEL[w.level]),
      ]) },
      { kind: "bars", title: "Cách tính chỉ số STEM (6 trụ cột, trọng số)", items: [
        { label: "Kế hoạch & quản trị", value: 15 }, { label: "Đội ngũ", value: 20 }, { label: "Cơ sở vật chất", value: 15 },
        { label: "Dạy học STEM", value: 25 }, { label: "Đánh giá & sản phẩm", value: 15 }, { label: "Dữ liệu & báo cáo", value: 10 },
      ] },
    ],
  },
  "so:bao-cao-bo": {
    intro: "Tổng hợp số liệu theo mẫu báo cáo của Bộ GD&ĐT từ dữ liệu chuẩn QĐ 2768; Lãnh đạo Sở duyệt, ký số và gửi.",
    actions: ["Lập báo cáo", "Xem mẫu của Bộ"],
    blocks: [
      { kind: "table", title: "Báo cáo gửi Bộ", columns: ["Báo cáo", "Kỳ", "Hạn", "Tự điền", "Trạng thái"], rows: [
        ["Báo cáo triển khai giáo dục STEM", "Năm học 2025–2026", "15/07/2026", pct(100), ok("Đã gửi")],
        ["Báo cáo sơ kết HK I", "HK I 2026–2027", "15/01/2027", pct(74), warn("Đang lập")],
        ["Thống kê phòng học bộ môn & STEM", "Năm học 2026–2027", "30/11/2026", pct(92), b("Chờ lãnh đạo duyệt", "info")],
      ] },
      { kind: "steps", title: "Quy trình", steps: [
        { label: "Hệ thống tự điền từ dữ liệu các trường", state: "done" },
        { label: "Chuyên viên rà soát, bổ sung nhận xét", state: "done" },
        { label: "Lãnh đạo Sở duyệt & ký số", state: "current" },
        { label: "Gửi Bộ & lưu bản đã khóa số liệu", state: "todo" },
      ] },
    ],
  },
  "so:chuong-trinh-trien-khai": {
    intro: "Chương trình/gói STEM đang triển khai tại các trường: nhà cung cấp, cấp học, số trường và lớp tham gia, mức bao phủ.",
    filters: ["Cấp học: Tất cả", "Nhà cung cấp: Tất cả"],
    kpis: [{ label: "Chương trình", value: 7 }, { label: "Trường triển khai", value: 64 }, { label: "Lớp tham gia", value: "1.120" }, { label: "Đã thẩm định", value: "6/7" }],
    blocks: [
      { kind: "table", title: "Chương trình", columns: ["Chương trình", "Đơn vị cung cấp", "Cấp học", "Trường", "Lớp", "Thẩm định"], rows: [
        ["Bài học STEM theo khung Sở", "Sở GD&ĐT", "TH · THCS · THPT", 112, 860, ok("Ban hành")],
        ["Robotics cơ bản", "KDI Education (demo)", "THCS", 18, 74, warn("v2 đang thẩm định")],
        ["IoT ứng dụng", "KDI Education (demo)", "THPT", 6, 22, ok("Đã công bố")],
        ["Lập trình Scratch", "Công ty Robotic Việt (demo)", "Tiểu học", 9, 41, ok("Đã công bố")],
      ] },
    ],
  },
  // ---------------- TRƯỜNG ----------------
  "truong:ho-so-truong": {
    intro: "Thông tin cơ sở giáo dục theo chuẩn QĐ 2768 (mã định danh, loại hình, cấp học, địa bàn), điểm trường và quy mô — đồng bộ với CSDL ngành.",
    actions: ["Cập nhật hồ sơ", "Đồng bộ CSDL ngành"],
    blocks: [
      { kind: "form", title: "Thông tin chung", fields: [
        { label: "Tên cơ sở giáo dục (tenCsgd)", value: "Trường THCS Bình Minh" }, { label: "Mã định danh (maDinhDanh)", value: "AH00010201" },
        { label: "Loại hình (loaiHinhCsgd)", value: "Công lập" }, { label: "Cấp học (capHoc)", value: "THCS" },
        { label: "Tỉnh/thành", value: "Tỉnh An Hòa (giả định)" }, { label: "Xã/phường", value: "Phường Đông Thành" },
        { label: "Địa chỉ (diaChiCsgd)", value: "Số 12 đường Giả Định, Phường Đông Thành", wide: true },
        { label: "Website (BG_00438)", value: "https://thcsbinhminh.demo" }, { label: "Email (BG_00436)", value: "c2binhminh@anhoa.demo" },
      ], submit: "Lưu" },
      { kind: "cards", title: "Quy mô", items: [
        { title: "4 lớp · 128 học sinh", meta: "Khối 6–9" }, { title: "14 cán bộ, giáo viên", meta: "9 GV dạy STEM" },
        { title: "2 phòng STEM · 1 góc Robotics", meta: "146 thiết bị" }, { title: "1 điểm trường", meta: "Điểm chính" },
      ] },
    ],
  },
  "truong:goi-stem": {
    intro: "Chương trình STEM trường đang triển khai: khung của Sở và chương trình của nhà cung cấp được cấp quyền; lớp tham gia và tiến độ.",
    blocks: [
      { kind: "cards", title: "Đang triển khai", items: [
        { title: "Bài học STEM theo khung Sở", meta: "Sở GD&ĐT · khối 6–9 · 32 bài", body: "Tích hợp chính khóa theo kế hoạch năm học.", badge: ok("Bắt buộc"), progress: 41 },
        { title: "Robotics cơ bản", meta: "KDI Education (demo) · CLB · 24 HS", body: "12 bài · bộ kit ×10 · quyền dữ liệu mức tổng hợp đến 30/06/2027.", badge: b("Theo hợp tác", "info"), progress: 50 },
      ] },
      { kind: "table", title: "Lớp tham gia", columns: ["Lớp", "Chương trình", "Bài đã học", "GV phụ trách", "Tiến độ"], rows: [
        ["6A1", "Khung Sở", "3/8", "Ngô Thị Hương", pct(38)], ["8A1", "Khung Sở", "2/8", "Hoàng Thị Lan", pct(25)],
        ["CLB Robotics", "Robotics cơ bản", "6/12", "Vũ Đức Anh", pct(50)],
      ] },
    ],
  },
  "truong:ppct": {
    intro: "Phân phối chủ đề/tiết STEM theo tuần cho từng khối; liên kết môn tích hợp và yêu cầu cần đạt — căn cứ để xếp lịch dạy.",
    actions: ["Nhập PPCT từ Excel", "Sao chép từ năm trước"],
    filters: ["Khối 6", "Học kỳ I"],
    blocks: [
      { kind: "table", title: "PPCT STEM — Khối 6, HK I", columns: ["Tuần", "Chủ đề", "Tiết", "Môn tích hợp", "Yêu cầu cần đạt", "Trạng thái"], rows: [
        ["5–6", "An toàn phòng STEM & quy trình thiết kế kỹ thuật", 2, "Công nghệ", "Nêu được 5 bước thiết kế", ok("Đã dạy")],
        ["7–8", "Hệ thống tưới cây tự động", 4, "KHTN, Tin học", "Lắp mạch cảm biến độ ẩm", warn("Đang dạy")],
        ["12–13", "Kính tiềm vọng", 3, "KHTN (quang học)", "Vận dụng phản xạ ánh sáng", mute("Chưa đến")],
        ["16–17", "Trưng bày sản phẩm cuối kỳ", 2, "Liên môn", "Thuyết trình sản phẩm", mute("Chưa đến")],
      ] },
    ],
  },
  "truong:tkb": {
    intro: "Cấu hình ca học, tiết học và thời khóa biểu STEM theo tuần; dùng chung cho đặt phòng và điểm danh.",
    actions: ["Cấu hình tiết học", "Nhập TKB"],
    blocks: [
      { kind: "table", title: "Cấu hình tiết học", columns: ["Ca", "Tiết", "Bắt đầu", "Kết thúc", "Ghi chú"], rows: [
        ["Sáng", "1–2", "07:30", "09:00", "Tiết đôi STEM"], ["Sáng", "3–4", "09:15", "10:45", ""], ["Chiều", "CLB", "14:00", "16:00", "Thứ Hai, Thứ Sáu"],
      ] },
      { kind: "week", title: "TKB STEM tuần 7", days: [
        { day: "Thứ Hai", items: [{ time: "Tiết 1–2", label: "6A1 · STEM", meta: "Phòng STEM 1" }, { time: "CLB", label: "Robotics", meta: "Phòng STEM 1", tone: "info" }] },
        { day: "Thứ Ba", items: [{ time: "Tiết 3–4", label: "8A1 · STEM", meta: "Phòng STEM 2" }] },
        { day: "Thứ Tư", items: [{ time: "Tiết 1–2", label: "7A1 · STEM", meta: "Phòng STEM 1" }] },
        { day: "Thứ Năm", items: [{ time: "Tiết 3–4", label: "9A1 · STEM", meta: "Phòng STEM 2" }] },
        { day: "Thứ Sáu", items: [{ time: "CLB", label: "Robotics", meta: "Phòng STEM 1", tone: "info" }] },
      ] },
    ],
  },
  "truong:co-so": {
    intro: "Tòa nhà, tầng và phòng học của trường — nền cho quản lý phòng STEM, đặt lịch và kiểm kê thiết bị.",
    actions: ["Thêm tòa nhà", "Thêm phòng"],
    blocks: [
      { kind: "table", title: "Phòng theo tòa nhà", columns: ["Tòa nhà", "Tầng", "Phòng", "Loại", "Sức chứa", "Trạng thái"], rows: [
        ["Nhà A", 2, "Phòng STEM 1", b("Phòng STEM", "info"), 40, ok("Hoạt động")],
        ["Nhà B", 1, "Phòng STEM 2", b("Phòng STEM", "info"), 30, ok("Hoạt động")],
        ["Thư viện", 1, "Góc Robotics", b("Không gian STEM", "info"), 16, warn("Bảo trì")],
        ["Nhà A", 1, "Phòng Tin học", mute("Bộ môn"), 40, ok("Hoạt động")],
      ] },
    ],
  },
};
