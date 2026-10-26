# Chuẩn kỹ thuật

Lệnh cụ thể và danh sách cấm cho agent: `CLAUDE.md`. File này giải thích các lựa chọn và chính sách phía sau.

## Ngôn ngữ và công cụ

- TypeScript strict cho mọi thứ (cấu hình chung: `tsconfig.base.json`); ESLint với `--max-warnings=0` (`eslint.config.js`). Luật lint là nguồn chuẩn — không nhắc lại ở đây.
- pnpm workspace (`pnpm-workspace.yaml`): `apps/*` là ứng dụng chạy được, `packages/*` là thư viện dùng chung. Package nội bộ đặt tên `@miu/<tên>`.
- Script tooling (asset, world) viết TypeScript chạy bằng `tsx`; khai báo trong `package.json` gốc theo tiền tố nhóm (`assets:*`, `world:*`).
- Tên file kebab-case, mô tả rõ chức năng.

## Kiểm thử

- Mỗi task có acceptance test viết trước khi code.
- Vitest cho logic thuần (`tools/`, `packages/`, `apps/*/src`): phạm vi quét ở `vitest.config.ts`. Logic cần kiểm được ngoài trình duyệt thì đặt trong `packages/`.
- Vitest chia ba project (`vitest.config.ts`): `node`, `web`, và `maps` (các test sinh lại cả map 800 × 800). `pnpm test` chạy cả ba; CI chạy `node` + `web` ở job `unit` (chia 2 máy theo file, `--shard`) và `maps` ở job riêng (2 máy: `zone-maps.test.ts` một máy, các `generate-*.test.ts` máy kia), từng file một, để việc sinh map không tranh CPU với hàng trăm file khác. Job `check` giữ các gate tĩnh (`assets:check`, `content:check`, typecheck, lint, build web, `security:dist`, `pnpm audit`).
- Kiểm tra tăng theo lượng nội dung (mọi quest, mọi mục tiêu, mọi map) đặt ở Node: `content:check` (gồm audit mục tiêu quest `pnpm world:quest-targets`: ở từng bước của mọi quest, mục tiêu tới được, nút Tương tác là của nó, nó đang hiện, không bị khối hay prop che), các audit map (`.claude/rules/world-scenery.md`) và vitest. Một luật của game mà audit dựa vào thì audit gọi đúng hàm của game, không viết lại.
- **E2E chỉ giữ luồng chính** (Playwright ở `apps/web/e2e/`). Mỗi file `<tên>.spec.ts` là một project; project `setup` tạo phụ huynh giả + hồ sơ qua API. Spec cần tiến độ quest riêng tự tạo phụ huynh mới (`freshChild` trong `quest-api.ts`). Server E2E dùng PGlite trong RAM, không có dữ liệu thật. Chờ theo trạng thái (DOM, `window.__miuStats`), không chờ theo thời gian.
  - **Bộ smoke** (`playwright.ci.config.ts`; `pnpm --filter @miu/web e2e:smoke`, cũng là `e2e:ci`): chạy mỗi lần push và PR ở job `e2e`, một máy, luôn xanh và chặn deploy. Năm luồng: đăng nhập qua dịch vụ tài khoản tới chơi, dữ liệu và xóa tài khoản (`account-flow`), mở link mời tới thành bạn (`invite`), mở Trung tâm và qua cổng (`maps`), xong chương 1 và nhận thưởng từ server (`quest-flow`, trừ test có tag `@nightly`), kiếm xu, mua đồ và mặc (`shop`).
  - **Lượt hằng đêm** (`playwright.nightly.config.ts`; `e2e:nightly`, job `e2e-nightly` khi CI `schedule` 02:00 giờ Việt Nam hoặc `workflow_dispatch`): mọi project trừ `store`, với `E2E_ALL_MAPS=1` để test mở map mở mọi map (lượt push chỉ mở Trung tâm). Gồm bộ smoke, test `@nightly` của `quest-flow` (gặp vẹt, tìm ba manh mối, lá thư tự mở), tương tác với mục tiêu (`play`), các dạng bài học bằng chạm (`quest-mechanics`), đánh trùm (`bosses`), chơi cùng đội (`coop`), in phiếu viết (`worksheets`), và các project chỉ ghi số liệu: `perf`, `budget` (ngân sách vẽ của mọi map), `screens`; báo cáo và ảnh giữ 7 ngày ở artifact `e2e-nightly`. Bản `perf.json`, `map-budget.json` và ảnh màn hình được duyệt vẫn chụp trên máy dev (xem [`screen-review.md`](screen-review.md)).
  - Hành vi của các project hằng đêm được khóa trên mỗi lần push bằng test Node: dạng bài học (`apps/web/src/ui/challenge/mechanics/mechanics.test.tsx`, `packages/quest/src/check-answer.test.ts`), đánh trùm (`apps/web/src/ui/challenge/boss/boss-duel.test.tsx`, `apps/web/src/ui/quest/quest-layer.test.tsx`, `apps/server/src/coop/guardian-fight.test.ts`), chơi cùng đội (`apps/server/src/coop/*.test.ts`, `apps/web/src/ui/coop/*.test.tsx`), phiếu viết (`apps/server/src/worksheet/worksheet-routes.test.ts`, `apps/web/src/ui/parent/worksheets/worksheets-screen.test.tsx`), manh mối và tiến độ quest (`apps/server/src/quest/quest-routes.test.ts`, `apps/web/src/ui/quest/quest-layer.test.tsx`), mục tiêu trên mọi map (audit trong `content:check`).
  - Test mới chỉ vào smoke khi nó là một luồng chính mà không test Node nào thay được; phần kiểm khác viết ở Node, luồng phụ cần trình duyệt thật thì vào lượt hằng đêm.
- **Ngân sách thời gian test** (giữ nguyên dù game có thêm bao nhiêu map, quest): E2E có timeout mặc định 45 s. Một test chạy quá 30 s phải tự khai timeout dài hơn bằng `test.setTimeout`, kèm comment ghi lý do; không khai thì reporter `e2e/time-budget-reporter.ts` đánh đỏ. Trên CI, bộ smoke chạy trên một máy GitHub, 1 worker, cả lượt không quá 180 s (`E2E_SUITE_BUDGET_SECONDS` trong `playwright.ci.config.ts`; đo ngày 26/10/2026 khoảng 100–115 s). Lượt hằng đêm không có ngân sách cả lượt, mỗi test vẫn giữ giới hạn của nó. Sau mỗi lượt, reporter in 10 test chậm nhất.
  - Không thử lại (`retries: 0`) và không giới hạn số test hỏng: mọi luồng đều chạy và báo, không có test "did not run". Một test hỏng là lỗi cần sửa; test chập chờn thì sửa nguyên nhân (chờ tín hiệu sẵn sàng của game), sửa hai lần vẫn chập chờn thì chuyển phần kiểm sang Node và bỏ khỏi smoke.
  - Tư liệu cho trang duyệt (video, ảnh chờ cảnh đẹp) chỉ chạy khi đặt `REVIEW_SHOTS=1`.
  - Trên máy dev chỉ chạy 1 worker và không chạy nhiều bộ test cùng lúc, vì nhiều trình duyệt chạy song song làm treo máy (máy 16 GB dùng chung nhiều dự án). Server E2E build web bằng `vite build` (không `tsc`, typecheck là gate riêng). Ngân sách draw-call đo theo GPU giả lập của CI: trên máy dev (GPU thật vẽ nhiều lệnh hơn) vượt ngân sách chỉ ghi chú trên kết quả (`expectDrawCalls` trong `e2e/stats.ts`), CI vẫn đánh đỏ.
  - Vượt ngân sách thì sửa test (tách nhỏ, cắt thời gian chờ, chuyển kiểm tra sang Node), không nâng con số ngân sách.
- Chữ trong game gọi người chơi bằng tên nhân vật: nội dung viết `{name}`, UI điền bằng `fillPlayerName`; mọi câu lặp lại (phản hồi, lời NPC, lời mời thử lại) chọn từ pool bằng `freshPicker`, không lặp ngay. `content:check` chặn chữ quest cứng "Miu".
- Đáp án quest chỉ ở server: web không import `content/quests`; `pnpm security:dist` (CI, sau build web) quét bundle.
- Generator phải xác định (cùng input → cùng byte output); kiểm bằng chạy lại và so hash.
- **Đo tải hub online** (`pnpm loadtest`, `tools/loadtest/`): chỉ trên máy dev. Lệnh tự chạy server local ở `127.0.0.1:8787` (bộ nhớ, đăng nhập mật khẩu test), không có tùy chọn trỏ tới URL khác, và từ chối nếu cổng đang bận; không bao giờ chạy trên production. Mỗi lượt chờ máy rảnh (một job nặng một lúc, load ≤ 8, còn ≥ 30% RAM trống). Ví dụ: `pnpm loadtest --scenario room --steps 10,25,50,100 --window 30`. Số liệu và giới hạn người mỗi room: [`plans/dattqh/reports/loadtest-multiplayer-261019.md`](../plans/dattqh/reports/loadtest-multiplayer-261019.md).
- Không làm yếu test để qua gate. Test không chạy được vì giới hạn môi trường thì skip có điều kiện ngay trong test (bắt đúng mã lỗi, như test symlink trên Windows), không xóa, và CI phải còn chạy nó.
- Thay đổi về đăng nhập, phân quyền, thưởng, dữ liệu trẻ em: kèm test bảo mật tự động (IDOR, chống gian lận, CSP).

## Backend (`apps/server`)

- Mỗi endpoint có test IDOR: phụ huynh/hồ sơ khác không đọc, sửa, xóa được; trả 404 (không 403) để không lộ tài nguyên tồn tại.
- Mỗi endpoint ghi thưởng, tiến độ, mở khóa có test chống gian lận: bỏ qua giá trị client gửi, gọi lặp không cộng thêm, sai thứ tự bị từ chối.
- Test API chạy bằng supertest trên PGlite in-memory ở máy dev; CI chạy cùng bộ test trên PostgreSQL thật.
- Request trong test đi qua `agent()`, `request()`, `agentFor()` của `apps/server/test/test-app.ts`, là các server nghe ở 127.0.0.1; không đưa app trần cho supertest (lint chặn). Nếu đưa app trần, supertest bind wildcard IPv6 rồi gọi 127.0.0.1, và trên macOS một chương trình khác đang nghe cùng cổng ở 127.0.0.1 sẽ trả lời thay, làm một test bất kỳ hỏng ngẫu nhiên với 403/404/503.
- Migration chỉ sinh bằng `drizzle-kit generate`, commit file SQL và review như code; không `push` schema lên DB thật.
- Không log email, tên hồ sơ, token; log chỉ id. Lỗi trả client không kèm stack.
- Input validate bằng Zod từ `packages/schema`; DTO trả ra không bao giờ chứa hash mật khẩu, PIN hay token.

## React (`apps/web`)

- React không giữ state thay đổi theo khung hình (vị trí, camera, FPS): game tự ghi vào DOM qua ref; React chỉ nhận event rời rạc qua `game-bridge`.
- Màn hình ghi rõ bám mock nào (`M?.?`) hoặc là NEW SCREEN; dùng biến CSS token, không hardcode màu mới.
- Gọi API cùng origin bằng `fetch`; không script hay analytics bên thứ ba.
- Chữ giao diện đi qua lớp song ngữ (`apps/web/src/ui/i18n`, cách dùng ở [`i18n.md`](i18n.md)): không viết chuỗi tiếng Việt thẳng trong component mới; chữ bài học giữ nguyên tiếng Việt.

## Định nghĩa "xong"

1. Năm gate CI xanh (`assets:check`, `content:check`, `test`, `typecheck`, `lint`); runtime đổi thì E2E xanh; CI còn chạy `pnpm audit` và Semgrep.
2. Agent review độc lập (`code-reviewer`) và đã xử lý phát hiện; phát hiện không sửa phải ghi lý do trong report.
3. Plan/report trong `plans/dattqh/` cập nhật; tài liệu `docs/` cập nhật nếu đổi hành vi người dùng thấy, kiến trúc, lệnh, hay quyết định.
4. Cuối đợt giao hàng: trang review cho người duyệt cuối.

## Ra quyết định

- Quyết định thường ngày: AI tự quyết. Có thể dùng TypeSafe Jev qua `tools/decisions/jev-decide.py`; ngưỡng tự quyết theo mức rủi ro nằm trong hằng `AUTO_THRESHOLD` của script (rủi ro cao luôn chuyển người).
- Quyết định quan trọng (chi phí, an toàn trẻ em, phạm vi sản phẩm, pháp lý, việc tốn công người): gom lại hỏi một lần, kèm phương án và đề xuất.
- Ghi quyết định đã chốt vào Validation Log của plan; quyết định kiến trúc bền vững chuyển vào sổ quyết định ở `system-architecture.md`.

## Dependency và chuỗi cung ứng

- Khóa phiên bản qua `pnpm-lock.yaml`; CI cài bằng `--frozen-lockfile`.
- Dependency mới: AI tự review, liệt kê trong trang review của đợt. CI chạy `pnpm audit --prod --audit-level=high` và Semgrep CE (SAST); CodeQL bị loại vì repo private cần gói trả phí.
- Không thêm script hay analytics bên thứ ba vào client.

## Commit

Conventional commits tiếng Anh, scope theo vùng (`assets`, `web`, `server`, `schema`, `quest`, `plans`…). Không nhắc AI; không ghi mã plan, phase hay mã finding trong commit, tên test, comment code.
