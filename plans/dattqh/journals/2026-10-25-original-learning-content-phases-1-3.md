# Nội dung tự viết: pha 1, 2, 3, 6 (code)

**Ngày:** 25/10/2026 · **Plan:** [`261025-0029-original-learning-content`](../261025-0029-original-learning-content/plan.md) · **Commit:** `90294f44`, `bd713793`, `fc28efae`, `fe88be25`, `31790027` (CI xanh ở `31790027`)

## Chuyện gì xảy ra

- Pha 1: khung Môn → Chủ đề → Mục tiêu (21 chủ đề, 64 mục tiêu), 70 quest gắn `topic`, kiểm chống chép bằng vân tay SGK. Bản vân tay đầu tiên băm không khóa; code-reviewer dựng lại được nguyên văn một bài đọc từ tệp đó (66/66 từ). Đã đổi sang HMAC có khóa bí mật (iCloud + GitHub secret `MIU_FINGERPRINT_KEY`) trước khi commit, nên bản dựng lại được chưa từng vào git. Review còn bắt: nhãn `folk` miễn quét hoàn toàn, danh sách chờ có thể thêm id, phiếu viết vẫn in chữ SGK, kiểm đáp án bị xóa nhầm cùng kiểm nguyên văn. Đã sửa hết.
- Pha 2 (agent con): không còn sách, lớp, bài, trang trên giao diện và trang công khai; `/bai/` → `/hoc/` có 301.
- Pha 6 (code): phiếu viết theo quest, nội dung tự viết.
- Pha 3: 5 quest mẫu viết lại, trang nghiệm thu riêng tư; chờ người sở hữu duyệt trước pha 4, 5.

## Sai sót của phiên

- Một `git commit` của lead kéo theo `git mv`/`git rm` mà agent pha 2 đã stage, làm `main` vỡ (`bd713793`). Sửa bằng commit khôi phục dựng qua index tạm (`fc28efae`), không force-push. Bài học ghi vào memory: khi agent con dùng chung thư mục, kiểm `git diff --cached --stat` trước mỗi commit, và dặn agent con không stage.
- Kiểm chống chép làm `content:check` chậm gấp nhiều lần trên CI (test 3,6 s lên 26–37 s): HMAC cho từng shingle, lại bị gọi khoảng 12 lần trong test. Thêm bộ đệm theo chuỗi; lần đầu bộ đệm trượt vì khóa là một Buffer mới mỗi lần gọi (khóa bộ đệm đổi sang hex). Test nội dung có giới hạn 90 s trên mọi nền tảng.

## Điều cần nhớ

- Kiểm chống chép chỉ chặn chữ của bộ sách đã băm (Kết nối tri thức); bản kể của sách khác (vd SGK cũ) không bị bắt. Người duyệt vẫn phải đọc bài dân gian.
- Deploy cần `deploy.sh setup` trước `release` (bảng 301), và phải hỏi người sở hữu.
