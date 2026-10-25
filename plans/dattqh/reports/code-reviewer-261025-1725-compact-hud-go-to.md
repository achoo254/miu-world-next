# Review commit c2960942: HUD gọn và nút "Đi tới" / "Đi đến"

Ngày 25/10/2026. Phạm vi: `git show c2960942` (56 file, +1755/−281). Không có commit nào sau nó (`c2960942..HEAD` rỗng), cây sạch.

## Kiểm tra đã chạy

| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | 0 lỗi (root, mobile, server, web) |
| `pnpm lint` | 0 lỗi, 0 cảnh báo; check-brand OK (lỗi jsx-a11y ở `hud-menu.tsx` mà report trophy nêu đã được sửa trước khi commit) |
| `vitest run` 6 file web (`hud-menu`, `place-trips`, `prompt-placement`, `trophy-room-panel`, `collection-book`, `play-screen`) `--maxWorkers=1` | 6 file, 40/40 test qua |
| `vitest run src/progression/trophy-room-routes.test.ts --maxWorkers=1` (server) | 7/7 test qua |

Theo yêu cầu, không chạy full suite, build web hay E2E. Các bước E2E `quest-flow`, `maps`, `store` chỉ được đọc, chưa chạy ở đâu.

## Critical

Không có. Nút dẫn đường không trả thưởng: `goThere` chỉ gửi `autowalk-to` hoặc `switchQuest`, còn `arriveBeside` chỉ đặt vị trí xuất phát. Bước quest vẫn qua server. Route trophy-room chỉ thêm `goTo`, và `goTo` được tính từ catalogue công khai (`metric.kind`, `metric.region`) cùng các id bé đã nhận, nên không lộ đáp án hay dữ liệu của người khác. Không có cổng khoá vùng nào bị vượt, vì vùng nào cũng mở qua bản đồ và `knowledge-gate` không phải vật cản.

## High

### H1. Trường mới `goTo` trong một `strictObject` làm app native đã phát hành không đọc được phòng truyền thống
- `packages/schema/src/trophy-room.ts:90-104`: `plaques[]` là `z.strictObject` và nay có thêm `goTo`. Client cũ parse bằng `schema.parse` (`apps/web/src/ui/api-client.ts:43`), nên gặp key lạ là ném lỗi.
- App Capacitor gói web vào trong (`apps/mobile/capacitor.config.ts`, `webDir: ../web/dist-native`), không tải lại từ server. Vì vậy khi server mới chạy, mọi bản app đã cài sẽ:
  - không mở được `TrophyRoomPanel` (hiện thông báo lỗi);
  - ở nhà, đọc trophy thất bại nên `setTrophies([])` (`play-screen.tsx:529-532`) và mọi kệ trong phòng truyền thống trống, dù bé đã có.
- Tab PWA đang mở lúc deploy cũng bị như vậy cho tới khi tải lại.
- Cách sửa (chọn một):
  - (a) Bỏ `goTo` khỏi `GET /trophies` và trả nó ở endpoint riêng, ví dụ `GET /trophies/next` → `{ plaques: [{ category, goTo }] }`. Client mới gọi thêm khi có `travel`.
  - (b) Nếu app chưa lên store, ghi rõ quyết định "chấp nhận lệch phiên bản" trong deployment guide, và về sau cho client parse response ở chế độ strip thay vì strict, để thêm trường không còn là thay đổi phá vỡ.

### H2. Phím Space (nhảy) bấm luôn nút đang giữ focus trong HUD: mở menu thì Space mở bảng Nhiệm vụ
- `apps/web/src/ui/hud/hud-menu.tsx:62`: khi mở menu, kể cả bằng chuột hay chạm, ô đầu tiên ("Nhiệm vụ") nhận focus. Menu chỉ đóng khi có `pointerdown`, không đóng khi bấm phím.
- `apps/web/src/game/player/input.ts:44-52`: game nghe `keydown` trên window và không `preventDefault`. Nút đang có focus vẫn nhận Space hoặc Enter như một cú bấm.
- Hệ quả trên desktop:
  - Mở ☰ rồi chơi bằng WASD và Space: cú nhảy đầu tiên vừa nhảy vừa mở quest board.
  - Esc đóng menu và trả focus về nút ☰ (`hud-menu.tsx:49`): lần Space sau mở lại menu, lần kế tiếp mở quest board.
  - Bấm chuột vào nhãn tương tác thì nhãn giữ focus, mỗi lần Space sau đó gửi thêm một `interact`. Lỗi này có từ trước, nhưng nay nhãn là đường tương tác chính.
- Cách sửa:
  - Chỉ chuyển focus vào ô đầu khi menu được mở bằng bàn phím (`event.detail === 0` trong `onClick`). Mở bằng pointer thì không chuyển focus.
  - Đóng menu khi có `keydown` của phím di chuyển hay Space ngoài sheet.
  - Sau khi bấm nhãn hoặc nút ☰ bằng pointer thì `blur()`, hoặc thêm `.hud-menu, .npc-label` vào `OWN_KEYS` cho Space.
  - Thêm test: mở menu bằng click, bấm Space, quest board không được mở.

### H3. "Đi tới" / "Đi đến" không làm gì trên cùng map khi bài của vùng đã xong hết
- `apps/web/src/ui/player/player-data.ts:82`: `questForRegion` trả bài đầu tiên của vùng kể cả khi bài đó đã `completed`. Đây là trường hợp thường gặp: bé học xong mọi bài ở rừng nhưng bộ sưu tập chưa đủ, hoặc cúp chưa có.
- `apps/web/src/ui/play/play-screen.tsx:575-585` với `questBound: true`: nếu là quest hiện tại thì gửi `autowalk-to {quest}`. Khi đó `game.ts` chỉ đi khi `hint?.available`, mà quest đã xong thì không có hint. Kết quả là panel đóng và không có gì xảy ra.
- Nếu là quest khác: `quest-pick` dựng lại map, `walkAfterPick` chờ `autowalkAvailable` không bao giờ tới rồi bỏ sau 4 s, vẫn không đi đâu.
- Sự kiện mà mọi quest đã `done` cũng bị như vậy (`nextEventQuest` trả `quests[0]`, `event-api.ts:57-58`).
- Sang map khác thì vẫn chạy, vì `arriveBeside = firstStepTarget`.
- Cách sửa: trong `goThere`, khi cùng map và (`trip.quest.state === 'completed'` hoặc `trip.quest.quest.id === questId` mà không có hint) thì gửi `autowalk-to { targetId: trip.target }`. Thêm test cho nhánh cùng map với quest đã xong.

## Medium

### M1. Nhãn chạm có thể nằm đè joystick, Chạy/Nhảy, nút ☰ và bản đồ nhỏ, và nuốt mất cú chạm
- `game.ts:1336` cùng `hud.tsx:192-202`: danh sách cần tránh chỉ có `hud-left` và `hud-right`. Mà `hud-right` nay chỉ là sheet của menu, nên lúc menu đóng thì box rỗng và không được tính.
- `.npc-label` có `z-index: var(--z-hud)` (4), cao hơn `#joystick` và `#actions` (3) trong `game.css`. Khi mục tiêu ở gần đáy màn, `clamp` kéo nhãn vào vùng của các điều khiển. Cú chạm Nhảy biến thành Tương tác, kéo joystick bị chặn.
- Trước đây nhãn không bị clamp và có nút Tương tác dự phòng. Nay nhãn là đường duy nhất trên cảm ứng.
- Cách sửa: `setPromptAvoid` thêm `#joystick`, `#actions`, `.hud-menu-toggle`, `.minimap`, `hud-rescue` và `hud-ride` (lúc hiện). Thêm một test `promptClearOfPanels` có box của joystick và actions ở đáy.

### M2. `arrival` bị bỏ lại khi `switchQuest` thoát sớm
- `play-screen.tsx:556` và `:584`: `switchQuest` `return` khi `next.quest.id === questId`, nhưng `goThere` vẫn đặt `arrival.current = {stage:'set'}`.
- Lần dựng lại game sau đó, không qua `switchQuest`, vẫn đọc `arriveBeside`. Ví dụ đổi đồ trong shop, lưu decor, hay `savedSpot` hoặc `trophyKeys` thay đổi. Bé bị dịch chuyển tới cạnh mục tiêu cũ.
- Hiếm (cần `regionMap(region)` khác vùng của quest hiện tại), nhưng là trạng thái treo không ai dọn.
- Cách sửa: `switchQuest` trả về `boolean` và chỉ đặt `arrival` khi đã đổi quest. Hoặc đặt `arrival` trước rồi để `switchQuest` không xoá khi gọi từ `goThere`.

### M3. Nhãn hiển thị không nằm trong tên truy cập (WCAG 2.5.3 Label in Name)
- `hud.tsx:74`: pill hiện tên quest và "0/11", nhưng `aria-label` là "Mở nhiệm vụ hiện tại". Trình đọc màn hình không đọc tên quest, và điều khiển bằng giọng nói theo chữ hiển thị không bấm được.
  - Sửa: bỏ `aria-label`, hoặc dùng `aria-label={`${title} ${done}/${total}, ${t('hud.openCurrent')}`}`.
- `go-there-button.tsx:32`: Sổ sưu tập hiện "Đi đến" nhưng tên là "Đi tới {map}" (test `collection-book.test.tsx` khẳng định đúng như vậy).
  - Sửa: `travel.goAria` nhận `{ word }` từ `label`, ví dụ "{word} {map}".

### M4. Huy hiệu sự kiện dẫn tới cổng, trong khi huy hiệu nhận từ bài thi thử
- Report trophy đã tự nêu ở mục 2. Nếu `reward.goal` là điểm bài thi (`EventGoal`), nút dẫn tới quest cổng, có thể đã xong (`nextEventQuest` trả `quests[0]`), và bé không nhận được huy hiệu ở đó.
- Cách sửa: `badgeTrip` đọc `reward.goal.kind`. Nếu là thi thử thì không có trip, hoặc mở thẳng màn thi. Cần người sở hữu chọn.

### M5. Bước E2E bấm `.npc-label`, một phần tử di chuyển mỗi frame, chưa chạy ở đâu
- `quest-flow.spec.ts:60,96`, `store-screens.spec.ts:62,70`, `screens.spec.ts:202,209,216,364`: Playwright chờ phần tử "stable" qua 2 frame. Nhãn được viết lại `transform` mỗi frame, và có thể nhảy giữa các vị trí ứng viên của `promptClearOfPanels`, nên có nguy cơ flaky hoặc click trúng phần tử khác.
- Chính report HUD nói `quest-flow`, `maps`, `store` chưa chạy local. Riêng `screens.spec.ts` (bước báo cáo người chơi) đã đổi sang `keyboard.press('KeyE')` vì cùng lý do này.
- Cách sửa: dùng `page.keyboard.press('KeyE')` cho các bước chỉ cần tương tác, và giữ một bước `.npc-label` để kiểm đường chạm. Chạy cả ba spec trên CI trước khi deploy.

## Low

- **L1. Logic sự kiện bị lặp:** `place-trips.ts:53-57` và `:89-93` cùng làm "event mở → `nextEventQuest` → tìm trong `src.quests` → `questTrip`". Gộp thành `eventTrip(event, src)`.
- **L2. Viết lại helper có sẵn:** `firstStepTarget` (`place-trips.ts:37`) lặp lại `stepTarget` trong `quest/quest-flow.ts:16`. Nên export `stepTarget` và dùng lại. Bước đầu là `search` (chỉ có `targets[]`) thì trả null và bé ra spawn; nên lấy `stepTargets(step)[0]`.
- **L3. Wrapper thừa:** `GoButton` (`trophy-room-panel.tsx`) chỉ bọc `GoThereButton` với `label="trophy.go"` và không bớt được độ phức tạp nào.
- **L4. Request thừa:** `TrophyRoomPanel` gọi `useLiveEvents()` (`trophy-room-panel.tsx:153`) cả khi không có `travel`. Hiện panel chỉ mở trong game nên chưa gây hại, nhưng `GET /events` chỉ nên gọi khi `travelling`.
- **L5. Nhãn rung:** `promptClearOfPanels` chọn ứng viên gần nhất ở mỗi frame. Với người chơi khác đang chạy cạnh mép panel, nhãn có thể nhảy qua lại giữa "dưới" và "phải". Có thể giữ hướng của frame trước khi vẫn còn hợp lệ.
- **L6. Dọn dẹp:** `hud.interact` vẫn còn trong locale và vẫn dùng làm nhãn cho người chơi ("Bông · Tương tác"). Không lỗi, chỉ ghi lại để không bị xoá nhầm.

## Đối chiếu yêu cầu

| Mục | Kết quả |
|---|---|
| Mọi hành động HUD cũ còn tới được | Có: Nhiệm vụ, Bản đồ, Ba lô, Bạn bè, Thú cưng, Bài hôm nay, Lái xe, Tạm dừng ở trong menu; Đánh hơi, Xuống xe, Quay lại ở trên màn; Tương tác qua nhãn hoặc E. Lưu ý M1 (nhãn có thể bị đè hoặc nuốt chạm). |
| Nhãn chạm đúng mục tiêu | Mỗi lúc chỉ có một nhãn (mục tiêu gần nhất), gửi `interact` và game chọn `promptTarget` ngay frame đó. Không có chồng nhãn. Người chơi đang chạy thì mục tiêu có thể đổi giữa lúc chạm và lúc xử lý; điều này có từ trước. |
| Bàn phím | E còn chạy; Enter trên nhãn chạy; Esc khi menu mở chỉ đóng menu (capture trên document chặn được listener trên window). Lỗi Space ở H2. |
| Đi sang map khác, teleport | Đúng vùng, đúng quest, `standBeside` đứng cạnh chứ không lọt vào trong vật, và URL `spawnAt` vẫn được ưu tiên. Vị trí đứng được lưu như lúc chơi thường. Lỗi M2. |
| Tự đi trên cùng map | Chạy khi quest còn mở; lỗi khi quest đã xong (H3). |
| Server không cấp thưởng, không lộ dữ liệu | Đạt. |
| Aria và vùng chạm 44 px | Nút ☰ 48 px, ô menu ≥ 4,5rem, pill 44 px, nhãn ≥ 44 px, nút "Đi tới" là `btn--sm` (44 px). Lỗi label-in-name ở M3. |
| E2E và `data-id` | Không còn chỗ nào dùng `hud-interact` hay `hud-top-right`; `hud-menu` vẫn được giữ, nay là một ô trong menu; thêm `hud-menu-toggle`. Rủi ro flaky ở M5. |
| Trùng lặp giữa trophy room và collection | Đã dùng chung `ui/travel/*` và `collectionTrip`; còn lặp nhỏ ở L1, L2. |

## Câu hỏi chưa giải quyết

1. App native đã có bản nào trên store hoặc TestFlight, hay ở máy tester, chưa? Câu trả lời quyết định H1 là chặn deploy hay chỉ cần ghi chú.
2. Huy hiệu Olympic nên mở bài thi thử hay giữ nút dẫn tới cổng (M4)?

Status: DONE_WITH_CONCERNS
Summary: Typecheck, lint và 47 test (web và server) đều xanh. Nút dẫn đường không cấp thưởng và không lộ dữ liệu. Có 3 lỗi High: thêm `goTo` vào `strictObject` làm client native cũ hỏng; Space bấm nút đang giữ focus trong menu và nhãn; "Đi tới" trên cùng map không làm gì khi bài của vùng đã xong.
Concerns: Chưa chạy E2E nào (`quest-flow`, `maps`, `store`, `screens`), và các bước click `.npc-label` có nguy cơ flaky. H1 tuỳ vào việc app native đã phát hành hay chưa.
