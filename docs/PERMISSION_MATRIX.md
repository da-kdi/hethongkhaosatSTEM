# Ma trận phân quyền & phạm vi dữ liệu

> FILE SINH TỰ ĐỘNG bởi `npm run gen:docs` từ `src/domain/permissions.ts` và `src/domain/roles.ts`. Không sửa tay.
> Cùng nguồn này sinh `supabase/seed.sql` (bảng `iam.role_permission`), nên tài liệu, giao diện và RLS luôn khớp nhau.

## 1. Nguyên tắc

- **Quyền = vai trò × phạm vi dữ liệu × quan hệ.** Có quyền chức năng chưa đủ; bản ghi còn phải nằm trong phạm vi của ngữ cảnh đang chọn.
- **Một ngữ cảnh tại một thời điểm.** Người nhiều vai trò chọn một `role_assignment`. Lựa chọn này nằm trong JWT claim `active_assignment_id` và RLS chỉ xét đúng assignment đó (ADR-002).
- **Kiểm tra ở Postgres** (RLS + RPC `security definer`). Ẩn menu ở giao diện chỉ để trải nghiệm tốt hơn, không phải lớp bảo mật.
- **Dữ liệu trẻ em:** dữ liệu cá nhân chi tiết (`iam.person_private`) cần quyền `org.person.personal`. Cấp Sở và nhà cung cấp mặc định chỉ thấy số liệu tổng hợp.

## 2. Vai trò hệ thống & phạm vi

| Mã | Vai trò | Cổng | Gán vào đơn vị | Phạm vi dữ liệu |
|---|---|---|---|---|
| `PLATFORM_ADMIN` | Quản trị nền tảng | Quản trị nền tảng | PLATFORM | Nền tảng: cấu hình, **không** mặc định xem dữ liệu cá nhân |
| `SO_LEADER` | Lãnh đạo Sở | Cấp Sở | SO | Đơn vị được gán và mọi đơn vị cấp dưới |
| `SO_SPECIALIST` | Chuyên viên Sở | Cấp Sở | SO | Đơn vị được gán và mọi đơn vị cấp dưới |
| `SO_ADMIN` | Quản trị viên Sở | Cấp Sở | SO | Đơn vị được gán và mọi đơn vị cấp dưới |
| `SCHOOL_LEADER` | Ban giám hiệu | Trường học | TRUONG | Đơn vị được gán và mọi đơn vị cấp dưới |
| `SCHOOL_ADMIN` | Quản trị viên trường | Trường học | TRUONG | Đơn vị được gán và mọi đơn vị cấp dưới |
| `DEPT_HEAD` | Tổ trưởng chuyên môn | Tổ chuyên môn | TO | Đơn vị được gán và mọi đơn vị cấp dưới |
| `TEACHER` | Giáo viên | Giáo viên | TRUONG | Lớp được phân công dạy/chủ nhiệm trong trường |
| `STUDENT` | Học sinh | Học sinh | TRUONG | Chỉ bản thân |
| `GUARDIAN` | Phụ huynh | Phụ huynh | PLATFORM | Học sinh đã liên kết **và xác minh**, còn hạn |
| `PROVIDER_ADMIN` | Quản trị nhà cung cấp | Nhà cung cấp | NCC | Trường/chương trình được cấp quyền theo hợp tác, trong thời hạn, theo mức AGGREGATE/CLASS/NAMED |
| `PROVIDER_EXPERT` | Chuyên gia nhà cung cấp | Nhà cung cấp | NCC | Trường/chương trình được cấp quyền theo hợp tác, trong thời hạn, theo mức AGGREGATE/CLASS/NAMED |

## 3. Vai trò × quyền

| Quyền | PLATFORM_ADMIN | SO_LEADER | SO_SPECIALIST | SO_ADMIN | SCHOOL_LEADER | SCHOOL_ADMIN | DEPT_HEAD | TEACHER | STUDENT | GUARDIAN | PROVIDER_ADMIN | PROVIDER_EXPERT |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| **org** | | | | | | | | | | | | |
| Xem đơn vị <br>`org.unit.view` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  |  |  |  |  |
| Quản trị đơn vị (tạo/sửa/ngừng) <br>`org.unit.manage` | ✓ |  |  | ✓ |  | ✓ |  |  |  |  |  |  |
| Xem lớp học <br>`org.class.view` |  | ✓ | ✓ |  | ✓ | ✓ | ✓ | ✓ |  |  |  |  |
| Quản trị lớp học <br>`org.class.manage` |  |  |  |  |  | ✓ |  |  |  |  |  |  |
| Xem danh sách người (tên, vai trò) <br>`org.person.view` |  | ✓ | ✓ |  | ✓ | ✓ | ✓ | ✓ |  |  |  |  |
| Xem dữ liệu cá nhân chi tiết (ngày sinh, liên hệ) <br>`org.person.personal` |  |  |  |  | ✓ | ✓ |  |  |  |  |  |  |
| Quản trị hồ sơ người <br>`org.person.manage` |  |  |  |  |  | ✓ |  |  |  |  |  |  |
| **iam** | | | | | | | | | | | | |
| Xem tài khoản <br>`iam.account.view` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  |  |  |  | ✓ |  |
| Quản trị tài khoản & gán vai trò <br>`iam.account.manage` | ✓ |  |  | ✓ |  | ✓ |  |  |  |  | ✓ |  |
| Xem vai trò & quyền <br>`iam.role.view` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  |  |  |  |  |  |
| Tạo/sửa vai trò tùy chỉnh <br>`iam.role.manage` | ✓ |  |  | ✓ |  | ✓ |  |  |  |  |  |  |
| Gửi yêu cầu liên kết con <br>`iam.guardian.request` |  |  |  |  |  |  |  |  |  | ✓ |  |  |
| Xác minh liên kết phụ huynh <br>`iam.guardian.approve` |  |  |  |  |  | ✓ |  |  |  |  |  |  |
| Cấp/thu hồi quyền dữ liệu cho nhà cung cấp <br>`iam.grant.manage` |  |  |  |  | ✓ | ✓ |  |  |  |  |  |  |
| **cfg** | | | | | | | | | | | | |
| Xem cấu hình <br>`cfg.setting.view` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  |  |  |  |  |  |
| Sửa cấu hình đơn vị <br>`cfg.setting.manage` | ✓ |  |  | ✓ |  | ✓ |  |  |  |  |  |  |
| **audit** | | | | | | | | | | | | |
| Xem nhật ký hệ thống <br>`audit.log.view` | ✓ | ✓ |  | ✓ | ✓ | ✓ |  |  |  |  |  |  |
| **plan** | | | | | | | | | | | | |
| Xem chỉ tiêu <br>`plan.target.view` |  | ✓ | ✓ |  | ✓ |  |  |  |  |  |  |  |
| Ban hành/giao chỉ tiêu <br>`plan.target.manage` |  | ✓ | ✓ |  |  |  |  |  |  |  |  |  |
| Xem kế hoạch STEM <br>`plan.plan.view` |  | ✓ | ✓ |  | ✓ |  | ✓ | ✓ |  |  |  |  |
| Lập/sửa kế hoạch STEM <br>`plan.plan.create` |  |  |  |  | ✓ |  | ✓ | ✓ |  |  |  |  |
| Duyệt kế hoạch STEM <br>`plan.plan.approve` |  |  |  |  | ✓ |  | ✓ |  |  |  |  |  |
| **activity** | | | | | | | | | | | | |
| Xem hoạt động STEM <br>`activity.activity.view` |  | ✓ | ✓ |  | ✓ |  | ✓ | ✓ | ✓ |  |  |  |
| Ghi nhận hoạt động STEM <br>`activity.activity.create` |  |  |  |  |  |  |  | ✓ |  |  |  |  |
| Duyệt hoạt động/minh chứng <br>`activity.activity.approve` |  |  |  |  | ✓ |  | ✓ |  |  |  |  |  |
| **resource** | | | | | | | | | | | | |
| Xem phòng & thiết bị <br>`resource.room.view` |  | ✓ | ✓ |  | ✓ | ✓ | ✓ | ✓ |  |  |  |  |
| Quản trị phòng & thiết bị <br>`resource.room.manage` |  |  |  |  |  | ✓ |  |  |  |  |  |  |
| Đặt phòng/thiết bị <br>`resource.booking.create` |  |  |  |  |  |  |  | ✓ |  |  |  |  |
| Duyệt đặt phòng/xử lý xung đột <br>`resource.booking.approve` |  |  |  |  | ✓ | ✓ |  |  |  |  |  |  |
| **assess** | | | | | | | | | | | | |
| Xem nhiệm vụ/dự án <br>`assess.task.view` |  |  |  |  | ✓ |  | ✓ | ✓ | ✓ |  |  |  |
| Giao nhiệm vụ/dự án <br>`assess.task.create` |  |  |  |  |  |  |  | ✓ |  |  |  |  |
| Nộp bài/sản phẩm <br>`assess.task.submit` |  |  |  |  |  |  |  |  | ✓ |  |  |  |
| Đánh giá, nhận xét <br>`assess.evaluation.create` |  |  |  |  |  |  |  | ✓ |  |  |  |  |
| **training** | | | | | | | | | | | | |
| Xem tập huấn <br>`training.course.view` |  | ✓ | ✓ |  | ✓ |  | ✓ | ✓ |  |  |  | ✓ |
| Quản lý tập huấn <br>`training.course.manage` |  |  | ✓ |  | ✓ |  |  |  |  |  | ✓ |  |
| **provider** | | | | | | | | | | | | |
| Quản lý hồ sơ nhà cung cấp <br>`provider.profile.manage` |  |  |  |  |  |  |  |  |  |  | ✓ |  |
| Xem sản phẩm/học liệu đã công bố <br>`provider.offering.view` |  | ✓ | ✓ |  | ✓ |  | ✓ | ✓ |  |  | ✓ | ✓ |
| Tạo/sửa sản phẩm, học liệu <br>`provider.offering.create` |  |  |  |  |  |  |  |  |  |  | ✓ | ✓ |
| Thẩm định/công bố sản phẩm, học liệu <br>`provider.offering.approve` |  | ✓ | ✓ |  |  |  |  |  |  |  |  |  |
| Xem tiến độ triển khai <br>`provider.deployment.view` |  | ✓ | ✓ |  | ✓ |  |  |  |  |  | ✓ | ✓ |
| Xử lý yêu cầu hỗ trợ <br>`provider.ticket.handle` |  |  |  |  |  |  |  |  |  |  | ✓ | ✓ |
| **report** | | | | | | | | | | | | |
| Xem dashboard <br>`report.dashboard.view` |  | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |  |  |  | ✓ | ✓ |
| Lập/nộp báo cáo <br>`report.submission.create` |  |  |  |  | ✓ | ✓ | ✓ |  |  |  | ✓ |  |
| Tiếp nhận/duyệt báo cáo <br>`report.submission.approve` |  | ✓ | ✓ |  |  |  |  |  |  |  |  |  |
| Xuất dữ liệu <br>`report.export` |  | ✓ | ✓ |  | ✓ | ✓ |  |  |  |  |  |  |
| Giao nhiệm vụ/yêu cầu giải trình <br>`report.directive.manage` |  | ✓ | ✓ |  | ✓ |  |  |  |  |  |  |  |
| Phản hồi nhiệm vụ/giải trình <br>`report.directive.respond` |  |  |  |  | ✓ |  | ✓ | ✓ |  |  |  |  |
| **portal** | | | | | | | | | | | | |
| Xem tình hình học tập của con <br>`portal.child.view` |  |  |  |  |  |  |  |  |  | ✓ |  |  |
| Trao đổi với nhà trường <br>`portal.message.send` |  |  |  |  |  |  |  | ✓ |  | ✓ |  |  |
| Đăng ký hoạt động/sự kiện <br>`portal.event.register` |  |  |  |  |  |  |  |  | ✓ | ✓ |  |  |

## 4. Hàm phạm vi (supabase/migrations/20261015000200_iam.sql)

| Hàm | Trả true khi |
|---|---|
| `iam.ctx()` | Trả assignment trong JWT nếu thuộc `auth.uid()`, đang ACTIVE, còn hiệu lực; ngược lại trả rỗng, nên mọi policy đều false |
| `iam.has_perm(p)` | Vai trò của ngữ cảnh có quyền `p` |
| `iam.can_see_unit(u)` | Theo phạm vi: cây con (+ chuỗi cha), trường của GV/HS, trường có con (PH), trường được grant (NCC) |
| `iam.can_see_class(c)` | Lớp thuộc cây con / lớp dạy / lớp của mình / lớp của con / grant mức ≥ CLASS |
| `iam.can_see_person(p)` | Học sinh: chỉ trường/tổ/GV dạy/PH đã xác minh/NCC mức NAMED, **Sở không thấy**. Nhân sự: theo cây đơn vị |
| `iam.can_see_personal(p)` | Bản thân, PH với con đã xác minh, hoặc có `org.person.personal` và thấy người đó |

Bản phản chiếu TS: `src/domain/access.ts`. Test đối chiếu: `supabase/tests/rls.test.ts`.
