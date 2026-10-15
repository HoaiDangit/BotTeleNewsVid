# NewsAutoBear Telegram bot

Worker: https://newsautobear-bot.thiep-hy-danglnh3264.workers.dev

## Đã cấu hình

- Cloudflare Workers Free, D1 `newsautobear-db` (binding `DB`).
- Cron `*/3 * * * *`: mỗi lượt đọc tối đa 3 trong 11 RSS; vòng đầy đủ 12 phút.
- 07:00 và 20:00 giờ Việt Nam: chọn tối đa 10 tin mới chưa gửi trong 24 giờ. Nếu thiếu nguồn thì báo số thực tế, không bịa tin.
- Mức ưu tiên: công nghệ/AI, kinh doanh thế giới, kinh tế, âm nhạc, xã hội, du lịch, môi trường, văn hóa. Cộng điểm cho tin nhắc tới Việt Nam.
- Gemini API có trần 20 lượt/ngày (gồm bản tin và hỏi đáp), không có đường chuyển sang model trả phí. Người dùng đã xác nhận dự án API là Free Tier. Cần giữ dự án ở Free Tier; mã không kiểm soát được thay đổi billing trên Google.
- Lưu 30 ngày; tìm trong dữ liệu đã thu thập, không phải tìm toàn bộ web hoặc lịch sử trước ngày cài đặt.

## Kích hoạt

1. Secrets `TELEGRAM_BOT_TOKEN` và `GEMINI_API_KEY` nhập riêng trong Cloudflare. Không đưa vào mã hoặc Git.
2. Vào `/activate`, nhập lại Telegram token để xác thực quản lý bot.
3. Worker đăng ký webhook bảo vệ bằng secret header với Telegram, rồi cấp liên kết ghép nối có hạn 15 phút.
4. Mở liên kết bằng tài khoản Telegram của bạn, nhấn Start. Chỉ tài khoản ghép nối được dùng bot.
5. Gửi `/trangthai`, `/tin`, `/hoi Tóm tắt tin AI mới nhất | 24h` để kiểm tra.

## Lệnh

```
/tin
/tim AI | 24h
/tim kinh tế | 01/10/2026 | 14/10/2026
/hoi Các tin AI mới ảnh hưởng Việt Nam thế nào? | 7d
/sang
/toi
/nguon
/trangthai
```

## Kiểm thử

`npm test` chạy 8 kiểm tra unit/integration bằng Node 22.17+, SQLite trong bộ nhớ và API giả lập. Kiểm tra khoảng ngày Việt Nam, RSS, chống trùng tiêu đề, từ chối webhook giả, ghép nối riêng, bản tin 10 tin, chống gửi lại cùng lượt và tìm kiếm.

Đã kiểm tra HTTP 200 từ `/health` và 11/11 RSS trả HTTP 200 có bài đọc được. Kiểm thử giả lập không thay thế kiểm tra Telegram/Gemini thật sau khi ghép nối.

## Giới hạn hiện tại

- Nguồn khởi đầu là VnExpress và BBC, gồm 11 chuyên mục; chưa kết nối Reuters/AP hay kho video độc lập.
- Dữ liệu là tiêu đề và mô tả RSS, không phải toàn văn. AI tóm tắt/dịch từ đoạn trích; cần mở nguồn trước khi xuất bản.
- Video chỉ kèm khi RSS cung cấp enclosure video; chưa dò video trong từng trang báo.
- Nhận diện trùng dựa vào URL và độ giống tiêu đề, chưa gộp toàn diện cùng sự kiện giữa các ngôn ngữ.
- Hỏi đáp dùng tối đa 6 trích đoạn liên quan từ tối đa 400 bài gần nhất trong khoảng chọn. `/tim` lọc từ khóa trong SQL trước khi giới hạn 400 kết quả để xếp hạng.
- Cron miễn phí có thể trễ; không có SLA 24/24. Lượt gửi bị lỗi/không rõ kết quả được lưu `uncertain` để tránh tự gửi trùng, xem lại bằng `/sang` hoặc `/toi`.
- Tích hợp ứng dụng dựng video chưa được thực hiện; cần biết tên ứng dụng và API. Worker sẽ điều phối, không chạy renderer nặng.

## Vận hành

- `/health` chỉ hiện trạng thái cấu hình, không kiểm tra xác thực API.
- `/trangthai` hiện số bài, lần quét, lần gọi AI và bản tin cần kiểm tra.
- Khóa thay đổi: sửa Secrets và chạy lại `/activate` để cập nhật webhook.
- Muốn tạm ngừng AI: đặt `AI_ENABLED=false` trong Variables.
- Muốn tạm ngừng thu thập/gửi tự động: tắt cron trong Dashboard.
- Nguồn và mô tả tính năng được thiết kế để đọc tin riêng, không tự đăng bài/video ra công chúng.

Mã nguồn dùng export hàm để kiểm thử. Bản dán trong Dashboard tương đương nhưng chỉ export default handler. Khi triển khai bằng Wrangler có thể bundle và loại bỏ exports phụ.

# Tích hợp video trên máy tính

Đã bổ sung hàng đợi video, cầu nối KT AI Video Studio và gửi MP4 về cuộc trò chuyện yêu cầu. Xem [VIDEO-HUONG-DAN.md](VIDEO-HUONG-DAN.md). Dùng `npm run build` để tạo `worker.deploy.mjs` trước khi triển khai. Khóa riêng trong `.bridge/` không đi kèm bản ZIP.

