# Ảnh cho video Telegram

Mặc định: tìm ảnh Wikimedia Commons theo chủ đề (AI/robot, chip, năng lượng, khí hậu, du lịch), nhận tối đa 3 ảnh CC0/Public domain. Lưu hồ sơ giấy phép, tác giả, trang nguồn, thời điểm và SHA-256 trong .bridge/media/<job>/manifest.json. Giấy phép cần đọc lại ở trang gốc khi đăng. Không mặc định cho phép ảnh CC BY, NC, ND hoặc SA trong bộ đọc hiện tại.

Ảnh dùng để minh họa chủ đề; không coi là ảnh sự kiện. Kịch bản yêu cầu nhãn “Ảnh minh họa”. Người biên tập kiểm tra nhãn thực tế trong MP4 và độ liên quan. Tìm theo chủ đề tự động không chứng minh ảnh khớp địa điểm/người/sự kiện. Không tìm được thì để cảnh chữ; không có nguồn ảnh thay thế không giấy phép. Không có phí API tìm ảnh và không gọi AI tạo ảnh.

Ảnh bài báo: khi có quyền dùng một ảnh cụ thể, tạo .bridge/article-image-permissions.json theo ví dụ article-image-permissions.example.json. Chỉ khai báo authorized=true sau khi tự kiểm tra chủ thể cấp phép, phạm vi thương mại/chỉnh sửa và các nghĩa vụ ghi công. permissionEvidence là ghi nhận giấy phép hoặc văn bản đồng ý; bot không tự kiểm chứng văn bản đó. Không sao chép hàng loạt ảnh báo vì có nút tải xuống.

Ảnh được đưa vào Studio bằng /api/user-images và chỉ chạy visualMode=user-only. Sau khi render, hash ảnh kế hoạch dựng phải trùng manifest mới được duyệt. IMAGE-CREDITS.txt và editorial-review.json nằm cạnh bản video giao trong videos/telegram/<job>. Tệp ghi công hiện lưu trên máy, chưa tự gửi kèm Telegram; cần lấy nội dung tệp để đăng kèm khi giấy phép yêu cầu. CC0/Public domain vẫn có thể liên quan quyền hình ảnh cá nhân, nhãn hiệu và các hạn chế khác.

Thay đổi chỉ áp dụng cho lượt dựng mới sau khi khởi động lại cầu nối; không can thiệp lượt đang chạy. Ảnh upload được giữ trong kho Studio và có giới hạn dung lượng/số lượng sẵn có; nếu kho đầy sẽ bỏ qua ảnh, vẫn dựng chữ.

## Phác họa khi thiếu ảnh

Mỗi video nhận tối đa hai ảnh. Nếu không nhập được ảnh có phép nào, vẽ hai PNG phác họa chủ đề trên máy bằng SketchRenderer.exe. Không gọi API tạo ảnh, không thêm phí. Đây là vẽ theo mẫu hình học cho công nghệ, sức khỏe, giáo dục, môi trường, kinh tế, du lịch, âm nhạc hoặc xã hội; không tự tái hiện chính xác sự kiện hay chân dung trong bài. Nhãn minh họa được vẽ thẳng vào PNG. Có dấu “Kịch bản giả định” khi nhận diện dự báo. Nếu chỉ tìm được một ảnh có phép thì dùng một ảnh, không bắt buộc bổ sung.

SketchRenderer.exe biên dịch từ SketchRenderer.cs, cần .NET Framework/System.Drawing của Windows. Chạy build-sketch.cmd nếu clone repo sang máy khác. EXE không commit; giữ cạnh sketch-images.mjs. Nếu không vẽ/nhập ảnh được thì lưu sketchError trong manifest và video vẫn có thể dựng chữ.

Cơ chế gán ảnh hiện dùng ảnh cho các cảnh đầu có ảnh; các cảnh sau vẫn là chữ/đồ họa, chưa tự phân bố hai ảnh phủ toàn bộ thời lượng.
