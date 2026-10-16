# Workflow nghiệp vụ

Từ M3, mọi workflow chạy trên một **bộ máy dùng chung** (`wf`): định nghĩa máy trạng thái có phiên bản. Mỗi chuyển trạng thái kiểm quyền và phạm vi, ghi `wf.step_log`, ghi audit và sinh thông báo. Trạng thái lõi do Sở khóa; tham số (bật/tắt bước, người duyệt theo chức vụ, SLA) cấu hình theo trường.

## Đã triển khai (M1)

### Đăng nhập & chọn ngữ cảnh
```
Đăng nhập ─► iam.my_contexts()
   ├─ 1 ngữ cảnh  → tự chọn
   └─ ≥2 ngữ cảnh → màn "Chọn ngữ cảnh làm việc"
iam.switch_context(assignment) ─► kiểm assignment thuộc mình & còn hiệu lực ─► ghi audit CONTEXT_SWITCH
   ─► client refreshSession() ─► custom_access_token_hook đưa active_assignment_id vào JWT
   ─► RLS chỉ xét assignment này
```
- URL thuộc cổng khác ngữ cảnh hiện tại sẽ chuyển về trang chủ của ngữ cảnh.
- Claim giả mạo, sai định dạng hoặc hết hạn khiến `iam.ctx()` trả rỗng, nên người dùng không thấy dữ liệu nào (đã có test).

### Thay đổi cấu hình
```
Người dùng (cfg.setting.manage, đơn vị trong phạm vi) ─► cfg.set_setting(unit, key, value, mode)
   ─► trigger guard: tầng trên MANDATORY → từ chối · tầng trên EXTEND → phải cùng kiểu
   ─► version + 1 · cfg.setting_history · audit.log
```

## Kế hoạch (M3+)

| Mã | Workflow | Luồng chính | Cấu hình |
|---|---|---|---|
| W1 | Chỉ tiêu Sở → Trường | Soạn bộ chỉ số → Ban hành → Giao chỉ tiêu → Trường tiếp nhận / kiến nghị → theo dõi tự động từ metric | Chỉ số, công thức, hạn: Sở (MANDATORY) |
| W2 | Kế hoạch STEM | Nháp → (Tổ rà soát) → BGH duyệt / trả lại → Hiệu lực → điều chỉnh tạo phiên bản mới | Bật/tắt bước Tổ; số cấp duyệt |
| W3 | Hoạt động & minh chứng | GV ghi nhận → nộp minh chứng → Tổ duyệt / yêu cầu bổ sung → tính vào báo cáo | `wf.session.dept_review` (đã có ở cấu hình); loại minh chứng bắt buộc |
| W4 | Đặt phòng/thiết bị | Đăng ký → phát hiện xung đột → chọn ưu tiên, các đơn còn lại tự từ chối kèm gợi ý → xác nhận → check-in | Quy tắc ưu tiên |
| W5 | Báo cáo định kỳ | Sở mở kỳ → điền sẵn từ metric → trường bổ sung/giải trình → BGH ký nộp → Sở chấp nhận / yêu cầu giải trình → khóa snapshot | Mẫu báo cáo: Sở |
| W6 | Nhiệm vụ & giải trình | Giao (đối tượng, hạn) → phản hồi + minh chứng → đóng / mở lại | SLA nhắc hạn |
| W7 | NCC: thẩm định → triển khai | Tạo sản phẩm/học liệu → gửi thẩm định → duyệt/trả lại → công bố → trường đăng ký → hợp đồng + grant → triển khai → báo cáo → đánh giá | Hội đồng thẩm định (chờ xác nhận) |
| W8 | Liên kết phụ huynh | Trường phát mã mời một lần (14 ngày, kèm SĐT PH tùy chọn) → PH nhập mã → SĐT tài khoản khớp → VERIFIED; không khớp → PENDING, QTV trường duyệt → hết hạn 31/8 · thu hồi khi chuyển trường/tốt nghiệp · khóa sau 5 lần sai/24h | ✅ M2c-2 (ADR-014) |
| W9 | Dự án HS | GV giao (rubric, hạn) → HS nộp (nhiều phiên bản) → GV chấm + nhận xét → công bố → HS/PH xem → hồ sơ năng lực | `visible_to_guardian` |

Sơ đồ trạng thái mẫu (W2/W3):

```
NHÁP ──gửi──► CHỜ_TỔ_DUYỆT ──duyệt──► CHỜ_BGH_DUYỆT ──duyệt──► ĐÃ_DUYỆT ──điều chỉnh──► (phiên bản mới: NHÁP)
  ▲               │ trả lại                 │ trả lại
  └───────────────┴─────────────────────────┘     (CHỜ_TỔ_DUYỆT bị bỏ qua khi wf.session.dept_review = false)
```
