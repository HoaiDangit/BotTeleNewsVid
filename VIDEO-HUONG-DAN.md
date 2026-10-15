# Video từ bản tin Telegram

Worker: https://newsautobear-bot.thiep-hy-danglnh3264.workers.dev
Bot: https://t.me/newsautobeartalk_bot

1. Mở `start-video.cmd` trên máy có KT AI Video Studio. Giữ máy hoạt động và có mạng.
2. Trong Telegram gửi `/tin` hoặc `/tim AI | 24h`.
3. Gửi `/video <link bài báo>` bằng tài khoản đã ghép nối. Nhận cả link ngoài kho RSS từ VietnamNet và các báo được bộ đọc hỗ trợ. Trang cần cho phép đọc nội dung công khai; không vượt đăng nhập/paywall.
4. Gửi `/check_status` để xem 5 yêu cầu gần đây. Máy nhận yêu cầu khoảng mỗi 30 giây, xử lý từng video.
5. MP4 được gửi lại đúng cuộc trò chuyện yêu cầu. Chú thích gồm tiêu đề gốc, nguồn, thời gian Việt Nam và mã yêu cầu.

Tên tệp: `tieu-de-bai-bao__YYYY-MM-DD_HH-mm-ss.mp4`, giờ Việt Nam. Thư mục giao bản gốc:
`E:\Dang\App_KhanhTra\KT-AI-VIDEO-STUDIO-main\videos\telegram\<mã yêu cầu>`.
Ứng dụng cũng giữ bản dựng tại thư mục riêng của nó. Bản gửi quá 48 MB được thử nén bằng FFmpeg, không thay bản gốc. Nếu vẫn vượt giới hạn hoặc không nén được, kiểm tra bản gốc trên máy.

Mặc định dùng video dọc 9:16 và cấu hình API/giọng của ứng dụng. Không đăng lên mạng xã hội. Không mở cổng hoặc công khai trang cài đặt của ứng dụng. Chỉ chủ bot được tạo yêu cầu; không mở cho người lạ dùng phần cứng của máy.

Nếu mất mạng khi gửi: không tự gửi lại khi chưa biết Telegram đã nhận hay chưa. Trạng thái `uncertain` cần kiểm tra Telegram và bản MP4 trước khi gửi lại. Nếu ứng dụng bị tắt giữa lúc dựng, yêu cầu có thể được đánh dấu thất bại để tránh dựng trùng. Yêu cầu đang chờ vẫn lưu trên cloud khi máy tắt.

Không tự bật máy hoặc ngăn sleep. Chạy lại `start-video.cmd` sau khi khởi động Windows. Chưa cài tự khởi động Windows.

Cấu hình riêng nằm trong `.bridge/config.json` (không đưa vào Git hoặc chia sẻ). Chỉ có khóa cầu nối, không sao chép Telegram token/Gemini key từ Cloudflare. Worker lưu dấu băm SHA-256 của khóa cầu nối. Muốn thay khóa: tạo khóa mới trên máy và đổi VIDEO_AGENT_SHA256 trong Worker.

Ứng dụng video dùng các API riêng đã cấu hình của nó. Việc ghép bot không chứng minh hạn mức miễn phí của TTS/STT; không bật billing hoặc thêm dịch vụ trả phí.

Kiểm tra kỹ thuật: `npm test`; kiểm tra kết nối: `node video-agent.mjs --check`; xây Worker: `npm run build`. Triển khai `worker.deploy.mjs`, không triển khai riêng `worker.mjs` vì phần video được nối vào khi build.

## Bài viết mạng xã hội đi kèm

Sau khi /video tạo yêu cầu mới, Cloudflare dùng Gemini viết bản nháp đánh giá 180–250 từ (giới hạn ký tự ưu tiên), gửi riêng về cùng cuộc trò chuyện để duyệt trong lúc chờ video. Dùng chung hạn mức AI 20 lượt/ngày. Không tự đăng lên mạng xã hội và không xác nhận khách quan tuyệt đối.

Bố cục: mở đầu đúng chủ đề, dữ kiện đáng chú ý, giá trị tham khảo, giới hạn thông tin, nguồn bài và lời mời góp ý. Dữ kiện chưa đối chiếu được ghi rõ. Bộ lọc từ chối kết quả quá ngắn hoặc có đoạn trùng dài; không thay thế biên tập viên.

Kết bài cố định: Nếu bạn phát hiện thông tin chưa chính xác hoặc có thể gây hiểu nhầm, hãy để lại bình luận bên dưới, kèm nguồn đối chiếu nếu có, để mình kiểm tra, rút kinh nghiệm và cải thiện những bài viết sau. Cảm ơn bạn đã góp ý!

Lỗi/hết hạn mức AI không hủy yêu cầu video. Bài nháp lưu trong D1 state theo social:<mã video>; trạng thái gửi không xác định không được tự gửi lại để tránh trùng.
