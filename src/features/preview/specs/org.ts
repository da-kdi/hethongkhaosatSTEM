import type { PreviewSpec } from "../types";
import { b, mute, ok, warn } from "./_h";

/** Phân hệ 4 · Nhà cung cấp & cấp quyền dữ liệu (M2d) */
export const ORG: Record<string, PreviewSpec> = {
  "truong:doi-tac": {
    intro: "Nhà cung cấp hợp tác với trường và quyền xem dữ liệu đã cấp: mức dữ liệu, chương trình, thời hạn; gia hạn hoặc thu hồi.",
    actions: ["Cấp quyền mới"],
    blocks: [
      { kind: "table", title: "Quyền dữ liệu đã cấp", columns: ["Nhà cung cấp", "Chương trình", "Mức dữ liệu", "Hiệu lực", "Trạng thái"], rows: [
        ["KDI Education (demo)", "ROBOTICS-THCS", b("Tổng hợp", "info"), "01/09/2026 – 30/06/2027", ok("Hiệu lực")],
        ["Công ty Robotic Việt (demo)", "—", mute("Chưa cấp"), "—", mute("Chưa hợp tác")],
      ] },
      { kind: "cards", title: "Mức dữ liệu", items: [
        { title: "Tổng hợp", body: "Chỉ số liệu tổng hợp (số lớp, số học sinh). Mặc định khuyến nghị." },
        { title: "Theo lớp", body: "Xem lớp tham gia chương trình, không xem tên học sinh." },
        { title: "Có tên", body: "Danh sách học sinh tham gia — chỉ khi hợp đồng ghi rõ.", badge: warn("Cần BGH duyệt") },
      ] },
    ],
  },
};
