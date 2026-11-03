# Kiểm tra vận hành 03/11/2026

Đối chiếu 28 lượt dựng thành công có đủ mốc bắt đầu/gửi trong agent-dashboard.log: trung vị 3 phút 42 giây, trung bình 4 phút 3 giây; khoảng 1 phút 55 giây–7 phút 49 giây. Đây là thời gian từ sau chuẩn bị ảnh đến gửi Telegram, không gồm chờ hàng đợi. Không phải cam kết thời gian cho video mới dài hơn.

Không thấy giới hạn tổng thời gian tự tắt Studio. Có giới hạn riêng cho truy vấn AI/TTS/mạng; khi API chậm hoặc lỗi phải báo trạng thái thay vì im lặng. Khi kiểm tra đã có lúc cả Studio và cầu nối không còn tiến trình, nhưng nhật ký cũ không lưu được nguyên nhân thoát. Chưa có bằng chứng xác định do máy ngủ hay do ứng dụng khác đóng tiến trình.

Bổ sung: Windows Scheduled Task NewsAutoBear-VideoWatchdog chạy ẩn khi người dùng đăng nhập, kiểm tra mỗi 30 giây, tự mở lại cầu nối đã tắt. Không tự giết lượt dựng đang hoạt động. Không đổi cài đặt nguồn điện. Máy ngủ/tắt hoặc mất mạng vẫn không dựng được.

Cloudflare: heartbeat độc lập mỗi 30 giây; cron 3 phút/lần báo khi mất kết nối hơn 3 phút (thời điểm báo thường sau 3–6 phút), báo kết nối lại, bắt đầu video, cập nhật dài mỗi 5 phút, cảnh báo 10 phút không có tiến triển và lỗi thực tế. Thông báo lỗi được lưu để thử gửi lại nếu Telegram tạm lỗi. Không tự hủy chỉ vì video chạy lâu.

Nhật ký riêng: .bridge/video-events.jsonl và .bridge/watchdog-events.jsonl; được loại khỏi Git. Sự kiện có mốc thời gian, mã job, thời lượng và lỗi đã che khóa; tiến trình bị chấm dứt từ ngoài có thể không ghi được lý do, nhưng watchdog ghi nhận lúc phải khôi phục.

Tạm ngừng tự khởi động: tạo tệp .bridge/watchdog-paused. Bỏ tệp này để tiếp tục. Muốn tắt tác vụ hẳn, Disable tác vụ NewsAutoBear-VideoWatchdog trong Windows Task Scheduler.
