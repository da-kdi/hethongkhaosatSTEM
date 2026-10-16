import type { PreviewSpec } from "../types";
import { b, bad, mute, ok, pct, warn } from "./_h";

/** Phân hệ 0 · Định hướng & kế hoạch đề án (Bước 1, 2, 5) */
export const PLAN: Record<string, PreviewSpec> = {
  "so:de-an": {
    intro: "Đề án STEM của tỉnh: mục tiêu giai đoạn, kế hoạch năm học, nguồn lực và lộ trình 5 bước triển khai.",
    actions: ["Tạo kế hoạch năm học", "Xuất đề án (PDF)"],
    filters: ["Giai đoạn 2026–2030", "Năm học 2026–2027"],
    kpis: [
      { label: "Mục tiêu giai đoạn", value: 12, hint: "4 nhóm chỉ số" },
      { label: "Trường tham gia", value: "86/112", hint: "77% toàn tỉnh" },
      { label: "Kinh phí năm học", value: "18,6 tỷ", hint: "NSNN 62% · xã hội hóa 38%" },
      { label: "Tiến độ năm học", value: "31%", hint: "Đang ở Bước 3" },
    ],
    blocks: [
      { kind: "steps", title: "Lộ trình 5 bước năm học 2026–2027", steps: [
        { label: "Định hướng từ Tỉnh/Sở", state: "done", note: "Ban hành kế hoạch số 125/KH-SGDĐT ngày 20/8/2026" },
        { label: "Lập kế hoạch", state: "done", note: "84/86 trường đã được duyệt kế hoạch" },
        { label: "Đào tạo và triển khai", state: "current", note: "3/5 đợt bồi dưỡng · 1.240 buổi dạy STEM đã ghi nhận" },
        { label: "Đánh giá vận hành", state: "todo", note: "Dự kiến tháng 1/2027 (giữa kỳ)" },
        { label: "Tổng hợp báo cáo và đề xuất cải tiến", state: "todo", note: "Tháng 6/2027" },
      ] },
      { kind: "bars", title: "Mục tiêu giai đoạn — mức đạt hiện tại", items: [
        { label: "Trường có phòng học STEM", value: 64, max: 112, suffix: " trường" },
        { label: "GV được bồi dưỡng STEM", value: 1430, max: 2200, suffix: " GV" },
        { label: "HS tham gia hoạt động STEM", value: 71 },
        { label: "Trường có CLB Robotics/KHKT", value: 38, max: 112, suffix: " trường", tone: "info" },
      ] },
      { kind: "table", title: "Văn bản chỉ đạo", columns: ["Số hiệu", "Trích yếu", "Ngày ban hành", "Bước", "Trạng thái"], rows: [
        ["125/KH-SGDĐT", "Kế hoạch triển khai giáo dục STEM năm học 2026–2027", "20/08/2026", "1", ok("Hiệu lực")],
        ["131/HD-SGDĐT", "Hướng dẫn xây dựng bài học STEM cấp THCS, THPT", "02/09/2026", "2", ok("Hiệu lực")],
        ["140/CV-SGDĐT", "Tổ chức bồi dưỡng GV cốt cán STEM đợt 1", "18/09/2026", "3", ok("Hiệu lực")],
        ["—", "Bộ tiêu chí đánh giá vận hành phòng STEM (dự thảo)", "—", "4", warn("Dự thảo")],
      ] },
    ],
  },
  "so:bo-chi-so": {
    intro: "Bộ chỉ số đo lường đề án: định nghĩa, công thức, nguồn dữ liệu, tần suất và ngưỡng cảnh báo — dùng chung cho báo cáo các cấp.",
    actions: ["Thêm chỉ số", "Nhập từ Excel"],
    kpis: [
      { label: "Chỉ số đang dùng", value: 24 }, { label: "Tự động từ hệ thống", value: 17, hint: "71%" },
      { label: "Nhập tay từ trường", value: 7 }, { label: "Có ngưỡng cảnh báo", value: 15 },
    ],
    blocks: [
      { kind: "table", title: "Danh mục chỉ số", columns: ["Mã", "Chỉ số", "Công thức", "Nguồn", "Tần suất", "Ngưỡng cảnh báo"], rows: [
        ["CS01", "Tỷ lệ trường có kế hoạch STEM được duyệt", "Số trường có KH duyệt / Tổng số trường", b("Tự động", "info"), "Tháng", "< 90% sau 30/9"],
        ["CS04", "Số buổi dạy STEM bình quân/lớp/học kỳ", "Tổng buổi ghi nhận / Số lớp", b("Tự động", "info"), "Tuần", "< 4 buổi"],
        ["CS07", "Tỷ lệ GV đạt chuẩn năng lực STEM mức 2", "GV đạt mức ≥2 / Tổng GV dạy STEM", b("Tự động", "info"), "Học kỳ", "< 50%"],
        ["CS11", "Hiệu suất sử dụng phòng STEM", "Giờ sử dụng / Giờ khả dụng", b("Tự động", "info"), "Tháng", "< 40%"],
        ["CS15", "Mức hài lòng của HS với hoạt động STEM", "Điểm TB phiếu khảo sát (thang 5)", b("Khảo sát", "warning"), "Học kỳ", "< 3,5"],
        ["CS20", "Kinh phí xã hội hóa huy động", "Tổng giá trị tài trợ", mute("Nhập tay"), "Năm", "—"],
      ] },
    ],
  },
  "so:giao-chi-tieu": {
    intro: "Giao chỉ tiêu cho từng trường theo bộ chỉ số, tiếp nhận và duyệt kế hoạch STEM năm học của trường.",
    actions: ["Giao chỉ tiêu hàng loạt", "Nhắc trường chưa nộp"],
    filters: ["Năm học 2026–2027", "Cấp học: Tất cả", "Trạng thái: Tất cả"],
    kpis: [
      { label: "Đã giao chỉ tiêu", value: "86/86" }, { label: "Kế hoạch đã duyệt", value: 84 },
      { label: "Chờ Sở duyệt", value: 1 }, { label: "Trả lại chỉnh sửa", value: 1 },
    ],
    blocks: [
      { kind: "table", title: "Kế hoạch STEM của trường", columns: ["Trường", "Cấp", "Chỉ tiêu buổi dạy/lớp", "Kế hoạch trường", "Ngày nộp", "Trạng thái"], rows: [
        ["Trường THCS Bình Minh", "THCS", "8", "10 buổi/lớp · 4 CLB", "15/09/2026", ok("Đã duyệt")],
        ["Trường THPT Thanh Sơn", "THPT", "6", "6 buổi/lớp · 2 CLB", "18/09/2026", warn("Chờ Sở duyệt")],
        ["Trường Tiểu học Sao Mai", "TH", "4", "4 buổi/lớp", "12/09/2026", ok("Đã duyệt")],
        ["Trường THCS Hòa An", "THCS", "8", "5 buổi/lớp", "20/09/2026", bad("Trả lại")],
        ["Trường THPT Phú Lộc", "THPT", "6", "8 buổi/lớp · 3 CLB", "14/09/2026", ok("Đã duyệt")],
      ] },
      { kind: "note", title: "Quy tắc duyệt", text: "Kế hoạch trường không được thấp hơn chỉ tiêu Sở giao; khi trả lại phải ghi lý do. Mỗi lần điều chỉnh tạo phiên bản mới và lưu lịch sử." },
    ],
  },
  "truong:chi-tieu": {
    intro: "Chỉ tiêu Sở giao cho trường năm học này và mức độ thực hiện hiện tại.",
    filters: ["Năm học 2026–2027"],
    kpis: [
      { label: "Chỉ tiêu được giao", value: 9 }, { label: "Đúng tiến độ", value: 6 },
      { label: "Chậm tiến độ", value: 2 }, { label: "Chưa bắt đầu", value: 1 },
    ],
    blocks: [
      { kind: "table", title: "Chỉ tiêu & thực hiện", columns: ["Chỉ số", "Chỉ tiêu", "Thực hiện", "Tiến độ", "Đánh giá"], rows: [
        ["Buổi dạy STEM bình quân/lớp/năm", "8 buổi", "3,2 buổi", pct(40), ok("Đúng tiến độ")],
        ["GV được bồi dưỡng STEM", "12 GV", "7 GV", pct(58), ok("Đúng tiến độ")],
        ["Học sinh tham gia CLB STEM", "120 HS", "64 HS", pct(53), ok("Đúng tiến độ")],
        ["Hiệu suất sử dụng phòng STEM", "≥ 50%", "34%", pct(68), warn("Chậm")],
        ["Sản phẩm dự thi KHKT cấp tỉnh", "3 dự án", "0", pct(0), mute("Chưa bắt đầu")],
        ["Hài lòng của học sinh (thang 5)", "≥ 4,0", "3,7", pct(92), warn("Chậm")],
      ] },
    ],
  },
  "truong:ke-hoach": {
    intro: "Kế hoạch STEM năm học của trường: phân bổ theo khối, tổ, giáo viên; gửi tổ góp ý, BGH duyệt và nộp Sở.",
    actions: ["Gửi Sở duyệt", "Tạo phiên bản mới"],
    kpis: [
      { label: "Hoạt động kế hoạch", value: 48 }, { label: "Bài học STEM", value: 32 },
      { label: "Hoạt động trải nghiệm", value: 12 }, { label: "Nghiên cứu KHKT", value: 4 },
    ],
    blocks: [
      { kind: "steps", title: "Quy trình duyệt kế hoạch (phiên bản 2)", steps: [
        { label: "Nháp — QTV/BGH soạn", state: "done", note: "Phạm Thu Hà · 05/09" },
        { label: "Tổ chuyên môn góp ý", state: "done", note: "Tổ KHTN, Tổ Toán – Tin · 09/09" },
        { label: "BGH duyệt", state: "done", note: "12/09" },
        { label: "Sở duyệt", state: "done", note: "Đã duyệt 15/09 · không yêu cầu chỉnh sửa" },
      ] },
      { kind: "table", title: "Phân bổ theo khối", columns: ["Khối", "Số lớp", "Bài học STEM/lớp", "Trải nghiệm", "Tổ phụ trách", "Đã thực hiện"], rows: [
        ["Khối 6", 1, 8, 3, "Tổ KHTN", pct(45)], ["Khối 7", 1, 8, 3, "Tổ Toán – Tin", pct(38)],
        ["Khối 8", 1, 8, 3, "Tổ KHTN", pct(41)], ["Khối 9", 1, 8, 3, "Tổ Toán – Tin", pct(25)],
      ] },
    ],
  },
  "to:ke-hoach": {
    intro: "Kế hoạch chuyên môn STEM của tổ: phân công bài học cho giáo viên, lịch sinh hoạt chuyên môn theo nghiên cứu bài học.",
    actions: ["Gửi BGH", "Phân công GV"],
    blocks: [
      { kind: "table", title: "Phân công bài học STEM của tổ", columns: ["Chủ đề", "Khối/lớp", "Giáo viên", "Tuần dự kiến", "Trạng thái"], rows: [
        ["Hệ thống tưới cây tự động", "6A1", "Ngô Thị Hương", "Tuần 7", ok("Đã dạy")],
        ["Mô hình nhà chống lũ", "8A1", "Hoàng Thị Lan", "Tuần 9", warn("Chuẩn bị")],
        ["Kính tiềm vọng", "6A1", "Ngô Thị Hương", "Tuần 12", mute("Chưa đến")],
        ["Pin chanh và mạch điện đơn giản", "8A1", "Hoàng Thị Lan", "Tuần 14", mute("Chưa đến")],
      ] },
      { kind: "list", title: "Sinh hoạt chuyên môn theo nghiên cứu bài học", items: [
        { title: "Dự giờ & phân tích bài 'Hệ thống tưới cây tự động'", meta: "Thứ Năm 22/10 · Phòng STEM 1", badge: b("Sắp tới", "info") },
        { title: "Thiết kế lại bài 'Mô hình nhà chống lũ'", meta: "Thứ Năm 05/11", badge: mute("Dự kiến") },
      ] },
    ],
  },
};
