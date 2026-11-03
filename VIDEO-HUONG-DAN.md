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

## Cập nhật nguồn và ảnh (02/11/2026)

- Video tin mục tiêu 120–180 giây nếu nguồn đủ dữ kiện; không thêm dữ kiện để kéo dài. Lời đọc chỉ nhắc nguồn báo, không đọc tên giọng/công cụ hay trạng thái bản nháp.
- Gửi ảnh JPEG/PNG/WebP (tối đa 6 MB) với caption `/video_tin https://trang-bao/bai-viet`, hoặc trả lời ảnh bằng lệnh đó. Ảnh dùng làm minh họa và ảnh bìa video Telegram; bản JPEG bìa được lưu cạnh MP4.
- Ưu tiên ảnh bạn gửi, tiếp đến ảnh trang nguồn; khi không có ảnh sẽ thử chụp trang nguồn trong trình duyệt riêng. Giữ ảnh dự phòng nếu trang chặn hoặc không chụp được.
- Chấp nhận trang HTTPS công khai, không còn giới hạn vào danh sách báo cố định. Không vượt đăng nhập/chặn truy cập; không phải mọi định dạng trang đều đọc được.
- Nội dung tự nhập: `/video_tin Tên bài | Tên nguồn | Nội dung từ 300 ký tự`. Có link: `/video_tin URL | Tên bài | Tên nguồn | Nội dung`.
- Tệp .txt UTF-8: tối đa 120 KB, nội dung 300–30000 ký tự, caption `/video_tin Tên bài | Tên nguồn | URL nếu có`.
- Menu vẫn gồm 6 lệnh. Runtime source-media-v2 cần triển khai đồng bộ Cloudflare và cầu nối máy tính. Nguồn và trạng thái quyền ảnh được lưu ở manifest riêng.

## Video giải thích bằng đồ họa web (03/11/2026)

Video tin mới dùng thẻ nền sáng, sơ đồ thông tin xuất hiện theo thời lượng cảnh, thẻ số liệu, so sánh hai phía và biểu đồ khi bài có đủ số liệu tương thích. Ảnh bài báo tiếp tục làm minh họa. Lời đọc trình bày sự kiện, cơ chế, dữ kiện, tác động và điều chưa rõ; nhận định có điều kiện phải tách khỏi thông tin nguồn. Không tự đặt số để vẽ biểu đồ.

Cài bằng `installExplainer(appRoot)` từ `install-explainer.mjs`. Installer sao lưu các tệp bị sửa dưới .bridge/studio-backups và chỉ kích hoạt chế độ mới với marker `[NewsAutoBear explain-web-v1]`; video bài tập và yêu cầu Studio thông thường giữ nhánh cũ. Cần khởi động lại riêng Studio Telegram khi không có video đang dựng, rồi khởi động cầu nối để nạp fingerprint mới. Không đổi menu hoặc dịch vụ Cloudflare.

Đã bỏ giới hạn prompt chung 50–100 giây cho riêng chế độ giải thích: mục tiêu 3–4 phút khi đủ dữ kiện, không kéo dài nguồn ngắn. Bản dựng thử từ nguồn dài có 8 cảnh, 604 từ; thời lượng cuối phụ thuộc TTS.

## Chạy ẩn và nhập tự do nhiều nguồn (03/11/2026)

- Cài `installQuiet(appRoot)` hoặc `installExplainer(appRoot)` để bổ sung windowsHide vào các tiến trình Node/FFmpeg của UI, TTS, thử giọng, video bài báo, ghi demo và kiểm tra nguồn. Các bản gốc được sao lưu dưới .bridge/studio-backups. Cần khởi động lại Studio đang mở khi rảnh để nạp mã mới.
- Sau /video_tin, viết tự do và đặt link ở bất kỳ đâu. Toàn bộ nội dung tin nhắn/caption/tệp .txt được lưu trong payload.userText và đưa vào tư liệu kịch bản, không coi phần sau link chỉ là tên nguồn. Bot tự tách tối đa 5 link HTTPS công khai, bỏ link trùng và nhận link ẩn của Telegram.
- Gửi tối đa 30000 ký tự tư liệu; tệp .txt UTF-8 tối đa 120 KB. Nếu vượt giới hạn bot báo lỗi thay vì âm thầm bỏ nội dung. Nội dung bài đọc từ web được phân bổ dung lượng hợp lý và ghi rõ nếu chỉ lấy trích đoạn.
- Nhiều bài cùng sự kiện: gộp dữ kiện, đối chiếu thời điểm, ghi nhận bất đồng. Bài khác chủ đề: chia mục trong một video tổng hợp. Không tự xem nhiều bài là nguồn độc lập. Link không đọc được được ghi rõ, chỉ dùng các nguồn đã đọc và tư liệu người gửi.
- Ví dụ: `/video_tin Bổ sung bối cảnh về AI tại Việt Nam. https://bao-a.vn/bai-1 https://bao-b.vn/bai-2 So sánh các dữ kiện và chỉ rõ điểm chưa thống nhất.`
- Runtime multi-source-v3 cần triển khai đồng bộ Worker và cầu nối máy tính; menu vẫn 6 lệnh. Không tự tìm thêm bài liên quan ngoài các link được gửi.
