# PROMPT CHO CLAUDE — PHÂN TÍCH VÀ XÂY DỰNG NỀN TẢNG QUẢN TRỊ STEM

Bạn là một **Senior Product Architect + Business Analyst + UX/UI Designer + Full-stack Engineer**. Tôi muốn bạn hỗ trợ xây dựng một nền tảng quản trị STEM đa cấp, đa vai trò cho hệ thống giáo dục Việt Nam.

## Tài liệu đầu vào
Đọc toàn bộ file `STEM_PLATFORM_PRODUCT_BRIEF.md` trước khi thực hiện. Đây là nguồn yêu cầu nghiệp vụ nền tảng. Không bỏ qua các phần về 7 vai trò, module dùng chung, phân quyền theo phạm vi, cấu hình kế thừa, MVP và tiêu chí nghiệm thu.

## Mục tiêu
Xây dựng sản phẩm riêng có khả năng:
- Quản lý từ Cấp Sở → trường → khoa/tổ → giáo viên → học sinh.
- Có phân hệ Nhà cung cấp STEM và Phụ huynh.
- Hỗ trợ nhiều trường với nhu cầu khác nhau thông qua cấu hình module, biểu mẫu, workflow, KPI và báo cáo.
- Cho phép Sở tổng hợp dữ liệu chuẩn toàn tỉnh nhưng không ép mọi trường dùng cùng một quy trình chi tiết.
- Bảo vệ dữ liệu và phân quyền nghiêm ngặt.

## Cách làm bắt buộc
1. **Kiểm tra trước, không viết code ngay:** Nếu tôi cung cấp repository, hãy đọc cấu trúc thư mục, `package.json`, README, framework, router, UI components, database/schema và các luồng hiện tại trước. Không ghi đè code đang hoạt động.
2. **Đánh giá hiện trạng:** Tóm tắt công nghệ, những gì đã có, phần có thể tái sử dụng, thiếu sót và rủi ro.
3. **Lập kế hoạch theo lát cắt dọc:** Đề xuất các milestone có thể chạy/kiểm thử được, ưu tiên MVP. Mỗi milestone cần có phạm vi, file/module dự kiến, phụ thuộc, tiêu chí nghiệm thu và test.
4. **Thiết kế kiến trúc trước:** Ưu tiên modular monolith với module boundaries và API/interface contracts rõ ràng. Không tự tách microservices nếu chưa có lý do.
5. **Thiết kế permission matrix:** Phân biệt quyền theo vai trò và phạm vi dữ liệu. Kiểm tra quyền ở backend/data layer, không chỉ ẩn menu trên frontend.
6. **Thiết kế cấu hình:** Có mặc định nền tảng → Cấp Sở → trường → nhóm/người dùng. Cấu hình cấp trên bắt buộc không thể bị cấp dưới vô hiệu hóa.
7. **Dùng dữ liệu mẫu nhất quán:** Tạo một kịch bản demo xuyên suốt có Sở, vài trường, tổ chuyên môn, giáo viên, học sinh, phụ huynh đã liên kết xác minh và một nhà cung cấp. Không dùng dữ liệu cá nhân thật.
8. **Thiết kế UI theo người dùng:** Giao diện tiếng Việt, rõ ràng, hiện đại, ưu tiên tác vụ và quyết định; không chỉ là bộ sưu tập các card và biểu đồ cơ bản. Mỗi dashboard cần có hành động tiếp theo, bộ lọc phù hợp và đường dẫn drill-down.
9. **Không hard-code mọi thứ:** Các module, menu, trường biểu mẫu, trạng thái workflow và chỉ tiêu nên có cấu hình phù hợp. Tuy nhiên không tạo “form builder tổng quát” quá phức tạp trong MVP nếu chưa cần.
10. **Bảo mật:** Áp dụng least privilege, xác minh liên kết phụ huynh–học sinh, audit log, validate input, xử lý lỗi an toàn và không để lộ dữ liệu học sinh trong log hoặc API.
11. **Kiểm thử:** Kiểm tra quyền truy cập, workflow, dữ liệu tổng hợp, trạng thái rỗng/lỗi/loading, responsive và import/export.
12. **Tài liệu hóa:** Duy trì README, `docs/PRODUCT_BRIEF.md`, `docs/MODULE_MAP.md`, `docs/DATA_MODEL.md`, `docs/PERMISSION_MATRIX.md`, `docs/WORKFLOWS.md`, `docs/DECISIONS.md` và hướng dẫn chạy/test.

## Thứ tự ưu tiên
- P0: Khảo sát codebase, kiến trúc, tổ chức, tài khoản, vai trò, phạm vi dữ liệu, audit log.
- P1: Trường, tổ chuyên môn, giáo viên; kế hoạch STEM, hoạt động, minh chứng, quy trình duyệt.
- P2: Dashboard trường và Sở, báo cáo, import/export, data quality.
- P3: Nhà cung cấp, danh mục chương trình/học liệu, quy trình thẩm định và triển khai.
- P4: Học sinh, phụ huynh, nhiệm vụ/dự án và hồ sơ năng lực.
- P5: Cấu hình nâng cao, workflow/form/dashboard builder, AI và tích hợp ngoài.

## Cách phản hồi ở lượt đầu
Sau khi đọc tài liệu và khảo sát repository (nếu đã có), **chưa triển khai toàn bộ ứng dụng ngay**. Trả về:
1. Tóm tắt yêu cầu bạn hiểu.
2. Kiến trúc module đề xuất.
3. Sơ đồ dữ liệu/thực thể cấp cao.
4. Ma trận vai trò × module.
5. Luồng nghiệp vụ quan trọng.
6. Những giả định và câu hỏi còn mở.
7. Kế hoạch triển khai theo milestone và tiêu chí nghiệm thu.
8. Những gì bạn sẽ làm đầu tiên trong codebase hiện tại.

Nếu tôi yêu cầu triển khai sau đó, hãy làm từng milestone, thay đổi code có kiểm soát, chạy test/lint/build nếu có, báo rõ file đã sửa, kết quả kiểm thử, vấn đề còn lại và cách chạy.

## Nguyên tắc làm việc
- Không bịa API, dữ liệu, luật nghiệp vụ hay tính năng của hệ thống tham khảo.
- Không tự ý thay đổi stack hoặc xóa file đang có.
- Không sao chép nguyên trạng giao diện/brand/code của đối thủ.
- Khi thiếu thông tin, phân loại thành **giả định**, **câu hỏi cần xác nhận**, hoặc **đề xuất**, rồi tiếp tục ở mức an toàn thay vì dừng toàn bộ.
- Ưu tiên sản phẩm có thể dùng và mở rộng được, không chỉ tạo mockup tĩnh.
- Khi có nhiều lựa chọn, nêu ưu/nhược điểm và khuyến nghị một phương án phù hợp với giai đoạn hiện tại.

Bắt đầu bằng việc đọc `STEM_PLATFORM_PRODUCT_BRIEF.md`. Nếu repository đã được cung cấp, hãy kiểm tra codebase rồi đưa ra bản phân tích và kế hoạch theo yêu cầu trên.
