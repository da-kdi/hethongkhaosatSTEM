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

### Ghi hồ sơ phân hệ 4 (migration 0008, M2b)
RPC `security definer` (mirror TS: `src/domain/orgOps.ts`), mỗi hàm kiểm quyền + đơn vị đích trong phạm vi + cùng trường:

| RPC | Quyền | Quy tắc chính |
|---|---|---|
| `org.upsert_department(p)` | `org.unit.manage` | Tổ thuộc trường; tên không trùng trong trường; ngừng (INACTIVE) khi không còn lớp |
| `org.upsert_teacher(p)` | `org.person.manage` | Tạo `iam.person` + `person_private` + `staff_membership`; chỉ sửa GV thuộc trường mình; kiểm tra SĐT |
| `org.set_teaching(p)` | `org.class.manage` | GV và lớp cùng trường; thêm/bỏ phân công |
| `org.upsert_class(p)` | `org.class.manage` | Năm học hiện hành; tên không trùng; khối 0–12; tổ & GVCN thuộc trường |
| `org.upsert_student(p)` | `org.person.manage` | Mã HS 3–30 ký tự, chuẩn hóa chữ hoa, duy nhất; đổi lớp trong trường |
| `org.set_student_status(id, st)` | `org.person.manage` | Đang học / Chuyển trường / Tốt nghiệp — không xóa hồ sơ |

### Nhập/xuất hồ sơ (migration 0009, M2c-1)

| RPC | Quyền | Ghi chú |
|---|---|---|
| `org.import_students(p)` | `org.person.manage` | `p.rows[]` theo tên kỹ thuật; tra lớp theo tên trong trường của ngữ cảnh; gọi lại `org.upsert_student`/`set_student_status`; lỗi → `Dòng N: …`, hủy cả lô; ghi 1 dòng audit `IMPORT` |
| `org.import_teachers(p)` | `org.person.manage` | Tra tổ đang hoạt động theo tên; `idHeThong` để cập nhật; gọi `org.upsert_teacher` |
| `org.log_export(kind, n)` | `report.export` | Dữ liệu xuất đọc qua RLS; RPC chỉ ghi audit `EXPORT` |

Mirror TS: `src/domain/exchange.ts` (`planImport` chạy thử, `exportTable` chỉ xuất ngày sinh/SĐT khi có quyền xem dữ liệu cá nhân).

Nhật ký: trigger trên `org.unit`, `org.class`, `org.staff_membership`, `org.teaching_assignment`; `org.enrollment` và `iam.person` ở chế độ PII (chỉ ghi tên cột thay đổi).

### Liên kết phụ huynh & hồ sơ NCC (migration 0010, M2c-2, ADR-014)

| Bảng / RPC | Quyền | Ghi chú |
|---|---|---|
| `iam.guardian_invite` | đọc: `iam.guardian.approve` + thấy HS | `code_hash` (SHA-256) không cấp SELECT; `phone` để đối chiếu; `used_at`, `revoked_at`; audit chế độ PII |
| `iam.guardian_link.revoked_at` | — | Cột mới |
| `iam.issue_guardian_invite(p)` → mã | `iam.guardian.approve` | HS đang học tại trường trong phạm vi; trả mã gốc một lần |
| `iam.revoke_guardian_invite(id)`, `iam.approve_guardian_link(id)`, `iam.revoke_guardian_link(id)` | `iam.guardian.approve` | |
| `iam.guardian_links_for_approver()` | `iam.guardian.approve` | Kèm tên PH (tối thiểu) |
| `iam.redeem_guardian_code(code)` | `iam.guardian.request`, phạm vi LINKED | Khóa sau 5 lần sai/24h; trả `{linkId,status,studentName}` hoặc `{error}` |
| trigger `org.revoke_guardian_links` | — | Hết đang học → thu hồi liên kết + mã chưa dùng |
| `org.provider_profile` | đọc: chính NCC; phạm vi PLATFORM/UNIT_SUBTREE | `ma_dinh_danh_to_chuc` (BG_00420), `loai_to_chuc` (BG_00811), liên hệ, `fields[]`, mô tả |
| `org.upsert_provider_profile(p)` | `org.provider.manage`, ngữ cảnh NCC | Sửa cả `org.unit.name` của NCC |

Mirror TS: `src/domain/guardian.ts`, `src/domain/provider.ts`, `src/domain/sha256.ts` (khớp `sha256()` của Postgres, có test).

### catalog — Danh mục dùng chung (migration 0007, ADR-013)
| Bảng | Nội dung |
|---|---|
| `catalog.code_list` | Danh mục; `code` = tên kỹ thuật thuật ngữ (vd. `capHoc`), `term_code` → `cfg.data_term`; `source` CSDL_NGANH / ISO_5218 / NOI_BO_TAM; `version`, `synced_at` |
| `catalog.code_value` | Giá trị (mã, tên, thứ tự, hiệu lực từ/đến, `deprecated`). Giá trị không có trong bản nạp mới → `deprecated = true`, không xóa (giữ toàn vẹn dữ liệu lịch sử) |
| `catalog.value_map` | Giá trị nội bộ của từng cột → mã chuẩn (FK tới `code_value`) |
| `catalog.import_batch` | Lịch sử nạp: phiên bản, nguồn, tệp, số mới/cập nhật/ngừng dùng, người nạp |

Ghi chỉ qua `catalog.import_code_list(jsonb)`: chỉ **Quản trị nền tảng** (`cfg.catalog.manage`); kiểm tra phiên bản, dòng rỗng, mã trùng; ghi nhật ký `IMPORT`. Khởi tạo: `gioiTinh` (ISO/IEC 5218) là chuẩn; `capHoc`, `loaiHinhCsgd`, `khoi`, `trangThaiNh` là **nội bộ tạm**; `monHoc`, `danToc`, `chucVuTaiCoQuanCongTac` để trống chờ nạp từ CSDL ngành.

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
