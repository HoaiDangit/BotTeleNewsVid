# Hai luồng nội dung

Giờ Việt Nam: 07:00 gửi tối đa 5 tin nổi bật mới trong 24 giờ; 20:00 gửi 5 bài tập tham khảo riêng. Chỉ chủ bot nhận bản tự động, thành viên trong danh sách được phép dùng lệnh để xem và tạo video. Thiếu tin mới thì báo thiếu, không thêm tin cũ cho đủ. Nguồn RSS và xếp hạng ảnh hưởng xã hội giữ nguyên.

Menu 6 lệnh: /myid, /tin, /baitap, /video_tin, /video_tap, /check_status. /start và /help vẫn mở hướng dẫn; quản trị viên vẫn gõ trực tiếp /allow, /deny, /users. Các lệnh cũ ngoài menu được hướng dẫn dùng menu mới; /video và /video_status giữ làm bí danh để người dùng cũ không mất khả năng gọi.

Ví dụ:

    /tin AI
    /video_tin https://example.com/bai-bao
    /baitap
    /video_tap 2
    /video_tap Squat | Đứng hai chân vững, hạ người có kiểm soát rồi đứng lại | 5 lần | https://example.com/nguon

Hai trường cuối của mô tả bài tập là tùy chọn. Mô tả cần ít nhất 25 ký tự; tối đa 1800 ký tự toàn yêu cầu. Số 1–5 lấy từ danh sách của ngày hiện tại theo giờ Việt Nam; qua ngày cần mở /baitap lại để chọn đúng. Nguồn tùy chọn được lưu để người biên tập đối chiếu, hệ thống không mặc nhiên xác minh trang người dùng gửi. Động tác do người dùng cung cấp được ghi nguồn người dùng, không gắn nhãn đã có chuyên gia duyệt. Không tự đặt số lần tập nếu thiếu.

Video tin dùng biên tập nguồn và tác động thông tin. Video bài tập dùng chuẩn bị, động tác, mức tập, lưu ý; cùng quy trình dựng trên PC và gửi về đúng cuộc trò chuyện. Hàng đợi có kind=news/workout; dữ liệu cũ mặc định news. /check_status phân loại hai nội dung. Bài đăng kèm workout tách khỏi bài nhận xét báo chí và giữ lời mời góp ý.

Thư viện bài tập khởi đầu gồm 7 lựa chọn từ NHS, đối chiếu ngày 26/10/2026. Mỗi ngày chọn đi bộ nhanh và luân phiên 4 bài sức mạnh. Đây là tuyển chọn từ thư viện có nguồn, không phải tự nghiên cứu lâm sàng mới hoặc 5 bài mới hoàn toàn mỗi ngày. Cần bổ sung/đối chiếu thư viện khi có nguồn phù hợp; bot không tuyên bố bài tập nào bảo đảm giảm cân hoặc là hiệu quả nhất cho mọi người.

https://www.nhs.uk/live-well/exercise/walking-for-health/
https://www.nhs.uk/live-well/exercise/strength-exercises/
https://www.cdc.gov/physical-activity-basics/guidelines/adults.html

Ảnh Drive cho workout phải khớp tên/biệt danh động tác, không dùng ảnh Gym ngẫu nhiên. Không khớp thì dùng phác họa thể lực có nhãn không hướng dẫn tư thế. Bản nháp video cần kiểm tra động tác, mức tập, ảnh và phụ đề trước khi đăng; không tự xuất bản.

Cầu nối dual-v1 mới nhận việc; bản cũ media-v3 bị chặn để tránh xử lý workout bằng kịch bản báo chí. Thư mục trạng thái runtime-v3 giữ lại để tiếp tục lịch sử video. Không cần thay Cloudflare Secrets, không thêm dịch vụ tạo ảnh hoặc gói trả phí.
