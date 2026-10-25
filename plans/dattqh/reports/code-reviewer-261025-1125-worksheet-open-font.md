# Review: phiếu viết đổi font chữ mẫu HP001 → Playwrite Việt Nam

Ngày 25/10/2026. Thay đổi trong working tree, chưa commit. Không xem `content/quests/*` và `body.sim.rca-*.test.ts`.

## Phạm vi

- Server: `worksheet-routes.ts` và test của nó.
- Web: `oli.tsx`, `worksheets.css`, `worksheets-screen.test.tsx`, `e2e/worksheets.spec.ts`, `vite-repo-assets.test.ts`, `review.html`.
- Asset: `tools/assets/sources.json`, pack `assets/packs/font-playwrite-vn/1.003/`, `manifest.json` và `LICENSES.md` (hai file sinh ra).
- Private: `private-files.json`, `sync-private.ts`.
- Deploy: `deploy.sh`, `setup-prod-host.sh`, `docs/deployment-guide.md`.
- Khác: `CLAUDE.md`, memory của code-reviewer.

## Đã tự kiểm chứng

- **Hash.** Mình tải lại cả hai URL từ upstream. sha256 của chúng khớp `sources.json`, khớp file trong pack và khớp manifest:
  - woff2: `40caf7f0…a83475`
  - OFL: `0370f594…cd8cb8`
- **URL CSS2 của Google Fonts.** `fonts.googleapis.com/css2?family=Playwrite+VN` trả về đúng một face `/* fallback */` trỏ tới chính file `v11` này. Vậy đó là bản dựng đầy đủ, không phải một subset theo unicode-range.
- **Font (đo bằng fontTools).**
  - Name record: "Playwrite VN", "Version 1.003", OFL.
  - `upm` = 1000. `hhea` = `typo` = 1743/−769, lineGap 0. Bit `USE_TYPO_METRICS` bật. `win` = 1771/779.
  - x-height 500, cap 1257.
  - Có đủ 178/178 ký tự tiếng Việt (nguyên âm × 5 dấu, ă â ê ô ơ ư đ, cả chữ hoa).
- **Baseline.** Với line-height L, baseline nằm cách đỉnh line box L/2 + (A−D)/2 × cỡ chữ. (1,743 − 0,769)/2 = **0,487**, đúng như CSS. Nếu một engine dùng metric `win` thì hệ số là 0,496, lệch 0,07 mm ở cỡ vừa, bỏ qua được.
- **Kích thước trên ô li.**
  - Cỡ vừa: x-height 4 mm (2 ô li), chữ hoa ≈10 mm (5 ô li).
  - Cỡ nhỏ: một nửa của cỡ vừa.
  - Dấu trên chữ hoa (Ấ = 1677 unit) vẫn nằm trong khung ô li ở dòng 1 và dòng 2.
- **Bề rộng** (cộng advance, không tính kern), so với 166 mm có được (`.oli` 176 mm trừ `left` 10 mm):
  - Khối chữ hoa rộng nhất là Ô, Ơ: 99,3 mm ở cỡ vừa.
  - Câu ứng dụng dài nhất ("Mỗi chiều, Mai cùng các bạn chơi chi chi chành chành."): 117,6 mm ở cỡ nhỏ.
  - Cả hai đều vừa.
- **Không hotlink.**
  - CSS trỏ `/game-assets/packs/font-playwrite-vn/1.003/playwrite-vn-400.woff2`.
  - `isFont` (`vite-repo-assets.ts:35`) đưa font vào bộ runtime của web và vào bộ `fontsOnly` của app.
  - Dev/preview trả 404 cho path không có trong manifest.
  - nginx có `location ~ ^/(assets|game-assets)/` với `try_files =404`. CSP vẫn là `font-src 'self'`.
- **Fallback.** `useModelHand` được gọi ở đầu `WorksheetSheetScreen` (`worksheets-screen.tsx:228`), trước khi dữ liệu về.
  - `load` reject, hoặc resolve ra mảng rỗng: `ready` giữ `false`. Khi đó phiếu không vẽ `.oli-model`, và khối chữ hoa hiện ghi chú "Tô theo mẫu chữ hoa trong vở Tập viết".
  - `font-synthesis: none`: không tự giả chữ đậm.
- **Route cũ.** `GET /api/worksheets/fonts/x.woff2` có 2 segment nên không khớp `/worksheets/:id`, và rơi vào 404 mặc định. Import `HttpError` vẫn được dùng.
- **Deploy.**
  - `bash -n` cho `deploy.sh` và `setup-prod-host.sh`: OK.
  - Grep cả repo (trừ `plans/`), không còn: `deploy.sh fonts`, hàm `fonts()`, `MIU_FONT_DIR`, `/opt/miu/fonts`, `HANDWRITING_FONT_DIR`, `worksheets/fonts`, `Chu Mau Tieu Hoc`, `chu-mau-`, `font-not-found`.
  - Dòng usage đã bỏ `fonts`. CI và hook không gọi lệnh này.
- **Sót HP001.** Chỉ còn ở các chỗ ghi lịch sử, có chủ đích:
  - `review.html:298`
  - `deployment-guide.md:177,180`
  - memory của reviewer
- **Repo public.** Diff không thêm IP, user ssh hay đường dẫn iCloud mới. `folder` trong `private-files.json` đã có từ trước, không đổi.
- **Gate.**
  - `pnpm assets:check`: OK, 17 packs, 4746 file.
  - `pnpm typecheck`: exit 0.
  - `pnpm lint`: exit 0. ESLint `--max-warnings=0` và check-brand đều sạch.
  - `vitest --maxWorkers=1`, 4 file (`worksheets-screen.test.tsx`, `vite-repo-assets.test.ts`, `worksheet-routes.test.ts`, `sync-private.test.ts`): 24/24 qua.
  - E2E và build web: chưa chạy, theo quy tắc của máy.

## Critical

Không có.

## High

Không có.

## Medium

**M1. Hai điều kiện then chốt chỉ có E2E chứng minh, mà E2E chưa chạy** (`apps/web/e2e/worksheets.spec.ts:42-48`).
- Hai điều kiện đó là:
  - tên family trong `oli.tsx:7` khớp `@font-face` ở `worksheets.css:56`;
  - file thật sự tải được từ `/game-assets/` trong bản build.
- Unit test mock `document.fonts.load`, nên dù đổi tên family ở một trong hai file thì unit test vẫn xanh, còn production thì mất chữ mẫu mà không báo lỗi gì.
- Assert `toHaveCount(2)` ở hai khối trong E2E là assert mạnh, vì chữ mẫu chỉ hiện khi `load` resolve ra face. Assert này bắt được cả hai lỗi trên.
- **Fix:** trước khi báo xong, đẩy lên CI chạy project E2E `worksheets` cùng `security:dist`. Rồi mở `worksheet-tv2-t01-b01.pdf` trong review-shots để mắt người kiểm tra baseline và độ đậm nét tô (font chỉ có weight 400, mảnh hơn HP001 700).
- Nếu muốn bắt lỗi lệch tên ngay ở unit: trong `vite-repo-assets.test.ts`, assert rằng `worksheets.css` chứa `font-family: 'Playwrite VN'`, với tên family export từ `oli.tsx`.

## Low

**L1. `document.fonts.check(...)` là assert yếu** (`apps/web/e2e/worksheets.spec.ts:47`).
- Theo spec, `check()` trả về `true` khi không có `@font-face` nào khớp family. Nên dòng này vẫn qua nếu `@font-face` bị xoá hoặc đổi tên.
- **Fix:** thay bằng
  ```ts
  expect(await page.evaluate(() => [...document.fonts].some((f) => f.family.replace(/"/g, '') === 'Playwrite VN' && f.status === 'loaded'))).toBe(true)
  ```
  Hoặc bỏ hẳn dòng đó, vì `toHaveCount(2)` đã đủ.

**L2. Dòng credit hard-code thiếu font mới.**
- `tools/assets/build-manifest.ts:84` sinh ra `assets/LICENSES.md:27`: "fonts Baloo 2 and Nunito (SIL Open Font License)". Playwrite có trong bảng license và có toàn văn OFL, nhưng thiếu ở dòng credit.
- `docs/design-guidelines.md:42` liệt kê các font tự host nhưng cũng không có Playwrite.
- **Fix:** thêm "and Playwrite Việt Nam (worksheets)" vào chuỗi ở `build-manifest.ts:84` rồi chạy lại `pnpm assets:manifest`. Thêm một ý vào `design-guidelines.md:42`: Playwrite VN 400, chỉ dùng cho chữ mẫu phiếu viết, khai báo ở `worksheets.css`.

**L3. Nguồn của file woff2 không ghi trong manifest** (`tools/assets/sources.json:1737`).
- `homepage` và `sourceUrl` trỏ `github.com/TypeTogether/Playwrite`, nhưng byte woff2 lấy từ bản dựng của Google Fonts (`fonts.gstatic.com/.../v11/...`).
- License không có vấn đề: cùng OFL, không có Reserved Font Name, và name record ghi 1.003. Nhưng người đọc manifest không biết file đến từ đâu.
- **Fix:** đặt `homepage` là `https://fonts.google.com/specimen/Playwrite+VN`. Cách này giống `font-nunito` dùng trang fontsource.
- Ngoài ra, `v11` của gstatic là bản sửa của API, không phải version font. Khi Google ra `v12`, URL cũ thường vẫn sống. Nếu URL chết, cần cập nhật như một thay đổi có duyệt (rule asset §5).

**L4. Fixture cũ còn tên font** (`tools/private/sync-private.test.ts:45`).
- Fixture `.data/fonts/a.woff2` là dấu vết duy nhất còn lại của đường font private trong code.
- Không sai: test chỉ kiểm phần chép file chung.
- **Fix (tuỳ chọn):** đổi thành `.data/sgk/src/a.pdf` cho khớp dữ liệu private hiện có.

**L5. Không có chặn tràn ngang** (`worksheets.css:71`, `white-space: nowrap`).
- Playwrite rộng hơn HP001: chữ M ở cỡ vừa rộng 15,4 mm.
- Nội dung hiện tại vừa (xem số đo ở trên). Nhưng một khối có từ 3 chữ hoa trở lên, hoặc một câu ứng dụng dài hơn khoảng 165 mm ở cỡ nhỏ, sẽ tràn ra ngoài ô li và ngoài mép trang mà không báo gì.
- **Fix (tuỳ chọn):** thêm test ở `worksheet-builder.test.ts`: mỗi khối `letter` có ≤ 2 chữ, mỗi dòng `model` có ≤ N ký tự (khoảng 70). Hoặc ghi giới hạn này vào comment của `letterSpace`/`sentenceSpace`.

## Ngoài phạm vi (ghi nhận)

- `pnpm assets:fetch` không lọc được theo pack: nó xoá rồi tải lại mọi pack.
  - Zip `kenney-city-kit-roads` trên upstream đã đổi hash, nên fetch sạch trên máy mới sẽ đỏ.
  - Người làm đã khôi phục bằng `git checkout`. Mình kiểm `git status -- assets`: chỉ còn pack mới cộng hai file sinh ra. `assets:check` OK.
  - Nên làm một đợt riêng: thêm cờ `--pack <id>`, và duyệt lại hash Kenney.
- `content:check` đỏ, do quest tv2 đang được agent khác sửa. Không liên quan tới thay đổi này.

## Kết luận về plan

Thay đổi đúng phạm vi đã nêu: đổi font, xoá sạch HP001, giữ fallback. Rule asset pipeline được tuân thủ:
- license `OFL-1.1` có trong allowlist;
- URL ghim (commit SHA cho OFL, `v11` cho woff2), hash đã ghi và mình đã tải lại kiểm;
- font phục vụ từ origin và có trong manifest.

Chưa thể coi là xong cho tới khi CI chạy E2E `worksheets` (M1).

Status: DONE_WITH_CONCERNS
Summary: Không có lỗi chặn. Font, license, hash, baseline (0,487), cỡ chữ trên ô li, fallback và phần dọn deploy đều đã kiểm độc lập và đúng. Gate local xanh: assets:check, typecheck, lint, 24/24 test.
Concerns: (M1) chưa có bằng chứng font tải thật trong trình duyệt và trong bản in cho tới khi E2E chạy trên CI và có người xem PDF. Bốn mục Low: assert `fonts.check` yếu, dòng credit và design-guidelines thiếu Playwrite, `homepage` không ghi nguồn gstatic, không có chặn tràn ngang.
