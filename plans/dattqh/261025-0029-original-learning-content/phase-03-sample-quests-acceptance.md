# Pha 3: Quest mẫu và trang nghiệm thu

**Tier:** M · **Phụ thuộc:** 1 · **Trạng thái:** in-progress (5 mẫu đã viết, chờ người sở hữu duyệt)

## Bối cảnh

N4: người sở hữu duyệt mẫu trước, sau đó mới viết hàng loạt (giống D10 của plan tập một). Công cụ nghiệm thu cũ ở `tools/sgk/acceptance-page.ts`, `acceptance-template.html`, `review-quests.ts` đánh dấu chữ SGK; giờ chuyển sang so bản cũ với bản mới.

## Luật viết (áp cho pha 3, 4, 5)

- **Giữ**: id quest, id bước, `region`, `phases`, `places`, mục tiêu trên map (`content/world/targets.json`), NPC và khung câu chuyện; D9 (kho phản hồi ≥ 3 câu đúng, ≥ 3 câu sai, không lặp), D11 (`goTo`), D12 (không khóa).
- **Viết lại**: mọi câu lệnh, số liệu, lựa chọn, đáp án, bài đọc, bảng từ ngữ, và mọi chữ trong câu chuyện nhắc lớp, sách, bài, trang (ví dụ tiêu đề "Thỏ Hạt Tiêu vào lớp Hai").
- **Tương đương sư phạm**: mỗi bước mới cùng mục tiêu, cùng dạng bài, cùng vùng số (ví dụ cộng qua 10 trong phạm vi 20) hoặc cùng độ dài bài đọc (±20%) với bước cũ; số câu luyện không ít hơn.
- **Đáp án số tính bằng code** như hiện nay; không tự gõ kết quả phép tính.
- **Bài đọc**: truyện cổ tích luôn kể lại bằng lời mình (`folk`); ca dao, đồng dao, câu đố dùng bản truyền thống, khai nguồn; tác giả hết bảo hộ khai tên và năm mất; còn lại `original`. Không dùng bản dịch trừ khi người dịch cũng hết bảo hộ.
- **Giọng chữ** hợp mọi lứa tuổi theo `.claude/rules/product-audience.md`.

## Việc

1. Chọn 5 quest mẫu phủ đủ kiểu: 2 Tiếng Việt (một bài đọc dân gian, một bài đọc tự viết, có phần nói và nghe) và 3 Toán (phép tính, bài toán có lời văn, đồng hồ hoặc hình). Chọn quest có lượt chơi thật trên production nếu đo được, để mẫu đại diện.
2. Viết lại 5 quest theo luật trên; gỡ id của chúng khỏi `textbook-copy-pending.json`.
3. Trang nghiệm thu `tools/learning/acceptance-page.ts` (chuyển từ `tools/sgk/`): từng bước đặt bản cũ cạnh bản mới, nhãn mục tiêu, nguồn bài đọc, kết quả kiểm chống chép, ảnh màn hình từng cơ chế, link chơi thử. Trang sinh ra chỉ ở máy hoặc qua tunnel, **không** đưa vào bundle production (bản cũ còn chữ SGK).
4. Gửi người sở hữu link trang; ghi góp ý và áp vào mẫu trước khi mở pha 4, 5. Ghi bản luật viết cuối vào phase file này.
5. Tạo report `plans/dattqh/reports/` ghi quyết định duyệt.

## File

Sửa: 5 file `content/quests/*.json` được chọn, `tools/content/textbook-copy-pending.json`.
Chuyển và sửa: `tools/sgk/{acceptance-page.ts,acceptance-template.html,review-quests.ts}` → `tools/learning/`.

## Kiểm tra

- `pnpm content:check` xanh: 5 quest không trùng vân tay, đủ phủ mục tiêu, đủ D9, D11.
- `pnpm vitest run apps/server/src/quest/toan2-quests.test.ts apps/server/src/quest/tv2-quests.test.ts` xanh (sửa test nếu đang kiểm nguyên văn).
- Người sở hữu duyệt trên trang nghiệm thu (cổng chặn pha 4, 5).

## Rủi ro

- Mẫu không đại diện: chọn trải dạng bài và cả hai môn; góp ý áp vào luật viết chung, không chỉ sửa 5 file.

## Tiến độ (25/10/2026)

- 5 quest mẫu đã viết lại, ra khỏi danh sách chờ (còn 65): `tv2-t01-b01` (bài đọc tự viết "Chiếc cặp màu nắng", có nói và nghe), `tv2-t14-b25` (truyện cổ tích "Hai anh em" kể lại bằng lời mới, `folk`), `toan2-cd1-b05` (cộng, trừ không nhớ đến 100), `toan2-cd2-b09` (bài toán thêm, bớt), `toan2-cd6-b29` (đồng hồ). Chọn theo dạng bài, không đo lượt chơi production (cần quyền đọc DB production, không đáng cho việc chọn mẫu).
- Kiểm chống chép: bản cũ lần lượt 22, 33, 9, 13, 20 chỗ trùng SGK; bản mới 0. Mọi bước học có `objective`; đáp án số có `expression`; phiếu viết của `tv2-t01-b01`, `tv2-t14-b25` là phiếu tự viết (`sheet`, pha 6).
- Trang nghiệm thu: `pnpm learning:acceptance` (`tools/learning/acceptance-page.ts`) ghi `.data/acceptance/index.html` (ngoài git, vì cột "bản cũ" còn chữ SGK); bản đăng riêng tư cho người sở hữu: https://claude.ai/artifact/SPHSymKSZckrzMm2t6bFmS. Công cụ cũ `tools/sgk/acceptance-page.ts` và template đã xóa.
- Cách viết cho người viết (người hoặc agent): [`rewrite-brief.md`](./rewrite-brief.md).
- Điểm để người sở hữu xem khi duyệt: truyện của `tv2-t14-b25` là hai anh em (khung quest là chị em ong; nối bằng lời thoại); id bước còn mang chi tiết cũ (vd `ban-gai-ngu-luc-23-gio` nay là 22 giờ) vì id giữ nguyên để không mất tiến độ, id không hiện cho người chơi; tên mục tiêu trên map có chữ "lớp" (vd "Bảng gỗ lớp Hai") chờ pha 7 sinh lại map.
- Sau review (`code-reviewer-261025-0321-phases-2-3-6.md`): bài đọc của `tv2-t14-b25` kể lại xa hơn bản cũ và khai đúng nguồn (truyện kể dân gian lưu truyền ở nhiều nước, không phải truyện cổ tích Việt); bước nghe kể dựa trên tranh vì game không có giọng kể (luật chung cho pha 5: bước "nghe kể" phải có lời kể trong game, hoặc dựa trên tranh); câu hỏi từ chỉ đặc điểm của `tv2-t01-b01` kiểm hiểu nghĩa ("lí nhí") thay vì nhớ chữ; `toan2-cd6-b29` hỏi "giờ tối" khớp bài dạy. Trang nghiệm thu không có ảnh từng cơ chế (cần E2E trên máy có màn hình) và chưa có link chơi thử trực tiếp: quest mẫu đã bật, chơi được sau lần deploy tới.
