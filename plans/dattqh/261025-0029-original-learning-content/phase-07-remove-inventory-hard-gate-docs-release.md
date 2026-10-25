# Pha 7: Xóa kiểm kê SGK, cổng cứng, tài liệu, review, release

**Tier:** M · **Phụ thuộc:** 2, 4, 5, 6 · **Trạng thái:** in-progress (việc 1–6 xong 25/10; chờ người sở hữu cho deploy)

## Việc

1. **Xóa**: `content/curriculum/`, `packages/schema/src/curriculum.ts` (giữ `ExerciseType` và `evaluateExpression` bằng cách chuyển sang `learning.ts`), `tools/content/check-curriculum.ts`, phần kiểm kê của `curriculum-links.ts` và `content-gaps.ts`, `apps/server/src/worksheet/curriculum-books.ts`, `tools/learning/migrate-quest-topics.ts`, `tools/sgk/` còn lại (kể cả `split-pages.py` nếu có), fixture `apps/server/test/fixtures/curriculum/`, `apps/web/e2e/fixtures/quests/e2e-sgk-mechanics.json` và `sgk-mechanics.spec.ts` (đổi tên theo cơ chế, không theo sách). Schema quest bỏ hẳn `lesson`, `curriculumRef`.
2. **Cổng cứng**: `textbook-copy-pending.json` rỗng thì xóa tệp và nhánh miễn trừ; kiểm cụm cấm (pha 2) áp cả cho quest; `content:gaps` chỉ còn theo mục tiêu. Giữ `textbook-fingerprints.bin` để chặn chép lại về sau.
3. **Tệp riêng**: bỏ hai PDF SGK khỏi `tools/private/private-files.json` và nhánh tách trang trong `sync-private.ts`; giữ font HP001. File trong iCloud của người sở hữu không đụng tới.
4. **Tài liệu và luật cho agent**: `README.md` (mô tả, mục giấy phép bỏ dòng về văn bản SGK), `CLAUDE.md` (giai đoạn, lệnh `content:gaps`, tệp riêng), `.claude/rules/product-audience.md` (bỏ "phần học vẫn bám SGK"), `docs/project-overview-pdr.md`, `docs/codebase-summary.md`, `docs/system-architecture.md`, `docs/code-standards.md`, `docs/i18n.md`, `docs/design-cac-map.md`, `docs/deployment-guide.md` (301 của `/bai/`), `docs/marketing-channels.md`, `docs/store/listing.md` (mô tả và App Review Notes bỏ "Grade 2", "Vietnamese Grade 2 Math"), `docs/project-roadmap.md`; Master Plan v3 ghi chú D1/D8/D13 đã thay bằng plan này.
5. **Plan cũ**: plan tập một ghi chú D1, D8, D13 đã thay; plan tập hai đổi `status: superseded` kèm link plan này (T7).
6. **Review**: trang `apps/web/review.html` cho đợt này (số quest viết lại, độ phủ theo mục tiêu, kết quả kiểm chống chép, danh sách nguồn bài đọc, ảnh màn hình, kết quả rà clip đã đăng); chạy `pnpm bots:learning` rồi `pnpm assets:manifest`; ảnh màn chính duyệt theo `docs/screen-review.md`.
7. **Release**: CI xanh, cổng `tools/deploy/release-gate.sh` qua, hỏi người sở hữu rồi deploy production đợt cuối; kiểm 301 và trang chủ đề trên production sau deploy.

## Thêm từ các pha trước (25/10/2026)

- Xóa trang nghiệm thu cũ đã commit `plans/dattqh/260930-0846-sgk-lop2-game-content/nghiem-thu/` (chứa chữ SGK trong repo công khai) cùng ảnh của nó.
- Chữ "lớp" còn ở tên mục tiêu trên map (`content/world/targets.json`: "Bảng gỗ lớp Hai", "Cửa sổ lớp 2A", "Thời khóa biểu lớp 2B"; đã nướng vào `assets/generated/world/*/entities.json`, phải sinh lại map, `world:walk`, `assets:manifest`), lời NPC (`content/npcs/*.json`) và vài quest ngoài sách (`yarn-*`, `ward-*`, `with-thoi-khoa-bieu-lop`, `vuot-ai-truong-hoc`). Sau đó mở rộng `no-book-or-grade-wording.ts` sang npcs, targets và toàn bộ chữ quest.
- `evaluateExpression` chỉ có cộng, trừ: nội dung Toán lớp 3 sẽ cần nhân, chia (ngoài phạm vi plan, ghi để plan sau).
- Tên mục tiêu trên map còn theo bài cũ (chỉ là tên hiển thị, id giữ): `toan2-cd6-buu-anh-*`, `toan2-cd6-to-lich-thang-*`, `tv2-t01-hoc-cay`, `tv2-t01-bang-chu-cai`, `tv2-t03-canh-cay-kho`, `tv2-t03-khom-co-dai`, `tv2-t12-banh-xe-le-go`. Quest `places` đã đổi ở nhiều quest nhưng map chưa sinh lại.
- Đặt mục tiêu quest (`tools/world/chapters/place-quest-targets.ts`) dùng một dòng số ngẫu nhiên chung cho mọi quest của map: sửa tên chỗ của một quest làm dời cả map (25/10 đổi "lớp 2A" làm dời 655 dòng trường học). Tách dòng số theo từng quest trước khi sinh lại các map, rồi chạy audit cảnh vật.
- `assets:fetch` toàn bộ đỏ trên máy mới: zip Kenney City Kit Roads trên kenney.nl đổi hash (pack phải duyệt lại, `assets-pipeline.md` mục 5). Fetch không lọc được theo pack.
- Kênh nước trường học: người chơi rơi xuống (bờ cao 4 khối) chỉ ra được bằng nút "Quay lại"; cân nhắc bậc lên hoặc lan can trong generator.
- nginx: `/bai/<slug>/index.html` (gõ thẳng file) chưa có trong bảng 301 (ít gặp).

## Kiểm tra

- Gate 5 lệnh của repo theo thứ tự CI ở local (trừ full `pnpm test`), rồi CI đầy đủ (test, build web, `security:dist`, E2E) xanh.
- `git grep -nE "lớp 2|lớp Hai|SGK|sách giáo khoa|Kết nối tri thức"` trên HEAD chỉ còn trong `plans/` (bản ghi lịch sử) và chú thích lý do của kiểm cụm cấm.

## Rủi ro

- Xóa sót chỗ còn import kiểm kê: `typecheck` và build web bắt; chạy trước khi push.
- Plan và report cũ còn nhắc SGK: chấp nhận, đó là bản ghi lịch sử, không phải bề mặt sản phẩm.

## Rollback

Revert commit xóa; nội dung quest mới không phụ thuộc kiểm kê nên không cần revert pha 4, 5.

## Tiến độ (25/10/2026)

- Việc 1–3: commit `439d045b` (xóa kiểm kê, danh sách chờ và mọi miễn trừ; kiểm vân tay chạy trên mọi quest, khóa sai định dạng hay không khớp `textbook-fingerprints.key-check` làm `content:check` đỏ; E2E `quest-mechanics`; gỡ 5 PDF sách khỏi tệp riêng, file trong iCloud giữ nguyên). Review: `plans/dattqh/reports/code-reviewer-261025-1240-remove-textbook-inventory.md`.
- Việc 4–5: commit `84267cd8` (README, CLAUDE.md, docs, store listing, Master Plan, plan cũ).
- Thêm: đặt mục tiêu quest theo dòng số riêng của từng quest, đổi 20 tên mục tiêu trên map, sinh lại 12 map (`63865225`); sửa bot rơi xuống kênh (`f599cb0f`) và mất cập nhật khi tắt server (`aaffaf3a`).
- Việc 6: trang review (`63f555f4`); ảnh 27 màn × 2 khổ chụp ở `63f555f4`, 5 agent duyệt, 0 block, 16 note (`c82cf587`). Cổng release qua, CI xanh.
- Còn mở: rà clip đã đăng trên mạng xã hội (repo marketing riêng) chưa làm; tỉ lệ kẹt bot ở trường học 4,61% (ngưỡng 5%), nên sửa cách bot chọn đích; `bot-load.test.ts` có lần đỏ trên CI vì đo theo thời gian thật (chạy lại thì xanh).
