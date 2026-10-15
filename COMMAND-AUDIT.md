# Kiểm tra menu ngày 14/10/2026

Đã đồng bộ 11 lệnh với Telegram: tin, tim, hoi, sang, toi, video, check_status, trangthai, nguon, help, start. Nút menu dùng chế độ commands. Áp dụng menu mặc định, hội thoại riêng và chủ bot, các ngôn ngữ mặc định/vi/en.

- Kiểm thử cục bộ: 11 bài kiểm tra đạt, gồm 15 tình huống xử lý lệnh.
- Kiểm tra dịch vụ thực: webhook không lỗi, không tồn đọng; 220 bài; 2 video trạng thái done.
- AI: model cũ trả 404; GEMINI_MODEL hiện gemini-3.5-flash-lite, gọi thử thành công. Không đổi billing.
- /sang và /toi chưa có bản tin lưu; chưa xác nhận gửi theo lịch thực tế.
- /video_status vẫn là tên thay thế tương thích cho /check_status.
- Chưa thử bấm từng lệnh bằng tài khoản Telegram của người dùng; kiểm thử xử lý lệnh dùng dữ liệu mô phỏng, kết hợp đối chiếu API dịch vụ thật.

Ví dụ:

/tin
/tim AI | 24h
/hoi Tin AI nào đáng chú ý nhất?
/video <link bài báo đã có trong kho>
/check_status

Máy dựng phải bật, có mạng và chạy start-video.cmd. Video gửi về cuộc trò chuyện yêu cầu; tên gồm tiêu đề và thời gian Việt Nam.
