/** Kiểu dữ liệu của Từ điển dữ liệu dùng chung ngành GDĐT (QĐ 2768/QĐ-BGDĐT, phiên bản 1.0). */

export interface DataDomain {
  code: string; // MOET01..MOET41
  level: number;
  group: string | null; // "Con người" | "Tổ chức" | null
  name: string;
  parent: string | null;
  description: string;
}

export interface DataTerm {
  code: string; // BG_00001..BG_00892
  name: string;
  definition: string;
  context: string;
  domains: string[];
  domainName: string;
  /** Tên kỹ thuật chuẩn (camelCase) — dùng khi trao đổi dữ liệu */
  technicalName: string;
  dataTypeVi: string;
  dataType: string;
  length: string | null;
  /** Mã từ vựng cốt lõi quốc gia (CDE-…) nếu có */
  coreCode: string | null;
}

export interface Dictionary {
  source: string;
  extractedAt: string;
  note: string;
  domains: DataDomain[];
  terms: DataTerm[];
}
