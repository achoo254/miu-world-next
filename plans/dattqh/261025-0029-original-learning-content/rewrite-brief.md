# Hướng dẫn viết lại một quest học (cho người viết, người hoặc agent)

Dùng cho pha 3 (mẫu), 4 (Toán), 5 (Tiếng Việt). Luật gốc ở [phase-03](./phase-03-sample-quests-acceptance.md) mục "Luật viết"; trang này là cách làm cụ thể. Hai mẫu đã viết xong để xem cách làm: `content/quests/tv2-t01-b01.json` (bài đọc tự viết) và `content/quests/toan2-cd2-b09.json` (bài toán thêm, bớt). So với bản cũ bằng `git show 90294f44:content/quests/<id>.json`.

## Giữ nguyên

- Id quest, id bước, `region`, `chapter`, `phases`, khóa của `places`, `target`/`targets` của từng bước, `kind`/`mechanic`, NPC và khung câu chuyện, `reward`.
- Không sửa `content/world/targets.json`, map, hay quest khác. Tên mục tiêu trên map có chữ "lớp" (vd "Bảng gỗ lớp Hai") để pha 7 xử lý; chữ trong quest (`places`, `goTo`, lời thoại) thì đổi ngay.

## Viết lại

- Mọi câu lệnh, số liệu, lựa chọn, đáp án, bài đọc, bảng từ ngữ, lời gợi ý, phản hồi, và mọi chữ nhắc **lớp 2, lớp Hai, lớp Một, lớp 1, SGK, sách giáo khoa, Bài N, trang N, tuần N**, kể cả `sevenQuestions`, `title`, `summary`, phần `en`.
- **Toán:** bộ số mới cùng vùng số và cùng độ khó (cộng qua 10 vẫn qua 10, có nhớ vẫn có nhớ, trong phạm vi như cũ); bài toán có lời văn đổi bối cảnh sang thế giới Miu (NPC, nơi chốn của map). Số câu luyện không ít hơn. Khung "Tóm tắt / Bài giải / Đáp số" giữ được nhưng diễn đạt bằng lời mình (không "Số … còn lại là:", "Có tất cả : … ?" y như sách).
- **Tiếng Việt:** bài đọc mới dài ±20% bài cũ, cùng thể loại (truyện ↔ truyện, thơ ↔ thơ). Truyện cổ tích luôn kể lại bằng lời mình, khai `"source": { "kind": "folk", "title": "Truyện cổ tích …" }`; ca dao, đồng dao, câu đố dùng bản truyền thống (nếu trùng vân tay thì báo lead để thêm mục duyệt ở `tools/content/allowed-traditional-passages.json`, đừng tự thêm); tác giả mất trước 1976 khai `public-domain` kèm `author`, `died`; còn lại `{ "kind": "original" }`. Câu hỏi đọc hiểu trả lời được từ chính bài mới.
- Tương đương sư phạm: mỗi bước mới cùng mục tiêu, cùng dạng bài với bước cũ; câu hỏi từ ngữ kiểm hiểu nghĩa, không chỉ nhớ lại chữ trong bài.
- Bước "nghe kể chuyện": game không có giọng kể, nên lời kể phải có trong game (lời thoại của nhân vật, hoặc một bài đọc thứ hai `original`), hoặc bước dựa trên tranh; không viết "Nghe kể chuyện" khi không có gì để nghe.
- Nguồn bài dân gian khai đúng thể loại và xuất xứ (truyện cổ tích Việt, ca dao, đồng dao, hay truyện kể dân gian nước ngoài); không đoán.
- Giọng chữ hợp mọi lứa tuổi (`.claude/rules/product-audience.md`).

## Trường kỹ thuật

- Xóa `lesson` của quest; xóa `curriculumRef` ở mọi bước; xóa `author`, `section` của bài đọc; thêm `source`. Đặt khóa `topic` ngay sau `status` (giữ chủ đề đã gán).
- Mỗi bước dạy (có `skill`, hoặc `speak`, hoặc `worksheet`) khai `objective`: id mục tiêu trong `content/learning/topics/<môn>/*.json`, cùng môn với quest (được dùng mục tiêu của chủ đề khác cùng môn, vd `chinh-ta-am-dau`, `noi-va-nghe-chia-se`, `viet-chu-hoa`).
- Đáp án số khai `expression`: một chuỗi cho câu đố, câu hỏi chọn, kéo thả (`"15 - 4"`); ô điền khai theo id ô, chỉ ô có phép tính (`{ "b5": "8 + 5", "b6": "8 + 5" }`). Dạng được hỗ trợ: cộng/trừ số nguyên trái sang phải; so sánh `"47 ? 38 + 5"` → `<`, `>`, `=`; một ẩn `"? + 5 = 12"`.
- Bước `worksheet`: bỏ `lessonId`, thêm `sheet` tự viết: `{ "title", "blocks": [ { "kind": "letter", "prompt", "letters": ["A"] } | { "kind": "copy-line", "text", "model": [..] } | { "kind": "dictation", "prompt", "title"?, "text" } | { "kind": "paragraph-prompt", "prompt", "hints": [..], "lines": 6 } | { "kind": "activity", "prompt", "media": [..] } ] }`. Chữ hoa giữ (hình chữ cái không có bản quyền); câu ứng dụng, đoạn nghe – viết, đề viết đoạn đều viết mới. Lời của bước `text` không nhắc "Bài N".
- Phản hồi (D9): mỗi bước có hỗ trợ có `feedback` 3 câu đúng, 3 câu sai; không câu nào (từ 16 ký tự) lặp lại ở bất kỳ đâu trong repo, kể cả `support.answer.text` lặp nguyên một lựa chọn của chính bước đó.
- Bước có `en` thì `en` phản ánh đúng chữ mới.

## Kiểm

Chạy tới khi rỗng cả bốn danh sách:

```sh
pnpm content:probe <quest id>
```

(learning: chủ đề, mục tiêu; copy: chống chép; links: mục tiêu, `expression`; variety: câu lặp. Lệnh coi quest đó như đã ra khỏi danh sách chờ, thoát mã 1 khi còn lỗi.) Rồi `pnpm vitest run --maxWorkers=1 apps/server/src/quest/toan2-quests.test.ts apps/server/src/quest/tv2-quests.test.ts` (chạy từ đầu tới cuối quest bằng đáp án). `pnpm content:check` đầy đủ do lead chạy. Không sửa `tools/content/textbook-copy-pending.json` (lead gỡ id).
