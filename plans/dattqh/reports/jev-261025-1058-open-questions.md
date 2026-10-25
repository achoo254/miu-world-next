# Jev quyết các câu hỏi còn mở (25/10/2026)

Người sở hữu (10:58): "câu hỏi còn mở gửi model Jev quyết định rồi tiếp tục làm tiếp". Gọi `tools/decisions/jev-decide.py` (model `jev-1.14.0`), đầu vào: dữ kiện đã kiểm của plan [`261025-0029-original-learning-content`](../261025-0029-original-learning-content/plan.md).

| Câu hỏi | Lựa chọn | Xác suất | Độ tin | Script |
| --- | --- | --- | --- | --- |
| Viết lại 65 quest còn lại ngay hay chờ người sở hữu duyệt 5 mẫu | **Bắt đầu ngay** | 0,94 / 0,06 | 0,88 | tự quyết |
| Bài đọc của `tv2-t14-b25` (khung chị em ong): giữ "Hai anh em" hay đổi truyện cổ tích Việt | **Đổi truyện cổ tích Việt** | 0,61 / 0,39 | 0,22 | chuyển người |
| Font HP001 (không giấy phép mở, không phục vụ ai) | **Tìm font giấy phép mở** | 0,44 / 0,33 giữ / 0,23 gỡ | 0,16 | chuyển người |
| Làm các việc pha 7 không phụ thuộc viết lại ngay hay để cuối | **Làm ngay** | 0,71 / 0,29 | 0,42 | chuyển người |

Ba câu dưới ngưỡng tự quyết của script; vì người sở hữu đã giao cho Jev quyết và bảo làm tiếp, agent theo lựa chọn có xác suất cao nhất. Font: tìm font mở; không có font phù hợp thì giữ như hiện nay (không phát hành gì), vì đó là lựa chọn đứng thứ hai và không rủi ro.

Hệ quả cho plan: N4 đổi thành "viết theo đợt ngay, Jev duyệt từng đợt; góp ý của người sở hữu về mẫu, khi có, áp cho mọi đợt (sửa cả đợt đã viết); người sở hữu duyệt trang review cuối trước release cuối".
