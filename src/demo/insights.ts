/**
 * Số liệu MINH HỌA cho dashboard Sở/Trường (hư cấu, tỉnh giả định "An Hòa").
 * Chỉ dùng cho giao diện xem trước — khi các phân hệ M3–M8 hoàn thiện, số liệu được tính từ dữ liệu thật
 * (bộ chỉ số CS01–CS24, xem đặc tả "Bộ chỉ số").
 */
import { U } from "./seed.ts";

export type Level = 3 | 2 | 1 | 0;
export const LEVEL_LABEL: Record<Level, string> = { 3: "Tốt", 2: "Khá", 1: "Đạt", 0: "Cần hỗ trợ" };
/** Ngưỡng phân loại (minh họa, Sở cấu hình được ở Bộ chỉ số) */
export const LEVEL_RULE: Record<Level, string> = {
  3: "Bao phủ STEM ≥ 75% và GV đã bồi dưỡng ≥ 70%",
  2: "Bao phủ ≥ 50% và GV ≥ 50%",
  1: "Bao phủ ≥ 25%",
  0: "Bao phủ < 25%",
};
export function levelOf(coverage: number, trained: number): Level {
  if (coverage >= 75 && trained >= 70) return 3;
  if (coverage >= 50 && trained >= 50) return 2;
  if (coverage >= 25) return 1;
  return 0;
}

// Xã/phường hư cấu — tên ghép ngẫu nhiên, không trùng địa danh thật có chủ đích
const WARD_NAMES = [
  "Phường Đông Thành", "Phường Tây An", "Xã Phú Lộc", "Phường Hòa An", "Xã Tân Hưng", "Xã Minh Châu", "Phường Bắc Sơn", "Xã Thuận Phong",
  "Xã An Bình", "Phường Nam Giang", "Xã Hưng Đạo", "Xã Lạc Viên", "Phường Kim Ngân", "Xã Vĩnh Hòa", "Xã Gia Phúc", "Phường Thanh Tâm",
  "Xã Phong Lâm", "Xã Đức Thịnh", "Phường Hải Yến", "Xã Quang Minh", "Xã Bình Nguyên", "Phường Trung Hòa", "Xã Yên Hà", "Xã Cẩm Lĩnh",
];
// Giá trị cố định (không ngẫu nhiên lúc chạy) để ảnh chụp/kiểm thử ổn định
const COV = [82, 64, 71, 22, 55, 48, 78, 35, 61, 88, 42, 18, 69, 57, 30, 76, 51, 26, 84, 47, 58, 39, 66, 14];
const TRN = [80, 61, 66, 38, 52, 44, 74, 40, 58, 79, 47, 31, 63, 55, 36, 71, 49, 33, 77, 50, 54, 41, 60, 28];
const SCH = [7, 5, 4, 6, 3, 4, 6, 3, 5, 8, 4, 3, 5, 4, 3, 6, 4, 3, 7, 4, 5, 3, 4, 3];

export const WARDS = WARD_NAMES.map((name, i) => ({ name, schools: SCH[i], coverage: COV[i], trained: TRN[i], level: levelOf(COV[i], TRN[i]) }));

export const PROVINCE = {
  schools: WARDS.reduce((n, w) => n + w.schools, 0),
  wards: WARDS.length,
  coverage: Math.round(WARDS.reduce((n, w) => n + w.coverage * w.schools, 0) / WARDS.reduce((n, w) => n + w.schools, 0)),
  trained: Math.round(WARDS.reduce((n, w) => n + w.trained * w.schools, 0) / WARDS.reduce((n, w) => n + w.schools, 0)),
  rooms: 64,
  roomsByType: [{ label: "Nâng cao", value: 12 }, { label: "Cơ bản", value: 31 }, { label: "Tối thiểu", value: 21 }],
  byLevel: [{ label: "THPT", value: 18 }, { label: "THCS", value: 44 }, { label: "Tiểu học", value: 52 }],
  sessionsPerWeek: 4.6,
  alerts: 14,
  monthly: [{ m: "Th5", v: 640 }, { m: "Th6", v: 210 }, { m: "Th7", v: 90 }, { m: "Th8", v: 180 }, { m: "Th9", v: 860 }, { m: "Th10", v: 1240 }],
};

export const SCHOOL_RANKING = [
  { name: "Trường THPT Phú Lộc", ward: "Xã Phú Lộc", index: 86, delta: +4 },
  { name: "Trường THCS Bình Minh", ward: "Phường Đông Thành", index: 74, delta: +6 },
  { name: "Trường Tiểu học Sao Mai", ward: "Phường Tây An", index: 71, delta: +2 },
  { name: "Trường THPT Thanh Sơn", ward: "Xã Phú Lộc", index: 63, delta: -3 },
  { name: "Trường TH Tây An", ward: "Phường Tây An", index: 41, delta: -1 },
  { name: "Trường THCS Hòa An", ward: "Phường Hòa An", index: 32, delta: -7 },
];

export interface SchoolInsight {
  index: number;
  grade: string;
  percentile: number;
  delta: number;
  pillars: { label: string; value: number }[];
  periodsWeek: { used: number; available: number };
  teachersUsing: { used: number; total: number };
  studentsJoined: { used: number; total: number };
  plansApproved: { used: number; total: number };
  monthly: { m: string; v: number }[];
  today: { time: string; label: string; teacher: string; room: string }[];
  rooms: { name: string; meta: string; status: "ok" | "maintenance" }[];
}

const BASE: SchoolInsight = {
  index: 74, grade: "B", percentile: 68, delta: 6,
  pillars: [
    { label: "Kế hoạch & quản trị", value: 82 }, { label: "Đội ngũ", value: 70 }, { label: "Cơ sở vật chất", value: 68 },
    { label: "Dạy học STEM", value: 76 }, { label: "Đánh giá & sản phẩm", value: 64 }, { label: "Dữ liệu & báo cáo", value: 80 },
  ],
  periodsWeek: { used: 22, available: 36 },
  teachersUsing: { used: 6, total: 9 },
  studentsJoined: { used: 96, total: 128 },
  plansApproved: { used: 4, total: 4 },
  monthly: [{ m: "Th5", v: 18 }, { m: "Th6", v: 6 }, { m: "Th7", v: 0 }, { m: "Th8", v: 4 }, { m: "Th9", v: 21 }, { m: "Th10", v: 26 }],
  today: [
    { time: "07:30", label: "6A1 · Tưới cây tự động", teacher: "Ngô Thị Hương", room: "STEM 1" },
    { time: "09:15", label: "8A1 · Nhà chống lũ", teacher: "Hoàng Thị Lan", room: "STEM 2" },
    { time: "14:00", label: "CLB Robotics", teacher: "Vũ Đức Anh", room: "STEM 1" },
  ],
  rooms: [
    { name: "Phòng STEM 1", meta: "Nhà A · Tầng 2 · 40 chỗ", status: "ok" },
    { name: "Phòng STEM 2", meta: "Nhà B · Tầng 1 · 30 chỗ", status: "ok" },
    { name: "Góc Robotics", meta: "Thư viện · 16 chỗ", status: "maintenance" },
  ],
};

export function schoolInsight(schoolId: string): SchoolInsight {
  if (schoolId === U.ts) return { ...BASE, index: 63, grade: "C", percentile: 45, delta: -3, periodsWeek: { used: 14, available: 30 }, studentsJoined: { used: 140, total: 260 } };
  if (schoolId === U.sm) return { ...BASE, index: 71, grade: "B", percentile: 60, delta: 2, rooms: BASE.rooms.slice(0, 1) };
  return BASE;
}
