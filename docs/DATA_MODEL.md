# Mô hình dữ liệu

Nguồn: `supabase/migrations/*.sql`. Kiểu TS tương ứng: `src/domain/model.ts`.

## Phân lớp

| Lớp | Ví dụ | Quy tắc |
|---|---|---|
| Danh mục | năm học, vai trò, quyền, loại hoạt động | Có phạm vi đơn vị, mở rộng được qua cấu hình EXTEND |
| Nghiệp vụ | gán vai trò, liên kết PH, kế hoạch, hoạt động | Có đơn vị sở hữu, audit, (từ M3) trạng thái workflow |
| Báo cáo | snapshot chỉ số, báo cáo đã nộp | Bất biến sau khi khóa kỳ (M4) |
| Tệp | minh chứng, sản phẩm HS | Mức nhạy cảm, thời hạn lưu (M3) |

**Lõi chuẩn + mở rộng:** bảng nghiệp vụ có cột chuẩn có kiểu (dùng cho tổng hợp lên Sở) và cột `ext jsonb` cho trường riêng của đơn vị (validate bởi `cfg.form_definition`, M3).

## Bảng đã có (M1)

### org — Tổ chức
| Bảng | Khóa / cột chính | Ghi chú |
|---|---|---|
| `org.unit` | `id`, `parent_id`, `type` (PLATFORM/SO/DON_VI/TRUONG/TO/NCC), `code` unique, `ward`, `school_level`, `status`, `ext` | Trigger kiểm cha–con hợp lệ. `ward` (xã/phường) là thuộc tính lọc, không phải cấp quản lý |
| `org.unit_closure` | (`ancestor_id`, `descendant_id`), `depth` | Duy trì bằng trigger; RLS dùng để kiểm cây con O(1). Chưa hỗ trợ đổi cha (cần RPC chuyên dụng) |
| `org.academic_year` | `code` `YYYY-YYYY`, `is_current` (tối đa 1) | |
| `org.class` | `school_id`, `department_id` (tổ quản lý), `academic_year_id`, `name`, `grade`, `homeroom_person_id` | unique (trường, năm, tên) |
| `org.staff_membership` | (`person_id`, `unit_id`), `position` | Nhân sự thuộc Sở/trường/tổ/NCC |
| `org.teaching_assignment` | (`person_id`, `class_id`, `subject`) | Phân công dạy, là căn cứ phạm vi TEACHING |
| `org.enrollment` | (`student_person_id`, `class_id`), `status`, `student_code` unique | |

### iam — Danh tính & phân quyền
| Bảng | Cột chính | Ghi chú |
|---|---|---|
| `iam.person` | `full_name`, `gender` | Tối thiểu để hiển thị |
| `iam.person_private` | `birth_date`, `phone` | **PII tách bảng**, RLS chặt hơn; audit chỉ ghi tên cột thay đổi |
| `iam.account` | `id` = `auth.users.id`, `person_id`, `email`, `status`, `current_assignment_id` | Ngữ cảnh đang chọn, được hook đưa vào JWT |
| `iam.permission` | `code` `module.resource.action`, `module` (generated) | Sinh từ `permissions.ts` |
| `iam.role` | `code`, `portal`, `scope_kind`, `unit_types[]`, `is_system`, `owner_unit_id` | Vai trò tùy chỉnh phải có đơn vị sở hữu |
| `iam.role_permission` | (`role_code`, `permission_code`) | |
| `iam.role_assignment` | `account_id`, `role_code`, `scope_unit_id`, `status`, `valid_from/to` | Trigger: vai trò chỉ gán vào loại đơn vị cho phép |
| `iam.guardian_link` | `guardian_person_id`, `student_person_id`, `relation`, `status` PENDING/VERIFIED/REVOKED, `method`, `verified_at/by`, `expires_at` | VERIFIED bắt buộc có method + thời điểm |
| `iam.provider_grant` | `provider_unit_id`, `school_unit_id`, `program_code`, `level` AGGREGATE/CLASS/NAMED, `valid_from/to` | |

### cfg — Cấu hình
| Bảng | Cột chính | Ghi chú |
|---|---|---|
| `cfg.setting` | (`unit_id`, `key`) unique, `value jsonb`, `mode`, `version`, `effective_from`, `updated_by` | Trigger `guard_setting`: chặn ghi khi tầng trên MANDATORY; EXTEND phải cùng kiểu; tăng version; ghi lịch sử |
| `cfg.setting_history` | bản sao mỗi lần đổi | Xem lịch sử phiên bản |
| `cfg.term_label` | (`unit_id`, `key`), `label` | Đổi thuật ngữ, ví dụ "Tổ" ↔ "Tổ bộ môn" |

Khóa cấu hình đang dùng: `module.<code>` → `{enabled}`; `catalog.activity_types` → mảng (EXTEND); `wf.session.dept_review` → `{enabled}`.

### audit
| Bảng | Cột chính | Ghi chú |
|---|---|---|
| `audit.log` | `at`, `actor_account`, `active_assignment`, `action`, `entity`, `entity_id`, `unit_id`, `summary jsonb` | Trigger chặn UPDATE/DELETE/TRUNCATE |

### cfg — Từ điển dữ liệu ngành (QĐ 2768/QĐ-BGDĐT, migration 0006)
| Bảng | Nội dung |
|---|---|
| `cfg.data_domain` | 41 miền dữ liệu MOET01–41 (Phụ lục 01): cấp, nhóm (Con người/Tổ chức), miền cha |
| `cfg.data_term` | 892 thuật ngữ BG_00001–00892 (Phụ lục 02): tên nghiệp vụ, định nghĩa, ngữ cảnh, miền, **tên kỹ thuật**, kiểu, độ dài, mã cốt lõi CDE |
| `cfg.data_term_mapping` | Cột hệ thống ↔ thuật ngữ, trạng thái EXACT/PARTIAL, ghi chú quy đổi |

**Cột chuẩn bổ sung ở 0006:**

| Cột | Thuật ngữ | Ràng buộc |
|---|---|---|
| `org.unit.ma_dinh_danh` | BG_00419 `truongId` / BG_00420 `maDinhDanhToChuc` | ≤35 ký tự; trường ≤15; duy nhất |
| `org.unit.loai_hinh_csgd` | BG_00429 `loaiHinhCsgd` | danh mục CSDL ngành (M2) |
| `org.unit.tinh_thanh` | BG_00426 `tinhThanhCsgd` | chuẩn là mã CDE-DC-001 |
| `org.class.ma_lop` | BG_00504 `maLop` | ≤20 ký tự |
| `iam.person_private.so_dinh_danh_ca_nhan` | BG_00011 `soDinhDanhCaNhan` (CDE-CN-001) | đúng 12 chữ số; dữ liệu nhạy cảm |
| `iam.person_private.dan_toc` | BG_00027 `danToc` (CDE-CN-004) | ≤2 ký tự |
| `iam.person_private.quoc_tich` | BG_00026 `quocTich` (CDE-CN-003) | ≤2 ký tự |

Mọi cột đã ánh xạ có `COMMENT ON COLUMN` ghi mã BG và tên kỹ thuật. Danh sách đầy đủ: `src/domain/dictionary/mapping.ts` hoặc trang "Từ điển dữ liệu ngành".

**Quy ước trao đổi dữ liệu:** import/export, API tích hợp và báo cáo gửi Sở/Bộ dùng **tên kỹ thuật chuẩn** làm tên cột/khóa JSON. Giá trị đã có chuẩn mã thì quy đổi khi xuất, ví dụ `gioiTinh` theo ISO/IEC 5218: NAM→`1`, NU→`2`. QĐ 2768 chưa ban hành danh sách giá trị cho các thuộc tính kiểu danh mục. Giá trị lấy từ **CSDL ngành của Bộ** (ADR-013), nạp ở M2 vào `catalog.code_list/code_value`; đến lúc đó các cột này để trạng thái PARTIAL.

## Sơ đồ quan hệ (M1)

```mermaid
erDiagram
  UNIT ||--o{ UNIT : "cha–con"
  UNIT ||--o{ UNIT_CLOSURE : ""
  UNIT ||--o{ CLASS : "trường"
  ACADEMIC_YEAR ||--o{ CLASS : ""
  PERSON ||--|| PERSON_PRIVATE : "PII"
  PERSON ||--o| ACCOUNT : ""
  PERSON ||--o{ STAFF_MEMBERSHIP : ""
  UNIT ||--o{ STAFF_MEMBERSHIP : ""
  PERSON ||--o{ TEACHING_ASSIGNMENT : ""
  CLASS ||--o{ TEACHING_ASSIGNMENT : ""
  PERSON ||--o{ ENROLLMENT : "học sinh"
  CLASS ||--o{ ENROLLMENT : ""
  ACCOUNT ||--o{ ROLE_ASSIGNMENT : "nhiều vai trò"
  ROLE ||--o{ ROLE_ASSIGNMENT : ""
  UNIT ||--o{ ROLE_ASSIGNMENT : "phạm vi"
  ROLE ||--o{ ROLE_PERMISSION : ""
  PERMISSION ||--o{ ROLE_PERMISSION : ""
  PERSON ||--o{ GUARDIAN_LINK : "phụ huynh / học sinh"
  UNIT ||--o{ PROVIDER_GRANT : "NCC / trường"
  UNIT ||--o{ SETTING : "cấu hình theo tầng"
```

## Bảng dự kiến (M2+)

Theo 14 phân hệ (ARCHITECTURE_PLAN §V2.2). Mỗi phân hệ một schema; khi tạo bảng mới phải ánh xạ cột sang thuật ngữ QĐ 2768 ngay trong `mapping.ts`. Danh sách dự kiến từ §3.2, bổ sung `survey.*` (phiếu, câu hỏi, phát hành, câu trả lời), `session.*` (buổi dạy, check-in, điểm danh, nhật ký), `resource.stock_*` (nhập–xuất–tồn), `schedule.*` (kế hoạch dạy học, lịch, đặt chỗ), `dw.*` (kho phân tích): `catalog.*`, `wf.definition/instance/step_log/directive`, `plan.indicator/target_set/target_allocation/stem_plan/plan_item`, `activity.lesson_plan/stem_activity/evidence/participation`, `resource.*`, `training.*`, `provider.*`, `assess.*`, `portal.*`, `report.metric/metric_snapshot/period/submission/dq_issue`, `file.object`.

## Quy ước

- UUID cho mọi khóa. Dữ liệu demo dùng UUID có quy luật (`src/domain/ids.ts`) để seed SQL và frontend dùng chung id.
- Hàm `security definer` luôn có `set search_path = ''` và tham chiếu đầy đủ tên schema.
- Ngày tham chiếu qua `iam.today()`; test đặt được bằng `app.today` để kiểm thời hạn.
