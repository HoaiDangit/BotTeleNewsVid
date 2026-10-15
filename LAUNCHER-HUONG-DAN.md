# Khởi động và kiểm tra trạng thái

Mở NewsAutoBear-Start.exe tại teleSetup. Cửa sổ hiện trạng thái Studio, tiến trình cầu nối, ghép Telegram và heartbeat Cloudflare; tự kiểm tra mỗi 10 giây. Có nút Khởi động, Kiểm tra lại, Mở Studio và Mở nhật ký. Đóng cửa sổ không dừng tiến trình nền.

EXE gọi Node.js trực tiếp, không chạy PowerShell script ẩn. Node.js phải có trong PATH. Giữ EXE cùng Launcher.cs, launcher-status.mjs, runtime-status.mjs, video-agent.mjs và các tệp hỗ trợ trong thư mục này. Cấu hình riêng ở .bridge/config.json, không tải lên GitHub.

Studio lỗi dựng và Studio chưa mở được hiển thị riêng. Tiến trình cầu nối còn sống không đồng nghĩa đã kết nối cloud; chỉ heartbeat mới dưới hai phút xác nhận điều đó. Cầu nối ghi heartbeat riêng trên máy mỗi 15 giây để tránh phụ thuộc hoàn toàn vào khả năng nhìn PID của phiên Windows.

Nếu yêu cầu video trước đó đã báo thất bại, gửi lại /video sau khi trạng thái sẵn sàng; không tự gửi lại để tránh tạo trùng.

Biên dịch EXE: dùng csc.exe của .NET Framework với /target:winexe /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /out:NewsAutoBear-Start.exe Launcher.cs. EXE là đầu ra cục bộ, không commit.
