# Miu World — hồ sơ App Store (bản nháp)

Bản nháp để dán vào App Store Connect, soạn ngày 27/10/2026 từ code (`HEAD` `1f335ce` cộng quyết định bỏ PIN tài khoản 27/10/2026, bản web trong `apps/mobile/ios/App/App/public` dựng 27/10 08:36), trang chính sách đang chạy và các URL đã kiểm bằng `curl` cùng ngày. Hồ sơ đầy đủ cho cả Google Play, các việc còn chặn và căn cứ từng câu trả lời: [`listing.md`](listing.md); cách chụp ảnh: [`README.md`](README.md). Ngôn ngữ chính của trang App Store: **Tiếng Việt**; thêm bản **English (U.S.)** bằng các dòng tiếng Anh dưới đây.

Số trong ngoặc là số ký tự Unicode (App Store Connect đếm như vậy); với từ khoá ghi thêm số byte UTF-8 vì giới hạn 100 được tính chặt theo byte ở đây.

**Khác với `listing.md` (23/10):** người sở hữu chốt danh mục chính **Education** (không phải Games) và tuổi **4+** (bạo lực hoạt hình trả lời None); bản tiếng Anh sửa câu "The game's text is in Vietnamese" vì giao diện có tiếng Anh và song ngữ (`docs/i18n.md`), chỉ bài học là tiếng Việt.

## Thông tin app

| Trường | Giá trị |
|---|---|
| Bundle ID | `com.hoandat.miu` (`apps/mobile/ios/App/App.xcodeproj/project.pbxproj`, `brand.config.json`) |
| SKU | `miu-ios` |
| Tên (≤ 30) | `Miu World` (9) · EN: `Miu World` (9) |
| Phụ đề (≤ 30) | `Phiêu lưu 3D, vừa chơi vừa học` (30) · EN: `3D adventure, learn by playing` (30) |
| Danh mục chính / phụ | **Education** / **Games** (subcategory Games: Educational, Adventure — nếu App Store Connect cho chọn khi Games là danh mục phụ) |
| Kids Category | **Không** (quyết định của người sở hữu). Hệ quả Guideline 1.3: metadata không dùng "For Kids", "For Children", "cho bé", "dành cho trẻ em" — các đoạn dưới đây đã tránh |
| URL hỗ trợ | `https://miu.hoandat.com/privacy` — 200 ngày 27/10; trang công khai, mục "Liên hệ" có email hỗ trợ (đã có trong bundle production). Trang không có neo `#contact` (mục chỉ có `data-id`). Phương án khác, cũng 200: `https://github.com/achoo254/miu-world-next/issues` |
| URL chính sách quyền riêng tư | `https://miu.hoandat.com/privacy` — 200 ngày 27/10 (SPA: mọi đường dẫn đều 200; đã kiểm bundle production có nội dung chính sách) |
| URL marketing (tuỳ chọn) | `https://miu.hoandat.com/` — 200 |
| URL điều khoản (EULA tuỳ chỉnh, không bắt buộc) | `https://miu.hoandat.com/terms` — bundle production có tiêu đề "Điều khoản sử dụng Miu World". Không phải EULA: để Apple dùng EULA chuẩn |
| Bản quyền | `2026 hoandat` |
| Giá | Miễn phí, không mua trong app (không StoreKit, không link thanh toán; cửa hàng trong game chỉ dùng Xu kiếm được khi chơi) |
| Thiết bị | iPhone và iPad (`TARGETED_DEVICE_FAMILY = "1,2"`), iOS **15.0** trở lên (`IPHONEOS_DEPLOYMENT_TARGET = 15.0`), dọc và ngang |
| Phiên bản | `1.0.0` (build `1`) |
| Export compliance | Exempt: `Info.plist` có `ITSAppUsesNonExemptEncryption = NO` (chỉ HTTPS/WSS chuẩn) |

### Văn bản quảng bá (≤ 170)

VI (149): `Mười hai vùng đất khối 3D để khám phá, mỗi nhiệm vụ luyện một chủ đề Toán hoặc Tiếng Việt. Chơi một mình hoặc cùng bạn bè. Miễn phí, không quảng cáo.`

EN (128): `Twelve 3D block lands to explore, and every quest practises a Math or Vietnamese topic. Play solo or with friends. Free, no ads.`

### Mô tả (≤ 4000)

VI (1733):

```
Miu World là trò chơi phiêu lưu trong thế giới khối 3D, nơi kiến thức là chìa khóa mở đường. Mỗi nhiệm vụ luyện một chủ đề Toán hoặc Tiếng Việt, viết riêng cho game: giải câu đố của cây cổ thụ, đếm táo cho bạn Hải ly, đọc thư tìm manh mối, vượt suối bằng những phép tính.

KHÁM PHÁ
• Mười hai khu vực: Khu rừng bí mật, Trường học, Thư viện, Làng ven sông, Chợ phiên, Nông trại, Lâu đài, Núi tuyết, Đảo bí ẩn… nối với nhau qua Trung tâm.
• Ngôi nhà riêng để trang trí, thú cưng để chăm sóc, đồ vật và trang phục để sưu tầm.
• Hơn 300 trò chơi nhỏ, mỗi lượt 30–90 giây, chơi cùng dân làng trên các bản đồ.

HỌC MÀ NHƯ CHƠI
• Câu hỏi đi theo chủ đề và mục tiêu học, có Hướng dẫn, Gợi ý và Đáp án kèm giải thích; xem đáp án không bị khóa tiến trình.
• Nghe đọc to, luyện nói, thử thách cùng trùm khu vực, sự kiện Olympic Toán.
• Phần thưởng do máy chủ tính: điểm kinh nghiệm, Xu, kỹ năng, sổ sưu tập.

CHƠI CÙNG BẠN BÈ
• Gặp các bạn ở Trung tâm, kết bạn, lập tổ đội và chơi nhiệm vụ co-op.
• Không có ô chat tự gõ: chỉ câu có sẵn và vẫy tay. Nói chuyện bằng giọng chỉ với bạn bè và tổ đội, không ghi âm, không lưu.
• Chặn và báo cáo người chơi ngay trong game; có người kiểm duyệt xem xét.

AN TÂM CHO GIA ĐÌNH
• Miễn phí, không quảng cáo, không mua trong app, không theo dõi.
• Không thu tên thật, tuổi hay ảnh; tên người chơi chọn từ danh sách.
• Một tài khoản có tối đa ba người chơi cho máy dùng chung.
• Chủ tài khoản tắt được chơi online và nói chuyện bằng giọng cho từng người chơi.
• Tải về hoặc xóa toàn bộ dữ liệu bất cứ lúc nào trong mục Quản lý tài khoản.

Giao diện và lời thoại bằng tiếng Việt, tiếng Anh hoặc song ngữ; bài học bằng tiếng Việt. Cần kết nối mạng để chơi và lưu tiến độ. Đăng nhập bằng tài khoản hoandat.com.
```

EN (1765):

```
Miu World is an adventure in a 3D block world where knowledge opens the way. Every quest practises one Math or Vietnamese-language topic, written for the game: solve the old tree's riddle, count apples for the beaver, read letters for clues, cross the stream with sums.

EXPLORE
• Twelve areas — the Secret Forest, the School, the Library, the Riverside Village, the Market, the Farm, the Castle, the Snowy Mountain, the Mystery Island and more — linked through the Centre.
• Your own house to decorate, a pet to look after, items and outfits to collect.
• More than 300 mini-games of 30 to 90 seconds, played with villagers across the maps.

LEARN BY PLAYING
• Questions follow learning topics and objectives, with Guide, Hint and Answer-with-explanation; seeing the answer never blocks progress.
• Read-aloud, speaking practice, zone guardian duels and a Math Olympiad event.
• Rewards are worked out by the server: XP, coins, skills and a collection book.

PLAY WITH FRIENDS
• Meet others in the Centre, add friends, form a party and play co-op quests.
• No free-text chat: only ready-made phrases and waves. Voice chat only with friends and party members, never recorded or stored.
• Block and report players in the game; moderators review reports.

PEACE OF MIND
• Free, no ads, no in-app purchases, no tracking.
• No real names, ages or photos; player names are picked from a list.
• Up to three players per account for shared devices.
• The account owner can turn online play and voice chat off for each player.
• Download or delete all your data at any time from account management.

Menus and dialogue in Vietnamese, English or both; lessons are in Vietnamese. An internet connection is needed to play and save progress. Sign in with a hoandat.com account.
```

Căn cứ: 12 khu vực `content/world/regions.json` (gồm Trung tâm và Nhà); 308 minigame `content/minigames/*.json` + `apps/web/src/ui/minigame/games/*`, 30–90 giây theo `docs/minigames.md`; tối đa 3 người chơi `MAX_PLAYERS` ở `apps/server/src/player/player-routes.ts`; Hải ly `content/quests/side-egg-catch.json`, cây cổ thụ `content/quests/forest-ch1.json`; trùm khu vực `content/quests/ward-*`; luyện nói `apps/web/src/ui/challenge/mechanics/speak-step.tsx`; Olympic `content/events/olympic-math-2026.json`; ba chế độ ngôn ngữ `PlayerLanguage` ở `packages/schema/src/account.ts`.

### Từ khoá (≤ 100, ngăn bằng dấu phẩy, không khoảng trắng sau dấu phẩy, không lặp tên app)

VI (71 ký tự, 96 byte): `toán,tiếng việt,ôn tập,học toán,phiêu lưu,thế giới khối,giáo dục,đố vui`

EN (88 ký tự, 88 byte): `math,vietnamese,learning,adventure,voxel,block world,quiz,education,lessons,3d,minigames`

Không dùng tên game khác (Minecraft), tên nhà xuất bản, tên sách giáo khoa hay "kids"/"trẻ em".

## Phân loại độ tuổi (Age Rating)

Kết quả mong muốn (người sở hữu chốt): **4+**. Trả lời bảng câu hỏi (bản 2025):

| Câu hỏi | Trả lời | Căn cứ |
|---|---|---|
| Parental Controls | No | Không còn PIN tài khoản (người sở hữu chốt 27/10/2026, `.claude/rules/product-audience.md`): công tắc "Chơi online", "Nói chuyện bằng giọng" cho từng người chơi vẫn có và máy chủ thi hành, nhưng ai cầm máy cũng đổi được, nên không khai là kiểm soát của phụ huynh |
| Age Assurance | No | Không hỏi tuổi |
| Unrestricted Web Access | No | Không có trình duyệt trong app; trang đăng nhập mở trong `ASWebAuthenticationSession`; link ngoài duy nhất mở Safari |
| User-Generated Content | Yes | Giọng nói với bạn bè/tổ đội; thời khoá biểu tự gõ chỉ chính người chơi xem; tên và câu nói chọn từ danh sách |
| Messaging and Chat | Yes | Câu có sẵn với người cùng phòng; nói chuyện bằng giọng chỉ với bạn bè và tổ đội |
| Social Media | No | Không bảng tin, không hồ sơ công khai |
| Advertising | No | |
| Cartoon or Fantasy Violence | None | Quyết định của người sở hữu để ra 4+: đấu trùm khu vực là trả lời câu hỏi (khiên, quả cầu, trùm loạng choạng), không đánh, không máu, không vũ khí. `listing.md` từng chọn Infrequent (→ 9+) |
| Realistic Violence, Prolonged Violence, Guns, Horror/Fear, Profanity, Mature/Suggestive, Sexual Content, Nudity, Alcohol/Tobacco/Drugs, Medical/Treatment, Health or Wellness | None | |
| Contests | Infrequent | Sự kiện Olympic Toán có huy chương (không tiền, không giải thật) |
| Gambling, Simulated Gambling, Loot Boxes | None / No | Phần thưởng cố định do máy chủ tính; không quay ngẫu nhiên, không mua |
| Made for Kids | No | Không vào Kids Category |

Sau khi trả lời, kiểm ô kết quả App Store Connect hiện **4+**. Nếu hiện cao hơn, thứ đẩy lên thường là Contests hoặc nhóm UGC/Messaging: báo người sở hữu, không sửa câu trả lời cho sai sự thật.

## App Privacy ("nhãn dinh dưỡng")

Khớp `content/legal/privacy-vi.json` (trang `/privacy`) và máy chủ `apps/server`. **Theo dõi (Tracking): No** cho mọi loại. Mọi loại dưới đây: thu thập = Yes, liên kết với danh tính = **Yes**, dùng để theo dõi = **No**, mục đích = **App Functionality**.

| Nhóm App Store Connect | Loại | Ghi chú |
|---|---|---|
| Contact Info | Email Address | Email đã xác minh của chủ tài khoản, nhận từ auth.hoandat.com (`parents.email`) |
| Identifiers | User ID | Mã tài khoản auth.hoandat.com (`parent_idp_links`); mã Google cũ của tài khoản trước 23/10/2026 |
| Usage Data | Product Interaction | Thời gian chơi theo tuần, thư đã đọc, cài đặt (bạn máy, công tắc online/giọng nói, lúc xác nhận lời nhắc an toàn) |
| User Content | Gameplay Content | Nhiệm vụ, sao, XP, đồ vật, nhân vật, trang trí nhà, chỗ đứng cuối trên map, bạn bè, chặn, báo cáo (lý do chọn sẵn) |
| User Content | Other User Content | Thời khoá biểu, lịch đồng phục tự gõ (tuỳ chọn, chỉ chính người chơi xem) |

Không thu: Name (tên hiển thị và tên nhân vật chọn từ danh sách, không phải tên thật), tuổi, ảnh, Audio Data (ghi âm luyện nói chỉ ở trên máy và xoá khi đóng bài; giọng nói đi thẳng giữa các máy qua WebRTC, máy chủ Miu không nhận), Location, Contacts, Health, Financial, Purchases, Browsing/Search History, Sensitive Info, Diagnostics, Device ID, Advertising Data.

Analytics trong app: **không có**. Bundle iOS không chứa SDK analytics, quảng cáo hay crash reporting (chỉ Capacitor 8.5.3, `@capacitor/app`, `@capacitor-community/keep-awake`, `@aparajita/capacitor-secure-storage`, `@shared-next/capacitor-system-auth` — `apps/mobile/ios/App/CapApp-SPM/Package.swift`); `index.html` của app không có beacon Cloudflare Web Analytics (chỉ bản web có). Máy chủ không gửi tới GA4 sự kiện nào của phiên app (`session.kind === 'native'`, `apps/server/src/analytics/analytics-session.ts`, có test); chỉ có số tổng người chơi online cao nhất mỗi giờ, không kèm mã nào.

Dữ liệu trẻ em: trẻ không tự đăng nhập, chơi bằng người chơi phụ trong tài khoản người lớn (tối đa 3 người chơi); không thu tên thật, tuổi, ảnh, giọng nói hay vị trí; người khác cùng map chỉ thấy tên nhân vật, trang phục, thú cưng và câu chọn sẵn; chủ tài khoản tải về (JSON) hoặc xoá toàn bộ dữ liệu trong app; bản sao lưu tự xoá sau tối đa 14 ngày.

## Ghi chú cho App Review

Dán vào **App Review Information → Notes** (tiếng Anh). Trên trang đăng nhập auth.hoandat.com ngày 27/10 (đi qua `https://miu.hoandat.com/api/auth/start`) có: **Sign in with Google**, **Sign in with GitHub**, **App reviewer sign-in** — **chưa có Sign in with Apple** (xem Rủi ro). Dòng trong `[…]` chỉ giữ khi nút Apple đã hiện trên trang đó.

```
Miu World is a free 3D learning adventure (Math and Vietnamese-language lessons written for the game). No ads, no in-app purchases, no analytics or tracking SDK.

SIGN-IN
- Tap "Đăng nhập" (Sign in). The app opens our own account service, auth.hoandat.com, in the system browser (ASWebAuthenticationSession), never in a web view.
- Demo account: on the auth.hoandat.com page tap "App reviewer sign-in" below the provider buttons and enter the email and password from the Sign-In Information fields. This reviewer-only sign-in is on for the review period only and needs no second device.
[- You can also tap "Sign in with Apple" and use any Apple ID; a new empty account is created.]
- The reviewer account is its own empty Miu account, never linked to any other account.

FIRST RUN (ADULT AND CHILD)
- An adult signs in and accepts the privacy notice ("Tôi đồng ý"); the signed-in adult is the main player. Children do not sign in: the adult can add up to two extra players for a shared device in account management.
- Pick a character; the game starts on the home island.

PLAYER SWITCHES
- Settings (gear) -> "Quản lý tài khoản" (Account) -> a player card -> "Chơi online" tab: switches for online play and voice chat for that player, enforced by our server (when off, the player plays alone and meets no one).

ACCOUNT DELETION (5.1.1(v))
- In the app: Settings (gear) -> "Quản lý tài khoản" -> "Xóa tài khoản" (Delete account) -> "Xóa hẳn tài khoản" (Delete permanently). Deletion is immediate and removes every player, all progress and every session; backups expire within 14 days.
- The shared sign-in account at auth.hoandat.com is deleted separately at https://auth.hoandat.com/account.

ONLINE FEATURES
- Players in the same area see each other. There is no free-text chat: only ready-made phrases and waves.
- Voice chat (microphone button) works only with friends or party members; nothing is recorded or stored. A "stay safe online" reminder is shown before a player's first voice chat. The microphone is also used for the optional speaking practice, whose recording never leaves the device.
- Report or block: tap another player -> "Báo cáo" (Report) or "Chặn" (Block). Reports go to a queue reviewed by our moderators.

LANGUAGE
- Menus and dialogue can be Vietnamese, English or bilingual (Settings -> Language); lessons are in Vietnamese.

Privacy policy: https://miu.hoandat.com/privacy (also linked on the sign-in page and in account management). Contact: the email on that page.
```

**Tài khoản người duyệt (không bao giờ ghi vào repo):** email và mật khẩu lấy từ tệp credential (mục `apple-app-review-demo`), chỉ nhập vào ô **Sign-In Information**. Trước khi gửi: kiểm link "App reviewer sign-in" còn hiện (auth-next ADR 0010, bật bằng `REVIEW_LOGIN_EMAIL` + `REVIEW_LOGIN_PASSWORD_HASH_PATH`); đăng nhập thử một lần trong app. Sau khi được duyệt: tắt theo `auth-next/docs/deployment-guide.md`.

## Ảnh chụp màn hình

Tạo bằng `pnpm --filter @miu/web store:screens` (cách chạy: [`README.md`](README.md)). PNG không kênh alpha, đo bằng `sips` ngày 27/10:

| Thư mục | Nhóm App Store Connect | Kích thước (px) |
|---|---|---|
| `screenshots/ios-iphone-6.9/` | iPhone 6.9" | 1320 × 2868 |
| `screenshots/ios-iphone-6.5/` | iPhone 6.5" | 1284 × 2778 |
| `screenshots/ios-ipad-13/` | iPad 13" (bắt buộc vì app chạy trên iPad) | 2064 × 2752 |

Mỗi thư mục có 6 ảnh, tải lên đúng thứ tự tên file:

1. `01-home.png` — đảo nhà. Chú thích gợi ý: "Thế giới khối 3D của riêng bạn".
2. `02-world-map.png` — bản đồ mười hai khu vực. "Mười hai vùng đất để khám phá".
3. `03-play.png` — chơi trong thế giới 3D, HUD. "Phiêu lưu cùng bạn bè".
4. `04-question.png` — câu đố Toán trong nhiệm vụ. "Mỗi nhiệm vụ một bài học".
5. `05-reward.png` — hoàn thành nhiệm vụ. "Học xong là có thưởng".
6. `06-pet-care.png` — chăm thú cưng. "Thú cưng để chăm sóc".

Ảnh là giao diện thật (bản web trong vỏ iOS) với người chơi giả "Mochi" trong database tạm, không dữ liệu thật; không có thanh trạng thái iOS.

## Rủi ro và việc trước khi gửi

| Mức | Việc | Ghi chú |
|---|---|---|
| Cao | **Sign in with Apple chưa có** trên auth.hoandat.com (kiểm 27/10: chỉ Google, GitHub, App reviewer sign-in) | Guideline 4.8: app cho đăng nhập Google/GitHub vào tài khoản chính phải có thêm một lựa chọn bảo vệ quyền riêng tư (Sign in with Apple). Bật theo `auth-next/docs/sign-in-with-apple.md` trước khi gửi, rồi giữ dòng `[…]` trong ghi chú review |
| Vừa | Code PIN đang được gỡ trong cây làm việc chưa commit (quyết định 27/10) | `HEAD`, production và bundle iOS dựng 27/10 08:36 vẫn có màn PIN. Hồ sơ này viết theo bản **không PIN**: build gửi duyệt phải dựng sau khi việc gỡ PIN đã commit và lên production, nếu không người duyệt thấy màn PIN không có trong ghi chú |
| Vừa | Pha 7 / B5 trong `listing.md`: pháp lý Việt Nam (game online), kiểm duyệt production, đo máy thật | Còn chặn phát hành công khai theo plan; có thể loại Việt Nam khỏi danh sách nước nếu người sở hữu muốn |
| Thấp | Link ngoài không qua cổng phụ huynh: footer trang giới thiệu (`https://hoandat.com`, mở Safari) và `mailto:` email hỗ trợ ở `/privacy`, `/terms` | Chỉ ở màn chưa đăng nhập / trang pháp lý; không vào Kids Category nên Guideline 1.3 về cổng phụ huynh không bắt buộc |
| Thấp | Link "bài học" ở trang giới thiệu (`/hoc/<môn>/`) là trang tĩnh của bản web, không có trong gói app | Trong app link này không mở được trang bài học; chỉ hiện trước khi đăng nhập |
| Thấp | App không có `PrivacyInfo.xcprivacy` riêng | Kiểm "Privacy Report" của bản archive; các gói Capacitor tự mang manifest |
