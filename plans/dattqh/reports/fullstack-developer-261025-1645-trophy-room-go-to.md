# Nút "Đi tới" cho Phòng truyền thống và "Đi đến" cho Sổ sưu tập

Ngày 25/10/2026. Chưa stage, chưa commit.

## Kết quả

Hai màn dùng chung một bộ code dẫn đường (`apps/web/src/ui/travel/`):

- **Phòng truyền thống:** mỗi huy hiệu hay cúp chưa có, và mỗi bảng thành tích còn dưới 3 sao, có nút **"Đi tới"**.
- **Sổ sưu tập:** món chưa tìm thấy ("???") có nút **"Đi đến"** trong phần chi tiết, dưới dòng "Chưa tìm thấy – Làm nhiệm vụ hoặc chơi trò chơi ở …".

Nút là `<button>` thật, dùng `btn--sm` (cao 44 px), bấm được bằng chạm, chuột, hoặc Tab rồi Enter/Space. Dưới nút có dòng "Ở {map}" hoặc "Ngay trên map này". `aria-label` ghi "Đi tới {map}". Món đã có giữ nguyên giao diện, không có nút. Món không có nơi nào dẫn tới lúc này cũng không có nút.

Khi bấm, các màn đang mở đóng lại (Phòng truyền thống, hoặc Ba lô cùng Sổ sưu tập), rồi:

- **Nơi đó ở map khác:** bé chuyển sang map đó qua cổng (có loading screen của cổng), với quest của map đó. Bé xuất hiện **đứng cạnh** chỗ cần tới, không đứng lọt vào trong vật. Phần đặt chỗ đứng dùng `standBeside`, giống công tắc `spawnAt` và chỗ đứng ở trận boss. Mũi tên quest có sẵn chỉ tiếp từ đó. Chỗ đứng vẫn được lưu như lúc chơi thường.
- **Nơi đó ở map đang đứng:** dùng lối tự đi của thẻ quest (`autowalk-to {quest}`). Nếu là quest khác thì đi qua luồng `quest-pick` có sẵn. Người cho minigame thì đi bằng `autowalk-to {targetId}`.

Phần này chỉ dẫn đường. Server vẫn quyết định mọi phần thưởng.

## Đích theo từng loại (suy từ dữ liệu)

| Loại | Đích | Nguồn dữ liệu |
|---|---|---|
| Huy hiệu sự kiện | Quest kế tiếp chưa xong của sự kiện **đang mở** mà cửa sổ hiện tại tặng đúng item đó. Ví dụ huy hiệu Vàng dẫn tới cổng Olympic ở Khu rừng bí mật. Bé đứng cạnh chỗ của bước kế tiếp. | `GET /events` (`rewards[].item`, `quests[].done`) |
| Cúp sưu tập | Bài đang học ở vùng đó, nếu không có thì bài đầu tiên chưa xong (`questForRegion`), đứng cạnh chỗ của bước kế tiếp | `room.cups[].mapId` |
| **Món trong Sổ sưu tập** | Giống cúp, dùng chung hàm `collectionTrip`. Server (`dropCollectible`) cho **mỗi lượt bài hay minigame đã trả thưởng trong vùng** rơi một món của bộ, và không quest nào tặng riêng một món. Vì vậy không món nào có một nguồn duy nhất, và đích là "quest đầu tiên đang mở của vùng có thể cho món đó", đúng phương án dự phòng trong yêu cầu. | `collectibles.json` (`mapId`), `quest-completion.ts` |
| Sao bảng thành tích | Server tính `goTo` từ thành tích **đầu tiên chưa nhận** của loại đó (theo thứ tự catalog) mà có nơi trên map dẫn tới. `lesson`: bài kế tiếp, đúng vùng nếu goal ghi vùng. `minigame`: đứng cạnh người cho minigame chưa chơi (`/quests?category=side`), map dựng theo bài của vùng đó. `collection`: cúp đầu tiên chưa có. `event`: sự kiện đang mở. | `METRIC_PLACES` (bảng ghi đủ mọi `metric.kind`, TypeScript báo lỗi nếu thiếu) và `plaqueGoTo` ở `packages/schema/src/trophy-room.ts` |

Các loại goal sau không có nơi trên map nên không có đích: `wearables-owned`, `shop-purchases`, `mail-gifts`, `gates-opened`, `coop-runs`, `coop-challenges`. Với nội dung hiện tại, cả năm bảng đều có đích ngay từ đầu (test server đã kiểm).

Kiểm tra đến được: mọi đích đều là chỗ của một bước quest, hoặc người cho side quest. Audit `world:quest-targets` trong `content:check` kiểm tất cả các chỗ này và trả 0 finding. Tôi không sửa quest, map hay targets.

## File đã sửa hoặc thêm

- `packages/schema/src/trophy-room.ts`: thêm `TrophyPlace`, `METRIC_PLACES`, `TrophyGoTo`, `plaqueGoTo` và trường `plaques[].goTo`. Hợp đồng API đổi, nhưng web và server cùng nằm trong repo.
- `apps/server/src/progression/trophy-room-routes.ts` và `.test.ts`: trả `goTo`; thêm test cho `plaqueGoTo`, cho đích ban đầu của năm bảng, và cho việc `METRIC_PLACES` ghi đủ mọi loại goal.
- **Mới, dùng chung:** `apps/web/src/ui/travel/place-trips.ts` và `.test.ts` (các hàm `badgeTrip`, `collectionTrip`, `plaqueTrip`, `arrivalTarget`), `go-there-button.tsx` (`GoThereButton` và kiểu `Travel`), `travel.css`.
- `apps/web/src/ui/trophy-room/trophy-room-panel.tsx` và `.test.tsx`, `trophy-room-api.ts` (thêm `loadSideQuests`), `trophy-room.css`: card chưa có chỉ làm mờ hình và chữ, không làm mờ nút.
- `apps/web/src/ui/collection/collection-book.tsx` và `.test.tsx`: thêm prop `travel`, nút "Đi đến" trong phần chi tiết của món chưa tìm.
- `apps/web/src/ui/backpack/backpack-panel.tsx`: chỉ chuyền `travel` xuống Sổ sưu tập.
- `apps/web/src/game/game.ts`: thêm option `arriveBeside`, đi chung đường với `spawnAt`; việc tắt lưu chỗ đứng giờ chỉ áp khi `spawnAt` lấy từ URL.
- `apps/web/src/ui/play/play-screen.tsx` và `.test.tsx`: hàm `goThere` đóng cả Phòng truyền thống lẫn Ba lô; ref `arrival` giữ đích tới khi map mới ở trạng thái `ready`, và bị hủy nếu bé đổi sang quest khác; `placeTravel` chuyền cho cả hai màn. Có thêm một test component đi qua cả hai nhánh.
- `apps/web/src/ui/i18n/locales/{vi,en}.json`: thêm `trophy.go`, `collection.go`, `travel.{where,here,goAria,goHereAria}`.

Tôi không sửa HUD.

## Kết quả kiểm tra (local, `--maxWorkers=1`)

| Lệnh | Kết quả |
|---|---|
| `pnpm assets:check` | OK, 17 pack, 4747 file |
| `pnpm content:check` | OK, 2159 file (đã gồm audit quest-targets, 0 finding) |
| `pnpm typecheck` | OK, 0 lỗi |
| `pnpm lint` | **Đỏ: 3 lỗi jsx-a11y ở `apps/web/src/ui/hud/hud-menu.tsx`**, file của agent đang làm lại HUD. Chạy `eslint --max-warnings=0` riêng trên các thư mục và file của phần này: 0 lỗi, 0 cảnh báo. `check:brand` OK. |
| `vitest` trên `ui/collection`, `ui/travel`, `ui/trophy-room`, `ui/backpack`, `ui/play`, `trophy-room-routes.test.ts` | 7 file, **40/40 test qua** |

Theo quy định, tôi không chạy full `pnpm test`, build web hay E2E. Tôi cũng không thêm E2E vì luồng này đã có test Node và test component (dùng Game giả).

## Cần người sở hữu biết hoặc quyết

1. **Cây thư mục đang dùng chung với agent làm HUD.** `play-screen.tsx`, `game.ts`, `vi.json` và `en.json` có cả thay đổi của agent đó. Ví dụ `game.ts` thay đổi 40 dòng, phần của tôi chỉ khoảng 16 dòng (`arriveBeside`, `urlSpawnAt`). Lead cần commit tách theo hunk.
2. **Huy hiệu Olympic thật ra nhận từ bài thi thử** (Luyện Olympic hoặc trang sự kiện), không phải ở cổng. Theo yêu cầu, nút hiện dẫn tới cổng. Có thể đổi để nút mở thẳng bài thi thử.
3. **Món sưu tập không có nguồn riêng:** server chọn món rơi theo seed của từng lượt, nên nút dẫn tới bài của vùng chứ không dẫn tới một quest cụ thể. Cách duy nhất có nguồn riêng là thư của NPC tặng món (ví dụ `to-ong-mat` trong `npcs/khu-rung-bi-mat.json`), nhưng thư không phải nơi trên map nên tôi không dẫn tới đó.
4. **Đi trên cùng map là tự đi**, có thể lâu trên map 800 × 800. Nếu muốn dịch chuyển tức thì cả trên cùng map thì cần thêm một lệnh teleport sau khi vùng đất đã tải xong.
5. **Bảng thành tích:** nếu thành tích kế tiếp đã đạt mà chưa nhận, nút vẫn dẫn tới nơi làm, không dẫn tới màn Thành tích để bấm nhận.
6. **Chưa chụp ảnh ở 360×740 và 820×1180**, vì cần đăng nhập và server dev. Theo tính toán, card rộng tối thiểu 10rem, cột chữ khoảng 100 px, nút khoảng 80 px, và dòng "Ở {map}" tự xuống dòng. Nên kiểm ở lượt chụp màn hình tới.
7. Chữ trên nút khác nhau theo đúng lời người sở hữu: "Đi tới" ở Phòng truyền thống, "Đi đến" ở Sổ sưu tập. Nếu muốn thống nhất một chữ thì chỉ cần đổi một khóa i18n.

Status: DONE_WITH_CONCERNS
Summary: Phòng truyền thống ("Đi tới") và Sổ sưu tập ("Đi đến") dùng chung `ui/travel/*`. Đích được suy từ dữ liệu: sự kiện đang mở, bài của vùng, và `goTo` do server tính từ thành tích kế tiếp. Ở map khác thì bé sang qua cổng và đứng cạnh chỗ cần tới; trên cùng map thì bé tự đi. Có test unit, test server và test component; 40/40 test qua; assets, content và typecheck xanh.
Concerns: `pnpm lint` đỏ vì `hud-menu.tsx` của agent khác; agent đó cũng đang sửa `play-screen.tsx`, `game.ts` và các file locale nên commit phải tách theo hunk; chưa chụp ảnh kiểm layout; huy hiệu dẫn tới cổng chứ không mở bài thi thử.
