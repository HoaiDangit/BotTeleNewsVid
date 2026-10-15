# Mở Studio và cầu nối Telegram

Nhấp đúp NewsAutoBear-Start.exe trong thư mục này. Giữ EXE cùng start-studio.ps1, video-agent.mjs và thư mục cấu hình .bridge; chỉ tạo shortcut nếu muốn đặt ngoài Desktop, không di chuyển riêng EXE.

Tệp khởi động dùng Node.js đã cài, mở KT AI Video Studio tại địa chỉ http://127.0.0.1:4000 và chạy cầu nối nền. Nếu Studio không sẵn sàng sẽ báo lỗi, không báo thành công giả. Nhật ký nằm trong .bridge.

Sau khi giao diện mở, gửi /check_status trên Telegram, rồi /video <link>. Máy phải bật, có mạng và không sleep. Đây là launcher nội bộ được biên dịch từ Launcher.cs, không phải bộ cài độc lập; không cần quyền quản trị và không thay đổi ExecutionPolicy.

Chưa thêm lệnh khởi động Telegram: nếu cầu nối tắt thì bot cloud không có tiến trình trên máy để nhận lệnh. Launcher xử lý trường hợp đó bằng một lần nhấp trên Windows.
