# teleSetup — tích hợp Telegram cho KT AI Video Studio

Mã bot Cloudflare, cầu nối Windows, launcher và kiểm tra biên tập nằm riêng trong thư mục này. Không sửa mã ứng dụng ở ../scripts hoặc ../src.

Đã sao chép từ ổ C ngày 15/10/2026. Bản C được giữ để tránh gián đoạn phiên đang chạy. Từ nay sửa mã trong teleSetup. Dùng NewsAutoBear-Start.exe tại đây cho lần khởi động tiếp theo. Launcher phát hiện PID bản C còn hoạt động thì dùng phiên đó và không tạo cầu nối thứ hai; khi bản C đã dừng, launcher cho phép bản E tiếp quản. Không chạy lại launcher C sau khi đã chuyển sang E.

.bridge chứa khóa cầu nối, cấu hình, trạng thái và log riêng; chỉ lưu trên máy, tuyệt đối không đưa lên GitHub. Không dừng tiến trình hay đổi Cloudflare trong lần di chuyển này.

GitHub: chỉ đồng bộ mã nguồn và tài liệu teleSetup; không đưa .bridge, .env, EXE, log, báo cáo chẩn đoán riêng hoặc video lên repo. EXE biên dịch lại từ Launcher.cs bằng compiler .NET Framework có sẵn. Thư mục teleSetup là repository riêng: https://github.com/HoaiDangit/BotTeleNewsVid. Dự án ứng dụng cha không bị đưa vào Git.

Kiểm tra: npm test. Tạo Worker: node build-video.mjs. Deploy worker.deploy.mjs khi cần thay đổi cloud; sao chép thư mục không tự deploy.
