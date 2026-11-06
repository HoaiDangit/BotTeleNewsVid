# Kiểm tra vận hành 03/11/2026

Đối chiếu 28 lượt dựng thành công có đủ mốc bắt đầu/gửi trong agent-dashboard.log: trung vị 3 phút 42 giây, trung bình 4 phút 3 giây; khoảng 1 phút 55 giây–7 phút 49 giây. Đây là thời gian từ sau chuẩn bị ảnh đến gửi Telegram, không gồm chờ hàng đợi. Không phải cam kết thời gian cho video mới dài hơn.

Không thấy giới hạn tổng thời gian tự tắt Studio. Có giới hạn riêng cho truy vấn AI/TTS/mạng; khi API chậm hoặc lỗi phải báo trạng thái thay vì im lặng. Khi kiểm tra đã có lúc cả Studio và cầu nối không còn tiến trình, nhưng nhật ký cũ không lưu được nguyên nhân thoát. Chưa có bằng chứng xác định do máy ngủ hay do ứng dụng khác đóng tiến trình.

Bổ sung: Windows Scheduled Task NewsAutoBear-VideoWatchdog chạy ẩn khi người dùng đăng nhập, kiểm tra mỗi 30 giây, tự mở lại cầu nối đã tắt. Không tự giết lượt dựng đang hoạt động. Không đổi cài đặt nguồn điện. Máy ngủ/tắt hoặc mất mạng vẫn không dựng được.

Cloudflare: heartbeat độc lập mỗi 30 giây; cron 3 phút/lần báo khi mất kết nối hơn 3 phút (thời điểm báo thường sau 3–6 phút), báo kết nối lại, bắt đầu video, cập nhật dài mỗi 5 phút, cảnh báo 10 phút không có tiến triển và lỗi thực tế. Thông báo lỗi được lưu để thử gửi lại nếu Telegram tạm lỗi. Không tự hủy chỉ vì video chạy lâu.

Nhật ký riêng: .bridge/video-events.jsonl và .bridge/watchdog-events.jsonl; được loại khỏi Git. Sự kiện có mốc thời gian, mã job, thời lượng và lỗi đã che khóa; tiến trình bị chấm dứt từ ngoài có thể không ghi được lý do, nhưng watchdog ghi nhận lúc phải khôi phục.

Tạm ngừng tự khởi động: tạo tệp .bridge/watchdog-paused. Bỏ tệp này để tiếp tục. Muốn tắt tác vụ hẳn, Disable tác vụ NewsAutoBear-VideoWatchdog trong Windows Task Scheduler.

## Chẩn đoán job v267977845

MP4 hoàn tất lúc 11:56:29 ngày 03/11/2026 (giờ Việt Nam), dài 185,87 giây, 19.705.218 byte; kiểm tra giải mã toàn bộ và thời lượng theo spec đều đạt, 7/7 ảnh khớp manifest. Sau đó bước kiểm tra khung hình gọi execFileSync ngay trong luồng HTTP chính làm SSE không trả lời trong hạn 10 giây. Cầu nối nhận AbortError, lần đọc tiếp theo đã là completed nhưng logic cũ chỉ giữ active, dẫn tới báo failed nhầm.

Sửa: chạy kiem-video.mjs bằng tiến trình con bất đồng bộ, vẫn giữ windowsHide. Khi truy vấn tiến độ lỗi, kiểm tra lại completed và marker trước khi quyết định lỗi; completed chuyển sang ready để gửi MP4. Đặt mã STUDIO_PROGRESS_TIMEOUT rõ ràng. Phục hồi Cloudflare chỉ áp dụng job failed chưa có message_id, có bằng chứng MP4 đã kiểm tra và không có job khác đang hoạt động. Không tự gửi lại video có trạng thái uploading/uncertain.

## Sửa bổ sung 04/11/2026: cửa sổ native và giao video
- Remotion còn gọi WMIC khi dò trình soạn thảo và taskkill lúc đóng Chromium; bổ sung windowsHide cho cả hai, Chromium, compositor và FFmpeg native. Bộ cài tự áp dụng lại bản vá sau cập nhật thư viện.
- Render thử có ghi nhận tiến trình thực tế: 10/10 lần mở tiến trình có windowsHide; 57 kiểm thử đạt.
- v267977846 đã render đủ 158,17 giây / 16.257.356 byte; lỗi giao trước đó là bộ duyệt chặn cụm thuật ngữ trùng 18 từ, chưa đến bước gọi Telegram. Cụm ngắn trở thành cảnh báo duyệt bản nháp; đoạn trùng từ 50 từ vẫn bị chặn. Không suy diễn ngưỡng kỹ thuật thành bảo đảm pháp lý.
- Đã kiểm tra giải mã đầy đủ MP4 và khôi phục giao từ bản có sẵn, không gọi AI/render lại. Cloud 1.7.2-native-quiet-review; Studio và cầu nối trên máy đã nạp lại.
- Xác nhận giao v267977846: Telegram message_id=400, local/remote đều done lúc 15:20:47 ngày 04/11/2026. Có ECONNRESET và một lượt thử bộ đệm chờ quá 240 giây; lượt gửi lại sau đó thành công với bản gốc, không cần bản nén. Không khẳng định đây là lỗi Telegram API; trạng thái máy chủ được kiểm tra trước mọi lần gửi lại.

## 04/11/2026 — v267977848: Gemini TTS hết hạn mức
- Studio báo cả hai key bị quota ở bước TTS; chưa có MP4. Không phải lỗi tải Telegram hoặc mất tiến độ.
- Bộ báo lỗi trước đây cắt 600 ký tự đầu stderr nên phần hướng dẫn/script lấn mất lỗi cuối. Giờ ưu tiên lỗi TTS cuối, không nhầm cảnh báo quota của một key đã được fallback thành lỗi cuối cùng.
- Thông báo quota không cam kết thời điểm reset, không bật dịch vụ trả phí; giữ trạng thái failed, không tự gọi lại. Dashboard cũng dùng cùng bản tóm tắt. Đã nạp cầu nối và đạt 58 kiểm thử.

## Giới hạn thời lượng từ 04/11/2026
- Video bot mới (tin tức, tổng hợp nhiều bài, bài tập) có marker max90-v1: mục tiêu 60–80 giây, trần 90 giây gồm nguồn/lưu ý; 4–6 cảnh, tổng 230–280 từ theo khoảng trắng, tối đa 300.
- Cập nhật cả yêu cầu biên tập, planner riêng tin tức và lời nhắc ưu tiên ở Studio; không đổi video cũ hoặc lượt Studio không có marker.
- Chặn kịch bản quá 300 từ trước TTS, chặn tổng frame >2700 ở 30 fps trước render; không cắt ngang lời đọc, không bỏ nguồn hoặc lưu ý an toàn để đạt giới hạn. Lượt vượt trần báo cần rút gọn; không tự gọi AI lại.
- Đã cài vào Studio đang vận hành, nạp lại Studio/cầu nối khi rảnh; 59/59 kiểm thử đạt. Thay đổi này không khôi phục hạn mức TTS đã hết.

## Phục hồi TTS bằng kế hoạch giữ lại
- Thêm cơ chế nạp kế hoạch phục hồi riêng từ .bridge/recovery-plans cho đúng job v<ID> và mã SHA-256 của toàn bộ context; kiểm tra lời đọc và ngân sách 300 từ trước khi dùng. Chỉ kích hoạt với marker max90-v1, không nhận đường dẫn tùy ý từ người dùng.
- Cho phép dùng lại nội dung đã biên tập khi thư mục dựng dở bị dọn, tránh gọi lại AI viết kịch bản. Tệp phục hồi, API key và .env không đưa lên GitHub.
- v267977848: giữ hai ảnh gốc đã có; rút kế hoạch thô xuống 5 cảnh, 254 từ; tạo lại giọng và render theo trần 90 giây. Bốn key đã được Studio nhận, xác thực key thứ tư qua API danh sách model (không dùng phép thử sinh nội dung).
- 60/60 kiểm thử đạt, gồm cách ly context, chặn kế hoạch quá dài và tính lặp an toàn của bộ cài. Việc key xác thực được không đảm bảo còn quota TTS.
- Hoàn tất v267977848 ngày 04/11/2026: tạo giọng thành công, xuất MP4 79,27 giây / 9.435.105 byte; toàn bộ phục hồi tới render mất khoảng 295 giây. Kiểm tra giải mã đủ video/audio đạt; bộ duyệt không có lỗi/cảnh báo. Telegram xác nhận message_id=414; local/remote đều done. Cầu nối và Studio sẵn sàng, nhận đủ 4 key; không đưa giá trị key lên GitHub.

## 06/11/2026 — đồng bộ video bot dưới 60 giây
- Thay quy định 90 giây bằng một SHORT_RULES dùng chung cho yêu cầu tin tức, bài tập, planner và Studio: mục tiêu 45–55 giây, trần 59 giây; 3–4 cảnh, 140–160 từ, tối đa 170 từ theo khoảng trắng gồm nguồn/lưu ý.
- Lượt gần nhất v267977850 bị dừng bởi ngưỡng cũ: AI viết 303 từ, vượt 300. Giờ kịch bản quá dài được yêu cầu biên tập lại tối đa một lần sau normalizePlan, trước ảnh và TTS; không lặp vô hạn, không cắt ngang câu/nguồn/lưu ý an toàn. Nếu vẫn dài thì dừng trước TTS.
- Marker mới max60-v1 và trạng thái durationLimitSeconds=59 gắn cho lượt bot mới. Kiểm tra frame <=1770 ở 30 fps trước render; đọc thời lượng MP4 bằng FFmpeg trước gửi, chặn >=60 giây hoặc lệch trần 59 giây quá dung sai container 0,05 giây. Không chỉ ước lượng từ số từ.
- Bộ cài nâng cấp được hook max90-v1 cũ, nạp cùng module chính sách vào scripts/tele-duration-policy.mjs; planner đã dùng đúng import bản cài.
- Đã cài và nạp lại Studio/cầu nối trên máy lúc rảnh. 62/62 kiểm thử đạt: biên frame/thời lượng, cùng quy định ở các prompt, chỉ một lượt rút gọn, không gọi thêm khi kịch bản đã vừa giới hạn. Không gọi TTS/render trả phí hoặc tạo video thử trong lần sửa cấu hình này.


## 06/11/2026 — gỡ kế hoạch sport/bài tập
- Bỏ workout khỏi bundle Worker; tắt lịch 20:00, /baitap và /video_tap không tạo yêu cầu. Menu còn 4 lệnh myid, tin, video_tin, check_status; bản tin 5 tin lúc 07:00 giữ nguyên.
- Cầu nối hủy job workout đang queued trước khi lấy việc; giữ lịch sử, ảnh/video và các job đang chạy. Không xóa dữ liệu Google Drive hay thư mục ứng dụng.
- Cloudflare 1.8.0-news-only đã hoạt động; Telegram API xác nhận menu mặc định và chủ bot có đúng 4 lệnh. 62/62 kiểm thử đạt, gồm không gửi bản tối, lệnh cũ không xếp hàng, queued workout được hủy, video tin vẫn hoạt động.
