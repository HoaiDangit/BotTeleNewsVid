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
