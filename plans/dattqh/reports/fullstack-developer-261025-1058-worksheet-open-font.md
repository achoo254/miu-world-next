# Phiếu viết: chữ mẫu bằng font mở Playwrite Việt Nam (thay HP001)

Ngày: 25/10/2026. Thay đổi để trong working tree, chưa stage, chưa commit.

## Kết quả

Phiếu viết giờ có chữ mẫu: font **Playwrite Việt Nam** (TypeTogether, SIL OFL 1.1) đi qua asset pipeline thành pack `font-playwrite-vn`, tải từ origin ở `/game-assets/packs/font-playwrite-vn/1.003/playwrite-vn-400.woff2`. Đường HP001 (route 404 của server, `@font-face` trỏ `/api/worksheets/fonts/*`, mục private-files, lệnh `deploy.sh fonts`) đã bỏ hết.

## Bằng chứng license

- https://raw.githubusercontent.com/google/fonts/main/ofl/playwritevn/OFL.txt và https://raw.githubusercontent.com/TypeTogether/Playwrite/main/OFL.txt:
  > "Copyright 2023 The Playwrite Project Authors (https://github.com/TypeTogether/Playwrite)
  > This Font Software is licensed under the SIL Open Font License, Version 1.1."
- `google/fonts` `ofl/playwritevn/METADATA.pb`: `license: "OFL"`, `display_name: "Playwrite Việt Nam"`, `primary_language: "vi_Latn"`, nguồn `TypeTogether/Playwrite` commit `02e4e15767f5b6c2109413429fc51879b9507ab4` (release `v1.003`).
- Chính file font nhúng name record: bản quyền như trên, "Version 1.003". `OFL-1.1` có trong `licenseAllowlist`.

## Khai báo pack (`tools/assets/sources.json`, mode `files`, theo mẫu `font-nunito`)

| file | URL | sha256 |
|---|---|---|
| `OFL.txt` | `https://raw.githubusercontent.com/TypeTogether/Playwrite/02e4e157…/OFL.txt` (ghim commit) | `0370f594…cd8cb8` |
| `playwrite-vn-400.woff2` (42.800 byte) | `https://fonts.gstatic.com/s/playwritevn/v11/mtGo4_hXJqPSu8nf5RBY5i0q0yxCxtP-9TFBNUI9E-o.woff2` | `40caf7f0…5a83475` |

Vì sao chọn nguồn woff2 này:
- Allowlist đuôi chỉ nhận `.woff2`, mà release `v1.003` (zip 41 MB) chỉ có TTF. Repo không có bước chuyển TTF → woff2.
- Fontsource `@fontsource/playwrite-vn@5.3.0` chỉ có subset `latin` (U+0000-00FF…), thiếu ă/ơ/ư và U+1EA0-1EF9, nên không dùng được.
- File của Google Fonts ở trên (bản `v11` có version trong URL, hash đã ghim) là bản dựng woff2 đầy đủ từ chính file OFL của `google/fonts`. Kiểm bằng fontTools: 486 ký tự, **không thiếu chữ tiếng Việt nào** (đủ cả chữ thường lẫn hoa có dấu), static weight 400.

Không thêm "Playwrite VN Guides": phiếu tự vẽ ô li bằng CSS, nên không cần đường kẻ của font.

Hash được ghi theo trust-on-first-use. `assets:fetch` in ra và mình tự tính lại độc lập, hai giá trị khớp nhau. `pnpm assets:manifest` sinh lại `assets/manifest.json` (+25 dòng, chỉ thêm) và `assets/LICENSES.md` (+99 dòng, văn bản OFL).

### Sự cố khi chạy `pnpm assets:fetch` (đã khôi phục)

Script không có cờ lọc pack: nó xoá rồi tải lại **mọi** pack. Lần chạy dừng ở `kenney-city-kit-roads` vì zip trên kenney.nl đã đổi nội dung (`expected 22058af3…, got 374a4552…`). Lúc đó pack này đã bị xoá 97 file, còn `fluent-emoji/…/minigame` đang được giải nén lại. Mình đã khôi phục bằng `git checkout -- assets/packs/kenney-city-kit-roads assets/packs/fluent-emoji/1ffb34c752ec/minigame`. Hiện `git status -- assets` chỉ còn pack font mới; minigame đủ 137/137 file. Vì fetch dừng trước khi ghi `sources.json`, hai hash TOFU được ghi vào đó bằng script (đúng giá trị fetch đã in).

**Cần người biết:** chạy `pnpm assets:fetch` sạch trên máy mới hiện sẽ đỏ, vì Kenney City Kit Roads 2.1 đã đổi trên upstream. Đây là chuyện riêng của pack đó, không thuộc phạm vi việc này.

## Code và metric

- `oli.tsx`: family `Playwrite VN`, `document.fonts.load('400 1em "Playwrite VN"')`. Vẫn giữ quy tắc: font chưa tải xong hoặc không tải được thì phiếu không vẽ chữ mẫu.
- `worksheets.css`: `@font-face` trỏ file pack, `font-display: block`, `font-synthesis: none`, weight 400 (font chỉ có tới 400). Metric đo trên outline:
  - x-height 500/1000 và chữ hoa ≈1250, đúng tỉ lệ 1 : 2,5 của vở Tập viết. Do đó `--oli-size` = 4 mm / 0,5 (cỡ vừa) và 2 mm / 0,5 (cỡ nhỏ).
  - ascent 1743, descent 769 (hhea = typo, có USE_TYPO_METRICS, lineGap 0). Baseline nằm dưới giữa line box (1,743 − 0,769) / 2 = **0,487 × cỡ chữ** (HP001 là 0,2).
  - Đã chụp thử bằng Chromium headless trên trang HTML rời (không build web): baseline nằm đúng trên đường đậm cuối dòng, chữ hoa cao 5 ô li, chữ thường 2 ô li, dấu tiếng Việt hiện đủ, bản tô màu nhạt hiện đúng.
- Server: bỏ route `GET /api/worksheets/fonts/:file` và test của nó. Đường dẫn cũ giờ rơi vào 404 mặc định.
- Bỏ phần HP001:
  - `tools/private/private-files.json`: bỏ 2 mục font (8 → 6 mục; còn PDF SGK và thời khóa biểu, không tính năng nào khác dùng font).
  - Comment của `sync-private.ts`.
  - `deploy.sh`: bỏ lệnh `fonts`.
  - `setup-prod-host.sh`: không tạo `/opt/miu/fonts` nữa.
- Native app: `fontAssetPaths` đóng gói mọi `packs/font-*.woff2`, nên app cũng có font (+42,8 KB). CSP `font-src 'self'` không đổi.

## File đã đổi

- Asset: `tools/assets/sources.json`, `assets/manifest.json` + `assets/LICENSES.md` (sinh lại), `assets/packs/font-playwrite-vn/1.003/{OFL.txt,playwrite-vn-400.woff2}` (mới).
- Web: `apps/web/src/ui/parent/worksheets/oli.tsx`, `worksheets.css`, `worksheets-screen.test.tsx`, `apps/web/vite-repo-assets.test.ts`, `apps/web/e2e/worksheets.spec.ts`, `apps/web/review.html`. Trong `review.html`, mục bảo mật chuyển HP001 từ "Chờ quyết định" sang "Đã xử lý".
- Server: `apps/server/src/worksheet/worksheet-routes.ts`, `worksheet-routes.test.ts`.
- Tool/deploy: `tools/private/private-files.json`, `tools/private/sync-private.ts`, `tools/deploy/production/deploy.sh`, `tools/deploy/production/setup-prod-host.sh`.
- Docs: `CLAUDE.md` (dòng dữ liệu ngoài git), `docs/deployment-guide.md` (bỏ dòng `deploy.sh fonts`, viết lại đoạn font chữ mẫu), `.claude/agent-memory/code-reviewer/{MEMORY.md,project-family-only-defaults.md}` (ghi finding HP001 đã xong để sweep sau không báo lại).

## Test

- `worksheets-screen.test.tsx`:
  - Test chữ mẫu kiểm thêm lệnh `load('400 1em "Playwrite VN"')`.
  - Test mới: font không tải được thì không có `.oli-model`.
- `vite-repo-assets.test.ts`: URL font trong `worksheets.css` phải có trong manifest và được đóng gói, và phải có `packs/font-playwrite-vn/`.
- E2E `worksheets.spec.ts`:
  - Trước khi in PDF, kiểm phiếu `tv2-t01-b01` có 2 `.oli-model` ở khối chữ hoa và 2 ở khối chép câu, và `document.fonts.check('400 16px "Playwrite VN"')` đúng.
  - Bỏ lượt mở lại phiếu để kiểm 0 chữ mẫu.

## Kiểm tra đã chạy (local)

- `pnpm assets:check`: OK, 17 packs, 4.746 file.
- `pnpm vitest run --maxWorkers=1` trên 4 file (`worksheets-screen.test.tsx`, `worksheet-routes.test.ts`, `vite-repo-assets.test.ts`, `sync-private.test.ts`): 4 file, **24/24 test qua**.
- `pnpm typecheck`: exit 0, 0 lỗi (lần đầu có 1 lỗi TS18048 trong test mới, đã sửa).
- `pnpm lint`: exit 0 (ESLint `--max-warnings=0` và check-brand).
- `pnpm content:check`: **FAILED, 8 lỗi**, tất cả dạng "quest tv2-… no longer copies the textbooks: remove it from tools/content/textbook-copy-pending.json". Các file đó (`content/quests/tv2-*.json`) đang được agent khác sửa song song. Việc này không chạm `content/` hay `tools/content/`.

## Còn lại (CI)

- Build web (`pnpm --filter @miu/web build`), `security:dist`, toàn bộ `pnpm test`, E2E `e2e:ci` (project `worksheets`): chưa chạy local, theo quy tắc máy dùng chung.
- Mắt người xem PDF `worksheet-tv2-t01-b01.pdf` trong review-shots của E2E: chữ mẫu đặt đúng ô li khi in thật.
- Trang review của đợt: thêm "asset pack mới `font-playwrite-vn` 1.003 (OFL-1.1), không thêm dependency npm". Bảng license tự sinh từ manifest.
- Production: thư mục `/opt/miu/fonts` và dòng `HANDWRITING_FONT_DIR` cũ (nếu có) trên máy chủ không ai đọc nữa. Xoá được khi người sở hữu đồng ý; việc này không cần cho release.

## Câu hỏi chưa giải quyết

- Pack `kenney-city-kit-roads` có hash upstream đổi (xem trên): có xử lý ở đợt riêng không (ghim lại URL hoặc chấp nhận hash mới sau khi duyệt)?

Status: DONE_WITH_CONCERNS
Summary: Phiếu viết có chữ mẫu bằng Playwrite Việt Nam (OFL 1.1, pack `font-playwrite-vn` tải từ origin), HP001 bỏ hẳn khỏi code, tooling và docs. assets:check, typecheck, lint và 24 test liên quan đều qua.
Concerns/Blockers: content:check đỏ 8 lỗi, do quest tv2 đang được agent khác sửa. Zip Kenney City Kit Roads trên upstream đã đổi hash nên `assets:fetch` toàn bộ sẽ đỏ. Lần fetch hỏng đã xoá tạm hai thư mục pack, đã khôi phục bằng git checkout. Build web và E2E chờ CI.
