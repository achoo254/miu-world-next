# Nội dung học tự viết, pha 4–7 (25/10/2026)

**Kết quả:** 70 quest học (36 Toán, 34 Tiếng Việt) viết lại bằng lời của mình, theo môn → chủ đề → mục tiêu; kiểm kê sách và mọi miễn trừ đã xóa; deploy production cùng ngày.

## Cách làm
- 8 đợt Toán và 10 đợt Tiếng Việt chạy song song, mỗi agent chỉ sửa file quest của mình, không stage; lead gỡ id khỏi danh sách chờ, chạy `content:check`, commit theo đợt. Danh mục bài đọc Tiếng Việt do một agent lập và Jev duyệt (`plans/dattqh/reports/jev-261025-1110-reading-list.md`).
- Kiểm theo từng quest (`pnpm content:probe`) giúp agent tự sửa tới khi sạch; lỗi còn lại khi gom chủ yếu là độ phủ mục tiêu (một mục tiêu chưa có dạng bài nào), chỉ lộ ra khi cả chủ đề rời danh sách chờ.

## Điều học được
- Đặt mục tiêu quest bằng một dòng số ngẫu nhiên chung cho cả map khiến đổi tên một chỗ làm dời cả map (655 dòng ở trường học) và lộ ra lỗi bạn máy rơi xuống kênh. Nay mỗi quest có dòng số riêng.
- Đổi đường đi của bạn máy làm lộ lỗi mất cập nhật khi tắt server (phai giá trị không tăng revision). Test đỏ vì lệch nhỏ cũng có thể là lỗi thật: tìm nguyên nhân trước khi nới ngưỡng.
- Cổng chống chép từng tắt im lặng khi khóa sai; nay có giá trị kiểm khóa được commit và lỗi khóa làm `content:check` đỏ.
- `assets:fetch` không lọc theo pack nên xóa tạm file của pack khác; zip Kenney City Kit Roads trên upstream đã đổi hash.

## Còn mở
- Người sở hữu duyệt nội dung mới trên trang nghiệm thu (lời đồng dao, ca dao có dị bản: xem `phase-05` mục "Người duyệt cuối cần xem").
- Rà clip đã đăng trên mạng xã hội; tỉ lệ kẹt bạn máy ở trường học 4,61%; `bot-load.test.ts` đôi khi đỏ trên CI vì đo thời gian thật.
