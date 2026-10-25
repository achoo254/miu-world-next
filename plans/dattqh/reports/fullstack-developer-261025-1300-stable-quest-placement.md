# Đặt mục tiêu quest ổn định theo từng quest, đổi tên mục tiêu, sinh lại 12 map

Ngày 25/10/2026. Chưa stage, chưa commit.

## 1. Thay đổi cách đặt mục tiêu

`tools/world/chapters/place-quest-targets.ts`
- Bỏ dòng số ngẫu nhiên chung `createRng(seed)` của cả map.
- Thêm `questStream(seed, ...parts)`, dùng `createRng(hashSeed('quest-targets:<seed>:<parts>'))` (helper sẵn có ở `packages/voxel/src/noise.ts`, cùng kiểu `outland:${seed}:${name}` của vùng ngoài).
  - Mỗi resident có dòng riêng: `resident:<id>`.
  - Mỗi quest có dòng riêng để chọn tâm các chỗ (place): `quest:<questId>`.
  - Mỗi mục tiêu có dòng riêng để chọn ô trong cụm và hướng mặt: `quest:<questId>:<targetId>`.
- `candidates`, `firstFreeAt`, `nearestFreeAt` nhận rng làm tham số. Thuật toán, khoảng cách và thứ tự giữ nguyên.
- Kết quả vẫn xác định. Đã chạy lại `world:school` và `world:thu-vien`: sha256 của `entities.json` và `regions/*.bin` trùng byte.

Test mới `tools/world/chapters/place-quest-targets.test.ts` (3 test):
- Cùng phần thì cùng dãy số; khác quest, khác seed hay khác mục tiêu thì khác dãy số.
- Cùng đầu vào cho ra cùng kết quả.
- Dùng quest thật của `cho-phien` trên một nền phẳng. Đổi mọi `places` của quest `main` đầu tiên có ≥ 2 chỗ (map có địa danh trùng tên mới) thì mục tiêu của quest đó dời đi, còn hơn 20 mục tiêu của các quest khác giữ nguyên vị trí và hướng mặt.
- Đã kiểm ngược: với code cũ, test này đỏ. Đổi tên mà không đổi số lần rút thì code cũ không dời gì, nên test cho tên mới trùng một địa danh, đúng như ca thật hôm 25/10.

Ràng buộc còn lại, có chủ đích, không do dòng số:
- Người giao nhiệm vụ phụ (side giver) được đặt sau cùng, tránh mọi mục tiêu đã đặt. Một mục tiêu của quest vừa đổi rơi vào chỗ của họ thì họ dời. Đã gặp ở `dao-bi-an`: `cua-cang-cap-cua` dời 9 khối.
- Dân làng và bạn đi cùng người giao nhiệm vụ (`village-life`, `sideFolk`) được đặt sau mục tiêu, tránh mục tiêu, nên có thể xê dịch quanh chỗ vừa đổi.
- Các resident tránh nhau theo thứ tự id, nên thêm hay bớt một resident có thể dời các resident đứng sau nó.

Lần sinh này dời hầu hết mục tiêu một lần, vì đổi sang dòng số mới. Từ nay, sửa một quest chỉ dời quest đó (và những gì kể ở trên).

## 2. Sửa generator do audit và test phát hiện

- `tools/world/zone-map.ts`: mục tiêu và người giao nhiệm vụ trước đây chỉ tránh cột tâm của prop (bán kính 1,5). Nay tránh thêm mọi cột mà prop chắn chiếm (`prop-cells.ts`).
  - Lỗi lộ ra ở `dao-bi-an`: `cua-cang-cap-cua` đứng trong `rock_largeA` (scale 5,39, tâm cách 3 khối). `world:quest-targets` báo 3 lỗi `covered`.
  - Không đổi `traversal` của vật nào.
- `tools/world/village-life.ts`: điểm nhìn `focus` mặc định (ô +z cạnh `work-a`) không được kiểm khoảng cách tới mục tiêu quest.
  - `generate-forest-map.test.ts` đỏ: `folk-reader-3` cách `tv2-t12-b21-bo-nhai` 4,47 < 5.
  - Nay chọn ô kề đầu tiên (+z, −z, +x, −x) đủ xa mục tiêu. Không rút thêm số ngẫu nhiên, nên dân làng khác không đổi.

## 3. Đổi tên mục tiêu (`content/world/targets.json`, giữ id)

| id | Tên cũ | Tên mới | Căn cứ trong quest |
|---|---|---|---|
| toan2-cd6-buu-anh-hue | Bưu ảnh Huế | Bưu ảnh sông Hương | b32: "ngồi thuyền ngắm sông Hương" |
| toan2-cd6-buu-anh-nam-can | Bưu ảnh Năm Căn | Bưu ảnh chợ nổi Năm Căn | b32: "Bưu ảnh chợ nổi" |
| toan2-cd6-buu-anh-mu-cang-chai | Bưu ảnh Mù Cang Chải | Bưu ảnh ruộng lúa Mù Cang Chải | b32: "ngắm lúa chín" |
| toan2-cd6-to-lich-thang-12 | Tờ lịch tháng 12 | Tờ lịch tháng 7 | b30 dùng tháng 7 và tháng 2 |
| toan2-cd6-to-lich-thang-5 | Tờ lịch tháng 5 | Tờ lịch tháng 12 | b31 dùng tháng 12 và tháng 11 |
| toan2-cd6-to-lich-thang-6 | Tờ lịch tháng 6 | Tờ lịch tháng 11 | b31 |
| tv2-t01-hoc-cay | Hốc cây | Hốc cây gạo | places "hốc cây gạo" |
| tv2-t01-bang-chu-cai | Bảng chữ cái | Bảng chữ cái ông Cua khắc | "Tấm bảng chữ cái ông Cua Đồng tự khắc" |
| tv2-t03-canh-cay-kho | Cành cây khô | Khúc gỗ trôi bên bến | tìm dọc "bãi sỏi bên bến" (look `log`) |
| tv2-t03-khom-co-dai | Khóm cỏ dại | Lùm cỏ ven bãi sỏi | như trên (look `bush`) |
| tv2-t12-banh-xe-le-go | Bánh xe lê-gô | Bánh xe khối xếp hình | quest gọi "khối xếp hình", bỏ thương hiệu |
| tv2-t12-khoi-do | Khối lê-gô đỏ | Khối xếp hình đỏ | như trên |
| tv2-t12-khoi-vang | Khối lê-gô vàng | Khối xếp hình vàng | như trên |
| tv2-t04-bong-bui-sim | Bóng ở bờ rào dâm bụt | Quả bóng đá lạc | quest tìm "ba quả bóng lạc trong lũy tre" (look soccer-ball) |
| tv2-t04-bong-goc-tre | Bóng ở gốc tre | Quả bóng rổ lạc | như trên (basketball) |
| tv2-t04-bong-ven-suoi | Bóng ven đầm sen | Quả bóng chuyền lạc | như trên (volleyball) |
| tv2-t08-sach-de-men | Sách Dế Mèn | Sách có chú ếch trên bìa | b15: "Bìa cuốn sách có chú ếch" |
| tv2-t08-sach-the-gioi-quanh-em | Sách Thế giới quanh em | Sách tranh bìa xanh | tên cũ không có trong quest (look blue-book) |
| tv2-t11-sach-nhim-nau | Sách Nhím Nâu | Cuốn truyện rùa con | b20: "Mang cuốn truyện…", truyện về rùa con |
| tv2-t13-cay-nuc-nac | Cây núc nác | Cây treo bản luật | places "cây treo bản luật" |

Cách quét: tìm mọi mục tiêu của quest `main` có tên không xuất hiện trong chữ của quest, rồi đọc bước dùng nó.
- Các tên chỉ màu hay đồ vật chung ("Bóng đỏ", "Vé màu cam", "Dây nhảy"…) vẫn hợp quest, nên giữ.
- Chữ "lớp" còn lại là lớp học (`meo-lop-truong`, "Cửa sổ lớp Chim Sẻ", "Thời khóa biểu lớp Sơn Ca"), không phải khối lớp. `content:check` cho qua.
- Không sửa `content/quests/*.json`.
- Có sửa một chú thích trang review (`apps/web/src/review/review-main.ts`, `tv2-t08-b15`) cho khớp tên sách mới.

## 4. Sinh lại map và kết quả audit

Đã chạy 12 lệnh `pnpm world:<map>` (đều exit 0), sau đó `assets:manifest`, `world:walk` cho 12 map, rồi các audit. Toàn bộ chuỗi chạy lại 3 lần, lần sau cùng là sau hai sửa ở mục 2. Mọi map chỉ đổi `entities.json`; `regions/*.bin` không đổi.

| Map | scenery-audit | room-audit | reach-audit | quest-targets |
|---|---|---|---|---|
| forest-ch1 | 0/0/0/0 | 8 roofed, 0 short | tới được hết, chỗ bắt đầu trống | sạch |
| lang-ven-song | 0/0/0/0 | 165, 0 short | sạch | sạch |
| nha-cua-be | 0/0/0/0 | 3, 0 short | sạch | sạch |
| trung-tam | 0/0/0/0 | 287, 0 short | sạch | sạch |
| truong-hoc | 0/0/0/0 | 252, 0 short | sạch | sạch |
| thu-vien | 0/0/0/0 | 545, 0 short | sạch | sạch |
| lau-dai | 0/0/0/0 | 366, 0 short | sạch | sạch |
| xom-mai-am | 0/0/0/0 | 177, 0 short | sạch | sạch |
| cho-phien | 0/0/0/0 | 350, 0 short | sạch | sạch |
| nong-trai | 0/0/0/0 | 93, 0 short | sạch | sạch |
| nui-tuyet | 0/0/0/0 | 67, 0 short | sạch | sạch |
| dao-bi-an | 0/0/0/0 | 13, 0 short | sạch | sạch (lần đầu 3 lỗi `covered`, đã sửa ở mục 2) |

(scenery: cây trên đường / đồ chắn giữa lối / nơi không cạnh đường / nơi tách khỏi mạng chỗ xuất hiện.)

Cảnh báo không chặn từ generator (chỗ của quest cách các chỗ khác < 10 khối):
- truong-hoc `tv2-t05-b09` "góc kể chuyện trong lớp": 4,5 khối.
- thu-vien `toan2-cd6-b30` "phòng lịch trên tháp": 7 khối.
- xom-mai-am `tv2-t14-b25` "vách tổ ong": 7 khối.

## 5. Test (mỗi file một lần, `--maxWorkers=1`)

| File | Kết quả |
|---|---|
| tools/world/zone-maps.test.ts | 50/50 (132 s) |
| tools/world/generate-forest-map.test.ts | 4/4 (98 s); trước khi sửa `village-life` thì 1 đỏ |
| tools/world/generate-school-map.test.ts | 5/5 |
| tools/world/generate-world-overview.test.ts | 4/4 |
| tools/world/chapters/place-quest-targets.test.ts (mới) | 3/3 |
| tools/world/{event-scenes, home-decor-map, mock-views, model-catalog, quest-target-audit, side-givers, walk-export, structures/path}.test.ts | 1, 34, 11, 2, 8, 6, 27, 2: đều qua |
| bot-brain/body.sim.test.ts | 1/1 |
| bot-brain/memory-restart.test.ts | 1/1 |
| bot-brain/learning.sim.test.ts | 1/1 |

Tỉ lệ kẹt của bot ở `body.sim` (truong-hoc, 10 bot, 10 phút): **4,61%**, ngưỡng 5%. Lưới đi của HEAD cho 2,04%.
- Số đo lấy từ một bản sao tạm của test có ghi số, đã xóa.
- Nguyên nhân: file `.bin` của lưới đi không đổi, chỉ `places` đổi. Chỗ đặt mới dồn nhiều mục tiêu sát rào phía tây và phía nam sân chơi (x≈327–331, z≈320–359).
- Bot đứng ngoài rào (cột x=319, dải z=316–318) nhìn thấy các chỗ đó và đi tới, nhưng bộ tìm đường cục bộ theo tầm nhìn không tìm được lối vòng, nên kẹt. Riêng `bot-th-6` kẹt 17 lần, tổng 123 s.
- Map không có lỗi: reach-audit và quest-targets xác nhận mọi mục tới được. Chưa vượt ngưỡng nên không đổi gì, nhưng biên độ còn rất mỏng.

`pnpm bots:learning` đã sinh lại `assets/generated/review/bots-learning.json`, rồi chạy `assets:manifest`:
- truong-hoc: biết 200/287 chỗ, kẹt 0,9% (HEAD 1,4%).
- trung-tam: biết 161/170 chỗ, kẹt 1,2% (HEAD 0,6%).
- forest-ch1: biết 125,3/221 chỗ, kẹt 0,5% (HEAD 0,6%).
- Bước đi sai: 0 ở cả ba map.

## 6. Gate

- `assets:check`: OK, 17 pack, 4.746 file.
- `content:check`: OK, 2.159 file; không có cảnh báo bỏ qua kiểm vân tay.
- `typecheck`: server và web đều Done, 0 lỗi.
- `lint`: exit 0, 0 cảnh báo.
- Không chạy full `pnpm test`, build web, E2E hay `perf`.

## File đổi

- Code: `tools/world/chapters/place-quest-targets.ts`, `tools/world/zone-map.ts`, `tools/world/village-life.ts`, `apps/web/src/review/review-main.ts` (1 dòng chú thích).
- Test mới: `tools/world/chapters/place-quest-targets.test.ts`.
- Dữ liệu: `content/world/targets.json`.
- Sinh ra: 12 `assets/generated/world/*/entities.json`, 12 `content/world/walk/*.json`, `assets/generated/review/bots-learning.json`, `assets/manifest.json`.

## Câu hỏi còn mở

- Tỉ lệ kẹt ở `body.sim` là 4,61%, sát ngưỡng 5%. Có nên sửa bộ chọn đích của bot (bỏ chỗ nhìn thấy nhưng đi vòng quá xa), hay chỉnh chỗ đặt quanh sân chơi trường học, trước khi thêm quest vào map trường?
- `toan2-cd6-b31`, bước `o-trong-thang-sau`: `goTo` ghi "Thỏ Tách Tách cầm tờ tháng 6", trong khi prompt nói tờ tháng 11. Đây là lỗi chữ của quest, chưa sửa vì nằm ngoài phạm vi.
- Trang review (`review-main.ts`, `propsCaption`) còn ghi "Toán bài N", "Tiếng Việt bài 15". Đây là trang cho người duyệt, không phải sản phẩm, nhưng có cụm "bài".
- Có nên sinh lại `pnpm world:overview` và `assets:home`? Ảnh toàn cảnh Home có thể đã lệch nhẹ vì mục tiêu và dân làng dời chỗ.

Status: DONE_WITH_CONCERNS
Summary: Mỗi resident, mỗi quest và mỗi mục tiêu có dòng số riêng, kèm test chứng minh đổi chỗ của một quest không dời quest khác. Đổi tên 20 mục tiêu, sinh lại 12 map; 48 audit, các test và 4 gate đều xanh.
Concerns: Tỉ lệ kẹt của bot ở trường học là 4,61%, sát ngưỡng 5%; lỗi chữ tháng 6/tháng 11 ở quest `toan2-cd6-b31`.
