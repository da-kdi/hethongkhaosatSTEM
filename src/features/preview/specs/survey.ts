import type { PreviewSpec } from "../types";
import { b, bad, mute, ok, pct, warn } from "./_h";

/**
 * Phân hệ 0.2 · Khảo sát — theo các module của hệ thống khảo sát KDI (github.com/da-kdi/khaosat-kdi):
 *  01 Survey Workspace · 02 Dynamic Form Builder · 03 Survey Distribution · 04 Response Intelligence.
 * Gắn vào quy trình đề án: khảo sát hiện trạng (Bước 1), hài lòng & nhu cầu (Bước 4), đánh giá tập huấn (Bước 3).
 */

const STATUS = {
  draft: mute("Nháp"), published: ok("Đang mở"), paused: warn("Tạm dừng"), closed: b("Đã đóng", "info"), archived: mute("Lưu trữ"),
};

const RESPOND: PreviewSpec = {
  intro: "Phiếu khảo sát bạn được mời trả lời. Bài làm tự lưu nháp — có thể dừng và tiếp tục trên thiết bị khác bằng cùng tài khoản.",
  kpis: [{ label: "Đang chờ trả lời", value: 1 }, { label: "Đã trả lời năm học này", value: 3 }, { label: "Hạn gần nhất", value: "30/11" }, { label: "Thời gian ước tính", value: "~5 phút" }],
  blocks: [
    { kind: "cards", title: "Phiếu được mời", span: 2, items: [
      { title: "Mức độ hài lòng với hoạt động STEM — HK I", meta: "Sở GD&ĐT · Hạn 30/11 · 12 câu · ẩn danh", badge: b("Đã lưu nháp 40%", "warning"), progress: 40 },
      { title: "Nhu cầu bồi dưỡng năm 2027", meta: "Sở GD&ĐT · Hạn 15/11 · 8 câu", badge: ok("Đã trả lời") },
      { title: "Góp ý CLB Robotics", meta: "THCS Bình Minh · Hạn 25/10 · 5 câu", badge: ok("Đã trả lời") },
    ] },
    { kind: "questions", title: "Đang trả lời: Mức độ hài lòng với hoạt động STEM — HK I", desc: "Phần 2/3 · Trải nghiệm học tập", progress: 40, span: 2, submit: "Tiếp tục", questions: [
      { type: "rating", title: "Em đánh giá chung các buổi học STEM học kỳ này", max: 5, value: 4, required: true },
      { type: "matrix", title: "Mức độ đồng ý với các nhận định sau", rows: ["Bài học gắn với thực tế", "Em được tự tay làm sản phẩm", "Thầy cô hướng dẫn rõ ràng"], cols: ["Rất không đồng ý", "Không đồng ý", "Trung lập", "Đồng ý", "Rất đồng ý"], picks: [3, 4, 3] },
      { type: "multi", title: "Em muốn học thêm chủ đề nào?", options: ["Robotics", "Lập trình", "Trí tuệ nhân tạo", "Năng lượng xanh"], selected: [0, 2] },
      { type: "text", title: "Điều gì khiến em chưa hài lòng?", long: true, placeholder: "Không bắt buộc…", logic: "câu 1 ≤ 3 sao" },
    ] },
  ],
};

const BUILDER: PreviewSpec = {
  intro: "Trình tạo phiếu kéo-thả: phần, câu hỏi, khối nội dung; logic hiển thị/bắt buộc theo điều kiện AND/OR; tự lưu, hoàn tác; xem trước máy tính/điện thoại. Mỗi lần xuất bản tạo phiên bản bất biến — phản hồi luôn gắn đúng phiên bản đã trả lời.",
  actions: ["Tạo khảo sát", "Tạo từ mẫu", "Nhân bản"],
  filters: ["Dự án: Đề án STEM 2026–2027", "Trạng thái: Tất cả", "Người tạo: Tất cả"],
  blocks: [
    { kind: "table", title: "Khảo sát của đơn vị", desc: "Vòng đời: Nháp → Đang mở → Tạm dừng → Đã đóng → Lưu trữ", columns: ["Khảo sát", "Đối tượng", "Phiên bản", "Câu hỏi", "Phản hồi", "Trạng thái"], rows: [
      ["Hiện trạng phòng & thiết bị STEM 2026", "QTV trường", "v3", 24, "112/112", STATUS.closed],
      ["Mức độ hài lòng với hoạt động STEM — HK I", "HS · PH · GV", "v2", 12, "9.840", STATUS.published],
      ["Nhu cầu bồi dưỡng năm 2027", "Giáo viên", "v1", 8, "1.208", STATUS.published],
      ["Đánh giá khóa 'Robotics cơ bản cho GV THCS'", "Học viên khóa", "v1", 10, "64", STATUS.paused],
      ["Nhu cầu chủ đề STEM 2027–2028", "BGH trường", "—", 18, "0", STATUS.draft],
    ] },
    { kind: "chips", title: "Thư viện loại câu hỏi (33 loại)", desc: "Mở rộng bằng cách thêm định nghĩa vào registry — không cần sửa giao diện", groups: [
      { label: "A · Lựa chọn", items: ["Một lựa chọn", "Nhiều lựa chọn", "Danh sách thả xuống", "Có/Không", "Xếp hạng thứ tự", "Đánh giá sao", "Thang Likert", "Ma trận", "NPS 0–10"] },
      { label: "B · Văn bản & số", items: ["Văn bản ngắn", "Đoạn văn", "Số", "Ngày", "Giờ", "Email", "Số điện thoại"] },
      { label: "C · Nâng cao", items: ["Địa chỉ (34 tỉnh/thành mới)", "Thông tin liên hệ", "Số lượng theo nhóm", "Danh mục × cấp độ", "Tải tệp lên", "Đồng ý xử lý dữ liệu"] },
      { label: "D · Khối nội dung", items: ["Tiêu đề", "Đoạn văn", "Hộp hướng dẫn", "Ảnh", "Video (YouTube/Vimeo/MP4)", "Liên kết/tài liệu", "Phân cách"] },
    ] },
    { kind: "list", title: "Cấu trúc phiếu: Hài lòng hoạt động STEM — HK I (v2)", items: [
      { title: "Phần 1 · Thông tin chung", meta: "3 câu · Đối tượng (HS/PH/GV), trường (tự điền theo tài khoản), lớp", badge: b("Mã câu đã khóa", "info") },
      { title: "Phần 2 · Trải nghiệm học tập", meta: "5 câu · đánh giá sao, ma trận Likert, nhiều lựa chọn", badge: b("Hiện khi: đối tượng = HS", "warning") },
      { title: "Phần 3 · Góc nhìn phụ huynh", meta: "3 câu · NPS + câu mở", badge: b("Hiện khi: đối tượng = PH", "warning") },
      { title: "Kiểm tra logic", meta: "Không có tham chiếu sai, không có vòng lặp điều kiện", badge: ok("Hợp lệ") },
    ] },
    { kind: "note", title: "Quy tắc an toàn dữ liệu", text: "Câu hỏi chứa dữ liệu cá nhân được gắn cờ PII và bị ẩn khỏi phân tích tổng hợp. Lựa chọn đã có dữ liệu chỉ được ẩn, không xóa; mã câu hỏi khóa sau khi xuất bản để báo cáo các kỳ so sánh được." },
  ],
};

const TEMPLATES: PreviewSpec = {
  intro: "Mẫu khảo sát dùng chung — dựng 100% bằng trình tạo, dùng lại cho mọi trường; Sở có thể ban hành mẫu bắt buộc cho kỳ khảo sát toàn tỉnh.",
  actions: ["Lưu khảo sát thành mẫu"],
  blocks: [
    { kind: "cards", title: "Mẫu theo quy trình đề án", items: [
      { title: "Khảo sát nhu cầu chủ đề STEM", meta: "Bước 1–2 · 18 câu · ~8 phút", body: "Cấp học, số lớp theo khối (hiện theo cấp), chủ đề × cấp độ có số lớp dự kiến, hình thức triển khai, phòng STEM, kinh phí, xếp hạng ưu tiên.", badge: b("Mẫu Sở", "info") },
      { title: "Hiện trạng phòng & thiết bị STEM", meta: "Bước 1 · 24 câu", body: "Số phòng, loại phòng, thiết bị theo danh mục, tình trạng, nhu cầu bổ sung — đối chiếu với Phân hệ 3.", badge: b("Mẫu Sở", "info") },
      { title: "Đánh giá khóa tập huấn", meta: "Bước 3 · 10 câu", body: "Đánh giá chung, ma trận khía cạnh (nội dung, giảng viên, cơ sở vật chất, tổ chức), Likert áp dụng, NPS + lý do khi ≤ 6.", badge: ok("Phổ biến") },
      { title: "Mức độ hài lòng hoạt động STEM", meta: "Bước 4 · 12 câu", body: "Phân nhánh theo đối tượng HS/PH/GV; kết quả vào chỉ số CS15 của Bộ chỉ số.", badge: ok("Phổ biến") },
      { title: "Đăng ký sự kiện / ngày hội STEM", meta: "Bước 3 · 6 câu", body: "Thông tin liên hệ (PII), vai trò, số người tham dự, ngày mong muốn.", badge: mute("Mẫu chung") },
      { title: "Góp ý câu lạc bộ STEM", meta: "Trường tự tạo · 5 câu", body: "Mẫu của THCS Bình Minh, chia sẻ cho trường khác.", badge: mute("Mẫu trường") },
    ] },
  ],
};

const DISTRIBUTION: PreviewSpec = {
  intro: "Phát phiếu theo đơn vị/vai trò trong hệ thống hoặc ra ngoài: link công khai, mã truy cập, lời mời riêng dùng một lần (token 128-bit, chỉ lưu bản băm, thu hồi được), mã QR có logo.",
  actions: ["Tạo lời mời", "Tải mã QR"],
  filters: ["Khảo sát: Hài lòng hoạt động STEM — HK I"],
  kpis: [{ label: "Lời mời đã gửi", value: "16.120" }, { label: "Đã mở", value: "11.304" }, { label: "Đã gửi phản hồi", value: "9.840" }, { label: "Đã thu hồi", value: 12 }],
  blocks: [
    { kind: "form", title: "Cài đặt phân phối", fields: [
      { label: "Đối tượng trong hệ thống", value: "HS khối 6–9 · PH đã liên kết · GV dạy STEM" },
      { label: "Phạm vi đơn vị", value: "Toàn tỉnh (112 trường) — trường được thêm câu hỏi riêng" },
      { label: "Mở / đóng", value: "01/11/2026 07:00 → 30/11/2026 23:59" },
      { label: "Giới hạn", value: "1 phản hồi / tài khoản · tối đa 20.000 phản hồi" },
      { label: "Link công khai", value: "https://khaosat.kdi.edu.vn/s/hai-long-stem-hk1", wide: true },
      { label: "Mã truy cập (cho người ngoài hệ thống)", value: "STEM-HK1-2026" },
      { label: "Nhắc tự động", value: "Trước hạn 3 ngày, cho người chưa trả lời" },
    ], submit: "Lưu cài đặt" },
    { kind: "table", title: "Lời mời riêng", desc: "Dùng một lần, có hạn — phù hợp khảo sát CBQL, chuyên gia, đối tác", columns: ["Người nhận", "Kênh", "Gửi lúc", "Hạn", "Trạng thái"], rows: [
      ["BGH 112 trường", "Trong hệ thống", "01/11", "30/11", b("98 đã trả lời", "success")],
      ["Chuyên gia KDI Education (demo)", "Email", "02/11", "15/11", ok("Đã trả lời")],
      ["Đại diện hội cha mẹ HS (8)", "Link riêng", "02/11", "30/11", warn("3 chưa mở")],
      ["Đối tác cũ — Công ty Robotic Việt (demo)", "Link riêng", "28/10", "05/11", bad("Đã thu hồi")],
    ] },
  ],
};

const ANALYTICS = (scope: string): PreviewSpec => ({
  intro: `Phân tích phản hồi ${scope}: biểu đồ tự chọn theo loại câu hỏi, lọc chéo, bảng chéo, phễu bỏ dở theo phần; mẫu số mỗi câu = số người được hiển thị câu đó.`,
  actions: ["Xuất Excel (5 sheet)", "Xuất CSV", "Kết nối Power BI"],
  filters: ["Khảo sát: Hài lòng hoạt động STEM — HK I", "Đối tượng: Tất cả", "Cấp học: Tất cả", "Phiên bản: v2"],
  kpis: [{ label: "Bắt đầu", value: "12.430" }, { label: "Hoàn thành", value: "9.840", hint: "79% tỷ lệ hoàn thành" }, { label: "Thời gian TB", value: "4 phút 12 giây" }, { label: "Điểm hài lòng", value: "4,1/5" }],
  blocks: [
    { kind: "bars", title: "Phễu bỏ dở theo phần", items: [
      { label: "Mở phiếu", value: 12430, max: 12430, suffix: "" }, { label: "Phần 1 · Thông tin chung", value: 11980, max: 12430, suffix: "" },
      { label: "Phần 2 · Trải nghiệm học tập", value: 10620, max: 12430, suffix: "", tone: "info" }, { label: "Gửi phiếu", value: 9840, max: 12430, suffix: "", tone: "success" },
    ] },
    { kind: "bars", title: "Câu 2.3 · Em muốn học thêm chủ đề nào? (nhiều lựa chọn)", desc: "% người trả lời — không ép tổng 100%", items: [
      { label: "Robotics", value: 64 }, { label: "Trí tuệ nhân tạo", value: 52, tone: "info" }, { label: "Lập trình", value: 47 }, { label: "Năng lượng xanh", value: 21, tone: "muted" },
    ] },
    { kind: "table", title: "Bảng chéo: điểm hài lòng TB theo cấp học × đối tượng", columns: ["Cấp học", "Học sinh", "Phụ huynh", "Giáo viên", "n"], rows: [
      ["Tiểu học", "4,4", "4,2", "3,9", "3.920"], ["THCS", "4,1", "4,0", "3,6", "4.410"], ["THPT", "3,9", "3,8", "3,5", "1.510"],
    ] },
    { kind: "table", title: "Phản hồi gần đây", desc: "Xem chi tiết theo đúng phiên bản đã trả lời · gắn cờ thay vì xóa", columns: ["Mã", "Đối tượng", "Đơn vị", "Thời gian", "Hoàn thành", "Cờ"], rows: [
      ["R-98411", "Học sinh", "THCS Bình Minh", "16/10 09:12", pct(100), "—"],
      ["R-98410", "Phụ huynh", "THPT Thanh Sơn", "16/10 09:05", pct(100), "—"],
      ["R-98402", "Học sinh", "THCS Hòa An", "16/10 08:41", pct(100), bad("Nghi trùng")],
      ["R-98397", "Giáo viên", "TH Sao Mai", "16/10 08:20", pct(66), mute("Đang làm")],
    ] },
    { kind: "note", title: "Tích hợp báo cáo", text: "Kết quả đẩy vào chỉ số CS15 (Bộ chỉ số) và mục Đề xuất cải tiến (Bước 5). Dữ liệu chuẩn hóa dạng dòng (wide/long/choices/codebook) cho Power BI; câu PII không xuất hiện trong view phân tích." },
  ],
});

export const SURVEY: Record<string, PreviewSpec> = {
  "so:khao-sat": {
    intro: "Toàn cảnh khảo sát cấp tỉnh: khảo sát hiện trạng (Bước 1), hài lòng & nhu cầu (Bước 4), đánh giá tập huấn (Bước 3).",
    actions: ["Tạo khảo sát", "Dùng mẫu"],
    filters: ["Năm học 2026–2027", "Dự án: Đề án STEM", "Mọi trạng thái"],
    kpis: [{ label: "Khảo sát", value: 9, hint: "2 đang mở · 1 nháp" }, { label: "Lượt bắt đầu", value: "13.702" }, { label: "Đã gửi", value: "11.112", hint: "81% hoàn thành" }, { label: "Đang làm dở", value: "1.290" }],
    blocks: [
      { kind: "steps", title: "Khảo sát trong quy trình đề án", steps: [
        { label: "Bước 1 · Hiện trạng phòng & thiết bị STEM", state: "done", note: "112/112 trường · đã đóng 30/09" },
        { label: "Bước 3 · Đánh giá khóa bồi dưỡng", state: "current", note: "Tự phát sau mỗi khóa · NPS 46" },
        { label: "Bước 4 · Hài lòng HS/PH/GV — HK I", state: "current", note: "Đang mở đến 30/11 · 9.840 phản hồi" },
        { label: "Bước 5 · Nhu cầu chủ đề STEM năm sau", state: "todo", note: "Nháp — dự kiến phát 03/2027" },
      ] },
      { kind: "table", title: "Khảo sát nổi bật", columns: ["Khảo sát", "Đối tượng", "Hạn", "Tỷ lệ phản hồi", "Hoàn thành", "Trạng thái"], rows: [
        ["Mức độ hài lòng hoạt động STEM — HK I", "HS · PH · GV", "30/11", pct(61), "79%", STATUS.published],
        ["Nhu cầu bồi dưỡng năm 2027", "Giáo viên", "15/11", pct(55), "92%", STATUS.published],
        ["Hiện trạng phòng & thiết bị STEM 2026", "QTV trường", "30/09", pct(100), "100%", STATUS.closed],
      ] },
      { kind: "list", title: "Cần chú ý", items: [
        { title: "Phụ huynh THPT: tỷ lệ phản hồi 18%", meta: "Gợi ý: nhắc qua giáo viên chủ nhiệm, thêm mã QR vào sổ liên lạc", badge: warn("Thấp") },
        { title: "Phần 2 phiếu hài lòng: 11% bỏ dở", meta: "Ma trận 8 dòng trên điện thoại — đề xuất tách đôi", badge: b("Tối ưu", "info") },
      ] },
    ],
  },
  "truong:khao-sat": {
    intro: "Khảo sát của trường: phiếu Sở phát cho trường (theo dõi tỷ lệ phản hồi của GV, HS, PH) và phiếu trường tự tạo.",
    actions: ["Tạo khảo sát của trường", "Nhắc người chưa trả lời"],
    kpis: [{ label: "Phiếu Sở phát", value: 3 }, { label: "Phiếu của trường", value: 2 }, { label: "Phản hồi HS", value: "52%" }, { label: "Phản hồi PH", value: "21%", hint: "dưới mục tiêu 50%" }],
    blocks: [
      { kind: "table", title: "Tỷ lệ phản hồi tại trường", columns: ["Phiếu", "Nguồn", "Đối tượng", "Phản hồi", "Hạn", "Trạng thái"], rows: [
        ["Hài lòng hoạt động STEM — HK I", "Sở", "HS (128)", pct(52), "30/11", STATUS.published],
        ["Hài lòng hoạt động STEM — HK I", "Sở", "PH (96)", pct(21), "30/11", warn("Thấp")],
        ["Nhu cầu bồi dưỡng năm 2027", "Sở", "GV (9)", pct(89), "15/11", STATUS.published],
        ["Góp ý CLB Robotics", "Trường", "HS CLB (24)", pct(88), "25/10", STATUS.published],
      ] },
      { kind: "bars", title: "Tỷ lệ phản hồi HS theo lớp (phiếu hài lòng)", items: [
        { label: "6A1", value: 78, tone: "success" }, { label: "7A1", value: 55 }, { label: "8A1", value: 41, tone: "warning" }, { label: "9A1", value: 34, tone: "warning" },
      ] },
    ],
  },
  "khao-sat-tao": BUILDER,
  "khao-sat-mau": TEMPLATES,
  "khao-sat-phan-phoi": DISTRIBUTION,
  "so:khao-sat-phan-tich": ANALYTICS("toàn tỉnh (số liệu tổng hợp, không hiển thị danh tính)"),
  "truong:khao-sat-phan-tich": ANALYTICS("của trường"),
  "truong:tra-loi": RESPOND,
  "khao-sat": RESPOND,
};
