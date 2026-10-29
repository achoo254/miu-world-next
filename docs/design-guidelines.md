# Hướng dẫn thiết kế

Nguồn: Master Plan v3 §2 (art direction, quy tắc bám mock), §10 (phong cách hiển thị). Mock ở `designs/`; danh sách màn hình theo mock ở `designs/mock-requirement-ui.md` và Master Plan §6.

## Bám mock

- Mock hiện tại (M1, M2, M3) là nguồn chuẩn cho **luồng màn hình, thông tin hiển thị, cơ chế chơi** — không phải cho hình dạng hay màu của nhân vật và môi trường (mock là render 3D mượt, game là voxel).
- Khi có mock voxel cho một màn hình, mock mới ghi đè mock cũ của màn đó; hai bên mâu thuẫn thì hỏi trước khi làm.
- Làm đúng luồng và chức năng trước, không khớp từng pixel.
- Mỗi màn hình ghi rõ bám mock nào, phiên bản nào (ví dụ `M3.2`).
- Màn NEW SCREEN phải theo visual language của ba mock hiện có.

## Art direction voxel (đề xuất, chờ mock voxel xác nhận)

- Thế giới, nhân vật, NPC, vật phẩm dựng từ khối; màu tươi, ánh sáng mềm, hợp trẻ em.
- Camera third-person; Home Base và World Map dùng chung một cảnh đảo nổi.
- HUD giữ cấu trúc M3.2: avatar + thanh XP, nhiệm vụ, bản đồ, ba lô, menu, joystick, nút Tương tác và Chạy.
- Một atlas + một material cho khối, flat shading, ánh sáng đơn giản (có thể bake AO vào đỉnh) — lựa chọn này ràng buộc bởi ngân sách hiệu năng, không chỉ thẩm mỹ.
- Bảng màu chung cho khối và asset tint: `content/palette.json` (đổi màu ở đây, không hardcode trong generator).

## Màu và token giao diện

- Hướng đã chọn cho các màn trước khi vào game: **A · Đảo mây kẹo hồng** (chọn ngày 30/09/2026 trong ba hướng mock). Nền trời xanh chuyển hồng, mây, đảo khối nổi; panel trắng bo tròn; nút chính hồng, nút phụ xanh dương. Hướng này bám sát visual language của M1–M3. Token vẫn là bản tạm cho tới khi có mock voxel (Master Plan task #4).
- Giao diện tách lớp khỏi logic, dùng design token và component chung để đổi diện mạo không phải viết lại chức năng.
- Token nằm ở `apps/web/src/ui/tokens.css`, là nơi duy nhất chứa giá trị màu. Muốn dùng giá trị mới thì thêm token trước. Cuối file có vài tên cũ (`--ink`, `--accent`, `--surface`…) giữ cho HUD của game (`apps/web/src/game/game.css`).
- `pnpm lint` chặn mã màu (hex, `rgb()`/`rgba()`/`hsl()`… ) viết ngoài `tokens.css` trong `apps/web/src/ui/` và `apps/web/src/seo/`: file CSS kiểm bằng `pnpm check:brand` (CLI `check-brand` của `@achoo254/brand`, cờ `--colour-dir`, `--token-file`), TS/TSX kiểm bằng ESLint (`eslint.config.js`). Ngoài phạm vi: runtime Three.js `apps/web/src/game/` (màu vật liệu và canvas viết trong code, cả `game.css`, `ride.css` của HUD game còn mã màu riêng), trang nội bộ `src/review/`, `src/preview/`, test và helper test. Màu tính từ token lúc chạy (pha hai token) thì ghi `eslint-disable-next-line` kèm lý do. Tên màu (`white`, `black`) chưa bị chặn, nhưng vẫn dùng token.
- Tên, mô tả, màu thanh trình duyệt, icon, bundle id app native, URL scheme, tenant chính và mẫu host nằm ở **một** file `brand.config.json` (gốc repo; `$schema` trỏ về schema trong gói), đọc qua gói dùng chung `@achoo254/brand` (repo `achoo254/shared-next`, cài theo tag git trong `package.json`; sửa mã thương hiệu ở đó, phát hành tag mới rồi nâng tag ở đây, không vá tại chỗ). UI và plugin Vite lấy `brand` từ `apps/web/src/brand.ts`; server (`moderation-mail.ts`) gọi `defineBrand` trên file JSON, bundle server nhúng sẵn file đó và không kéo Ajv. Danh sách logo và tùy chọn manifest của Miu ở `apps/web/brand-icons.ts`. Web manifest và `capacitor.json` sinh bằng `pnpm brand:gen` vào `apps/web/generated/` (test `apps/web/brand-icons.test.ts` báo đỏ nếu quên chạy); manifest trình duyệt tải do `apps/web/vite-app-icons.ts` dựng từ cùng tùy chọn. Desktop là web app cài được (PWA): không có Tauri, không có `appIds.desktop`. Màu `theme`/`background` của brand trùng `--color-sky-top`/`--color-sky-mid` (test giữ hai nơi bằng nhau). Ảnh logo vẫn do `pnpm assets:logo` render. `pnpm lint` chặn tên sản phẩm viết cứng thành nguyên một chuỗi hay nguyên chữ JSX trong code `apps/`, `packages/` (ngoài test); câu chữ có tên trong locale, văn bản pháp lý, trang HTML và `content/` là lời văn, không bị chặn. Tên file ảnh người chơi tải về (`miu-world*.png`) giữ nguyên.
- Component dùng chung nằm ở `apps/web/src/ui/kit/`: kiểu nút (`buttonClass`), icon, ảnh Miu, cảnh bầu trời (`SkyScene`), bàn phím số, thanh tiến độ, hộp thoại `Modal` (giữ focus bên trong, Esc để đóng, trả focus về chỗ cũ). Màn hệ thống (Menu trong game, Mất mạng, Đang tải, lớp phủ xoay ngang) ở `apps/web/src/ui/system/`. Class dùng chung nằm ở `apps/web/src/ui/styles.css`. Dựng màn mới từ đây trước khi viết style riêng.
- Icon và ảnh mà giao diện React hiển thị phải khai báo trong `apps/web/src/ui/kit/ui-art.ts`. Bản build chỉ chép các file có trong danh sách đó, và báo lỗi nếu file không có trong manifest.
- Tạo hình nhân vật theo mock voxel `designs/character.png` (người sở hữu chốt 2026-09-30; với nhân vật, mock này là chuẩn cả hình dạng lẫn màu): mèo trắng chibi đầu to, tai hồng, mắt to có đốm sáng, miệng cười, ria, má hồng, váy hồng nơ trắng. Bốn loài Mèo, Thỏ, Cáo, Gấu mở cho bé chọn từ 30/09/2026 (người sở hữu yêu cầu; Master Plan ghi MVP chỉ Mèo).
- Nhân vật luôn **ghép từ dữ liệu dùng chung, không làm riêng từng con** (người sở hữu yêu cầu 30/09/2026, để sau này sinh hàng trăm NPC và đổi trang phục hàng loạt):
  - Thân gốc (`content/character-bases.json`), thư viện bộ phận theo loại (`content/character-parts/<loại>.json`: tai, mắt, miệng, mõm, má, ria, đuôi), trang phục (`content/outfits/<id>.json`, có biến thể màu). Mọi bộ phận tô bằng **ô màu có tên**, không gắn màu cứng.
  - Loài (`content/species.json`) là công thức: chọn bộ phận (có thể dịch vài khối), bảng màu lông, trang phục mặc định. Mỗi loài phải khai đủ bộ ô màu chung (`SPECIES_SLOTS`), nhờ vậy loài nào cũng lắp được bộ phận và trang phục nào (test kiểm mọi tổ hợp).
  - Một nhân vật là một dòng trong `content/characters.json`: `recipe` gồm loài, trang phục (`id` hoặc `id:biến-thể`), màu ghi đè, nhãn. NPC mới cũng chỉ là một dòng như vậy.
  - Đổi trang phục hàng loạt cho sự kiện: tạo `content/outfit-rules.json` với các quy tắc `{ "tags": [...], "outfit": "..." }`; nhân vật mang đủ các nhãn của quy tắc đầu tiên khớp sẽ mặc trang phục đó (`resolveOutfit`), rồi build lại nhân vật. Nhãn (ví dụ giới tính của NPC) chỉ nằm trên dữ liệu nội dung; hồ sơ trẻ không lưu giới tính (muốn lưu thì là thay đổi thu thập dữ liệu trẻ, cần người sở hữu quyết).
  - Phụ kiện có 7 ô: `hat`, `glasses`, `scarf` (gắn đầu/thân), `back`, `wings` (sau lưng), `shoes` (một đôi: khai cho chân trái với `mirror: true`, chân phải tự lật), `hand` (gắn tay phải, cầm ở bàn tay, nghiêng bằng `rotation`). Mỗi ô ≥ 20 món mở từ Lv.1.
  - Hướng mở rộng đã chừa sẵn: tư thế cầm đồ (dùng các clip `holding-*` có sẵn trong rig cho ô `hand`), đi xe, lái máy bay (phương tiện là vật thể khối riêng, nhân vật gắn vào ghế và dùng clip `drive`/`sit` có sẵn; điều khiển thuộc runtime). Phong cách khối kiểu game sandbox, không dùng tên, texture hay asset của Minecraft.
- Ảnh Miu hiện lấy từ bộ render của trang review (`assets/generated/review/character/`), nền màu phẳng, không trong suốt. Vì vậy giao diện luôn đặt ảnh vào khung cùng màu nền, hoặc hòa màu bằng `multiply` lên nền tint. Khi có ảnh nhân vật riêng cho giao diện, đổi đường dẫn trong `ui-art.ts`.

## Font, icon, âm thanh

- Font tự host (OFL, có tiếng Việt): **Baloo 2** (700, 800) cho tiêu đề/HUD, **Nunito** (400, 700) cho nội dung; **Playwrite Việt Nam** (400, theo mẫu chữ viết tay tiểu học) cho chữ mẫu trên phiếu viết. Khai báo dùng chung ở `apps/web/src/ui/fonts.css`.
- Icon vật phẩm, tiền tệ, HUD, huy hiệu: Microsoft Fluent Emoji 3D (MIT); bỏ emoji dính thương hiệu.
- Khung, nút, banner: CSS + token, không dùng ảnh vẽ tay. Ảnh đại diện, thumbnail render từ model 3D bằng script.
- Số và chữ trên vật thể (viên đá số, thẻ chữ) vẽ lúc chạy bằng canvas texture.
- Âm thanh, VFX: pack Kenney (CC0). "Nghe lại" dùng Web Speech API.

## Chỉ chơi màn ngang

Người sở hữu chốt ngày 29/10/2026: giao diện game chỉ hỗ trợ màn hình ngang, không gian chơi rộng nhất có thể.

- Khoá ngang: app iPhone/iPad (`Info.plist`, chỉ LandscapeLeft/Right) và Android (`android:screenOrientation="sensorLandscape"`), PWA (`"orientation": "landscape"`, sinh từ `apps/web/brand-icons.ts` bằng `pnpm brand:gen`). Trên web, máy cảm ứng (`pointer: coarse`) cầm dọc ở màn game gặp lớp phủ toàn màn "Xoay ngang thiết bị để chơi" (`ui/system/rotate-overlay.tsx`), chặn mọi chạm tới khi xoay; khi trang ở fullscreen thì thử `screen.orientation.lock('landscape')` (trình duyệt từ chối thì bỏ qua). Máy tính dùng chuột không bao giờ bị chặn dù cửa sổ hẹp. Trang giới thiệu (khách chưa đăng nhập), chính sách, điều khoản, Quản lý tài khoản, phiếu viết và kiểm duyệt vẫn dùng được khi cầm dọc.
- Thiết kế cho mốc thấp nhất trước: điện thoại ngang 844 × 390 và 740 × 360, rồi iPad 1180 × 820 và máy tính. Truy vấn chung cho điện thoại ngang: `@media (orientation: landscape) and (max-height: 540px)`. Ở khổ này trang không cuộn dọc dài khi tránh được: menu và nút hành động dạt ra hai mép trái phải, giữa dành cho cảnh (đảo Home, bản đồ, game); phần dài (thẻ hôm nay, bảng nhiệm vụ) cuộn bên trong cột của nó. Bố cục xếp chồng một cột chỉ dùng khi màn đứng (`orientation: portrait`).
- Home ngang thấp: cài đặt và dock (2 cột) ở mép trái, đảo to nhất theo chiều cao ở giữa, huy hiệu, nút Chơi ngay và các thẻ hôm nay ở mép phải. Bản đồ: tiêu đề nằm giữa hàng đầu, cả đảo vừa màn dưới đó. Màn khu vực: biển tên, lời giới thiệu, rương bên trái; bảng nhiệm vụ bên phải tự cuộn.
- HUD trong game sát hai mép: huy hiệu và thẻ nhiệm vụ trên trái, nút menu và bản đồ nhỏ trên phải, cần điều khiển dưới trái, Chạy/Nhảy dưới phải; giữa màn trống.
- Vùng an toàn (tai thỏ, thanh home): chỉ nội dung bấm được né bằng `env(safe-area-inset-*)` (token `--safe-*`); nền, cảnh 3D, ảnh tràn full màn.
- Hộp thoại (`kit/modal.tsx`): rộng theo màn ngang (hộp `wide` tới 62rem ở điện thoại ngang), cao tối đa bằng màn trừ vùng an toàn, cuộn bên trong, nút ✕ ở góc luôn thấy khi cuộn; nội dung dài chia hai cột khi đủ rộng (menu trong game: nút quay lại và lối ra bên trái, cài đặt bên phải).

## Mở hộp thoại không dừng game

Game online nên thế giới luôn sống (người sở hữu, 29/10/2026). Mở menu, ba lô, cửa hàng, bảng, câu hỏi, minigame hay hộp thoại nào trong game đều không dừng vòng lặp: người chơi khác, bạn máy, NPC, thú cưng, sự kiện và đồng bộ mạng vẫn chạy. Chỉ điều khiển của bé bị giữ khi hộp thoại mở (phím đang giữ được thả, bé đứng yên; tự đi tới chỗ nhiệm vụ thì vẫn đi tiếp). Không phủ tối, không làm mờ cả màn: một lớp trong suốt vẫn nhận chạm bên cạnh hộp thoại để không lỡ điều khiển game, chỉ có bóng nhẹ ngay sau hộp thoại cho chữ dễ đọc. Màn "Tạm dừng" cũ nay là "Menu" (vẫn mở bằng Esc). Khi hộp thoại che game, cả khung hình (bước thế giới theo thời gian thật rồi vẽ) chạy tối đa khoảng 20 hình/giây thay vì theo màn hình (60), và trên máy vẽ chậm (máy yếu, trình duyệt CI vẽ bằng CPU) thì chờ gấp ba thời gian vẽ một khung trước khung sau, để việc vẽ không chiếm quá khoảng một phần ba thời gian; thế giới vẫn chuyển động đúng tốc độ, còn chạm, cuộn và chuyển cảnh của hộp thoại không phải chờ khung hình. Game chỉ dừng thật khi trang hoặc app bị ẩn. Thời gian chơi trong tuần và thời gian đi cùng thú cưng đếm khi game đang chạy, có hộp thoại hay không. Các lựa chọn này do Jev quyết theo chỉ đạo của người sở hữu.

## Trận đấu trùm: động tác chơi

- Mỗi câu của trùm trả lời bằng một động tác chơi (khai ở `move` của câu): **ném bùa** (kéo lùi bùa ở tay như ná rồi thả về phía tấm khiên có đáp án, thả thẳng lên khiên, hoặc chạm khiên), **chạm cầu** (các quả cầu đáp án lượn quanh trùm, một vòng 12 s, đặt ngón tay xuống là dừng), **kéo ngọc** (mang viên ngọc vào ô đáp án dưới chân trùm, hoặc chạm ô), **nạp chiêu** (chạm một đáp án ba lần, hoặc nút "Nạp chiêu", vòng sáng đầy thì tự bắn; không tụt theo thời gian). Không đồng hồ, không mất lượt.
- Mọi đích là nút thật: chạm, chuột và bàn phím (Tab, Enter) đều chọn được; ≥ 48 × 48 px (khiên, ô, chữ rune 108 px rộng, cầu 104 px), cách nhau ≥ 8 px; chữ đáp án xuống dòng, không cắt. Khiên, cầu, ngọc, bùa vẽ bằng CSS và token (`moves/moves.css`), không ảnh.
- Trận diễn trong thế giới đang chạy: thanh tên + HP ở trên, thẻ câu hỏi ở dưới (khoảng nửa màn hình dọc, một phần ba màn hình ngang), đích neo quanh trùm trong phần giữa; game ghi vị trí trùm vào phần tử neo, CSS kẹp trong vùng trống. Sai: đích lắc nhẹ, không đổi màu đỏ gắt; đúng: số HP trừ bay lên từ thanh.
- Bản nhẹ (`prefers-reduced-motion` hoặc `?quality=low`): cầu đứng yên, không vệt ngắm, số trừ chỉ hiện rồi mờ, camera nhảy thẳng, không rung. Chữ hướng dẫn động tác trung tính cho mọi lứa tuổi, xoay vòng không lặp liền.

## Hạn chế đã chấp nhận

Asset từ nhiều pack (Kenney, Fluent Emoji, KayKit sau này) có thể lệch phong cách và kém chi tiết hơn mock. Giảm bằng bảng màu chung, flat shading, UI thống nhất bằng token; stakeholder xác nhận chất lượng ở gate POC.
