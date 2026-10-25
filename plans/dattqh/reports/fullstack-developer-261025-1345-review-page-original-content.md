# Trang review cho đợt nội dung học tự viết (pha 7, việc 6)

Ngày: 2026-10-25 · Plan: `plans/dattqh/261025-0029-original-learning-content/` · Trạng thái: xong phần trang review, chưa commit.

## Kết quả

`apps/web/review.html` có mục mới **"Nội dung học viết bằng lời của mình (25/10/2026)"**, đặt đầu trang (mới nhất ở trên, mục lục tự lấy). Mục gồm:

- **Viết lại:** 70 quest học, Toán 36, Tiếng Việt 34 (đọc từ số liệu sinh ra); id giữ nguyên nên tiến độ giữ nguyên; 12 map sinh lại với chỗ đặt riêng cho từng quest.
- **Độ phủ theo mục tiêu:** bảng theo môn từ `objective-coverage.json` (chuyển từ mục cũ lên đây), thêm dòng "Cả môn" (CSS sẵn có đã in đậm dòng cuối).
- **Kiểm chống chép:** badge "0 chỗ trùng", 630 quest và 21 chủ đề đã kiểm. Trang không hiện vân tay, khóa hay câu chữ trùng.
- **Nguồn bài đọc:** 37 bài: 31 tự viết, 6 dân gian, 0 hết thời hạn bảo hộ. Sáu bài dân gian ghi theo tên: Lời ru của mẹ (Ca dao), Chi chi chành chành, Cây khế, Treo biển, Thầy bói xem voi, Sự tích bánh chưng, bánh giầy.
- **Asset mới:** pack `font-playwrite-vn` 1.003, OFL 1.1; không thêm gói npm. Dòng tương ứng cũng thêm vào mục "Dependency mới của đợt".
- **Sửa lỗi bạn máy:** bạn máy rơi xuống kênh; phần phai giá trị nơi đã biết bị mất khi tắt server.

## Số liệu sinh ra

Trang chưa từng đọc `content/quests` lúc build. Đọc quest vào bundle cũng sẽ đưa đáp án vào web, nên số liệu nằm trong một tệp JSON nhỏ:

- `tools/content/learning-review-summary.ts` (mới) là hàm thuần. Nó đếm quest học đang mở theo môn và bài đọc theo `source.kind`, liệt kê bài dân gian (tên tác phẩm và tên bài), rồi nhận kết quả kiểm chống chép dưới dạng số.
- `pnpm content:gaps --review` nay ghi thêm `assets/generated/review/learning-content.json`. Kiểm chống chép chạy đúng như `content:check` (`checkRepoTextbookCopy`). Máy không có khóa thì ghi `copyCheck: null` và trang hiện "Chưa kiểm".
- Tệp mới đã khai trong `tools/assets/generated.json`, sau đó chạy `pnpm assets:manifest` (manifest +8 dòng, không sửa tay). Chạy lại generator thì ra đúng cùng byte (đã so sha256).

## Gỡ chữ của sách cũ

- Chú thích ảnh vật thể: "(Toán bài N)" và "(Tiếng Việt bài 15 / ôn cuối kì)" đổi thành môn kèm tên quest mới. Vật trong ảnh vẫn có trong quest đã viết lại (đã grep).
- Mục cũ "Nội dung học theo chủ đề" đổi thành "Vật thể trong quest học". Phần độ phủ chuyển sang mục mới.
- Nghiệm thu: "70 bài SGK lớp 2 tập 1" đổi thành "70 quest học Toán và Tiếng Việt"; "Hoãn: SGK tập 2" đổi thành "nội dung học thêm".
- Việc cần người, dòng giáo viên: "Giáo viên duyệt nội dung SGK / Giáo viên lớp 2" đổi thành "Giáo viên duyệt nội dung học / Giáo viên tiểu học".
- Đã bỏ chỗ trỏ tới `sgk-*-teacher-flags.md`, ở dòng giáo viên và trong danh sách chờ giáo viên duyệt. Hai tệp đó liệt kê đáp án của các bước theo sách cũ, nay không còn.
- Marketing: thay câu về trang `/bai/` theo sách (Kết nối tri thức) bằng trang chủ đề `/hoc/<môn>/<chủ-đề>/` có 301 từ `/bai/`, nút "Chơi chủ đề này".
- Các chỗ còn lại: "dạng bài SGK" đổi thành "dạng bài học"; "một bài SGK ở map khác" đổi thành "một quest học"; "bài SGK tập 2 vào sau" đổi thành "nội dung học thêm vào sau"; "36 bài Toán" đổi thành "36 quest Toán".
- Chạy `git grep -nE "lớp 2|lớp Hai|SGK|sách giáo khoa|Kết nối tri thức|bài [0-9]+" -- apps/web/review.html apps/web/src/review` thì không còn kết quả nào.

## Kiểm tra

| Lệnh | Kết quả |
| --- | --- |
| `pnpm assets:check` | OK, 17 pack, 4747 file |
| `pnpm content:check` | OK, 2159 file, không có cảnh báo khóa (máy có khóa) |
| `pnpm typecheck` | sạch (gốc + server, web, mobile) |
| `pnpm lint` | sạch, 0 warning; check-brand đạt |
| `pnpm vitest run --maxWorkers=1` cho `learning-review-summary.test.ts`, `vite-repo-assets.test.ts`, `vite-seo-meta.test.ts`, `check-assets.test.ts` | 4 tệp, 30 test đạt, 1 skip (test symlink trên Windows, như đã ghi trong CLAUDE.md) |

`apps/web/src/review` không có tệp test. Không chạy full `pnpm test`, build web hay E2E vì máy dùng chung; CI sẽ build. Tôi chưa xem trang trong trình duyệt.

## Tệp đã sửa

- `apps/web/review.html`
- `apps/web/src/review/review-main.ts`
- `tools/content/content-gaps.ts`
- `tools/content/learning-review-summary.ts` (mới)
- `tools/content/learning-review-summary.test.ts` (mới)
- `tools/assets/generated.json`
- `assets/generated/review/learning-content.json` (sinh ra)
- `assets/manifest.json` (sinh bằng `pnpm assets:manifest`)

## Câu hỏi còn mở

- Việc 6 của pha 7 còn ảnh màn chính (`docs/screen-review.md`) và phần rà clip đã đăng; phiên này không làm hai phần đó.
- Hai tệp `plans/dattqh/reports/sgk-*-teacher-flags.md` đã lỗi thời. Có nên ghi chú "superseded" vào hai tệp đó không? Phiên này không đụng tới vì chúng là bản ghi lịch sử.
