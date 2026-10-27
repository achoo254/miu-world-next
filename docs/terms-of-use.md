# Điều khoản sử dụng

Phát hành ngày 26/10/2026, chủ sở hữu duyệt. Bản soạn ngày 20/10/2026, chỉ từ những gì repo đang làm; chưa có luật sư xem (trang tự nói điều đó).

Nội dung: [`content/legal/terms-vi.json`](../content/legal/terms-vi.json) (schema `TermsDocument` trong `packages/schema/src/content.ts`; `pnpm content:check` và `packages/schema/src/content.test.ts` kiểm). Trang công khai `/terms` (không cần đăng nhập): `apps/web/src/ui/legal/terms-screen.tsx`, dùng khung chung `legal-page.tsx` của trang Quyền riêng tư. Liên kết "Điều khoản" đứng cạnh "Quyền riêng tư" (`apps/web/src/ui/legal/legal-links.tsx`) ở chân trang chủ, màn đăng nhập/đăng ký, trang mời bạn, và chân các trang chủ đề tĩnh `/hoc/…` (`apps/web/vite-lesson-pages.ts`). Nginx không cần đổi: `/terms` là route của SPA, đi qua `try_files … /index.html` như `/privacy`.

## Quyết định của chủ sở hữu (26/10/2026)

- Điều khoản chỉ để đọc: không ai phải chấp nhận, màn đồng ý không có liên kết tới `/terms`, `consentVersion` giữ `v6` (lý do ở mục dưới).
- Thêm đúng một điều trước khi phát hành, ở mục "Chặn, báo cáo và kiểm duyệt": thấy một quyết định kiểm duyệt chưa đúng thì gửi thư tới địa chỉ liên hệ ở cuối trang, người kiểm duyệt sẽ xem lại. Chỉ hứa điều có thật: thư liên hệ do người đọc; không hứa thời hạn trả lời. Địa chỉ là `contactEmail` của `privacy-vi.json` (một nguồn, không chép sang `terms-vi.json`); `content:check` báo đỏ nếu địa chỉ đó trống.
- Cố ý không thêm: giới hạn trách nhiệm và thời gian hoạt động, luật áp dụng, lời khuyên không nói thông tin cá nhân khi nói chuyện bằng giọng, bản tiếng Anh.

## Vì sao không nâng `consentVersion`

Lời đồng ý (`content/legal/consent-vi.json`, trường `version`) là lời đồng ý về dữ liệu. Server so phiên bản này với bảng `consents` ở mọi route của người chơi (`hasCurrentConsent` trong `apps/server/src/auth/consent-store.ts`, `activePlayerId`, `sessionAuthenticator`): đổi phiên bản là mọi tài khoản bị chặn chơi cho tới khi đồng ý lại. Quy tắc của repo chỉ đòi nâng phiên bản khi thêm hay đổi trường dữ liệu, cách thu hoặc chia sẻ dữ liệu (`.claude/rules/server-and-child-safety.md`; trang Quyền riêng tư, mục "Về chính sách này": "Thay đổi lớn còn được đưa vào lời đồng ý"). Trang Điều khoản không thu thêm, không chia sẻ thêm dữ liệu nào, nên phiên bản giữ nguyên (đang là `v6`), và lời đồng ý không nhắc tới Điều khoản. Màn đồng ý cũng không có liên kết tới `/terms`, để không ngầm coi bấm đồng ý là chấp nhận Điều khoản (test `account-flow.test.tsx` giữ điều đó). Nếu chủ sở hữu muốn tài khoản phải chấp nhận Điều khoản, đó là quyết định pháp lý: sửa lời đồng ý, nâng phiên bản (mọi tài khoản đồng ý lại một lần), sửa trang Quyền riêng tư cho cùng phiên bản.

`/terms` cũng không nằm trong số liệu sử dụng ẩn danh (`FIXED_PAGES` trong `packages/schema/src/analytics.ts`): trang Quyền riêng tư liệt kê đúng các trang được đếm.

## Từng điều và nguồn

| Mục | Điều | Nguồn trong repo |
| --- | --- | --- |
| Nói ngắn gọn | Miễn phí, không quảng cáo, mọi lứa tuổi; luôn chơi online; dữ liệu ở trang Quyền riêng tư | `apps/web/index.html` ("Miễn phí, không quảng cáo"); `.claude/rules/product-audience.md`; `privacy-vi.json` mục "Nói ngắn gọn", "Khi chơi online" |
| Tài khoản và người chơi | Đăng nhập qua auth.hoandat.com (Google, GitHub hoặc Apple); người đăng nhập là chủ tài khoản và người chơi chính; tối đa 2 người chơi phụ; trẻ có tài khoản đăng nhập riêng chơi bằng người chơi phụ của người lớn | `consent-vi.json`; `MAX_PLAYERS = 3` trong `apps/server/src/player/player-routes.ts`; `.claude/rules/product-audience.md` (Mô hình tài khoản) |
| Tài khoản và người chơi | Tên người chơi, tên nhân vật chọn từ danh sách; không hỏi tên thật, tuổi | `.claude/rules/server-and-child-safety.md`; `privacy-vi.json` mục "Chúng tôi không lưu gì" |
| Tài khoản và người chơi | Giữ kín tài khoản đăng nhập | `terms-vi.json`. Lời khuyên suy ra từ việc tài khoản mở được mọi người chơi |
| Trẻ em chơi | Không yêu cầu phụ huynh giám sát; ai cho trẻ chơi bằng tài khoản mình thì chịu trách nhiệm | `CLAUDE.md` mục Đối tượng; `consent-vi.json`; `privacy-vi.json` |
| Trẻ em chơi | Chủ tài khoản xem tiến bộ học, đổi cài đặt bạn máy, xóa bạn, bỏ chặn; người chơi tự đổi lại cài đặt và tự trả lời lời mời | `privacy-vi.json` mục "Khi chơi online", "Quyền của bạn" |
| Chơi cùng người khác | Không chat tự gõ, chỉ vẫy tay và câu chọn sẵn; giọng nói chỉ trong tổ đội hoặc gọi bạn bè, người được gọi phải bấm nghe; micro chỉ bật khi bấm; tắt được trong Cài đặt | `privacy-vi.json` mục "Khi chơi online"; Master Plan v3 quyết định 48 |
| Chơi cùng người khác | Bạn máy luôn gắn nhãn; tắt được | `privacy-vi.json` mục "Khi chơi online" |
| Chơi cùng người khác | Chơi tử tế: không làm phiền, trêu chọc, không gửi liên tục, không đặt tên nhân vật không phù hợp | Các lý do báo cáo `REPORT_REASONS` (`packages/schema/src/multiplayer.ts`) và nhãn `online.report.*` trong `apps/web/src/ui/i18n/locales/vi.json` |
| Chặn, báo cáo và kiểm duyệt | Chặn: không thấy nhau ở đâu, không kết bạn, không vào nhà, không nghe nhau | `privacy-vi.json` mục "Khi chơi online" |
| Chặn, báo cáo và kiểm duyệt | Báo cáo chọn lý do từ danh sách; lưu để người kiểm duyệt xem | `REPORT_REASONS`; `online.report.note` trong `vi.json`; `privacy-vi.json` |
| Chặn, báo cáo và kiểm duyệt | Quyết định: bỏ qua, nhắc nhở, đổi tên nhân vật, tạm khóa online 1/3/7/30 ngày, khóa hẳn; báo qua Hộp thư; vẫn chơi một mình, nhận thưởng | `MODERATION_ACTIONS`, `LOCK_DAYS` trong `packages/schema/src/moderation.ts` (test `content.test.ts` giữ số ngày khớp); `apps/server/src/moderation/moderation-mail.ts`; `privacy-vi.json` |
| Chặn, báo cáo và kiểm duyệt | Ba người khác nhau báo cáo trong một ngày thì tạm ẩn khỏi online | `AUTO_HIDE_REPORTERS`, `AUTO_HIDE_WINDOW_MS` trong `apps/server/src/moderation/moderation-store.ts`; `privacy-vi.json` |
| Chặn, báo cáo và kiểm duyệt | Trò chơi có thể tạm tắt tương tác giữa người chơi hoặc tạm đóng chơi online | `ONLINE_MODES` (`on`, `interaction-off`, `off`) trong `packages/schema/src/multiplayer.ts` |
| Chặn, báo cáo và kiểm duyệt | Thấy quyết định kiểm duyệt chưa đúng: gửi thư tới địa chỉ liên hệ cuối trang, người kiểm duyệt xem lại; không hứa thời hạn | Quyết định của chủ sở hữu 26/10/2026; `contactEmail` trong `privacy-vi.json` |
| Phần thưởng và đồ vật | Điểm kinh nghiệm, Xu, sao, đồ vật do máy chủ tính, chỉ dùng trong trò chơi; chơi đội thì ai người nấy giữ | `CLAUDE.md` (server là nguồn sự thật); `.claude/rules/server-and-child-safety.md`; Master Plan v3 quyết định 6 (không Kim cương), 47; `privacy-vi.json` |
| Dữ liệu và giọng nói | Chi tiết ở trang Quyền riêng tư; không ghi âm, không lưu giọng nói; bản ghi bài tập nói chỉ trong trình duyệt | `privacy-vi.json` mục "Chúng tôi không lưu gì"; `docs/i18n.md` mục Đọc to |
| Ngừng chơi và xóa tài khoản | Xóa người chơi phụ hoặc cả tài khoản bất cứ lúc nào; người chơi chính chỉ xóa cùng tài khoản; xóa ngay, sao lưu và nhật ký tự xóa sau tối đa 14 ngày | `consent-vi.json`; `privacy-vi.json` mục "Giữ bao lâu", "Quyền của bạn"; `.claude/rules/server-and-child-safety.md` (xóa cứng) |
| Mã nguồn và hình ảnh, âm thanh | Mã nguồn mở MIT tại GitHub; asset trong game chỉ CC0, MIT, OFL hoặc sinh bằng code; riêng logo và icon app là ảnh AI (OpenAI gpt-image) của hoandat, giữ mọi quyền, không phải CC0; danh sách license trong mã nguồn | `LICENSE`; `CLAUDE.md` (repo công khai); `licenseAllowlist` và `brandArt` trong `tools/assets/sources.json`; `assets/LICENSES.md`; `.claude/rules/assets-pipeline.md` |
| Về điều khoản này | Không có bộ phận pháp chế, tự soạn, chưa có luật sư xem; cập nhật trang và ngày khi đổi | `privacy-vi.json` mục "Về chính sách này" (cùng cách nói) |
| Liên hệ (trên màn hình) | Thư tới địa chỉ liên hệ của trang Quyền riêng tư | `contactEmail` trong `privacy-vi.json` (một nguồn, không chép sang `terms-vi.json`) |

## Không có trong Điều khoản

Chủ sở hữu đã quyết (26/10/2026): dùng trò chơi không có nghĩa là chấp nhận Điều khoản; không viết giới hạn trách nhiệm hay cam kết thời gian hoạt động của dịch vụ, luật áp dụng, lời khuyên không nói thông tin cá nhân khi nói chuyện bằng giọng; chưa có bản tiếng Anh (trang hiện tiếng Việt ở mọi chế độ ngôn ngữ, như trang Quyền riêng tư). Thêm điều nào trong số đó là quyết định mới của chủ sở hữu.
