import type { PreviewSpec } from "../types";
import { b, bad, mute, ok, warn } from "./_h";

/** Phân hệ 2 · Chương trình & học liệu STEM */
export const PROGRAM: Record<string, PreviewSpec> = {
  "so:khung-chuong-trinh": {
    intro: "Khung chương trình STEM theo cấp học, khối: chủ đề gợi ý, yêu cầu cần đạt, liên môn — làm căn cứ cho kế hoạch của trường.",
    actions: ["Thêm chủ đề", "Ban hành phiên bản"],
    filters: ["Cấp học: THCS", "Phiên bản 2026.1"],
    blocks: [
      { kind: "table", title: "Chủ đề STEM khung — THCS", columns: ["Khối", "Chủ đề", "Môn tích hợp", "Số tiết", "Yêu cầu cần đạt chính", "Trạng thái"], rows: [
        ["6", "Hệ thống tưới cây tự động", "KHTN, Công nghệ, Tin học", 4, "Thiết kế mạch đơn giản; đo độ ẩm", ok("Ban hành")],
        ["7", "Máy bắn đá mini", "Vật lý, Toán, Công nghệ", 3, "Vận dụng đòn bẩy, đo đạc quỹ đạo", ok("Ban hành")],
        ["8", "Mô hình nhà chống lũ", "KHTN, Địa lý, Công nghệ", 4, "Vật liệu, lực đẩy Archimedes", ok("Ban hành")],
        ["9", "Trạm quan trắc môi trường mini", "KHTN, Tin học", 5, "Thu thập & xử lý dữ liệu cảm biến", warn("Dự thảo")],
      ] },
    ],
  },
  "so:tham-dinh": {
    intro: "Thẩm định học liệu do trường, giáo viên, nhà cung cấp gửi lên; công bố vào kho học liệu dùng chung toàn tỉnh.",
    actions: ["Phân công thẩm định"],
    kpis: [{ label: "Chờ thẩm định", value: 7 }, { label: "Đã công bố", value: 126 }, { label: "Yêu cầu sửa", value: 3 }, { label: "Thời gian xử lý TB", value: "6 ngày" }],
    blocks: [
      { kind: "table", title: "Hồ sơ thẩm định", columns: ["Học liệu", "Đơn vị gửi", "Loại", "Ngày gửi", "Người thẩm định", "Trạng thái"], rows: [
        ["Robotics cơ bản khối 6 — v2", "KDI Education (demo)", "Bộ bài học", "10/10/2026", "Trần Thị Mai", warn("Đang thẩm định")],
        ["Kính tiềm vọng", "THCS Bình Minh", "Kế hoạch bài dạy", "08/10/2026", "Trần Thị Mai", ok("Đạt — công bố")],
        ["Cảm biến nhiệt độ với Arduino", "THPT Thanh Sơn", "Video + phiếu học tập", "05/10/2026", "—", b("Chờ phân công", "info")],
        ["Pin chanh", "THCS Hòa An", "Kế hoạch bài dạy", "01/10/2026", "Trần Thị Mai", bad("Yêu cầu sửa")],
      ] },
      { kind: "steps", title: "Quy trình thẩm định (W7)", steps: [
        { label: "Đơn vị gửi học liệu", state: "done" }, { label: "Sở phân công thẩm định", state: "done" },
        { label: "Thẩm định theo tiêu chí (nội dung, an toàn, bản quyền)", state: "current" },
        { label: "Công bố vào kho dùng chung / trả lại", state: "todo" },
      ] },
    ],
  },
  "truong:hoc-lieu": {
    intro: "Kho học liệu trường dùng: học liệu Sở công bố, học liệu nhà cung cấp được cấp quyền và học liệu do giáo viên trường biên soạn.",
    actions: ["Thêm học liệu", "Gửi Sở thẩm định"],
    filters: ["Nguồn: Tất cả", "Khối: Tất cả", "Môn: Tất cả"],
    blocks: [
      { kind: "cards", title: "Học liệu nổi bật", items: [
        { title: "Hệ thống tưới cây tự động", meta: "Kho Sở · Khối 6 · 4 tiết", badge: ok("Đã thẩm định"), body: "Kế hoạch bài dạy, phiếu học tập, rubric đánh giá sản phẩm." },
        { title: "Robotics cơ bản khối 6", meta: "KDI Education (demo) · 12 bài", badge: b("Theo hợp đồng", "info"), body: "Bộ bài học kèm bộ kit; dùng trong thời hạn cấp quyền." },
        { title: "Kính tiềm vọng", meta: "GV Ngô Thị Hương · Khối 6", badge: ok("Đã công bố"), body: "Học liệu của trường đã được Sở công bố dùng chung." },
        { title: "Trạm quan trắc môi trường mini", meta: "Tổ Toán – Tin · Khối 9", badge: mute("Nội bộ"), body: "Đang thử nghiệm, chưa gửi thẩm định." },
      ] },
    ],
  },
  "to:hoc-lieu": {
    intro: "Học liệu tổ đang dùng và đang biên soạn; tổ trưởng rà soát trước khi gửi trường/Sở.",
    actions: ["Rà soát học liệu"],
    blocks: [
      { kind: "table", title: "Học liệu của tổ", columns: ["Tên", "Tác giả", "Khối", "Phiên bản", "Trạng thái"], rows: [
        ["Kính tiềm vọng", "Ngô Thị Hương", 6, "v3", ok("Đã công bố")],
        ["Mô hình nhà chống lũ", "Hoàng Thị Lan", 8, "v1", warn("Tổ rà soát")],
        ["Pin chanh và mạch điện", "Hoàng Thị Lan", 8, "v1", mute("Nháp")],
      ] },
    ],
  },
  "gv:hoc-lieu": {
    intro: "Kế hoạch bài dạy STEM và học liệu của bạn; dùng mẫu theo quy trình thiết kế kỹ thuật, chia sẻ cho tổ.",
    actions: ["Soạn kế hoạch bài dạy", "Dùng mẫu từ kho Sở"],
    blocks: [
      { kind: "list", title: "Kế hoạch bài dạy của tôi", items: [
        { title: "Hệ thống tưới cây tự động — 6A1", meta: "Cập nhật 12/10 · đã dạy tuần 7", badge: ok("Đã dạy") },
        { title: "Kính tiềm vọng — 6A1", meta: "Cập nhật 14/10 · dạy tuần 12", badge: warn("Đang soạn") },
      ] },
      { kind: "steps", title: "Khung bài học STEM (quy trình thiết kế kỹ thuật)", steps: [
        { label: "Xác định vấn đề", state: "done" }, { label: "Nghiên cứu kiến thức nền", state: "done" },
        { label: "Đề xuất & lựa chọn giải pháp", state: "current" }, { label: "Chế tạo mẫu, thử nghiệm, đánh giá", state: "todo" },
        { label: "Chia sẻ, thảo luận, điều chỉnh", state: "todo" },
      ] },
    ],
  },
  "hs:hoc-lieu": {
    intro: "Tài liệu, video, phiếu học tập giáo viên giao cho lớp em.",
    blocks: [
      { kind: "cards", title: "Tài liệu của lớp 6A1", items: [
        { title: "Phiếu học tập: Độ ẩm đất", meta: "Cô Ngô Thị Hương · Hạn 20/10", badge: ok("Đã nộp") },
        { title: "Video: Cảm biến hoạt động thế nào?", meta: "6 phút", badge: b("Mới", "info") },
        { title: "Hướng dẫn an toàn phòng STEM", meta: "Bắt buộc đọc", badge: ok("Đã xem") },
      ] },
    ],
  },
  "ncc:san-pham": {
    intro: "Danh mục chương trình, bộ học liệu của đơn vị; quản lý phiên bản và gửi Sở thẩm định (W7).",
    actions: ["Thêm chương trình", "Gửi thẩm định"],
    blocks: [
      { kind: "table", title: "Chương trình & học liệu", columns: ["Chương trình", "Cấp học", "Số bài", "Phiên bản", "Thẩm định", "Trường đang dùng"], rows: [
        ["Robotics cơ bản", "THCS", 12, "v2", warn("Đang thẩm định"), 18],
        ["IoT ứng dụng", "THPT", 10, "v1", ok("Đã công bố"), 6],
        ["Scratch sáng tạo", "TH", 8, "v1", mute("Chưa gửi"), 0],
      ] },
    ],
  },
};
