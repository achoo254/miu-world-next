# Review: pha 2, 3, 6 (working tree trên `fc28efae`)

Ngày 25/10/2026, 03:21–03:40 (Asia/Saigon). Plan: [`261025-0029-original-learning-content`](../261025-0029-original-learning-content/plan.md). Phạm vi: 204 mục chưa commit (172 file sửa, +2.588/−3.601 dòng; thêm 18 ảnh thẻ chia sẻ). Snapshot: HEAD `fc28efae`, file mới nhất là `content/quests/tv2-t14-b25.json` (03:12). Không sửa file, không stage.

## Đã chạy

| Lệnh | Kết quả |
| --- | --- |
| `pnpm typecheck` | EXIT 0 (root, apps/web, apps/server, apps/mobile). Lỗi `worksheet-builder.test.ts:31` mà report pha 2 nêu đã hết |
| `pnpm lint` | EXIT 0 (eslint + check-brand) |
| `pnpm content:check` | `content:check OK — 2171 files`, 33 s |
| `vitest --maxWorkers=1`: toan2/tv2-quests, worksheet/*, quest-routes, schema worksheet + content | 8 file, 253 test xanh |
| `vitest --maxWorkers=1`: parent/worksheets, nginx-prod, no-book-or-grade-wording, scan-dist, topic-pages, schema analytics, server analytics/*, lesson-page-data, vite-lesson-pages, ui/home, ui/region | 17 file, 165 test xanh |
| `_probe.ts` cho 5 quest mẫu | learning, copy, links, variety đều rỗng |

Tự kiểm thêm bằng script tạm (scratchpad, không ghi vào repo):
- **Bảng 301**: dựng lại slug cũ từ `book.json` + `lesson` của quest ở HEAD, tra chủ đề hiện tại. 72/72 địa chỉ (cộng 72 bản không có `/` cuối) **khớp đúng** `nginx-bai-redirects.conf`. 72 URL `/bai/` của `seo-lastmod.json` cũ đều có trong bảng.
- **Phiếu viết**: bản cũ có 40 bài kiểm kê có phiếu, bản mới cũng ra 40 phiếu (38 theo `lessonId`, 2 theo `sheet`). Không mất phiếu nào.
- **Rò đáp án trên trang công khai**: 2.233 chuỗi bí mật của `questSecrets` × chữ của trang chủ đề và `vi.json`: 0 trùng. Bỏ `publicBookTitles` không làm `security:dist` đỏ giả.
- **Thông tin client nhận được**: `QuestStepPublic` dùng `worksheetPublicShape` (không strict, lọc bỏ `sheet` và `lessonId`). `objective` và `expression` nằm trong `curriculumRef`, chỉ có trong authoring. Test `quest-routes.test.ts:454` chặn `objective`, `expression`, `curriculumRef`.
- **`seo-lastmod.json`**: 21 trang, không trang nào lệch hash.
- **"Bài hôm nay"**: lọc theo `topicOf`, ra cùng tập quest với `textbookOf` cũ (70 quest học, quest truyện/phụ không được có `topic`).

## Critical

Không có.

## High

**H1. `deploy.sh release` sẽ dừng ngay ở bước kiểm build, vì vẫn đếm trang dưới `/bai`.**

- Vị trí: `tools/deploy/production/deploy.sh:249-256`.
- Lỗi:
  - `pages="$(find apps/web/dist/bai -name index.html …)"` giờ ra 0.
  - Script thoát với "release build has no lesson pages under /bai".
  - Kể cả khi qua được bước đó, phép so `<loc>` == `pages + 1` cũng sai.
- Hệ quả: CI không chạy script này nên không thấy lỗi. Lỗi sẽ chặn đúng đợt deploy 1 của T5. Script dừng trước khi động vào production nên không mất dữ liệu.
- Cách sửa:
  - đổi sang `find apps/web/dist/hoc -name index.html`;
  - sửa chú thích và hai thông báo lỗi ("topic pages under /hoc");
  - giữ phép so `pages + 1` (sitemap có 21 `<loc>` = 20 trang `/hoc` + trang chủ; nên kiểm lại bằng `seo-lastmod.json`);
  - grep `bai` trong `tools/deploy/` một lượt.

**H2. Chỉ chạy release thì `/bai/` thành 404, cho tới khi chạy thêm `deploy.sh setup`.**

- Vị trí: `nginx-prod.conf:15-17,89-95`, `setup-prod-host.sh:64`. Report pha 2 có nhắc ở mục "Việc cho lead"; ghi lại ở đây vì ảnh hưởng SEO.
- Lỗi:
  - `release` không cài nginx.
  - Bản dist mới không còn `dist/bai/`.
  - nginx cũ giữ `location /bai/ { try_files … =404 }`, nên 72 URL đang được index trả 404 thật.
  - `/hoc/<sai>/` rơi vào `location /` và trả `index.html` (soft 404).
- Cách sửa: ghi vào `docs/deployment-guide.md` §5 và phần Release của phase 2 thứ tự bắt buộc cho đợt này: `deploy.sh setup` (cài include + conf mới, `nginx -t`), rồi mới `release` trong cùng một lần duyệt của người sở hữu. Hoặc để `release` từ chối chạy khi máy chủ chưa có `/etc/nginx/miu-bai-redirects.conf`, kiểm qua `prod 'test -s …'`.

## Medium

**M1. Trang công khai vẫn in "lớp 2A/2C" của 3 quest đang chờ.**

- Vị trí: `apps/web/lesson-page-data.ts:41-47`, `tools/content/no-book-or-grade-wording.ts:73`.
- Lỗi: tóm tắt của `tv2-t05-b10` ("hành lang lớp 2A") và hai quest khác hiện trên `/hoc/tieng-viet/...`, tức nằm trong HTML được index. Kiểm cụm cấm cố ý bỏ qua quest chờ. Như vậy tiêu chí 2 ("trang chủ đề … không còn lớp 2") chưa đạt từ đợt deploy 1.
- Cách sửa (chọn một):
  - viết lại ngay 3 câu tóm tắt (chỉ `summary`, không đụng bước);
  - hoặc `pickQuestPageFields` bỏ `summary` khi quest còn trong danh sách chờ;
  - hoặc chặn cụm cấm trên `summary` cho mọi quest hiện trên trang (miễn trừ chỉ cho chữ trong bước).

**M2. Kiểm cụm cấm còn hở so với tiêu chí 2 và brief.**

- Vị trí: `tools/content/no-book-or-grade-wording.ts:12-20`. Các trường hợp lọt:
  - tên sách cũ "Toán 2", "Tiếng Việt 2", "tập một", "học kì 1";
  - "lớp Một", "lớp 1" (brief yêu cầu bỏ);
  - tiếng Anh "2nd grade", "second grade", "Year 2".
- Phạm vi quét: chỉ quét nguồn (i18n, `index.html`, regions, dữ liệu trang). Không quét `content/npcs`, `content/world/targets.json` (tên mục tiêu "Bảng gỗ lớp Hai" hiện cho người chơi), cũng không quét HTML sinh ra trong `dist/hoc`, dù phần Rủi ro của phase 2 nói phải quét "trên bundle và trang sinh ra".
- Cách sửa:
  - thêm các mẫu trên (`/\b(Toán|Tiếng Việt) 2\b/`, `/tập (một|hai)/i`, `/học k[ìỳ] [12]/i`, `/lớp (?:1|một)(?!\d)/iu`, `/\b(2nd|second) grade\b/i`);
  - gọi `wordingIssues(htmlText(...))` trên `dist/hoc/**/index.html` trong `security:dist`;
  - ghi rõ ở phase 7 là phải mở rộng sang npcs/targets.

**M3. `tools/content/_probe.ts` tự ghi là "Scratch helper (not committed)", trong khi `rewrite-brief.md` (bước Kiểm) bắt người viết pha 4, 5 chạy nó.**

- Vị trí: `tools/content/_probe.ts:1`.
- Hệ quả: commit theo đúng chú thích thì agent pha 4, 5 ở worktree khác hay CI không có công cụ.
- Cách sửa: đổi tên thành `tools/content/probe-quests.ts`, thêm script `content:probe`, bỏ dòng "not committed". Có thể thêm 1 test khói. Nếu không giữ thì sửa brief.

**M4. Phiếu viết chỉ lấy bước `worksheet` đầu tiên của quest.**

- Vị trí: `apps/server/src/worksheet/worksheet-builder.ts:96`. Chú thích ở dòng 89 lại ghi "A quest's worksheet steps make one sheet".
- Hiện tại: `toan2-cd3-b17` và `toan2-cd5-b27` mỗi quest có 2 bước phiếu (cùng `lessonId`), nên chưa sai.
- Rủi ro: ở pha 4, người viết sẽ cho mỗi bước một `sheet` riêng, và phiếu thứ hai biến mất mà không báo.
- Cách sửa (chọn một): gộp `blocks` của mọi bước phiếu theo thứ tự bước (tiêu đề lấy của bước đầu); hoặc thêm luật trong `questIssues` "một quest có nhiều nhất một `sheet`" và ghi vào brief.

**M5. `tv2-t14-b25`: nhãn nguồn và mức gần bản SGK cũ của "Hai anh em" cần người duyệt xem.**

- Vị trí: `content/quests/tv2-t14-b25.json:47-50`.
- Nguồn gốc: theo hiểu biết của tôi, chưa đối chiếu với sách, truyện này thường được ghi "Theo Truyện ngụ ngôn" và có gốc là truyền thuyết nước ngoài, không phải "truyện cổ tích" Việt.
- Mức gần bản SGK cũ: cốt truyện và nhịp câu bám sát bản đã in trong SGK Tiếng Việt 2 chương trình cũ, ví dụ "Anh còn phải nuôi vợ con…", "Sáng ra, hai người ngạc nhiên vì hai đống thóc vẫn đầy bằng nhau". Vân tay chỉ băm bộ Kết nối tri thức nên không bắt được bản này.
- Một điểm nữa: đây chính là truyện **nghe kể** của bài 25 trong bộ sách đang thay. Phần nghe kể đổi sang "chiếc lá che mưa", còn bài đọc lại là truyện của sách.
- Cách sửa:
  - khai `source.title` đúng thể loại (vd "Truyện ngụ ngôn Hai anh em");
  - kể lại xa hơn về chi tiết (bối cảnh, lời thoại nội tâm);
  - hoặc chọn một truyện cổ tích Việt khác cùng chủ đề anh chị em (vd "Sự tích cây vú sữa", "Cây khế" rút gọn).
  - Đưa điểm này vào trang nghiệm thu cho người sở hữu quyết.

**M6. `tv2-t14-b25`: bước "Nghe kể chuyện" không có chuyện để nghe.**

- Vị trí: `content/quests/tv2-t14-b25.json:593,680`.
- Lỗi: `xep-tranh-hai-anh-em` mở bằng "Gấu Hũ vừa kể xong… Nghe kể chuyện. Nghe xong…", còn `ke-hai-anh-em` bảo "kể 1–2 đoạn của chuyện chiếc lá che mưa". Trong quest không có lời kể nào, chỉ có 4 chú thích tranh và gợi ý (`doan-tranh-hai-anh-em`). Bản cũ cũng vậy vì dựa vào giáo viên đọc ở lớp. Bỏ sách rồi thì mục tiêu nghe (`doc-truyen-ke-lai`) không có nội dung nghe.
- Cách sửa:
  - thêm một bước `dialogue` Gấu Hũ kể chuyện (4–6 câu theo 4 tranh), hoặc một `texts` thứ hai có `source: original` để `ListenButton` đọc;
  - hoặc bỏ cụm "Nghe kể chuyện. Nghe xong" và để bước sort dựa trên tranh.
  - Áp thành luật chung trong `rewrite-brief.md` cho mọi bước nghe kể ở pha 5.

**M7. Trang nghiệm thu thiếu hai thứ mà việc 3 của phase 3 yêu cầu: "ảnh màn hình từng cơ chế" và "link chơi thử".**

- Vị trí: `tools/learning/acceptance-page.ts`.
- Lỗi: trang chỉ có hai cột chữ cũ/mới, nhãn mục tiêu, đáp án, kết quả chống chép.
- Cách sửa: thêm link `/play?quest=<id>` (hoặc cách mở quest hiện có) và ảnh từ `.data/sgk/review-shots/` nếu có. Hoặc ghi rõ trong phase 3 là đã bỏ hai mục này và lý do.

## Low

- **Sư phạm, `tv2-t01-b01` bước `tu-chi-lop-mot`** (`content/quests/tv2-t01-b01.json:563,567`):
  - Câu dẫn "chỉ về phía mấy em nhỏ đang nấp sau lưng mẹ" không khớp câu hỏi về đôi mắt của em bé đánh rơi sáp màu.
  - Bước cũ kiểm hiểu nghĩa từ chỉ đặc điểm ("rụt rè" tả tâm trạng). Bước mới chỉ nhớ lại chữ trong bài ("tròn xoe"), dễ hơn.
  - Cách sửa: hỏi "Từ nào cho thấy em bé còn ngại ngùng?" với "lí nhí" (đúng) / "rối rít" / "ríu rít", hoặc sửa câu dẫn cho khớp.
- **Sư phạm, `toan2-cd6-b29` bước `nam-ngu-luc-dem`** (`:305`):
  - Câu hỏi "ngắm sao lúc mấy giờ **đêm**?" có đáp án 21:00, trong khi dialogue của chính quest (`:114`) dạy "9 giờ tối là 21 giờ".
  - Bản cũ dùng 22 giờ cho "giờ đêm". Cách sửa: đổi `time`/`answer` về 22:00, hoặc hỏi "mấy giờ tối".
- **`tv2-t14-b25` bước `hai-gio-tu-ngu`**: "sáng" lẫn hai nghĩa ("trăng sáng" chỉ đặc điểm, "Sáng ra" chỉ thời gian), dễ gây tranh cãi. Nên đổi thành "tròn" hoặc "vằng vặc".
- **`quest-routes.ts:61-62`**: chú thích của `storyOf` giờ nằm trên `topicOf`, hai khối JSDoc liền nhau nên chú thích bị lệch hàm. Chuyển dòng 61 xuống ngay trên `function storyOf`.
- **Client cũ còn mở tab hoặc chạy bản native cũ**:
  - `WorksheetListResponse` cũ đòi `lessonId`/`bookId`/`pages`, nên màn phiếu viết báo lỗi tới khi tải lại; `/parent/worksheets/tv2-t1-b01` (đường dẫn cũ) trả 404.
  - Không cần sửa nếu app native chưa phát hành. Nếu đã phát hành thì giữ alias `GET /worksheets/:lessonId` (tra quest theo `lessonId`) tới bản app kế tiếp.
- **`no-book-or-grade-wording.test.ts`** dựa vào việc `tv2-t05-b10` còn chữ "lớp 2A" (report pha 2 đã nêu). Nên dùng fixture riêng thay vì dữ liệu thật đang được viết lại.
- **GA4**: tham số `lesson_id` đổi thành `topic_id`. Một trong 6 custom dimension đang chạy (theo `docs/project-roadmap.md:71`) là `lesson_id` thì phải khai `topic_id` trong GA4, nếu không báo cáo theo bài sẽ mất từ ngày deploy. Việc này ngoài repo, cần người sở hữu.
- **nginx**: `/bai/<slug>/index.html` (gõ thẳng file) không có trong map nên trả 404 thay vì 301. Ít gặp; nếu muốn đủ thì thêm `~^/bai/(.+)/index\.html$` hoặc chuẩn hóa `$uri` trước khi tra map.

## Bảy hướng kiểm được giao

- **Route server và hợp đồng `QuestView`**:
  - `topic` chỉ điền cho quest `active`; schema web và server dùng chung `QuestTopic`; typecheck xanh.
  - Không còn ai đọc `textbook`, `lessonId` ở client: grep `apps/web/src` không ra.
- **Analytics**:
  - `normalizePagePath` chặn `/region/x/y` và chỉ nhận `/hoc/<môn>/<chủ-đề>` có trong danh mục.
  - `lesson_id` từ client cũ bị zod bỏ qua, không làm request lỗi.
- **API phiếu viết và nơi gọi**:
  - Route `:id` khớp `app-shell.tsx:188`; E2E đổi id đúng (`toan2-cd3-b15` có `lessonId`).
  - `endpoint-table.test.ts` vẫn thay `:id`.
- **Rò rỉ**:
  - `sheet`, `objective`, `expression` không tới client;
  - `lesson-page-data.ts` chỉ đọc 6 khóa của quest, chủ đề bỏ `gdpt`;
  - `scan-dist.ts` vẫn quét đáp án và CSP trên `dist/hoc`.
- **Bảng 301**: đúng 100% (xem trên). Tác dụng thật phụ thuộc H2.
- **Chữ lớp, sách trên bề mặt cho người chơi**:
  - i18n, `index.html`, `apps/web/src` sạch. Chỉ còn `review-main.ts:97` ("Quest mẫu SGK"), là trang duyệt nội bộ.
  - "Lớp {class}" của thời khóa biểu là lớp thật của người chơi, hợp lệ.
  - Còn sót: npcs, targets, quest chưa viết lại (pha 7, M1, M2).
- **5 quest mẫu**:
  - Toán: mọi đáp án khớp phép tính, đã kiểm tay từng bước (thêm/bớt qua 10 vẫn qua 10, không nhớ vẫn không nhớ, ô chữ số nhòe có nghiệm duy nhất, đồng hồ giữ :15/:30).
  - Tiếng Việt: bài đọc ±20% (145/159 từ, 198/197 từ); câu hỏi trả lời được từ bài mới; tranh đã đổi chú thích theo bài mới.
  - Giọng văn tự nhiên, không còn "lớp 2", "Bài N" trong 5 file (grep).
  - Còn: M5, M6 và các mục Low ở trên.

## Tiêu chí nghiệm thu 2 và 7

- **Tiêu chí 2: chưa đạt**, một phần là đúng kế hoạch.
  - Đã đạt: giao diện, i18n, `index.html`, dữ liệu trang chủ đề, sitemap sạch, có kiểm máy trong `content:check`.
  - Còn thiếu:
    - (a) tóm tắt của quest chờ trên trang công khai (M1);
    - (b) npcs, targets, chữ trong quest chưa viết lại hiện trong game (đã dời sang pha 7);
    - (c) tài liệu store `docs/store/listing.md` (pha 7);
    - (d) kiểm cụm cấm chưa đủ mẫu và chưa quét trang sinh ra (M2).
  - "Công cụ clip mới" không còn trong repo (`e7948b6f`), nên mục này coi như không áp dụng.
- **Tiêu chí 7: chưa xác minh.**
  - Code và E2E `worksheets.spec.ts` đã đổi sang `tv2-t01-b01` (phiếu tự viết) và `toan2-cd3-b15` (phiếu kiểm kê). Builder ra đủ 40 phiếu; test route và màn hình xanh ở local.
  - Theo quy định máy dùng chung, E2E chưa chạy. Chỉ đạt khi job `e2e:ci` xanh trên CI.

## Pha nào có vẻ xong (chỉ đề xuất, không sửa plan)

- **Pha 2: code xong.** Nên đánh `done-with-followups` sau khi sửa H1. Ba việc theo sau: M1, M2 và thứ tự deploy ở H2.
- **Pha 3**: 5 mẫu đã viết, gate xanh; còn chờ người sở hữu duyệt, nên M5, M6, M7 nên xong trước khi gửi duyệt.
- **Pha 6: phần code xong**, còn M4 trước khi pha 4 viết `sheet` cho `toan2-cd3-b17`, `toan2-cd5-b27`.

## Câu hỏi còn mở

1. App native (Capacitor) đã phát hành bản nào gọi `/api/worksheets` chưa? Nếu có thì cần alias (mục Low).
2. GA4 có custom dimension `lesson_id` không? Nếu có thì người sở hữu cần khai `topic_id` trước khi deploy.
3. Nguồn và bản kể "Hai anh em" (M5): người sở hữu muốn giữ (đổi nhãn, kể xa hơn) hay thay truyện?

Status: DONE_WITH_CONCERNS
Summary: Gate local xanh (typecheck, lint, content:check, 418 test). Bảng 301 đúng cả 72 địa chỉ. Không rò `sheet`, `objective`, `expression` hay đáp án ra client và trang công khai. Toán mẫu tương đương và đúng đáp án. Có một lỗi chặn release: `deploy.sh` vẫn kiểm `dist/bai` (H1).
Concerns/Blockers: H1 chặn đợt deploy 1. H2 cần chạy setup trước release. Tiêu chí 2 chưa đạt (M1, M2, pha 7). Tiêu chí 7 chờ E2E trên CI. M5, M6 cần người sở hữu xem lúc duyệt mẫu.
