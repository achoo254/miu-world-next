# Brief: Miu World chỉ chơi màn ngang

Người sở hữu (29/10/2026): giao diện game chỉ hỗ trợ màn hình ngang; iPad và điện thoại buộc phải xoay ngang. Mọi modal, popup hợp màn ngang. Menu và nút hành động dạt ra hai mép trái phải. Mục tiêu: không gian chơi rộng nhất có thể.

## Phạm vi

1. Khoá ngang
   - App Capacitor: iOS `Info.plist` (UISupportedInterfaceOrientations và ~ipad chỉ LandscapeLeft/Right), Android `AndroidManifest.xml` (`android:screenOrientation="sensorLandscape"`).
   - PWA manifest: `"orientation": "landscape"`.
   - Web trên thiết bị cảm ứng (pointer coarse) đang dọc: lớp phủ toàn màn "Xoay ngang thiết bị để chơi" (i18n vi/en, icon xoay), chặn tương tác; khi vào fullscreen thử `screen.orientation.lock('landscape')` (bỏ qua lỗi). Máy tính (chuột) không bị chặn dù cửa sổ hẹp.
2. Bố cục màn ngang, thiết kế cho mốc chiều cao thấp nhất: điện thoại ngang 844×390 / 740×360; rồi iPad 1180×820 và máy tính.
   - HUD trong game: nút menu, hành động (nhảy, chạy, tương tác), cần điều khiển, mini map, thẻ nhiệm vụ dạt sát hai mép (vùng an toàn tai thỏ theo `env(safe-area-inset-*)` — chỉ nội dung bấm né, nền tràn), giữa màn trống cho cảnh chơi; chữ/nút co theo chiều cao.
   - Home, Bản đồ, màn khu vực, chọn nhân vật/tạo nhân vật, cửa hàng, ba lô, sự kiện, Olympic, hộp thư, bạn bè, cài đặt: bố cục ngang (cột trái/phải), không cuộn dọc dài trên điện thoại ngang khi tránh được.
   - Modal/popup (kit/modal.tsx và các panel): panel rộng, `max-height: 100dvh` trừ vùng an toàn, cuộn bên trong, nút đóng luôn thấy; nội dung dài (câu hỏi, cửa hàng, phần thưởng) chia hai cột khi đủ rộng.
3. Test
   - `apps/web/e2e/screens.spec.ts`: khổ chụp đổi sang ngang 740×360 và 1180×820 (cập nhật `docs/screen-review.md`, trang review đọc `screens/<khổ>/`).
   - Các spec dùng viewport dọc (account-flow, bosses, perf, quest-mechanics, worksheets, touch helpers…): chuyển sang khổ ngang để lớp phủ xoay không chặn; unit test liên quan.
4. Tài liệu: `docs/design-guidelines.md` hoặc chỗ tương đương ghi luật màn ngang; `CLAUDE.md` nếu cần một dòng.

## Không làm

- Không đổi gameplay, nội dung học, server.
- Không hạ chất lượng cảnh 3D.

## Thêm (29/10/2026): mở modal không pause game

Game online nên thế giới luôn sống. Hiện `apps/web/src/ui/play/play-screen.tsx` gom mọi panel mở thành `covered` và truyền `paused={covered}` vào `GameView` → `game.stop()`; nền modal có scrim tối và `backdrop-filter: blur` (`apps/web/src/ui/kit/scene.css`).

- Mở modal/popup/panel (ba lô, cửa hàng, nhiệm vụ, bạn bè, đội, nấu ăn, thời khóa biểu, trang trí, cúp, menu online, hộp thoại NPC, câu hỏi, minigame overlay nếu không cần độc quyền màn) KHÔNG dừng vòng lặp game: cảnh vẫn vẽ, người chơi khác, bạn máy, NPC, thú cưng, sự kiện, đồng bộ mạng vẫn chạy.
- Chỉ chặn điều khiển của bé khi panel cần nhận phím/chạm (không để nhân vật tự đi khi đang gõ hay bấm trong panel); thả phím đang giữ khi panel mở.
- Bỏ hiệu ứng "pause": không blur, không phủ tối toàn màn; panel nằm trên game đang chạy (chỉ nền mờ nhẹ phía sau chính panel nếu cần cho chữ dễ đọc).
- Màn "Tạm dừng" (`system/pause-screen`) thành menu không dừng game (đổi tên hiển thị nếu cần, ví dụ "Menu"); giữ các lựa chọn trong đó.
- Thời gian chơi trong tuần (`usePlayTime`) và nhạc: xét lại để đếm/phát khi game chạy dù có panel; quyết định hợp lý, ghi lại.
- Chỉ dừng thật khi tab/app bị ẩn (visibilitychange) như hiện nay nếu có, để tiết kiệm pin.
- Test: cập nhật unit test và E2E đang dựa vào việc game dừng khi panel mở.

## Trạng thái (29/10/2026)

Hoàn thành phần tự động trên nhánh `feat/landscape-live`, chờ CI (test đầy đủ, build web, E2E), duyệt và deploy.

- Khoá ngang và lớp phủ xoay: `apps/web/src/platform/landscape.ts`, `apps/web/src/ui/system/rotate-overlay.tsx`, `Info.plist`, `AndroidManifest.xml`, `brand-icons.ts` → `generated/web.webmanifest.json`.
- Không dừng game: `Game.setControlsBlocked` thay `stop()`/`resume()`; game chỉ dừng khi trang/app ẩn; `PlayerInput.setBlocked`.
- Bố cục ngang: Home, Bản đồ, màn khu vực, Hành trình, Thành tích, tạo nhân vật, hộp thoại, menu trong game. HUD vốn đã dạt hai mép, giữ nguyên.
- Test: unit (`rotate-overlay.test.tsx`, `input.test.ts`, `play-screen.test.tsx`…); E2E và ảnh `screens`/`store-screens`/`perf`/`map-budget` chuyển sang khổ ngang.
- Tài liệu: `docs/design-guidelines.md` §Chỉ chơi màn ngang, §Mở hộp thoại không dừng game; `docs/screen-review.md`.

Quyết định do Jev chọn (`tools/decisions/jev-decide.py`, mức low):

| Câu hỏi | Lựa chọn | Độ tin |
|---|---|---|
| Thời gian chơi trong tuần | đếm khi game chạy, có hộp thoại hay không | 0,92 |
| Thời gian đi cùng thú cưng | đếm khi game chạy | 0,82 |
| Minigame | thế giới 3D vẫn chạy phía sau | 0,86 |
| Tên màn Tạm dừng | "Menu", nút đầu "Quay lại chơi" (Jev báo escalate, lấy lựa chọn xác suất cao nhất 0,67) | 0,34 |
| Đang tự đi khi mở hộp thoại | đi tiếp | 0,92 |
| Nền sau hộp thoại trong game | lớp trong suốt nhận chạm, chỉ bóng nhẹ sau hộp thoại | 0,86 |
| Phạm vi lớp phủ xoay | chỉ màn game và luồng đăng nhập vào game | 0,98 |

Còn lại: chụp lại bộ ảnh `screens` (740 × 360, 1180 × 820) và ảnh cửa hàng ứng dụng ở khổ ngang; thử trên máy thật (iPhone, iPad, Android).
