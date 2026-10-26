# Miu World

Thư mục repo: `miu-world-next` (tên hiển thị sản phẩm vẫn là “Miu World”).

Game phiêu lưu 3D voxel online trên web cho mọi lứa tuổi, nơi kiến thức là công cụ để tiến lên chứ không phải một LMS có thêm avatar. Nội dung học (Toán, Tiếng Việt) viết bằng lời của mình, tổ chức theo môn, chủ đề và mục tiêu, không theo sách giáo khoa hay lớp; nguồn ở [`content/learning/topics/`](content/learning/topics/), map và quest ở [`content/`](content/). Server là nguồn sự thật cho tiến độ và thưởng; client không tự tính.

- Sản phẩm, đối tượng, phạm vi: [`docs/project-overview-pdr.md`](docs/project-overview-pdr.md); quyết định sản phẩm gốc: [Master Plan v3](<Miu World — Master Development Plan v3 (3D theo mockup + Multiplayer).md>)
- Bản đồ tài liệu: [`docs/README.md`](docs/README.md); bắt đầu đọc code từ đâu: [`docs/codebase-summary.md`](docs/codebase-summary.md)
- Quy tắc cho AI agent, lệnh và gate trước khi báo xong: [`CLAUDE.md`](CLAUDE.md)

## Cấu trúc

Workspace pnpm: game web và runtime 3D ở `apps/web`, API ở `apps/server`, vỏ Capacitor ở `apps/mobile`, thư viện dùng chung ở `packages/`, script asset, nội dung, map và kiểm tra ở `tools/`. Tên gói và stack xem `package.json` của từng thư mục; ranh giới và quyết định kiến trúc: [`docs/system-architecture.md`](docs/system-architecture.md).

## Bắt đầu

Cần Node và pnpm theo `engines` và `packageManager` trong [`package.json`](package.json); mọi lệnh của repo nằm ở mục `scripts` của file đó.

```sh
pnpm install
pnpm dev
```

`pnpm dev` chạy API và web cùng lúc ([`tools/dev/start-dev-servers.ts`](tools/dev/start-dev-servers.ts)). Đăng nhập phụ huynh đi qua dịch vụ tài khoản dùng chung auth-next; client dev được nạp từ tệp credential ngoài repo của người phụ trách (biến `MIU_TOKEN_FILE` nếu để chỗ khác). Thiếu tệp đó thì API vẫn chạy nhưng không đăng nhập được.

Gate trước khi báo xong, cách chạy test và E2E trên máy dev dùng chung: [`CLAUDE.md`](CLAUDE.md) mục Lệnh và [`docs/code-standards.md`](docs/code-standards.md). Chụp màn hình duyệt trước deploy: [`docs/screen-review.md`](docs/screen-review.md). Deploy và rollback: [`docs/deployment-guide.md`](docs/deployment-guide.md).

## License asset

Chỉ nhận CC0, MIT, OFL. Ngoại lệ duy nhất là logo/icon app (và thẻ chia sẻ có in logo): AI-generated with OpenAI gpt-image for the hoandat ecosystem; owned by hoandat, all rights reserved (not CC0). Nguồn, phiên bản và hash từng file: [`assets/LICENSES.md`](assets/LICENSES.md) và `assets/manifest.json` (sinh bằng `pnpm assets:manifest`, không sửa tay).

## Giấy phép

Mã nguồn theo giấy phép MIT ([`LICENSE`](LICENSE)). Asset trong `assets/` không thuộc phạm vi MIT: giữ giấy phép gốc của từng pack (logo/icon app: hoandat giữ mọi quyền), xem [`assets/LICENSES.md`](assets/LICENSES.md).

Quyền riêng tư của người chơi và địa chỉ liên hệ cho báo lỗi bảo mật hoặc yêu cầu về dữ liệu: trang `/privacy` của game (nội dung ở [`content/legal/privacy-vi.json`](content/legal/privacy-vi.json)).
