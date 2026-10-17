# Danh sách tài khoản được phép

Chủ bot sau ghép nối là quản trị viên, luôn có quyền truy cập.

1. Người mới mở bot và gửi /myid, rồi gửi ID dạng số cho quản trị viên.
2. Quản trị viên gửi /allow <ID>.
3. Người được phép gửi /start và dùng /tin, /tim, /hoi, /video, /check_status. Video gửi về đúng chat yêu cầu, mỗi người chỉ xem trạng thái video của mình.
4. Quản trị viên gửi /users để xem danh sách hoặc /deny <ID> để thu hồi.

Chỉ quản trị viên được thêm/xóa/xem danh sách. Người chưa được phép chỉ lấy được ID của chính mình và hướng dẫn xin quyền. Không hỗ trợ thêm bằng username vì username có thể đổi; dùng ID số.

Dữ liệu access:<ID> lưu trong Cloudflare D1, không đưa ID người dùng lên GitHub. Hạn mức AI 20 lượt/ngày và hàng đợi video tối đa 10 đang xử lý được chia sẻ; chưa có hạn mức riêng từng người. Lịch gửi tự động 07:00/20:00 vẫn gửi quản trị viên; người được phép xem cùng bản tin qua /sang hoặc /toi.

Thu hồi quyền hủy video queued/running và chặn upload nếu tài khoản đã bị xóa. Video đã gửi hoặc đã bắt đầu gửi lên Telegram không thể thu hồi bằng /deny. Bản ghi và tệp video cũ vẫn giữ nguyên.

Kiểm thử bao gồm người lạ, người được cấp quyền, giả mạo lệnh quản trị, thêm/xóa, không xóa chủ bot và hủy yêu cầu của người bị thu hồi.

## Xác lập lại quản trị viên

Vai trò gắn với Telegram ID dạng số do /myid trả về. Tạo bot trong BotFather không tự gán owner trong D1. /myid nay hiển thị ID và vai trò đang có.

Công cụ phục hồi trên máy dùng POST /render/admin qua khóa cầu nối riêng. action inspect kiểm tra chủ hiện tại hoặc ID đích bằng Telegram getChat; action assign chỉ gán khi ID và username hiện tại khớp Telegram. Không suy ra ID từ tên hiển thị. Chỉ dùng công cụ này khi chủ bot yêu cầu chuyển quyền rõ ràng. Khóa .bridge/config.json nay có quyền phục hồi quản trị; phải giữ riêng trên máy.

Khi chuyển quyền, menu quản trị cũ được thay bằng menu thường, menu quản trị mới được đồng bộ. Các thành viên đã cho phép vẫn giữ nguyên. ID/username thực tế của quản trị viên lưu tại D1, không hardcode trong repository.
