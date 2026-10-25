# Code review: xóa kiểm kê sách, cổng cứng chống chép (pha 7, mục 1–4)

Phạm vi: diff chưa commit trên `aa806933`, 104 mục trong `git status` (98 tệp tracked, +538 / −32.512 dòng, cộng 4 tệp mới). Đã đọc 2 report và phase-07. Không sửa tệp nào trong repo; script thử chỉ nằm ở scratchpad.

## Kết luận

Phần xóa sạch và nhất quán. Không còn chỗ nào dẫn tới tệp, script, trường hay export đã xóa (trừ 1 dòng trong Master Plan). Schema strict chặn `lesson`, `curriculumRef`, `lessonId`, `author`, `section`. Kiểm vân tay và kiểm cụm cấm giờ chạy trên mọi quest. `QuestView` không làm lộ `source`, đáp án hay chữ hỗ trợ.

Thử nghiệm cho thấy cổng chống chép vẫn **tắt im lặng được trên CI**. Lỗi này có từ trước diff, nhưng diff này biến vân tay thành lớp chặn duy nhất, và tệp `.bin` không sinh lại được nữa. Nên sửa trước khi coi pha 7 là "cổng cứng".

## Gate đã chạy

| Lệnh | Kết quả |
|---|---|
| `pnpm assets:check` | `OK — 17 packs, 4746 files` |
| `pnpm content:check` | `OK — 2158 files`, 0 cảnh báo; khóa đọc được, không có "skipped" |
| `pnpm typecheck` | root, mobile, server, web: Done, 0 lỗi |
| `pnpm lint` | eslint `--max-warnings=0` sạch; check-brand OK |
| `vitest --maxWorkers=1`: `no-textbook-copy`, `content-variety`, `no-book-or-grade-wording`, `game.test`, `content.test`, `apps/server/src/worksheet` | 7 tệp, 77 test pass |
| Script thử khóa: quest cũ `tv2-t01-b01` (commit `90294f44`) với khóa local | 153/153 shingle bài đọc có trong `.bin`: khóa local khớp tệp |
| `CI=1 MIU_FINGERPRINT_KEY=abc pnpm content:check` | **`content:check OK`, exit 0** |
| `CI=1 MIU_FINGERPRINT_KEY=<64 số 0> pnpm content:check` | **`content:check OK`** |

Không chạy full `pnpm test`, build web hay E2E, theo yêu cầu.

## Critical

Không có.

## High

### H1. Khóa sai định dạng tắt cả khối kiểm nội dung học trên CI mà không báo gì (lỗi có từ trước, giờ nặng hơn)

`tools/content/check-content.ts:714-727`. Khối `try { … } catch { }` bọc cả `checkRepoTextbookCopy`, `checkLearningLinks`, `varietyIssues` và `checkLogicSteps`. Nhánh catch nuốt mọi lỗi, với chú thích "lỗi schema đã báo ở trên".

`fingerprintKey()` throw khi khóa không đủ 64 ký tự hex (`tools/learning/textbook-fingerprints.ts:33`). Khi đó cả bốn kiểm bị bỏ, và `content:check` vẫn in OK. Đã chạy thử `CI=1 MIU_FINGERPRINT_KEY=abc` và nhận đúng kết quả đó. Cũng vậy khi `.bin` hỏng (`decodeFingerprints` throw) hoặc `allowed-*.json` sai.

Vì sao chặn: brief yêu cầu "CI must fail without the key". Một secret dán thiếu hay dư ký tự cũng là không có khóa, nhưng CI vẫn xanh.

Cách sửa: chỉ bắt lỗi parse quest; mọi lỗi khác thành issue.

```ts
let quests: QuestDefinition[] | undefined;
try { quests = readQuestDefinitions(path.join(dir, 'quests')); } catch { /* catalogue load reported it */ }
if (quests) {
  try { /* topics, copy, links, variety, logic */ }
  catch (error) { issues.push(`learning checks could not run: ${error instanceof Error ? error.message : String(error)}`); }
}
```

Thêm test: `checkContent` với `env` có `MIU_FINGERPRINT_KEY: 'abc'` phải có issue. Muốn vậy phải truyền `env` vào được `checkRepoTextbookCopy`.

### H2. Không có cách kiểm khóa CI có khớp `.bin` hay không, nên khóa sai thì cổng thành no-op

`tools/content/no-textbook-copy.ts:191-199`, `tools/learning/textbook-fingerprints.ts:25-35`. Code chỉ kiểm định dạng khóa. Khóa đúng 64 hex nhưng khác khóa đã tạo tệp thì không shingle nào khớp, và CI vẫn xanh. Đã thử với khóa toàn số 0: OK.

Trước đây còn có kiểm kê để đối chiếu. Giờ kiểm kê đã xóa và tệp `.bin` không sinh lại được (chú thích mới ở dòng 5-8), nên không còn mẫu dương tính nào trong repo.

Cách sửa: commit một giá trị kiểm khóa, không tiết lộ gì về khóa. Ví dụ `KEY_CHECK = HMAC(key, 'miu-fingerprint-key-check').slice(0, 8)` (hex) trong `textbook-fingerprints.ts`. `fingerprintKey()` throw khi không khớp, và sau H1 lỗi này sẽ thành issue. Thêm test chạy trên CI (có secret): `fingerprintKey()` không null và khớp `KEY_CHECK`.

## Medium

### M1. Ngoại lệ `en` cho phép mọi dòng `en` chưa dịch, không chỉ tên trò dân gian

`tools/content/content-variety.ts:70` (`twinOf`), `:81` (`if (first === twinOf(here)) continue;`).

Phần đúng:
- Logic hẹp ở chỗ chỉ bỏ qua khi lần dùng đầu là đúng vị trí tiếng Việt của chính bước đó. Lặp sang quest khác hay bước khác vẫn bị bắt, và test `content-variety.test.ts:45-56` chứng minh hai nhánh này.
- Regex `(?<=^|[.\s])en\.` chỉ thay `en.` đầu tiên, đúng cho cả `en.title` cấp quest (`where` không có tiền tố).

Phần rộng hơn mục đích: bất kỳ dòng `en` nào ≥16 ký tự giữ nguyên tiếng Việt của nó (lời thoại, prompt, choices…) đều qua. Trước đây kiểm trùng dòng vô tình bắt được bản `en` chưa dịch. Không có kiểm nào khác làm việc đó (đã grep `tools/content`, `packages/schema`).

Script thử cho thấy hiện chỉ có 1 dòng dùng ngoại lệ: `side-chi-chi steps[1].en.title`.

Cách sửa (chọn một):
- Chỉ cho ngoại lệ ở khóa `title` / `goTo`: `if (first === twinOf(here) && /(^|\.)en\.(title|goTo)$/.test(where)) continue;`
- Hoặc dùng allowlist có lý do, cùng kiểu với `allowed-traditional-passages.json`.

Thêm 1 ca test: `en.lines[0]` giống hệt dòng tiếng Việt thì phải bị báo.

### M2. Bỏ cả 5 PDF, gồm mẫu Tiếng Anh 2, là vượt phạm vi phase

`tools/private/private-files.json`. Phase-07 mục 3 ghi "bỏ hai PDF SGK". Dev bỏ cả 5, trong đó có `ta2-global-success-mau.pdf`, mà mục `why` cũ ghi là "the source for the English subject".

Đây là quyết định của người sở hữu, không phải lỗi code. Tệp trong iCloud không bị đụng tới, nên thêm lại chỉ cần 1 dòng. Cần người sở hữu xác nhận (xem câu hỏi bên dưới).

## Low

1. `"Miu World — Master Development Plan v3 (3D theo mockup + Multiplayer).md":589` còn nhắc E2E `sgk-mechanics`. Sửa thành `quest-mechanics`.
2. `apps/server/src/quest/quest-routes.test.ts:454`: regex chặn lộ dữ liệu đã bỏ `curriculumRef` nhưng chưa thêm `source` và `died`. `toEqual` ở dòng 453 đang che phủ, nhưng nên thêm `|source|died` vào regex để chặn hồi quy rõ ràng. Tên `describe('textbook mechanics over the API'` (dòng 384) và biến `sgkView` nên đổi theo.
3. Chưa có test cho phép biến đổi `QuestView` (`packages/schema/src/game.ts:245`) với bài đọc `folk` / `original`: không có `author`, không có `source`. Hiện chỉ có ca `public-domain` (`game.test.ts:33`).
4. Chưa có test khẳng định `QuestText` từ chối `author` / `section`. `textbookLinks` đã bỏ và giờ chỉ còn `strictObject` chặn. Đề xuất `expect(QuestText.safeParse({ title, body, author: 'x' }).success).toBe(false)`.
5. `packages/schema/src/content.ts:1156` còn 1 dòng chỉ có dấu cách, sót lại khi xóa `lesson?:`.
6. `tools/private/sync-private.ts:1`: dòng chú thích đầu tệp giờ dài khoảng 190 ký tự. Nên ngắt dòng như các dòng bên dưới.
7. Report của dev ghi "63/63 mục tiêu". Thực tế `objective-coverage.json` và `content/learning/topics` cho 21 chủ đề, **64/64**. Docs (`project-roadmap.md:68`: 64) đúng; chỉ report sai.

## Đối chiếu từng mục được yêu cầu

- **Guard không bị nới:**
  - `checkTextbookCopy` lặp mọi quest, không còn nhánh `pending` (`no-textbook-copy.ts:160-178`).
  - Bài đọc nào cũng phải có `source`.
  - Không có khóa thì CI đỏ (`no-textbook-copy.ts:193-194`, test `:146`). Ngoại lệ: H1 và H2.
  - Kiểm cụm cấm quét mọi chuỗi của mọi `content/quests/*.json`, `content/npcs/*.json` và `content/world/targets.json` (`no-book-or-grade-wording.ts:92-104`). Thư mục quest không có thư mục con, đã kiểm.
  - `learning-links` giờ gate mọi mục tiêu: chặt hơn trước.
- **Tham chiếu sót:**
  - `git grep` các tên đã xóa (`lessonId`, `curriculumRef`, `curriculum-books`, `check-curriculum`, `curriculum-links`, `textbook-copy-*`, `readPendingQuests`, `isTextbookQuest`, `sgk-mechanics`, `quest-sgk`, `sgk-coverage`, `sgk:review`, `tools/sgk`, `content/curriculum`, `@miu/schema/curriculum`, `--book/--unit/--topics`) ngoài `plans/` chỉ còn:
    - assert phủ định trong `content.test.ts:253,262`;
    - `legacyQuest` trong `acceptance-page.ts`, có chủ đích, chỉ ghi ra `.data/`;
    - `.claude/rules/quest-content.md:17`, câu nói các trường đã bỏ;
    - Master Plan dòng 589 (Low 1).
  - `package.json`, `.github/workflows/ci.yml` (shard theo số), `playwright.config.ts`, vite config sạch.
  - Trang review: id `objective-coverage` và `lesson-props` có trong `review.html:186,189`; manifest và `generated.json` khớp.
- **`QuestView`:**
  - Server parse `QuestView`, sau đó transform bỏ `source`; lần parse lại (`QuestListResponse`, client) giữ `author`, nên biến đổi idempotent.
  - `died`, `note` và `title` của nguồn không ra client.
  - Bước học vẫn dùng các shape public đã bỏ đáp án.
- **Docs khớp code:**
  - `content:gaps [--missing] [--review]`, `objective-coverage.json`, `quest-mechanics`, `.data/review-shots/` và ghi chú `MIU_FINGERPRINT_KEY` khớp code.
  - Không còn lệnh sinh lại `.bin`.
  - Lệch duy nhất: Low 1.
- **Vệ sinh repo công khai:**
  - Các dòng thêm mới không có IP, user SSH, đường dẫn iCloud tuyệt đối hay secret.
  - `KEY_FILE_IN_ICLOUD` và `folder` trong `private-files.json` là đường dẫn tương đối, có từ trước, không phải dòng mới.
  - Diff xóa sha256 của các PDF, nhưng chúng vẫn còn trong lịch sử git. Không phải bí mật.

## Ngoài phạm vi (đã biết, thuộc mục 6)

`apps/web/review.html` còn chữ sách ở các dòng 30, 42, 59, 73, 82, 173. `review-main.ts:223-224` có chú thích ảnh "Tiếng Việt bài 15", "ôn cuối kì".

## Việc nên làm, theo thứ tự

1. H1: thu hẹp `catch` trong `checkContent`, thêm test khóa sai định dạng.
2. H2: thêm giá trị kiểm khóa (`KEY_CHECK`) và test chạy trên CI.
3. M1: thu ngoại lệ `en` về `title` / `goTo` hoặc allowlist; thêm ca test âm.
4. Low 1–5.
5. Hỏi người sở hữu về M2.

## Câu hỏi còn mở

1. Mẫu "Tiếng Anh 2 Global Success" có còn là nguồn dự kiến cho môn English không? Nếu còn, thêm lại dòng đó vào `private-files.json`. Nếu không, giữ như dev đã làm.
2. Secret `MIU_FINGERPRINT_KEY` trên GitHub có đúng là khóa đã tạo `.bin` không? Tôi chỉ xác minh được khóa local (153/153 khớp). CI hiện không có cách tự kiểm (H2).

Status: DONE_WITH_CONCERNS
Summary: Diff xóa sạch kiểm kê và mọi miễn trừ; schema strict chặn các trường sách; 4 gate local xanh, 77 test liên quan pass; docs khớp code (trừ 1 dòng Master Plan); QuestView không lộ source hay đáp án.
Concerns: H1: khóa sai định dạng làm `content:check` bỏ cả khối kiểm nội dung học mà vẫn OK trên CI, đã chứng minh bằng `CI=1 MIU_FINGERPRINT_KEY=abc`. H2: khóa đúng định dạng nhưng sai giá trị cũng qua. M1: ngoại lệ `en` rộng hơn mục đích. M2: bỏ PDF Tiếng Anh vượt phạm vi phase, cần người sở hữu xác nhận.
