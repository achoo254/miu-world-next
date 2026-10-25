# HUD gọn kiểu Minecraft cảm ứng (25/10/2026)

Theo quyết định `jev-261025-1650-compact-hud.md`, cộng ba yêu cầu thêm của người sở hữu: bỏ nút Tương tác, sửa chồng lấn HUD tổ đội, Tạm dừng rộng trên máy lớn. Chỉ đổi bố cục; logic game giữ nguyên (game.ts chỉ đổi cách đặt nhãn).

## Trên màn: trước và sau

| | Trước (cả 360×740 và 820×1180) | Sau, 360×740 | Sau, 820×1180 và ≥ 1024 px |
|---|---|---|---|
| Trên trái | Thẻ người chơi (ảnh, tên, cấp, thanh XP, xu), thẻ nhiệm vụ mở sẵn (tiêu đề, chủ đề, bước, "Chạm để tự đi tới"), hàng "Bạn bè" + thú cưng, "Bài hôm nay", khung đội mở sẵn trên iPad | Chip người chơi (ảnh trong vòng XP, nhãn Lv, xu), thẻ nhiệm vụ một dòng "Khu rừng bí mật… 0/11"; khung đội thu thành chip mặt | Như phone, rộng hơn; khung đội cũng thu thành chip |
| Trên phải | Nhiệm vụ, Bản đồ, Ba lô, Menu (lưới 2×2 trên phone), bản đồ nhỏ | Một nút ☰ (badge số / chấm), bản đồ nhỏ dưới nó | Nút "☰ Menu" có chữ từ 1024 px, bản đồ nhỏ |
| Dưới trái | Joystick, "Lái xe"/"Xuống xe" | Joystick; "Xuống xe" chỉ khi đang lái | như phone |
| Dưới phải | Tương tác, Chạy, Nhảy | Chạy, Nhảy (không đổi cỡ: 68/80 px phone, 84/100 px iPad) | như phone |
| Số nút có chữ cùng lúc | khoảng 13 | 5 điều khiển (chip, thẻ, ☰, Chạy, Nhảy) + joystick, bản đồ nhỏ | như phone |

## Mỗi hành động chuyển đi đâu

| Hành động | Trước | Sau | `data-id` |
|---|---|---|---|
| Nhiệm vụ | nút trên phải | ô trong menu | `hud-quests` (giữ) |
| Bản đồ | nút trên phải | ô trong menu | `hud-map` (giữ) |
| Ba lô | nút trên phải | ô trong menu | `hud-backpack` (giữ) |
| Menu → Tạm dừng | nút "Menu" | ô "Tạm dừng · Cài đặt" trong menu; Esc vẫn mở thẳng | `hud-menu` (giữ, nay là ô); nút mở menu mới `hud-menu-toggle` |
| Bạn bè (+ số lời mời) | chip trên trái | ô trong menu, số lời mời cũng hiện trên nút ☰ | `hud-friends` (giữ), `hud-menu-badge` |
| Thú cưng | chip trên trái | ô trong menu | `hud-pet` (giữ) |
| Đánh hơi | cạnh thú cưng | vẫn trên màn (cột trái), chỉ khi dùng được | `hud-pet-sniff` (giữ) |
| Bài hôm nay | chip dưới thẻ nhiệm vụ | ô cả hàng trong menu, chấm trên nút ☰ khi có | `play-daily` (giữ), `hud-menu-dot` |
| Lái xe | nút dưới trái | ô trong menu | `hud-ride` (giữ) |
| Xuống xe | nút dưới trái | vẫn dưới trái, chỉ khi đang lái | `hud-ride` (giữ) |
| Tương tác | nút dưới phải | **bỏ**; chạm nhãn trên mục tiêu ("Vẹt · Nói chuyện"), Enter trên nhãn, hoặc phím E | `hud-interact` bỏ; nhãn `play-prompt-<target>` (giữ) |
| Quay lại (kẹt) | nút giữa dưới, khi kẹt | không đổi | `hud-rescue` |
| Thẻ nhiệm vụ / tự đi tới | mở sẵn, tự thu sau 12 s, tự mở ở bước mới | thu sẵn thành một dòng (tên + bước xong/tổng); chạm mở thẻ đủ (bước, chủ đề, "Chạm để tự đi tới"); tự thu sau 12 s, khi bước mới, hoặc nút ▲ | `hud-tracker-pill`, `hud-tracker` (giữ) |

Menu: mở/đóng bằng nút ☰ (`aria-expanded`), chạm ra ngoài, chọn một ô, hoặc Esc (Esc khi menu mở chỉ đóng menu, không mở Tạm dừng). Mở bằng bàn phím thì ô đầu nhận focus. Nút icon-only có `aria-label`, `title` (chuột), và nhãn hiện khi giữ ngón tay (giữ 450 ms chỉ hiện nhãn, không bấm). Mọi nút ≥ 44 px (ảnh đo: 0 nút nhỏ). Vùng an toàn: cột trái, nút menu, bản đồ nhỏ cộng `env(safe-area-inset-*)`; index.html chưa `viewport-fit=cover` nên trên Safari các inset là 0 (Safari tự chừa tai thỏ) — CSS sẵn sàng khi bật cover.

## Ba yêu cầu thêm

1. **Bỏ nút Tương tác.** Nhãn nổi trên mục tiêu là `<button>` thật (chạm, chuột, Enter/Space), tên truy cập là chữ của nó, vùng chạm tối thiểu 44 × 44 px, gửi đúng lệnh `interact` cho mục tiêu gần nhất như nút cũ; phím E giữ nguyên. Trước đây nhãn bị ẩn khi nằm dưới panel HUD (nút Tương tác là đường dự phòng); nay nhãn không bao giờ ẩn: `promptClearOfPanels` (`game/hud/prompt-placement.ts`, có test) dời nó tới chỗ gần nhất không đè panel và giữ trong màn. Mỗi mục tiêu quest có nhãn riêng: `pnpm content:check` (gồm audit `world:quest-targets`) xanh.
2. **HUD tổ đội chồng lấn.** Khung "Đội của bạn" mặc định thu thành chip mặt trên mọi màn (trước chỉ thu trên phone), chạm để mở, lựa chọn vẫn nhớ theo máy. Cột trái có trần chiều cao (chừa 16 rem đáy trên iPad/desktop, 12,5 rem trên phone, cho joystick và "Xuống xe") và chừa cột phải (nút menu + bản đồ nhỏ); dài hơn thì cuộn, không chạy xuống dưới các nút. Nút của thẻ "Cả đội chơi «…»" thành pill, chữ một dòng, xuống hàng khi hẹp. "Lái xe" vào menu, "Xuống xe" chỉ khi lái nên không còn đè thẻ. Dòng chat của người khác ("Đội · Miu: …") khi có hộp thoại mở thì nằm dưới lớp mờ của hộp thoại, ở đáy, không đè hộp thoại (`Toast behind`). Chưa làm "chồng nhiều dòng": store chỉ giữ một dòng, dòng mới thay dòng cũ như trước.
3. **Tạm dừng rộng.** Hộp thoại cỡ `wide` (52 rem); từ 720 px cài đặt chia hai cột cân (âm thanh + nhạc nền chiếm cả hàng, chữ một dòng), hành động thành lưới; phone vẫn một cột. Vẫn mở từ ô "Tạm dừng · Cài đặt" trong menu và từ Esc; mọi mục giữ nguyên.

## File thay đổi (của việc này)

- Mới: `apps/web/src/ui/hud/hud-menu.tsx`, `hud-menu.css`, `use-hold-hint.ts`, `hud-menu.test.tsx`; `apps/web/src/ui/system/pause-screen.css`.
- HUD: `ui/hud/hud.tsx`, `hud.css`, `ride-button.tsx`, `quest-tracker.test.tsx`, `ride-button.test.tsx`.
- Dùng chung (sửa tối thiểu): `ui/play/play-screen.tsx` (khối `<Hud>`: truyền mục menu, badge, nút Đánh hơi; một dòng `friendAsks`; chú thích nhãn), `ui/play/play-screen.test.tsx` (chỉ test Tạm dừng: mở menu trước), `ui/i18n/locales/vi.json` + `en.json` (3 khóa `hud.menuNews`, `hud.menuFresh`, `hud.settings`), `game/game.ts` (đặt nhãn: dời khỏi panel thay vì ẩn; import), `game/game.css` (vị trí bản đồ nhỏ dưới một nút menu, safe-area trên), `ui/styles.css` (`.npc-label` ≥ 44 px, focus).
- Khác: `ui/player/player-badge.tsx` + `player.css` (biến thể `compact`), `ui/pet-care/pet-hud.tsx` (tách `PetSniffButton`), `pet-care.css`, `pet-hud.test.tsx`, `ui/online/social-layer.tsx` (đội thu mặc định; dòng chat `behind`), `online.test.tsx`, `ui/coop/coop.css`, `ui/kit/toast.tsx` + `toast.css` (tùy chọn `behind`), `ui/system/pause-screen.tsx`, `ui/home/home-screens.test.tsx`, `game/hud/prompt-placement.ts` + test, `review/review-main.ts` (tên 3 màn mới), `docs/screen-review.md`.
- E2E: `e2e/quest-api.ts` (`openQuestCard`, `openHudMenu`), `quest-flow.spec.ts`, `maps.spec.ts`, `store-screens.spec.ts`, `screens.spec.ts` (bỏ `hud-interact` → `.npc-label` / phím E; mở thẻ/menu trước khi đọc; màn mới `28-play-menu`, `29-pause`, `30-party-quest`; `MIU_SCREENS_SIZES` cho khổ khác), `layout.ts`.
- Không đụng phòng truyền thống, bộ sưu tập, ba lô (của agent khác). `play-screen.tsx`, `play-screen.test.tsx`, `game.ts`, locales đang có thay đổi dở của agent kia; phần của tôi nằm ở khối khác.

## Kiểm tra (local, 1 worker)

| Lệnh | Kết quả |
|---|---|
| `pnpm assets:check` | OK — 17 packs, 4753 files |
| `pnpm content:check` | OK — 2159 files (12 big bosses, 42 zone guardians, audit mục tiêu quest xanh) |
| `pnpm typecheck` | 0 lỗi (root + mobile, server, web) |
| `pnpm lint` | 0 lỗi, 0 cảnh báo; check-brand OK |
| `pnpm vitest run` các thư mục đã chạm (`ui/hud, home, play, player, pet-care, online, voice, coop, system, kit, friends, i18n, account`, `game`, `review`) `--maxWorkers=1` | 75 file, 596 test xanh |
| `pnpm --filter @miu/web e2e --project setup --project screens --workers=1` (`MIU_SCREENS_SIZES=360x740,820x1180,1600x1000`) | 4/4 xanh, 121 s; 30/30 màn `ok` mỗi khổ; 0 chồng lấn, 0 nút < 44 px ở cả hai khổ duyệt |

Không chạy local: `quest-flow`, `maps`, `store` (E2E đã sửa selector, chờ CI), build web (CI), full `pnpm test`.

## Ảnh

Sau (đã ghi đè vào repo, manifest sinh lại bằng `pnpm assets:manifest`; ảnh chụp từ cây có code dở của agent khác — `shots.json` ghi `uncommitted` 71–72 file — nên **không** dùng cho duyệt trước deploy, `review.json` chưa cập nhật):

- `assets/generated/review/screens/360x740/` và `820x1180/`: `07-play-hud.png` (HUD gọn), `08-play-prompt.png` (nhãn chạm "Vẹt · Nói chuyện"), `28-play-menu.png` (menu mở), `29-pause.png`, `17-pet-care.png`, `18-party.png` (đội thu thành chip), `30-party-quest.png` (đội mở + thẻ chơi cả đội, không chồng).
- Desktop 1600×1000 (ngoài repo): `C:\Users\HOANDA~1\AppData\Local\Temp\claude\D--CONG-VIEC-hoandat-app\ba618f7f-aaff-4531-8965-fba388d2c406\scratchpad\after-1600x1000\` (cùng tên file).

Trước (bản ở HEAD, chép ra ngoài): `C:\Users\HOANDA~1\AppData\Local\Temp\claude\D--CONG-VIEC-hoandat-app\ba618f7f-aaff-4531-8965-fba388d2c406\scratchpad\before\` — `360x740-` và `820x1180-` × `07-play-hud`, `08-play-prompt`, `17-pet-care`, `18-party`. Không có ảnh "trước" ở 1600×1000 (cần build bản cũ); ảnh chụp của người sở hữu ở ~1690×1270 là bản trước.

## Còn lại

- Ảnh desktop `30-party-quest`: nhãn "Bông · Tương tác" của người chơi kia nằm đè bóng thoại "Hôm nay đi đâu nhỉ?" của chính người đó (bóng thoại do game vẽ, không trong danh sách tránh). Có từ trước; chưa sửa.
- "Chồng các dòng chat": hiện vẫn một dòng một lúc; xếp chồng nhiều dòng cần đổi `social-store` (ngoài phạm vi bố cục).
- Trên phone, khi khung đội mở và có thẻ cả đội, cột trái cuộn; nút của thẻ cả đội phải cuộn mới thấy (ảnh `360x740/30-party-quest.png`).
