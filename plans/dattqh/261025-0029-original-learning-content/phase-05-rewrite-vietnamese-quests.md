# Pha 5: Viết lại 34 quest Tiếng Việt

**Tier:** XL · **Phụ thuộc:** 3 (người sở hữu đã duyệt mẫu) · **Trạng thái:** done (25/10, commit `348e02d3`, `56eae4ad`, `7d823d40`, `b9c97fe3`)

## Bối cảnh

34 file `content/quests/tv2-*.json` (trừ mẫu) chép bài đọc, bài thơ của tác giả còn bảo hộ, bảng từ ngữ, câu hỏi đọc hiểu, bài luyện từ và câu, nói và nghe. Mỗi quest khoảng 30 KB; mỗi quest có một hoặc nhiều mục `texts` (bài đọc) mà nhiều bước bám vào. Đây là phần nặng nhất vì bài đọc mới quyết định toàn bộ câu hỏi đi kèm.

## Việc

1. **Danh mục bài đọc trước, câu hỏi sau**: lập bảng bài đọc mới cho cả 34 quest (chủ đề, độ dài mục tiêu, nguồn dự kiến: ca dao, đồng dao, câu đố, truyện cổ tích kể lại, tác giả hết bảo hộ, hoặc tự viết), lưu ở `reading-list.md` trong thư mục plan. Kiểm năm mất của từng tác giả `public-domain` và ghi nguồn tra cứu. Hỏi Jev duyệt bảng này trước khi viết câu hỏi.
2. Chia 4–5 đợt theo chủ đề; mỗi người viết sở hữu trọn file quest của đợt.
3. Mỗi quest: viết bài đọc theo bảng (khai `source`), bảng từ ngữ, rồi câu hỏi đọc hiểu, luyện từ và câu, nói và nghe theo luật viết ở pha 3 và mục tiêu của chủ đề; câu chuyện bao quanh bỏ chữ lớp Hai; gỡ `lesson`, `curriculumRef`, thay bằng `objective`; gỡ id khỏi `textbook-copy-pending.json`.
4. Phần thu âm trên máy (D2) và bước `speak`: đổi câu mẫu theo bài đọc mới; không đổi cơ chế.
5. Hết mỗi đợt: `content:check` xanh, Jev duyệt trên trang nghiệm thu, lưu quyết định; đợt xong vào hàng release (T5), hỏi người sở hữu trước khi deploy.

## File

Sửa: `content/quests/tv2-*.json` (34 file trừ mẫu), `tools/content/textbook-copy-pending.json`, `apps/server/src/quest/tv2-quests.test.ts`.
Mới: `reading-list.md` (trong plan).

## Kiểm tra

- `pnpm content:check` (chống chép, nguồn bài đọc và năm mất, phủ mục tiêu, D9, D11), `pnpm vitest run apps/server/src/quest/tv2-quests.test.ts`, `typecheck`, `lint`; CI xanh.
- Độ dài bài đọc trong ±20% bài cũ; câu hỏi đọc hiểu trả lời được từ chính bài đọc mới (kiểm bằng người viết thứ hai đọc chéo trong đợt).

## Rủi ro

- Bài dân gian trùng bản đã biên tập trong SGK: vân tay vẫn quét; trùng mà không kể lại được thì đổi bài.
- Văn tự viết đều giọng giữa 34 quest: kiểm không lặp câu của D9 áp cả cho bài đọc; Jev đọc mẫu ngẫu nhiên mỗi đợt.

## Kết quả (25/10/2026)

- 33 quest Tiếng Việt viết lại trong 10 đợt theo `reading-list.md` (Jev duyệt, `plans/dattqh/reports/jev-261025-1110-reading-list.md`) và `rewrite-brief.md`; `tv2-t14-b25` đổi bài đọc sang Cây khế. Danh sách chờ `textbook-copy-pending.json` trống.
- Nguồn bài đọc: dân gian (Cây khế, Treo biển, Thầy bói xem voi, Sự tích bánh chưng bánh giầy, đồng dao Chi chi chành chành, ca dao hát ru), còn lại tự viết. Không bài nào cần mục duyệt trong `allowed-traditional-passages.json`.
- Truyện phụ nghe/kể theo tranh viết mới, lời kể nằm trong lời thoại của nhân vật. Bài thơ, bài hát còn bảo hộ và bìa sách thật trong các bước phụ đã thay.
- Lead chỉnh khi gom: tên lớp thống nhất "lớp Chim Sẻ" như map (đợt viết đặt "lớp Hoa Mai"); `toan2-cd1-b01` gọi chỗ "cửa lớp Chim Sẻ" để map trường học giữ bố cục; thêm bước `xep-buoc-choi` (sắp năm bước chơi) cho `tv2-t13-b23` để mục tiêu làm theo hướng dẫn có dạng sắp xếp; bước đọc đầu của 5 quest truyện gắn `doc-truyen-doc-to`; `tv2-t12-b22` đổi tựa "chú lê-gô" thành "chú khối gỗ".
- Kiểm: `content:probe` rỗng từng quest; `content:check` OK (2171 file); `tv2-quests.test.ts`, `toan2-quests.test.ts`, `tools/content/` 268/268.

### Người duyệt cuối cần xem

- Lời đồng dao `tv2-t13-b23` theo trí nhớ người viết ("Con ngựa đứt cương", "Cấp kế đi tìm"), có dị bản.
- Ca dao `tv2-t15-b27` "…công lao mẫu từ" (dị bản "mẹ già").
- `tv2-t17-b32`: cặp "Anh em như thể tay chân / Rách lành đùm bọc…" trùng vân tay nên chỉ giữ dòng đầu.
- Khung quest hơi lệch bài đọc ở `tv2-t16-b29` (cửa chòi, bài nói cột nhà), `tv2-t16-b30` (ông Vện, bài nói về bà); đã nối bằng lời thoại.
