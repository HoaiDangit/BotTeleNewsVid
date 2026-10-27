# Thư viện ảnh Google Drive

Bot ưu tiên tối đa 2 ảnh từ thư viện Drive có chủ đề khớp tiêu đề, mô tả hoặc danh mục bài báo. Thiết lập các thư mục hẹp theo lĩnh vực và thêm keywords bằng tiếng Việt/Anh; tên ảnh và mô tả được dùng để xếp hạng trong thư mục. Đây là khớp từ khóa, không nhận diện nội dung ảnh bằng AI. Không chọn ngẫu nhiên ảnh của lĩnh vực khác. Tệp trùng nội dung được loại bỏ. Video vẫn dùng panel ảnh và nhãn minh họa của media-v3.

Ảnh bổ sung có NGUON-ANH-BO-SUNG.json cạnh ảnh: assets chứa file, sha256, author, license, licenseUrl, sourcePage, changes và kind. Bot chỉ dùng metadata gắn đúng tên và hash ảnh; giữ nguồn/tác giả/giấy phép/thay đổi trong manifest và IMAGE-CREDITS.txt của video. Hiện hỗ trợ CC BY-SA 4.0 và Unlicense theo tuyên bố repository nguồn. Bảng đối chiếu hai tư thế được đánh dấu comparison-overview, không phải tư thế mới. Khi đăng video cần giữ phần ghi công và thực hiện điều kiện giấy phép tương ứng; tệp thông tin trên máy không tự được nền tảng mạng xã hội đăng kèm. Không khẳng định đã xác minh độc lập mọi quyền bên thứ ba.

Sao chép drive-images.example.json thành .bridge/drive-images.json. Tệp riêng này không lên GitHub. Đổi enabled=true sau khi điền đường dẫn hoặc ID thư mục thực tế, author, permissionEvidence và authorized=true cho từng thư mục mà chủ sở hữu xác nhận quyền sử dụng. Việc lưu ảnh trên Drive không tự tạo quyền tái sử dụng. Không đặt khóa API hay mật khẩu trong chat.

## Drive đã đồng bộ trên Windows

Đặt mode=synced và localPath là đường dẫn tuyệt đối của từng thư mục ảnh Google Drive for desktop. Chọn giữ ảnh sẵn trên máy để không phụ thuộc thời gian tải tệp trực tuyến. Mặc định bot chỉ đọc ảnh trực tiếp; đặt recursive=true cho thư viện phân theo thư mục con. Khi bật, chỉ quét trong thư mục được chọn với giới hạn 2 tầng con, 80 thư mục và 500 ảnh; không đi theo symlink. Tên thư mục động tác được dùng để ưu tiên ảnh khớp bài viết. Không sửa/xóa ảnh. Hỗ trợ JPEG, PNG, WebP tối đa 6 MB/ảnh; AVIF/GIF được bỏ qua. Không cài thêm thư viện hay dùng API tạo ảnh trả phí.

## Drive API

Thư viện đã sắp xếp theo tên bài tập có thể dùng một mục folders với localPath trỏ tới thư mục gốc và exerciseLibrary=true. Bot tự đọc tối đa 300 thư mục bài tập trực tiếp, ưu tiên tên/biệt danh động tác trước khi mở ảnh. Không cần khai báo từng bài hoặc đổi cấu hình khi bổ sung thư mục mới. Các thư mục bắt đầu bằng dấu chấm hoặc gạch dưới (như _Tai_lieu_nguon) được loại khỏi kho ảnh. Mỗi thư mục bài tập chứa ảnh trực tiếp; tệp ZIP và tài liệu không dùng để dựng video.

Đặt mode=api và folderId của từng thư mục. Bật Google Drive API trong dự án của chủ sở hữu và cung cấp OAuth đã được chủ sở hữu chấp thuận với phạm vi drive.readonly. Lưu client_id, client_secret, refresh_token vào .bridge/drive-oauth.json trên máy. Chỉ dùng refresh token cho đúng OAuth client; không lấy cookie hay mã phiên trình duyệt. Phạm vi readonly áp dụng quyền đọc của tài khoản đã cấp; cấu hình phần mềm chỉ truy vấn các thư mục khai báo. Không tự cấp quyền, không làm thư mục công khai. Module dùng token endpoint cố định của Google, kiểm tra canDownload trước khi tải qua files.get?alt=media. Không ghi token vào manifest, log hay Cloudflare. Đọc tối đa 500 mục ảnh trực tiếp mỗi thư mục; thư mục con cần khai báo riêng.

https://developers.google.com/workspace/drive/api/guides/search-files
https://developers.google.com/workspace/drive/api/guides/manage-downloads
https://developers.google.com/identity/protocols/oauth2/web-server#offline

## Kiểm tra và vận hành

Chạy node drive-check.mjs để kiểm tra cấu hình và chọn ảnh với từ khóa thử, không dựng video hoặc gửi Telegram. Chạy node drive-check.mjs "du lịch Việt Nam" để kiểm tra lĩnh vực cụ thể. Kết quả không hiển thị thông tin đăng nhập. Sau khi cập nhật mã, khởi động lại cầu nối lúc không có video đang dựng và kiểm tra fingerprint trên EXE. Không cần sửa Worker Cloudflare.

Drive chưa cấu hình, không khớp chủ đề, lỗi quyền hoặc không có ảnh hợp lệ: dùng tiếp Wikimedia và phác họa hiện có. Hồ sơ .bridge/media/<job>/manifest.json ghi nguồn Drive, tác giả, quyền sử dụng và hash; lỗi Drive được ghi riêng. Hai ảnh Drive hợp lệ sẽ được đưa vào Studio trước khi dựng và luân phiên qua các cảnh. Cần kiểm tra video trước khi công bố vì khớp từ khóa không chứng minh ảnh mô tả đúng sự kiện.

Kết nối Google Drive trong Codex chỉ phục vụ thao tác ở phiên chat; bot chạy nền cần đường dẫn đồng bộ hoặc OAuth riêng như trên.
