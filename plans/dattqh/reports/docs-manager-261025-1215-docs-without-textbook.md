# Tài liệu theo nội dung học tự viết (pha 7, mục 4 và 5)

Plan: `plans/dattqh/261025-0029-original-learning-content/`. Các thay đổi chưa được stage hay commit.

## Bề mặt đã sửa

| File | Thay đổi |
| --- | --- |
| `README.md` | Mô tả nay nói 70 quest học Toán, Tiếng Việt viết bằng lời của mình, theo môn, chủ đề, mục tiêu. Mục giấy phép bỏ dòng văn bản SGK. |
| `CLAUDE.md` | Viết lại đoạn "Giai đoạn hiện tại" và bỏ ghi chú worktree `miu-world-sgk`. Tệp riêng chỉ còn thời khóa biểu. Dòng lệnh nội dung đổi thành `content:gaps [--missing] [--review]` theo mục tiêu, kèm ghi chú khóa vân tay (`MIU_FINGERPRINT_KEY`). Mục "Dễ vấp" không còn nhắc worktree cũ. |
| `.claude/rules/product-audience.md` | Phần học theo chủ đề và mục tiêu, không theo sách hay lớp. |
| `docs/project-overview-pdr.md` | Thêm ràng buộc "Nội dung học" (lý do: repo công khai) và thuật ngữ Chủ đề / Mục tiêu. |
| `docs/codebase-summary.md` | Hàng quest: bỏ `lesson`, thêm `topic`/`objective`, kiểm chống chép, kiểm cụm cấm, `content:gaps`. Hàng song ngữ: đổi "chữ SGK" thành "chữ bài học". |
| `docs/system-architecture.md` | Thêm một dòng vào sổ quyết định: nội dung tự viết, có phương án bị loại. "Chữ SGK" đổi thành "chữ bài học". |
| `docs/code-standards.md` | E2E `sgk-mechanics` đổi thành `quest-mechanics` (tên do lead đưa). "Chữ SGK" đổi thành "chữ bài học". |
| `docs/i18n.md` | Mục "Không dịch": chữ bài học và câu trích bài đọc. |
| `docs/design-cac-map.md` | Hai chỗ "bài SGK" đổi thành "quest học" / "bài học". |
| `docs/deployment-guide.md` | Kiểm sitemap theo trang dưới `/hoc/`; ảnh thẻ và `seo:lastmod` theo chủ đề. 301 của `/bai/` đã có sẵn và đúng. |
| `docs/store/listing.md` | Phụ đề, mô tả ngắn, promotional text, từ khóa và mô tả (vi, en) bỏ lớp 2, sách, "Grade 2". App Review Notes và ghi chú phân loại tuổi cũng đổi theo. Độ dài đã đếm lại, vẫn trong giới hạn: phụ đề 30/30, từ khóa vi 77, từ khóa en 87, promo vi 119, promo en 142. |
| `docs/project-roadmap.md` | Thêm mục cho plan mới, có trạng thái từng pha. Mục tập một ghi "văn bản thay từ 25/10", tập hai ghi "Đã thay (`superseded`)". Mục trang `/bai/` ghi đã thay bằng `/hoc/` có 301. "70 bài SGK" và "Bài hôm nay" đổi chữ. |
| Master Plan v3 | Thêm quyết định §15 #54: thay D1, D8, D13 và mọi chỗ nói nội dung bám sách. §8c bỏ "verbatim". |
| `plans/dattqh/260930-0846-sgk-lop2-game-content/plan.md` | Ghi chú D1, D8, D13 đã thay; D2, D3, D9, D11, D12 giữ (T6). |
| `plans/dattqh/261002-1139-sgk-lop2-tap2-content/plan.md` | `status: superseded`, kèm ghi chú và link sang plan mới (T7). |

Bỏ qua `docs/marketing-channels.md`: file không tồn tại, đã gỡ ở commit `e7948b6f`, marketing chuyển sang tieu-de-next.

## Bằng chứng cho các con số và khẳng định

- Quest học: 36 quest `toan2-*` và 34 quest `tv2-*`, đếm ở `content/quests/`. Chúng chia trên 8 map: 12, 12, 9, 8, 8, 8, 7, 6.
- Chủ đề: 21 chủ đề, gồm Toán 9 và Tiếng Việt 12, có 64 mục tiêu. Đếm ở `content/learning/topics/`.
- Không quest nào còn `lesson` hay `curriculumRef`. 37/37 bài đọc khai `source`.
- `content:check` gọi `no-textbook-copy.ts` và `no-book-or-grade-wording.ts`. Khóa đọc từ `MIU_FINGERPRINT_KEY` hoặc từ iCloud. Thiếu khóa thì máy local bỏ qua kiểm, CI báo đỏ.
- `/bai/` trả 301 nhờ `tools/deploy/production/nginx-bai-redirects.conf`. Test là `nginx-prod.test.ts`.
- Bước kiểm sitemap nằm ở `tools/deploy/production/deploy.sh`.
- Trạng thái từng pha lấy từ dòng "Trạng thái" trong các file pha.

## Lần grep cuối

Lệnh: `git grep -nE "lớp 2|lớp Hai|SGK|sách giáo khoa|Kết nối tri thức" -- README.md CLAUDE.md docs .claude/rules`

| Hit | Vì sao giữ |
| --- | --- |
| `CLAUDE.md:7` | Câu này nói sản phẩm không nhắc sách giáo khoa và `content:check` chặn chữ trùng vân tay SGK. |
| `docs/codebase-summary.md:57` | Nói kiểm chặn chữ trùng vân tay SGK. |
| `docs/project-overview-pdr.md:25` | Nói không chép sách giáo khoa. |
| `docs/project-roadmap.md:68` | Nói plan bỏ văn bản sách giáo khoa chép nguyên văn. |
| `docs/system-architecture.md:96` (2 hit) | Kiểm vân tay của văn bản SGK, và phương án bị loại "Chép nguyên văn SGK". |
| `.claude/rules/quest-content.md:17` | File do code agent làm chủ, tôi không sửa. Câu này cũng nói không chép SGK. |
| `docs/store/screenshots/ios-ipad-13/03-play.png`, `05-reward.png` | Byte nén PNG trùng ngẫu nhiên với "SGK", không phải chữ trên ảnh. Đã xem `03-play.png`: không có chữ sách hay lớp. |

Hit nào cũng chỉ nói rằng game cố ý không dùng sách giáo khoa.

## Còn lại, ngoài phạm vi được giao

- Master Plan v3 còn câu cũ ở mục 4 ("Nội dung (bài SGK lớp 2 tập 1)", "bài SGK tập 2 vào sau") và ở các dòng 34, 40, 51, cùng checklist mục 16. Quyết định #54 ghi rõ là thay những chỗ này; tôi không sửa từng câu vì việc được giao chỉ là một ghi chú ngắn.
- `tools/private/private-files.json` vẫn còn PDF SGK. Đây là phần của code agent (mục 3): khi gỡ xong thì dòng "chỉ còn thời khóa biểu mặc định" trong `CLAUDE.md` mới đúng.
- `.claude/rules/quest-content.md:17` vẫn nhắc `textbook-copy-pending.json`, thuộc phần của code agent.
