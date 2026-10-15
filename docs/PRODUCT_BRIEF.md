# ĐẶC TẢ SẢN PHẨM: NỀN TẢNG QUẢN TRỊ STEM ĐA CẤP, ĐA VAI TRÒ
Phiên bản: 1.0  
Mục đích: Tài liệu đầu vào cho Claude để phân tích, thiết kế UX/UI và hỗ trợ xây dựng sản phẩm.

## 1. Tầm nhìn sản phẩm

Xây dựng một nền tảng quản trị và triển khai giáo dục STEM dùng chung cho nhiều cấp quản lý và nhiều nhóm người dùng tại Việt Nam. Nền tảng phục vụ quản lý cấp Sở GD&ĐT, trường học, tổ/khoa chuyên môn, giáo viên, học sinh, phụ huynh và nhà cung cấp chương trình/dịch vụ STEM như KDI.

Sản phẩm không chỉ là dashboard báo cáo. Đây là hệ thống nghiệp vụ có khả năng:
- Quản lý tổ chức và dữ liệu theo cấu trúc nhiều cấp.
- Lập kế hoạch, giao việc, triển khai và đánh giá hoạt động STEM.
- Quản lý chương trình, học liệu, thiết bị và phát triển năng lực giáo viên.
- Theo dõi tình hình toàn tỉnh nhưng vẫn hỗ trợ quy trình riêng của từng trường.
- Cho phép cấu hình module, biểu mẫu, trường dữ liệu, workflow, KPI và báo cáo theo từng đơn vị.
- Đảm bảo dữ liệu có nguồn gốc, chất lượng, lịch sử thay đổi và quyền truy cập phù hợp.

## 2. Nguyên tắc thiết kế quan trọng

1. **Một nền tảng, nhiều vai trò:** Không tạo 7 ứng dụng độc lập. Dùng chung nền tảng, đăng nhập và dữ liệu nền; menu và thao tác thay đổi theo vai trò/phạm vi được cấp.
2. **Phân quyền theo vai trò và phạm vi dữ liệu:** Quyền phải xét đồng thời vai trò, tổ chức, trường, lớp và mối quan hệ thực tế. Ví dụ phụ huynh chỉ xem học sinh đã được liên kết và xác minh; nhà cung cấp chỉ xem trường/chương trình/hợp đồng được cấp quyền.
3. **Cấu hình theo đơn vị:** Có cấu hình mặc định toàn nền tảng, cấu hình cấp Sở, cấu hình trường và cấu hình theo nhóm người dùng. Cấp dưới không được ghi đè cấu hình bắt buộc từ cấp trên.
4. **Chuẩn hóa dữ liệu tổng hợp:** Các trường có thể mở rộng biểu mẫu và quy trình, nhưng dữ liệu tối thiểu dùng cho báo cáo cấp tỉnh phải thống nhất.
5. **Có thể kiểm toán:** Lưu nhật ký tạo/sửa/xóa, thay đổi quyền, gửi duyệt, phê duyệt, từ chối và xuất dữ liệu.
6. **Triển khai theo giai đoạn:** Ưu tiên nền tảng và nghiệp vụ cốt lõi trước; không làm mọi tính năng nâng cao cùng lúc.
7. **Không giả định tính năng đã tồn tại:** Các module dành cho Nhà cung cấp và Phụ huynh là nhu cầu đề xuất mới, cần được thiết kế và triển khai.

## 3. Các vai trò chính và module tương ứng

### 3.1. Cấp Sở GD&ĐT
Mục tiêu: Quản lý toàn tỉnh, giám sát triển khai STEM, đánh giá kết quả và điều phối hỗ trợ.

**A. Tổng quan điều hành**
- Dashboard KPI toàn tỉnh: số trường, giáo viên, học sinh, phòng STEM.
- Tỷ lệ triển khai chương trình và mức hoàn thành kế hoạch.
- Bản đồ phân bố trường học theo địa bàn.
- Cảnh báo trường/địa phương chưa đạt chỉ tiêu hoặc thiếu dữ liệu.

**B. Mạng lưới trường học**
- Danh sách, hồ sơ và phân loại trường theo địa bàn/cấp học/loại hình.
- Theo dõi quy mô, nhân sự, cơ sở vật chất và mức độ triển khai STEM.
- So sánh trường và địa phương theo tiêu chí có cấu hình.

**C. Kế hoạch và chỉ tiêu STEM**
- Ban hành kế hoạch, mục tiêu, chỉ tiêu và bộ chỉ số cấp tỉnh.
- Giao chỉ tiêu xuống trường/đơn vị trực thuộc.
- Theo dõi tiến độ, kết quả và mức hoàn thành.

**D. Giám sát và đánh giá chất lượng**
- Theo dõi hoạt động STEM, kết quả học tập tổng hợp, năng lực giáo viên.
- Đánh giá hiệu quả sử dụng phòng học, thiết bị và chương trình.
- Phát hiện dữ liệu bất thường, trường chưa cập nhật hoặc chưa đạt chuẩn.

**E. Điều phối và hỗ trợ**
- Giao nhiệm vụ, yêu cầu giải trình/bổ sung dữ liệu.
- Điều phối tập huấn, chuyên gia và nguồn lực.
- Theo dõi hạn xử lý, phản hồi và kết quả khắc phục.

**F. Báo cáo và quản trị dữ liệu**
- Báo cáo định kỳ/chuyên đề, xuất Excel/PDF.
- Quản lý chỉ tiêu và biểu mẫu báo cáo.
- Theo dõi chất lượng dữ liệu, nguồn dữ liệu và lịch sử cập nhật.

### 3.2. Trường học
Mục tiêu: Quản lý hoạt động STEM tại trường từ kế hoạch đến triển khai, đánh giá và báo cáo.

**A. Tổng quan trường học**
- KPI, tiến độ kế hoạch, số tiết/hoạt động, số học sinh tham gia.
- Việc đến hạn, báo cáo thiếu và cảnh báo cần xử lý.

**B. Kế hoạch và chương trình STEM**
- Lập kế hoạch năm học/học kỳ.
- Đăng ký chương trình, chủ đề và hoạt động STEM.
- Phân bổ kế hoạch theo khối lớp, tổ chuyên môn và giáo viên.

**C. Nhân sự và lớp học**
- Hồ sơ giáo viên, học sinh, lớp và tổ chuyên môn.
- Phân công giảng dạy, thời khóa biểu.
- Phân quyền theo chức vụ và phạm vi.

**D. Phòng STEM và thiết bị**
- Quản lý phòng học, thiết bị, vật tư và học liệu.
- Đặt lịch sử dụng, theo dõi tình trạng, bảo trì và kiểm kê.
- Đề xuất bổ sung nguồn lực.

**E. Hoạt động dạy – học**
- Theo dõi lịch dạy và hoạt động STEM thực tế.
- Quản lý minh chứng, sản phẩm và kết quả.
- Theo dõi chuyên cần và mức độ tham gia.

**F. Phát triển năng lực giáo viên**
- Nhu cầu và lịch tập huấn.
- Chứng chỉ, năng lực và kết quả bồi dưỡng.
- Đề xuất giáo viên tham gia chương trình nâng cao năng lực.

**G. Báo cáo và làm việc với Sở**
- Tổng hợp và nộp báo cáo.
- Bổ sung minh chứng, giải trình.
- Tiếp nhận chỉ đạo và theo dõi nhiệm vụ từ Sở.

### 3.3. Nhà cung cấp chương trình/dịch vụ STEM
Đối tượng: KDI và các đơn vị cung cấp chương trình, học liệu, thiết bị, đào tạo hoặc giải pháp STEM. Đây là phân hệ mới.

**A. Hồ sơ nhà cung cấp**
- Thông tin pháp nhân, đầu mối, lĩnh vực và địa bàn hoạt động.
- Hồ sơ năng lực, nhân sự và chuyên gia.

**B. Danh mục sản phẩm/dịch vụ**
- Chương trình, khóa học, chủ đề, học liệu, thiết bị và vật tư.
- Cấp độ, độ tuổi, môn học, thời lượng, yêu cầu triển khai.
- Phiên bản, trạng thái công bố và phạm vi sử dụng.

**C. Quản lý nội dung/học liệu**
- Tạo và quản lý giáo án, bài giảng, hướng dẫn, tài nguyên số.
- Quản lý phiên bản và tài liệu đính kèm.
- Gửi thẩm định/phê duyệt trước khi công bố nếu quy trình yêu cầu.

**D. Hợp tác và triển khai**
- Tiếp nhận nhu cầu từ trường/Sở.
- Đăng ký chương trình, trường tham gia và kế hoạch triển khai.
- Quản lý hợp đồng, lịch đào tạo, lịch hỗ trợ và đầu mối.

**E. Chất lượng và hỗ trợ**
- Báo cáo số lớp, giáo viên, học sinh đã triển khai trong phạm vi được phép.
- Thu thập phản hồi, quản lý yêu cầu hỗ trợ và sự cố.
- Theo dõi tiến độ, đánh giá chất lượng và kế hoạch cải tiến.

**Giới hạn truy cập:** Nhà cung cấp chỉ được xem dữ liệu được cấp quyền theo hợp tác/chương trình/trường; không mặc định được xem dữ liệu cá nhân hoặc dữ liệu toàn tỉnh.

### 3.4. Cấp Khoa/Tổ chuyên môn
Mục tiêu: Điều phối chuyên môn ở cấp khoa/bộ môn/tổ trong trường. Tên và cấu trúc tổ chức phải cấu hình được.

**A. Tổng quan tổ**
- Tiến độ kế hoạch, giáo viên, lớp, hoạt động và kết quả.
- Công việc chờ duyệt hoặc chưa hoàn thành.

**B. Kế hoạch chuyên môn**
- Xây dựng kế hoạch STEM theo môn học/khối lớp.
- Phân công chủ đề, hoạt động và người phụ trách.
- Theo dõi tiến độ theo kỳ/năm học.

**C. Học liệu và chia sẻ**
- Thư viện bài dạy, dự án và chủ đề STEM.
- Chia sẻ giáo án, tài liệu và kinh nghiệm.
- Đề xuất sử dụng học liệu từ nhà cung cấp.

**D. Kiểm duyệt và đánh giá**
- Rà soát kế hoạch bài dạy và minh chứng.
- Góp ý, duyệt hoặc yêu cầu chỉnh sửa.
- Đánh giá chất lượng theo tiêu chí chuyên môn.

**E. Báo cáo và năng lực**
- Tổng hợp kết quả của tổ.
- Theo dõi năng lực/nhu cầu tập huấn giáo viên.
- Đề xuất cải tiến và nguồn lực với Ban giám hiệu.

### 3.5. Giáo viên
Mục tiêu: Chuẩn bị bài dạy, tổ chức hoạt động STEM, theo dõi học sinh và ghi nhận kết quả.

**A. Trang chủ/lịch công tác**
- Thời khóa biểu, lịch STEM, lịch tập huấn.
- Công việc, thông báo và hạn hoàn thành.

**B. Kế hoạch bài dạy/học liệu**
- Tạo kế hoạch bài dạy, chọn chủ đề và mục tiêu.
- Tra cứu giáo án, học liệu và hướng dẫn.
- Điều chỉnh nội dung theo lớp/điều kiện thực tế.

**C. Tổ chức hoạt động STEM**
- Ghi nhận hoạt động đã thực hiện.
- Đặt phòng, đăng ký thiết bị/vật tư.
- Tải minh chứng hình ảnh, sản phẩm và tài liệu.

**D. Lớp học và học sinh**
- Danh sách lớp, điểm danh và mức độ tham gia.
- Giao nhiệm vụ cá nhân/nhóm.
- Theo dõi tiến độ dự án.

**E. Đánh giá và phản hồi**
- Đánh giá theo rubric/tiêu chí/sản phẩm.
- Ghi nhận năng lực, kết quả và nhận xét.
- Phản hồi cho học sinh/phụ huynh theo quyền.

**F. Hồ sơ phát triển chuyên môn**
- Lưu bài dạy và minh chứng chuyên môn.
- Theo dõi tập huấn/chứng chỉ.
- Tự đánh giá và đăng ký bồi dưỡng.

### 3.6. Học sinh
Mục tiêu: Tham gia hoạt động STEM, thực hiện dự án, lưu sản phẩm và theo dõi sự tiến bộ.

**A. Trang chủ học tập**
- Lịch học, hoạt động và nhiệm vụ.
- Thông báo từ giáo viên/trường.
- Tiến độ hoàn thành nhiệm vụ.

**B. Học liệu/khóa học**
- Bài học, tài liệu, video và hướng dẫn.
- Học liệu theo lớp/chương trình.
- Bài tập/hoạt động trực tuyến nếu được bật.

**C. Dự án STEM**
- Xem yêu cầu và nhiệm vụ cá nhân/nhóm.
- Nộp báo cáo, hình ảnh, video và sản phẩm.
- Theo dõi tiến độ, nhận xét và kết quả.

**D. Hồ sơ năng lực/thành tích**
- Lưu sản phẩm và dự án đã thực hiện.
- Xem kết quả, nhận xét và sự tiến bộ.
- Ghi nhận chứng nhận, giải thưởng/thành tích.

### 3.7. Phụ huynh
Đây là phân hệ mới. Mục tiêu: Theo dõi quá trình học tập của con, nhận thông báo và phối hợp với nhà trường.

**A. Tổng quan học tập của con**
- Lớp, chương trình và hoạt động STEM đang tham gia.
- Tiến độ nhiệm vụ và sản phẩm.
- Kết quả, nhận xét và sự tiến bộ.

**B. Lịch học/thông báo**
- Lịch học, sự kiện và hoạt động trải nghiệm.
- Thay đổi lịch, yêu cầu chuẩn bị.
- Nhắc hạn đăng ký/xác nhận tham gia.

**C. Trao đổi với trường**
- Nhận nhận xét từ giáo viên.
- Gửi câu hỏi/ý kiến.
- Theo dõi phản hồi và lịch sử trao đổi.

**D. Đăng ký hoạt động/dịch vụ**
- Đăng ký sự kiện, cuộc thi hoặc ngoại khóa.
- Xác nhận tham gia và cập nhật thông tin.
- Theo dõi trạng thái đăng ký nếu được triển khai.

## 4. Các module nền tảng dùng chung

1. **Quản lý tổ chức:** Cấp Sở → đơn vị trực thuộc (nếu có) → trường → khoa/tổ → lớp; cho phép cấu hình cơ cấu theo địa phương.
2. **Tài khoản và phân quyền:** Một người có thể có nhiều vai trò; phân quyền theo vai trò, tổ chức, trường, lớp và quan hệ liên kết.
3. **Cấu hình hệ thống:** Bật/tắt module, cấu hình biểu mẫu, trường dữ liệu, workflow, KPI và báo cáo.
4. **Workflow/phê duyệt:** Gửi duyệt, duyệt, trả lại bổ sung, giao nhiệm vụ, theo dõi hạn và đóng việc.
5. **Danh mục dùng chung:** Năm học, cấp học, môn học, chương trình, loại hoạt động, tiêu chí đánh giá.
6. **Thông báo:** Thông báo trong hệ thống và các kênh tích hợp nếu có.
7. **Tích hợp/dữ liệu:** Import/export, API, đồng bộ, kiểm tra chất lượng dữ liệu.
8. **Audit log:** Nhật ký thao tác, thay đổi dữ liệu, thay đổi quyền, phê duyệt và xuất dữ liệu.
9. **Báo cáo/dashboard engine:** Các thành phần báo cáo tái sử dụng, nhưng dữ liệu phải lọc theo quyền.
10. **Quản lý tệp/minh chứng:** Tệp, ảnh, video, tài liệu, quyền truy cập, phiên bản và thời hạn lưu trữ.

## 5. Quan hệ nghiệp vụ giữa các vai trò

- Cấp Sở ban hành định hướng/chỉ tiêu, theo dõi và hỗ trợ trường.
- Trường lập kế hoạch, phân công, quản lý tài nguyên và tổng hợp báo cáo.
- Khoa/Tổ điều phối chuyên môn và rà soát hoạt động của giáo viên.
- Giáo viên chuẩn bị bài, tổ chức hoạt động, đánh giá và giao nhiệm vụ.
- Học sinh thực hiện nhiệm vụ/dự án, nộp sản phẩm và xem phản hồi.
- Phụ huynh xem dữ liệu của con đã được liên kết/xác minh, nhận thông báo và trao đổi với trường.
- Nhà cung cấp quản lý chương trình/học liệu/dịch vụ, phối hợp triển khai với các trường theo quyền được cấp.

Luồng nghiệp vụ tham khảo:
1. Sở cấu hình kế hoạch/chỉ tiêu → trường tiếp nhận và lập kế hoạch.
2. Trường/tổ phân công → giáo viên tạo kế hoạch bài dạy và hoạt động.
3. Học sinh tham gia/nộp sản phẩm → giáo viên đánh giá.
4. Tổ chuyên môn rà soát → trường tổng hợp và gửi báo cáo.
5. Sở theo dõi, phản hồi hoặc giao nhiệm vụ hỗ trợ.
6. Nhà cung cấp cung cấp nội dung/dịch vụ được phê duyệt và báo cáo kết quả triển khai trong phạm vi được cấp quyền.
7. Phụ huynh theo dõi thông tin liên quan đến con.

## 6. Mô hình cấu hình linh hoạt

Thiết kế cơ chế kế thừa cấu hình theo tầng:
- Mặc định nền tảng.
- Cấp Sở.
- Đơn vị trực thuộc (nếu có).
- Trường.
- Khoa/Tổ hoặc nhóm người dùng, nếu cần.

Mỗi cấu hình cần có một trong ba chế độ:
- **Bắt buộc:** cấp dưới không thể tắt/sửa.
- **Kế thừa và mở rộng:** cấp dưới được thêm lựa chọn nhưng không xóa phần bắt buộc.
- **Tự chủ:** đơn vị tự cấu hình trong giới hạn được cấp.

Cấu hình nên có phiên bản, người sửa, ngày hiệu lực và khả năng xem lịch sử. Ví dụ: trường có thể tạo biểu mẫu hoạt động STEM riêng nhưng không được bỏ các trường dữ liệu bắt buộc mà Sở yêu cầu để tổng hợp báo cáo.

## 7. Kiến trúc và nguyên tắc kỹ thuật đề xuất

- Khởi đầu bằng **modular monolith** có ranh giới module rõ ràng; chưa cần microservices nếu chưa có nhu cầu triển khai/tải độc lập.
- Dùng API/interface contracts giữa các module; module không truy cập tùy tiện vào logic nội bộ của module khác.
- Phân tách domain nghiệp vụ: tổ chức/phân quyền, kế hoạch STEM, hoạt động, học liệu, thiết bị, đánh giá, nhà cung cấp, cổng học sinh/phụ huynh.
- Phân biệt dữ liệu danh mục, dữ liệu giao dịch/hoạt động, dữ liệu báo cáo và tệp minh chứng.
- Thiết kế API, migration, validation, error handling và logging.
- Không lưu dữ liệu nhạy cảm vào log; áp dụng tối thiểu quyền truy cập, bảo vệ dữ liệu học sinh và kiểm soát liên kết phụ huynh.
- Không tự ý chọn công nghệ mới nếu repository hiện tại đã có stack phù hợp; trước tiên hãy kiểm tra codebase.

## 8. Phạm vi MVP đề xuất

### Giai đoạn 1 — Nền tảng quản trị và nghiệp vụ cốt lõi
- Quản lý tổ chức, người dùng, vai trò, quyền và phạm vi dữ liệu.
- Cấu hình module cơ bản theo trường.
- Danh mục năm học, trường, tổ, lớp, giáo viên.
- Kế hoạch STEM, hoạt động, phân công, minh chứng và trạng thái duyệt.
- Dashboard/báo cáo cơ bản cho trường và Sở.
- Import/export và kiểm tra dữ liệu cơ bản.
- Audit log và thông báo nội bộ.

### Giai đoạn 2 — Nội dung và nhà cung cấp
- Hồ sơ nhà cung cấp.
- Danh mục chương trình, học liệu và dịch vụ.
- Quy trình thẩm định/công bố.
- Liên kết chương trình với trường và theo dõi triển khai.
- Phản hồi, hỗ trợ và đánh giá chất lượng.

### Giai đoạn 3 — Cổng học sinh/phụ huynh
- Tài khoản học sinh và liên kết phụ huynh an toàn.
- Lịch, nhiệm vụ, dự án và hồ sơ sản phẩm.
- Kết quả/nhận xét theo quyền.
- Thông báo và đăng ký hoạt động.

### Giai đoạn 4 — Nâng cao
- Form builder và workflow builder nâng cao.
- KPI/dashboard builder.
- Cảnh báo dữ liệu và phân tích nâng cao.
- AI trợ lý dựa trên dữ liệu được phép truy cập, có trích nguồn và kiểm soát quyền.
- Tích hợp với hệ thống giáo dục khác khi có yêu cầu thực tế.

## 9. Các màn hình cần thiết để prototype

Ưu tiên dựng prototype có dữ liệu mẫu nhất quán:
1. Đăng nhập và chọn vai trò/ngữ cảnh nếu có nhiều vai trò.
2. Dashboard Cấp Sở với bộ lọc địa bàn, cấp học, năm học.
3. Danh sách trường và trang chi tiết trường.
4. Dashboard trường.
5. Danh sách kế hoạch STEM và màn hình chi tiết kế hoạch.
6. Danh sách hoạt động STEM, form tạo/chỉnh sửa và trang chi tiết.
7. Trang tổ chuyên môn: phân công, rà soát và duyệt.
8. Trang giáo viên: lịch, hoạt động, lớp, đánh giá.
9. Trang nhà cung cấp: danh mục chương trình/học liệu và tiến độ triển khai.
10. Cổng học sinh: nhiệm vụ và dự án.
11. Cổng phụ huynh: tổng quan học tập của con.
12. Quản trị tổ chức, vai trò/quyền, module và cấu hình.

Không nhất thiết triển khai tất cả màn hình trong một lượt. Hãy làm theo MVP, nhưng cấu trúc code cần tránh khóa cứng để có thể mở rộng.

## 10. Tiêu chí nghiệm thu tổng quát

- Người dùng chỉ thấy menu và dữ liệu trong phạm vi quyền.
- Một người có nhiều vai trò vẫn không bị trộn quyền giữa các ngữ cảnh.
- Dữ liệu trường có thể tổng hợp lên Sở theo bộ trường chuẩn.
- Có thể bật/tắt module theo trường mà không cần sửa code cho từng trường.
- Quy trình gửi duyệt, trả lại, duyệt và lưu lịch sử hoạt động được.
- Mọi thay đổi quan trọng có audit log.
- Có dữ liệu mẫu xuyên suốt từ Sở → trường → tổ → giáo viên → học sinh và luồng nhà cung cấp/phụ huynh.
- UI responsive, tiếng Việt, dễ dùng cho cán bộ quản lý và giáo viên.
- Không hiển thị dữ liệu học sinh/phụ huynh ngoài phạm vi được cấp.
- Tài liệu hóa cấu trúc module, mô hình dữ liệu, quyền và cách chạy dự án.

## 11. Những điều chưa được giả định

- Chưa xác nhận stack công nghệ cuối cùng.
- Chưa có bộ dữ liệu thực tế đầy đủ và API tích hợp.
- Chưa xác định chính xác các biểu mẫu/báo cáo bắt buộc của từng tỉnh.
- Chưa xác định quy trình pháp lý/thẩm định nhà cung cấp.
- Các chỉ tiêu, tiêu chí xếp hạng, thời hạn lưu dữ liệu và cơ chế xác minh phụ huynh cần được cấu hình/đặc tả thêm.
- Không sao chép nguyên trạng giao diện, tài sản thương hiệu hoặc code của hệ thống đối thủ. Dùng hệ thống tham khảo để hiểu bài toán, thiết kế giải pháp riêng.

---
Tài liệu này là đặc tả định hướng ban đầu. Khi phát triển thực tế, hãy xác minh giả định, ghi rõ câu hỏi còn mở và không tự phát minh nghiệp vụ bắt buộc.
