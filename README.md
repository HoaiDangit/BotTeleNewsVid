# NewsAutoBear Telegram bot

Bot tin tức và tạo video tổng hợp; luồng sport/bài tập đã gỡ ngày 06/11/2026.

Worker: https://newsautobear-bot.thiep-hy-danglnh3264.workers.dev

## Hoạt động hiện tại

- Cloudflare Worker/D1 thu thập tin theo cron, gửi tối đa 5 tin nổi bật lúc 07:00 giờ Việt Nam mỗi ngày. Không còn bản bài tập lúc 20:00.
- Menu: /myid, /tin, /video_tin, /check_status. Quản trị viên vẫn dùng trực tiếp /allow, /deny, /users; /start và /help mở hướng dẫn.
- /video_tin nhận nội dung, một đến năm link, tệp TXT và ảnh đính kèm. Studio trên máy dựng MP4 dưới 60 giây và gửi về đúng cuộc trò chuyện yêu cầu; cần máy/cầu nối hoạt động.
- /baitap và /video_tap báo tính năng đã gỡ; không xếp hàng bài tập mới. Yêu cầu workout còn queued được chuyển cancelled khi cầu nối lấy việc. Video đã có và dữ liệu ảnh được giữ nguyên.
- Tin tức nhiều lĩnh vực vẫn được xếp hạng theo mức ảnh hưởng xã hội và liên quan Việt Nam.

## Cấu hình và kiểm tra

Secrets Telegram/Gemini của Worker nhập tại Cloudflare; cấu hình Studio ở .env, cầu nối ở .bridge/config.json. Không đưa bí mật lên GitHub.

Chạy npm test để kiểm thử, npm run build để tạo worker.deploy.mjs trước triển khai. Bản đang triển khai: 1.8.0-news-only. Đã đồng bộ menu mặc định, hội thoại riêng và chủ bot với ngôn ngữ mặc định/vi/en.

Xem VIDEO-HUONG-DAN.md và KIEM-TRA-VAN-HANH.md để vận hành. HAI-LUONG-NOI-DUNG.md là tài liệu lịch sử, không phải kế hoạch đang chạy.

Video được giao riêng dưới dạng bản nháp cần duyệt; không tự đăng lên mạng xã hội. Cron và API miễn phí có hạn mức, không bảo đảm SLA 24/24.
