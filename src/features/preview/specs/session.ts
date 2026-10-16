import type { PreviewSpec } from "../types";
import { b, bad, mute, ok, pct, warn } from "./_h";

/** Phân hệ 6 · Buổi dạy & điểm danh */
export const SESSION: Record<string, PreviewSpec> = {
  "so:giam-sat-buoi-day": {
    intro: "Giám sát số buổi dạy STEM được ghi nhận, tỷ lệ có minh chứng, chuyên cần học sinh theo trường.",
    filters: ["Tháng 10/2026", "Cấp học: Tất cả"],
    kpis: [{ label: "Buổi dạy ghi nhận", value: 1240 }, { label: "Có minh chứng", value: "87%" }, { label: "Chuyên cần HS", value: "94%" }, { label: "Trường chưa ghi nhận", value: 6 }],
    blocks: [
      { kind: "table", title: "Theo trường", columns: ["Trường", "Buổi dạy", "Kế hoạch tháng", "Đạt", "Minh chứng", "Chuyên cần"], rows: [
        ["THCS Bình Minh", 14, 16, pct(88), ok("100%"), "95%"], ["THPT Thanh Sơn", 9, 12, pct(75), warn("78%"), "92%"],
        ["TH Sao Mai", 8, 8, pct(100), ok("100%"), "97%"], ["THCS Hòa An", 2, 16, pct(13), bad("50%"), "90%"],
      ] },
    ],
  },
  "truong:buoi-day": {
    intro: "Buổi dạy STEM toàn trường: ai dạy, lớp nào, điểm danh, minh chứng; tổng hợp theo tuần/tháng.",
    kpis: [{ label: "Buổi tháng này", value: 14 }, { label: "Đã điểm danh", value: 14 }, { label: "Chờ duyệt minh chứng", value: 2 }, { label: "Chuyên cần", value: "95%" }],
    blocks: [
      { kind: "table", title: "Buổi dạy gần đây", columns: ["Ngày", "Lớp", "Bài học", "Giáo viên", "Có mặt", "Minh chứng"], rows: [
        ["12/10", "6A1", "Tưới cây tự động (1/4)", "Ngô Thị Hương", "31/32", ok("Đã duyệt")],
        ["13/10", "8A1", "Nhà chống lũ (1/4)", "Hoàng Thị Lan", "29/30", warn("Chờ duyệt")],
        ["14/10", "7A1", "Máy bắn đá mini (1/3)", "Vũ Đức Anh", "33/33", warn("Chờ duyệt")],
        ["09/10", "9A1", "Trạm quan trắc (1/5)", "Vũ Đức Anh", "30/31", ok("Đã duyệt")],
      ] },
    ],
  },
  "truong:duyet-minh-chung": {
    intro: "BGH duyệt minh chứng buổi dạy (ảnh, sản phẩm, biên bản) — quy trình W3, có/không qua tổ theo cấu hình.",
    actions: ["Duyệt hàng loạt"],
    blocks: [
      { kind: "cards", title: "Chờ BGH duyệt", items: [
        { title: "8A1 · Nhà chống lũ (1/4)", meta: "Hoàng Thị Lan · 13/10 · 6 ảnh, 1 biên bản", badge: warn("Tổ đã rà soát"), body: "Học sinh làm việc 6 nhóm, thử nghiệm mô hình trong bể nước." },
        { title: "7A1 · Máy bắn đá mini (1/3)", meta: "Vũ Đức Anh · 14/10 · 4 ảnh", badge: warn("Chờ duyệt"), body: "Đo khoảng cách bắn, ghi dữ liệu vào phiếu nhóm." },
      ] },
      { kind: "steps", title: "Quy trình W3", steps: [
        { label: "GV nộp minh chứng sau buổi dạy", state: "done" }, { label: "Tổ trưởng rà soát (bật ở trường này)", state: "done" },
        { label: "BGH duyệt", state: "current" }, { label: "Tính vào chỉ tiêu & báo cáo Sở", state: "todo" },
      ] },
    ],
  },
  "to:duyet-minh-chung": {
    intro: "Tổ trưởng rà soát buổi dạy và minh chứng của giáo viên trong tổ trước khi chuyển BGH.",
    blocks: [
      { kind: "table", title: "Chờ tổ rà soát", columns: ["Ngày", "Giáo viên", "Lớp · Bài", "Minh chứng", "Thao tác"], rows: [
        ["15/10", "Ngô Thị Hương", "6A1 · Tưới cây tự động (2/4)", "5 ảnh", b("Rà soát", "info")],
      ] },
    ],
  },
  "gv:buoi-day": {
    intro: "Mở buổi dạy để điểm danh nhanh, ghi chú và tải minh chứng (dùng được trên điện thoại, cả khi mất mạng — đồng bộ sau).",
    actions: ["Bắt đầu buổi dạy"],
    blocks: [
      { kind: "table", title: "Điểm danh — 6A1 · Tưới cây tự động (2/4) · 19/10", columns: ["Mã HS", "Họ và tên", "Nhóm", "Có mặt", "Ghi chú"], rows: [
        ["BM6A1-01", "Trần Khánh Huy", "Nhóm 1", ok("Có mặt"), "Trưởng nhóm"], ["BM6A1-02", "Lê Đức Quỳnh", "Nhóm 1", ok("Có mặt"), ""],
        ["BM6A1-03", "Nguyễn Minh Châu", "Nhóm 2", bad("Vắng có phép"), "Ốm"], ["BM6A1-04", "Phạm Gia Bảo", "Nhóm 2", ok("Có mặt"), ""],
      ] },
      { kind: "list", title: "Minh chứng", items: [
        { title: "Ảnh hoạt động nhóm (3)", meta: "Tải từ điện thoại", badge: mute("Chưa tải") }, { title: "Sản phẩm nhóm", meta: "Ảnh/video ≤ 50 MB", badge: mute("Chưa tải") },
      ] },
    ],
  },
  "hs:chuyen-can": {
    intro: "Chuyên cần của em ở các buổi học STEM và câu lạc bộ.",
    kpis: [{ label: "Buổi học STEM", value: "7/7" }, { label: "CLB Robotics", value: "5/6" }, { label: "Chuyên cần", value: "92%" }, { label: "Vắng có phép", value: 1 }],
    blocks: [{ kind: "list", title: "Gần đây", items: [
      { title: "Tưới cây tự động (2/4)", meta: "19/10", badge: ok("Có mặt") }, { title: "CLB Robotics", meta: "16/10", badge: b("Vắng có phép", "warning") },
    ] }],
  },
  "ph:chuyen-can": {
    intro: "Chuyên cần của con ở hoạt động STEM; chỉ hiển thị con đã liên kết.",
    kpis: [{ label: "Buổi học STEM", value: "7/7" }, { label: "CLB", value: "5/6" }, { label: "Chuyên cần", value: "92%" }, { label: "Cần lưu ý", value: 0 }],
    blocks: [{ kind: "list", title: "Trần Khánh Huy · 6A1", items: [
      { title: "Tưới cây tự động (2/4)", meta: "19/10 · Cô Ngô Thị Hương", badge: ok("Có mặt") }, { title: "CLB Robotics", meta: "16/10", badge: warn("Vắng có phép") },
    ] }],
  },
};
