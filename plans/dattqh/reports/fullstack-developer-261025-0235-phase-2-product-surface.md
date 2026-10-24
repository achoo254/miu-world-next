# Pha 2: Gỡ sách, lớp, bài, trang khỏi bề mặt sản phẩm — báo cáo

Ngày 25/10/2026. Plan: [`261025-0029-original-learning-content`](../261025-0029-original-learning-content/plan.md), pha 2. Thay đổi còn nằm trong working tree, chưa commit.

## Kết quả

Người chơi và trang công khai không còn thấy tên sách, lớp, số bài hay số trang, với mọi quest (đã viết lại hay chưa). Quest học được gắn nhãn **môn · chủ đề**. Trang công khai chuyển từ `/bai/<slug>/` (70 bài + 2 môn) sang `/hoc/<môn>/<chủ-đề>/` (18 chủ đề có quest + 2 môn). Địa chỉ cũ trả 301 sang trang chủ đề tương ứng. `content:check` có thêm bước chặn các cụm chữ này quay lại.

## Đã làm

### Server
- `packages/schema/src/game.ts`: bỏ `QuestTextbook` và `QuestView.textbook`, thêm `QuestTopic` (`id`, `title`, `subject`, `subjectName`) và `QuestView.topic`.
- `apps/server/src/quest/quest-routes.ts`: `topicOf()` dựng nhãn từ `content.learning` và tên môn trong `skills.json`.
- `content-catalog.ts`: bỏ `textbooks`/`questTextbooks` và import `readCurriculum`. Server chỉ còn đọc kiểm kê ở phần phiếu viết, do agent khác sở hữu.
- Analytics (`packages/schema/src/analytics.ts`, `analytics-routes.ts`, `server-events.ts`, `ga4-debug.ts`, web `track.ts`):
  - Tham số `lesson_id` đổi thành `topic_id` (id chủ đề, kiểm theo danh mục).
  - Bảng route nhận `/hoc/<môn>` và `/hoc/<môn>/<chủ-đề>`. `/bai/...` không còn là trang.
  - Danh mục lấy từ `topicPages()`, không dùng `readBookTocs` nữa.
- `tools/world/quest-target-audit.ts`: parse `QuestView` với `topic: undefined`, vì trong file quest `topic` là id chứ không phải nhãn.

### Web
- `player/textbook-ref.tsx` đổi tên thành `player/topic-label.tsx` (`TopicLabel`, `topicOf`); CSS `.topic-label*`.
- Các chỗ gọi đã cập nhật: `region-detail`, `today-quests`, `daily-lesson`, `hud`, `completion-sequence`, `share-result`.
  - `data-id` đổi từ `*-textbook*` sang `*-topic*`.
  - "Bài hôm nay" lọc theo `topic`.
- `region-board.ts`: `regionBooks` thay bằng `regionSubjects` (gom theo môn: tên môn, số bài, các chủ đề). `region-books.tsx` hiển thị theo đó.
- Bỏ dòng `region.book` ("Toán 2, tập một: bài 1–6"):
  - xoá khỏi schema `region.ts` và `content/world/regions.json`;
  - xoá khối hiển thị trong `region-detail.tsx`.
- Chia sẻ:
  - xoá `share/lesson-link.ts`;
  - `resultLink(origin, topic, invite)` trỏ về `/hoc/<môn>/<chủ-đề>/`;
  - `ShareKind.topicId`.
- `landing-screen.tsx` dùng `TOPIC_SUBJECTS` ("Các chủ đề Toán" → `/hoc/toan/`).
- i18n `vi.json`/`en.json` (hai bên đồng bộ, `checkLocales` xanh):
  - xoá `textbook.page*`, `region.bookLine`, toàn bộ `lessonPage.*`, `shareCard.lessonLine`;
  - thêm `topicPage.*`, `shareCard.topicLine`, `landing.benefitTopics`;
  - viết lại `seo.*`, `landing.*`, `subjectPage.*`, `notFound.hint`, `invitePage.lead`, `weeklyCard.footer`, `region.booksTitle`;
  - `parent.worksheetsTitle`/`Hint` chỉ đổi chữ, giữ key; màn phiếu viết là của agent khác.
- `index.html`: tiêu đề, h1, đoạn mở đầu, lợi ích, link `/hoc/toan/`, `/hoc/tieng-viet/`. Không còn lớp, SGK hay tên bộ sách. JSON-LD của trang chủ đề bỏ `educationalLevel`.
- Hai câu nhân vật phụ có chữ "lớp Hai" đã viết lại: câu thoại trong `everyday-routines.ts` và tên trong `packages/voxel/src/outland-life.ts`.

### Trang công khai
- `packages/schema/src/lesson-pages.ts` (+ test) đổi thành `topic-pages.ts` (+ test): `TOPIC_SUBJECTS`, `subjectPagePath`, `topicPagePath`, `topicPages()`.
- `apps/web/lesson-page-data.ts` vẫn giữ allowlist.
  - Quest: chỉ đọc `id`, `status`, `topic`, `title`, `summary`, `region`.
  - Chủ đề: `pickTopicPageFields` bỏ `gdpt`; mục tiêu chỉ lấy `text`.
- `vite-lesson-pages.ts`:
  - trang môn liệt kê các chủ đề;
  - trang chủ đề gồm: môn, tiêu đề, tóm tắt, "Luyện được gì" (mục tiêu), hoạt động trong game, nút chơi, chủ đề trước/sau.
  - `topicPageFiles`.
- `vite.config.ts`, `vite-sitemap.ts`, `seo-lastmod.json` đã cập nhật. `seo-lastmod.json` sinh bằng `pnpm seo:lastmod`: 21 trang, bỏ 72 trang cũ.
- Thẻ chia sẻ: `share-cards.ts` đổi `lessonShareCard` thành `topicShareCard(topicId)`; sửa `render-share-cards.ts` (nhãn môn + tên chủ đề).
  - Đã chạy `pnpm assets:cards`: 19 ảnh, gồm 18 chủ đề và ảnh chung; ảnh chung đổi theo tagline mới.
  - Manifest do generator ghi lại. Diff manifest chỉ chạm `generated/share-cards/`.
- `tools/security/scan-dist.ts`:
  - bỏ `publicBookTitles`, giữ phần quét đáp án;
  - `lessonPageIssues`/`scanLessonPages` đổi thành `topicPageIssues`/`scanTopicPages` (quét `dist/hoc`).

### Bảng 301 `/bai` → `/hoc`
- Bảng nằm ở **`tools/deploy/production/nginx-bai-redirects.conf`**: `map $uri $miu_bai_redirect`, 72 địa chỉ cũ, mỗi địa chỉ có và không có `/` cuối.
- Bảng tính một lần từ `lessonPages()` trước khi xoá: 70 bài, mỗi bài đúng một quest và một chủ đề; cộng `/bai/toan-2/` → `/hoc/toan/` và `/bai/tieng-viet-2/` → `/hoc/tieng-viet/`.
- `nginx-prod.conf`:
  - `include /etc/nginx/miu-bai-redirects.conf;` ở mức http;
  - `location /bai/` trả `301 $miu_bai_redirect$is_args$args` (giữ utm và `moi`), địa chỉ khác trả 404 thật;
  - thêm `location /hoc/` 404 thật như `/bai/` trước đây.
- `setup-prod-host.sh` cài tệp include.
- `nginx-prod.test.ts` thêm 4 test:
  - include đặt trước `server {`;
  - 144 khoá, cả hai cách viết cùng đích, mọi đích là trang build thật;
  - kiểm tay vài đích;
  - 301 giữ query.

### Chặn quay lại
- Thêm `tools/content/no-book-or-grade-wording.ts` (+ test), gọi trong `main()` của `check-content.ts`. Cụm bị chặn:
  - `lớp 2`, `lớp 2A`, `lớp Hai`;
  - `Grade 2`;
  - `SGK`;
  - `sách giáo khoa`;
  - `Kết nối tri thức`;
  - `/\bBài \d+\./`;
  - `/\bTrang \d+/i`.
- Kiểm trên:
  - mọi chuỗi của `vi.json`/`en.json`;
  - chữ hiển thị của `apps/web/index.html`;
  - `content/world/regions.json`;
  - dữ liệu trang chủ đề (tên môn, chủ đề, tóm tắt, mục tiêu);
  - tiêu đề và tóm tắt của quest hiện trên trang chủ đề, nhưng **chỉ khi quest đã ra khỏi `tools/content/textbook-copy-pending.json`**. Quest đang chờ viết lại được miễn tới pha 7.

### E2E (đã sửa, chưa chạy ở local)
- `screens.spec.ts`:
  - `21-lesson-page` mở `/hoc/toan/so-den-100/`, heading "Trò chơi luyện Số đến 100". Giữ tên ảnh để không lệch bộ ảnh duyệt.
  - `19-worksheets`: heading `'Tiếng Việt'` exact, theo yêu cầu của điều phối.
- `quest-flow.spec.ts` và `maps.spec.ts` không assert nhãn cũ, chỉ có chú thích, nên không phải sửa.

### Tài liệu
Đã cập nhật `docs/system-architecture.md` (route, `topic_id`, 301), `docs/codebase-summary.md` (`QuestView.topic`) và `docs/deployment-guide.md` (tệp include).

## Kiểm tra đã chạy (local)

| Lệnh | Kết quả |
| --- | --- |
| `pnpm assets:check` | OK — 16 pack, 4.744 file |
| `pnpm content:check` | OK — 2.171 file, 0 lỗi (gồm kiểm cụm cấm) |
| `pnpm lint` | sạch (eslint `--max-warnings=0` + `check-brand`) |
| `pnpm typecheck` | root (packages, tools) và `apps/web`, `apps/mobile` sạch. `apps/server` báo **1 lỗi ở `src/worksheet/worksheet-builder.test.ts:31`**, file do agent phiếu viết đang sửa, không phải của tôi |
| `vitest --maxWorkers=1`, các test chạm hoặc phủ code đã sửa | 9 lượt chạy. Tổng 33 + 7 + 4 + 2 + 1 + 4 file; tất cả xanh: 222 + 108 + 39 + 28 + 6 + 25 test |

Các file test đã chạy:
- schema: `topic-pages`, `analytics`, `game`;
- `packages/quest`;
- server: `analytics/*`, `quest-routes`, `content-catalog`;
- tools: `quest-target-audit`, `nginx-prod`, `scan-dist`, `no-book-or-grade-wording`;
- web: `lesson-page-data`, `vite-lesson-pages`, `vite-seo-meta`, `vite-sitemap`, `src/seo`, `ui/home`, `ui/region`, `ui/landing`, `ui/share`, `share-result`, `rewards`, `src/analytics`, `game/ambient`;
- voxel: `outland-life`.

Chưa chạy ở local, theo quy định máy dùng chung: full `pnpm test`, build web, `security:dist`, E2E. Các phần này cần CI.

## Bỏ qua và lý do
- Việc 5–6 của phase (lịch clip marketing, clip đã đăng): công cụ clip đã chuyển khỏi repo ở commit `e7948b6f`, nên không làm ở đây.
- Chữ "textbook" trong chú thích code (màn thử thách, i18n.ts…): người chơi không thấy, để pha 7 dọn cùng tài liệu.
- `apps/web/review.html` và `review-main.ts`: trang duyệt nội bộ, không công khai.
- `docs/store/listing.md`: tài liệu store thuộc pha 7.

## Việc cho lead / câu hỏi mở

1. **Deploy nginx**: `deploy.sh release` không cài lại nginx. Muốn `/bai/` trả 301 thì phải chạy `deploy.sh setup` (hỏi người sở hữu trước). Trang `/hoc/` vẫn chạy được nếu chưa setup, vì `location /` có `try_files $uri $uri/`. Nhưng tới lúc đó `/bai/` trả 404.
2. **Chữ "lớp 2/lớp Hai" còn trong nội dung ngoài quest học**, không thuộc phạm vi tôi được giao:
   - tên mục tiêu trên map, hiện cho người chơi: `content/world/targets.json` có "lớp 2A", "lớp 2B", "lớp Hai";
   - lời nhân vật: `content/npcs/{truong-hoc,trung-tam,nong-trai}.json` (6 chỗ);
   - nhiều quest truyện và quest phụ (`yarn-*`, `ward-*`, `with-thoi-khoa-bieu-lop`, `vuot-ai-truong-hoc`, `viec-tot-truong-hoc`).
   Kiểm cụm cấm chưa quét các file này (quest được miễn tới pha 7). Đề xuất: gộp vào pha 4/5 hoặc 7, rồi mở rộng `checkBookOrGradeWording` ra npcs/targets khi đã sạch.
3. Ba quest đang viết lại (`tv2-t05-b09`, `tv2-t05-b10`, `tv2-t06-b12` hiện có "lớp 2A/2C" trong tóm tắt) sẽ bị kiểm cụm cấm chặn ngay khi ra khỏi danh sách chờ. Người viết cần tránh "lớp 2A". Test `no-book-or-grade-wording.test.ts` đang dựa vào việc `tv2-t05-b10` còn chữ đó: khi quest này được viết lại, thay ví dụ trong test.
4. `seo-lastmod.json` và ảnh thẻ chia sẻ phụ thuộc tiêu đề, tóm tắt quest. Các agent đang viết lại quest sẽ làm hash trang đổi: chạy lại `pnpm seo:lastmod` trước khi commit đợt cuối. Tên chủ đề đổi thì chạy thêm `pnpm assets:cards`.
5. GA4: tham số sự kiện đổi từ `lesson_id` sang `topic_id`. Nếu property GA4 có custom dimension `lesson_id` thì cần khai thêm `topic_id`. Việc này làm trong GA4, ngoài repo.

Status: DONE_WITH_CONCERNS
Summary: Mọi nhãn sách, lớp, bài, trang đã gỡ khỏi giao diện, i18n, `index.html`, trang công khai, analytics, chia sẻ; trang `/hoc/` thay `/bai/` kèm bảng 301 và test nginx; `content:check` chặn cụm cấm; gate local xanh, trừ một lỗi typecheck trong file phiếu viết của agent khác.
Concerns/Blockers: 301 chỉ có hiệu lực sau `deploy.sh setup` (cần người duyệt); chữ "lớp 2/lớp Hai" còn trong npcs, targets và quest truyện, ngoài phạm vi pha này; E2E, build web, `security:dist` chưa chạy local.
