# Danh mục bài đọc mới cho 33 quest Tiếng Việt (pha 5, việc 1)

**Trạng thái:** Jev đã duyệt 25/10 (nghiêng 0,81 về duyệt; ghi tại `plans/dattqh/reports/jev-261025-1110-reading-list.md`). Người viết được thay một bài thơ tự viết bằng ca dao, đồng dao hợp thể loại khi tìm thấy. Bài dân gian trùng vân tay: thơ ca giữ lời truyền thống được thêm mục duyệt (lead thêm); truyện kể trùng thì kể lại xa hơn tới khi hết trùng. Phạm vi: 32 quest `tv2-*` còn trong `tools/content/textbook-copy-pending.json` + `tv2-t14-b25` (đổi bài đọc thành truyện dân gian Việt về anh em). Tổng 36 bài đọc (`tv2-t09` có 2, `tv2-t18-on-cuoi-ki` có 3).

## Cách đọc

Mỗi quest một mục. Trường:
- **Cũ**: tên bài, thể loại, số chữ (đếm theo dấu cách, tính cả dấu gạch đầu dòng và `|` của bảng; chỉ để ước lượng, người viết đếm lại).
- **Đích**: khoảng ±20% số chữ bài cũ.
- **Mới**: tên tạm của bài mới (người viết có thể đổi tên).
- **Nguồn**: `folk` (truyện kể lại bằng lời mình; ca dao, đồng dao theo bản truyền thống, nếu trùng vân tay thì lead thêm mục duyệt ở `tools/content/allowed-traditional-passages.json`), `public-domain` (kèm tên, năm mất, URL), hoặc `original`.
- **Phác**: ý chính, giữ các câu hỏi của quest (chi tiết, nhân vật, trình tự, nghĩa từ, từ loại, dấu câu, chính tả) trả lời được từ bài mới.
- **Bước phụ thuộc**: id bước có chữ hoặc câu hỏi bám vào bài; `(?)` là nhiều khả năng phụ thuộc, người viết kiểm khi viết. Bước `phieu-viet-*` luôn cần sửa đoạn nghe – viết cho khớp bài mới. Bước lời thoại mở đầu và `qua-cua-*` (tặng quà) nhắc tên bài cũ thì sửa luôn.
- **Truyện phụ**: một số quest có thêm truyện nghe/kể theo tranh (không nằm trong `texts`, lời kể nằm trong bước). Game không có giọng kể, nên người viết phải đưa lời kể vào bước hoặc dựa vào tranh; không dùng lại cốt truyện bản cũ.

## Luật chọn nguồn đã áp dụng

1. Ưu tiên dân gian Việt (ca dao, đồng dao, câu đố, truyện cổ tích, truyện cười, ngụ ngôn). Chỉ dùng khi thể loại, độ dài và dạng câu hỏi khớp. Truyện luôn kể lại bằng lời mình.
2. Tác giả mất từ 1975 trở về trước: chỉ dùng nếu tra được năm mất và bài hợp. Đợt này **không dùng bài nào** (xem mục "Tác giả hết bảo hộ" cuối trang).
3. Còn lại `original`, viết riêng cho game, không bám cốt truyện, hình ảnh hay câu chữ của bài cũ.
4. Không lặp chủ đề, cốt truyện, truyện dân gian giữa các quest (bảng đối chiếu ở cuối). Không chữ lớp, năm học, sách, bài, trang.
5. Giọng chữ hợp mọi lứa tuổi; kết truyện dân gian có chi tiết dữ (Cây khế, Thầy bói) thì kể nhẹ tay, không máu me.

---

## Chủ điểm 1 (vùng lang-ven-song)

### tv2-t01-b02 · Ông Cua Đồng tìm ngày hôm qua · chủ đề bang-chu-cai
- Cũ: "Ngày hôm qua đâu rồi?", thơ, 84 chữ. Đích: 67–101.
- Mới: "Tờ lịch của ông Cua" · thơ 5 chữ, 4 khổ, hỏi – đáp.
- Nguồn: `original`. Lý do: không có ca dao hỏi – đáp về thời gian khớp bước "ngày ở lại những đâu"; ca dao "Tháng giêng là tháng ăn chơi…" ngắn hơn đích và nhiều dị bản.
- Phác: em hỏi ông Cua Đồng giữ lịch "tờ lịch cũ đi đâu rồi?"; ba khổ đáp "ở lại" trong hạt mạ thành lúa, trong bờ tre, trong trang vở; khổ cuối là lời dặn. Giữ cấu trúc để học thuộc 2 khổ, nghe – viết 2 khổ cuối.
- Bước phụ thuộc: `doc-bai-tho`, `ngay-hom-qua-o-lai`, `loi-dan-cua-bo`, `hoc-thuoc-long`, `nguoi-va-vat-trong-tranh`, `dat-cau-tu-tranh`, `dem-tho-quanh-goc-cay`, `phieu-viet-bai-2`, `qua-cua-voi-bao`(?). Lời dẫn trong `loi-dan-cua-bo` nhắc "bố": đổi nhân vật.

### tv2-t02-b03 · Thỏ Bồng Bềnh ước dưới cầu vồng · doc-truyen
- Cũ: "Niềm vui của Bi và Bống", truyện đối thoại, 159 chữ. Đích: 127–191.
- Mới: "Hũ ước dưới chân cầu vồng" · truyện đối thoại hai nhân vật.
- Nguồn: `original`.
- Phác: hai bạn nhỏ (chuột Tí và Tép, không phải anh em) nhìn cầu vồng, đoán chân cầu có kho báu và bàn nhau mua gì; cầu vồng tắt, không có gì; hai bạn rủ nhau làm tranh tặng nhau. Có các câu thốt lên ngạc nhiên, từ chỉ người, từ chỉ vật; chia được 4 tranh.
- Bước phụ thuộc: `doan-tranh-cau-vong`(?), `doc-truyen`, `neu-co-hu-vang`, `khong-co-hu-vang`, `cau-noi-yeu-thuong`, `may-tu-ngu`(?), `ve-tang-ai`, `xep-tranh-phoi`, `chu-nhoe-duoi-tranh`, `ke-chuyen-theo-tranh`, `ke-cho-nguoi-than`, `phieu-viet-bai-3`.

### tv2-t02-b04 · Gấu Nhẩm tìm việc · tu-chi-su-vat-hoat-dong
- Cũ: "Làm việc thật là vui", văn xuôi miêu tả, 134 chữ. Đích: 107–161.
- Mới: "Một ngày trong vườn hoa" · văn xuôi 2 đoạn.
- Nguồn: `original`.
- Phác: đoạn 1: vật và con vật trong vườn đều có việc (ong hút mật, gà gáy, đồng hồ nước nhỏ giọt, chim bắt sâu); đoạn 2: bé cũng làm việc (tưới cây, nhặt lá, phụ mẹ), luôn bận mà vui. Cần nhiều từ chỉ sự vật và hoạt động rõ ràng.
- Bước phụ thuộc: `khoi-dong`(?), `doc-bai`, `con-vat-trong-bai`, `viec-cua-be`, `dong-vai-con-vat`, `ghep-cau-hoat-dong`(?), `viec-cuoi-ngay`(?), `phieu-viet-bai-4`.

### tv2-t03-b05 · Voi Út soi bóng bên bến sông · doc-truyen
- Cũ: "Em có xinh không?", truyện, 185 chữ. Đích: 148–222.
- Mới: "Chú voi con muốn có cánh" · truyện.
- Nguồn: `original`.
- Phác: voi con hỏi ba bạn (khỉ, sóc, chim) và nghe ba lời khác nhau, bắt chước làm theo (buộc lá làm cánh, đeo chùm quả như đuôi), bị người thân góp ý; nhận ra vòi của mình tưới nước, giúp bạn. Giữ: hỏi ba nhân vật, ba lời đáp, người cho lời khuyên, từ chỉ hoạt động, bài học "là chính mình". Không dùng "sừng, râu, gương".
- Bước phụ thuộc: `gap-voi-ut`, `doc-truyen`, `ba-loi-dap`, `loi-khuyen-cua-ai`, `sung-rau-gia`, `hoat-dong-voi-em`, `khen-voi-ut`, `bai-hoc-cua-voi-em`, `neu-la-voi-anh`, `xep-tranh-mat-nuoc`, `ke-chuyen-theo-tranh`, `ke-ve-voi-em`, `phieu-viet-bai-5`, `qua-cua-hai-anh-em`. Id `sung-rau-gia` giữ nguyên, nội dung đổi.

### tv2-t03-b06 · Mèo Nghệ run râu trước lớp · tu-chi-dac-diem
- Cũ: "Một giờ học", truyện, 202 chữ. Đích: 162–242.
- Mới: "Bông hoa của Bích" · truyện.
- Nguồn: `original`.
- Phác: bạn Bích lần đầu nói trước lớp về loài hoa mình thích, lúng túng đỏ mặt; thầy hỏi dẫn dắt ("Hoa ấy màu gì? Em thấy ở đâu?"), Bích nhìn bông hoa mang theo và nói trôi chảy. Có câu hỏi dấu chấm hỏi trong bài; có lí do lúng túng, dấu hiệu tự tin lên.
- Bước phụ thuộc: `doc-mot-gio-hoc`, `vi-sao-quang-lung-tung`(đổi tên nhân vật), `quang-hoa-tu-tin`, `cam-giac-noi-truoc-lop`(?), `cau-hoi-trong-bai`, `khen-ban-quang`, `phieu-viet-bai-6`. Bước `doc-sach-ban-tay-be` trích thơ "Đôi bàn tay bé" của tác giả còn bảo hộ: thay bằng thơ tự viết.

### tv2-t04-b07 · Bụi xấu hổ cứ nhắm mắt · doc-truyen
- Cũ: "Cây xấu hổ", truyện miêu tả nhân hoá, 151 chữ. Đích: 121–181.
- Mới: "Cây trinh nữ và hạt sương" · truyện miêu tả nhân hoá.
- Nguồn: `original`.
- Phác: cây xấu hổ cụp lá mỗi khi có tiếng động; một chú nhím đi ngang rón rén đặt hạt sương lên lá, cây mở dần "mắt lá" thấy hạt sương lấp lánh, thấy mình không cần giấu. Giữ: điều làm cây nhắm mắt, nuối tiếc/ mong, từ chỉ đặc điểm, nói tiếp lời cây.
- Bước phụ thuộc: `nai-mo-lam-tho`(?), `doan-loai-cay`(?), `doc-cay-xau-ho`, `co-cay-xon-xao`, `cay-xau-ho-tiec-gi`, `cau-van-mong-chim`, `tu-ngu-cho-bai-tho`, `loi-cua-cay-xau-ho`, `so-la-bi-nhoe`, `phieu-viet-bai-7`.
- Truyện phụ ("Chú đỗ con"): `doan-va-nghe-ke`, `xep-tranh-do-con`, `ke-cho-sau-xanh-ngu`, `ke-voi-nguoi-than`.

### tv2-t04-b08 · Hổ Sọc làm cầu thủ dự bị · bang-chu-cai
- Cũ: "Cầu thủ dự bị", truyện, 190 chữ. Đích: 152–228.
- Mới: "Người nhặt cầu" · truyện (đá cầu).
- Nguồn: `original`.
- Phác: sóc nhỏ bị chê chậm, được giao nhặt cầu; vừa nhặt vừa tập nhảy mỗi sáng; một hôm đội thiếu người, cả hai đội đều gọi sóc. Giữ: vì sao chưa ai nhận, việc làm khi dự bị, vì sao cuối cùng được mời, lời khen và lời chúc mừng.
- Bước phụ thuộc: `ho-van-tap-mot-minh`(?), `doc-cau-thu-du-bi`, `vi-sao-chua-duoc-nhan`, `du-bi-lam-gi`, `ca-hai-doi-muon-gau`, `loi-khen-trong-bai`, `chuc-mung-gau-con`, `lam-du-bi-nhe`(?), `phieu-viet-bai-8`. Đổi "gấu con" thành nhân vật mới trong cả quest.

## Chủ điểm 2 (vùng truong-hoc)

### tv2-t05-b09 · Bài thơ Nai Sương tặng cô · doc-tho
- Cũ: "Cô giáo lớp em", thơ, 60 chữ. Đích: 48–72.
- Mới: "Tiếng cô trong nắng sớm" · thơ 5 chữ, 3 khổ.
- Nguồn: `original`. Lý do: ca dao về thầy cô ("Muốn sang thì bắc cầu kiều…") chỉ đủ khoảng 35 chữ và không có hình ảnh gió, nắng, hoa cho các câu hỏi.
- Phác: cô đến lớp sớm, nụ cười cô; gió, nắng ghé cửa sổ; lời cô làm trang vở thơm. Giữ cấu trúc để hỏi câu thơ có gió/nắng, bạn nhỏ kể về cô, tình cảm, xếp dòng thơ, học thuộc 2 khổ.
- Bước phụ thuộc: `doc-bai-tho-cua-so`, `gio-nang-ghe-lop`, `ban-nho-ke-ve-co`, `tinh-cam-voi-co`, `gio-thoi-dong-tho`, `doc-thuoc-long`, `cau-ket-bai-tho`(?), `phieu-viet-bai-9`, `qua-cua-nai-mo`(nhắc tên thơ).
- Truyện phụ ("Cậu bé ham học"): `nghe-chuyen-vu-due`, `xep-tranh-vu-due`, `ke-cho-nguoi-than`.

### tv2-t05-b10 · Thỏ Vội mang nhầm sách vở · doc-van-ban-thong-tin
- Cũ: "Thời khoá biểu", văn bản thông tin (đoạn giới thiệu + bảng), ~162 chữ. Đích: 130–194.
- Mới: "Thời khoá biểu của lớp Hoa Mai" · đoạn giới thiệu cách đọc + bảng 5 ngày.
- Nguồn: `original`. Bảng xếp lại môn từng tiết khác bản cũ; tên môn là tên chung nên được dùng.
- Phác: giữ cách đọc "thứ – buổi – tiết – môn"; có đủ ngày có tiết Âm nhạc / Mĩ thuật / Thể chất để hỏi – đáp; có ô trống để hỏi "buổi nào ít tiết".
- Bước phụ thuộc: `tho-ti-hot-hoang`(?), `cach-biet-mon-hoc`(?), `doc-thoi-khoa-bieu`, `mon-hoc-thu-nam`, `kho-khan-khi-thieu-tkb`(?), `hoi-dap-tiet-mi-thuat`, `hoi-dap-cung-tho-ti`, `mon-hoc-em-thich`, `hua-voi-voi-bao`(?), `phieu-viet-bai-10`.

### tv2-t06-b11 · Đánh thức trống trường · doc-tho
- Cũ: "Cái trống trường em", thơ, 64 chữ. Đích: 51–77.
- Mới: "Chiếc trống ngủ quên" · thơ 4 chữ, 4 khổ.
- Nguồn: `original`.
- Phác: mùa hè trống nằm một mình, nghe ve; chờ bạn; ngày khai giảng trống thức dậy vang "tùng tùng". Nhân hoá (trống buồn, nhớ, mừng); có từ khó cần giải nghĩa; khổ cuối để điền chữ.
- Bước phụ thuộc: `trong-bao-dieu-gi`(?), `bai-tho-tren-gia-trong`, `trong-mua-he-va-khai-giang`, `kho-tho-tro-chuyen`, `tinh-cam-voi-trong`, `ngam-nghi-la-gi`(từ khó mới), `trong-giong-con-nguoi`, `loi-tam-biet-trong`, `trong-thuc-day`, `phieu-viet-bai-11`. Lưu ý chéo: `phieu-viet-bai-12` ở quest b12 cũng nghe – viết thơ này.

### tv2-t06-b12 · Cô Mèo Kính và tờ danh sách nhoè mưa · doc-van-ban-thong-tin
- Cũ: "Danh sách học sinh", đoạn dẫn + bảng 8 dòng, ~153 chữ. Đích: 122–184.
- Mới: "Danh sách đăng kí câu lạc bộ đọc truyện của tổ Bốn" · đoạn dẫn + bảng 8 dòng.
- Nguồn: `original`. Tên người bịa, tên truyện bịa (không dùng lại tên truyện trong bản cũ).
- Phác: giữ 3 cột (số thứ tự, họ và tên, truyện); tên xếp theo thứ tự chữ cái đầu (An, Anh, Bảo, Bắc, Bình…); có người cùng truyện để hỏi "ai cùng truyện", dòng số 6, tổng số bạn.
- Bước phụ thuộc: `da-doc-danh-sach-nao`(?), `doc-danh-sach`, `truyen-cua-ban-so-6`, `ban-cung-truyen`, `tac-dung-danh-sach`, `xep-ten-the-nao`, `chep-lai-danh-sach-rung`(?), `ten-tho-ti-nhoe`(?), `phieu-viet-bai-12`. Hai danh sách phụ nằm trong bước (`to-1-lop-2a`, `chia-nhom-tham-quan`) cũng phải viết lại, bỏ "lớp 2A".

### tv2-t07-b13 · Gà Con Ri nhớ nhà giờ ra chơi · doc-tho
- Cũ: "Yêu lắm trường ơi!", thơ, 80 chữ. Đích: 64–96.
- Mới: "Mái trường ven sông" · thơ lục bát, 6 cặp.
- Nguồn: `original`. Dùng lục bát để khác nhịp với hai bài thơ trước.
- Phác: yêu hàng cây, tiếng chim, sân giờ ra chơi, khung cửa sổ, lời cô; nhớ trường khi nghỉ. Giữ: khổ thơ ↔ tranh, bạn nhỏ yêu những gì, nhớ gì về cô, từ chỉ tình cảm.
- Bước phụ thuộc: `hat-em-yeu-truong-em`(bài hát của nhạc sĩ còn bảo hộ, thay bằng lời tự viết), `tinh-cam-ban-nho`, `doc-bai-tho`, `khop-kho-tho-voi-tranh`, `ban-nho-yeu-gi`, `nho-loi-co`, `tu-the-hien-tinh-cam`, `ghep-cau-dac-diem`, `phieu-viet-bai-13`, `chip-nho-nha`(?).
- Truyện phụ ("Bữa ăn trưa"): `xep-tranh-bua-trua`, `ke-chuyen-bua-trua`, `ke-cho-me-chip`.

### tv2-t07-b14 · Cáo Cọ hết sạch màu vẽ · dau-cau
- Cũ: "Em học vẽ", thơ, 80 chữ. Đích: 64–96.
- Mới: "Hộp màu của em" · thơ 5 chữ, 4 khổ, vần chân rõ.
- Nguồn: `original`.
- Phác: em pha màu vẽ trời, diều, thuyền buồm, cánh đồng, sân trường; cuối dòng có cặp tiếng cùng vần để làm bước tìm vần; nhiều từ chỉ sự vật.
- Bước phụ thuộc: `doc-em-hoc-ve`, `tranh-canh-bien`, `kho-tho-san-truong`, `tieng-cung-van`, `doc-thuoc-hai-kho`, `tu-chi-su-vat`, `so-tu-moi-cua-vet`, `phieu-viet-bai-14`.

## Chủ điểm 3 (vùng thu-vien)

### tv2-t08-b15 · Kệ sách đổ rầm trong phòng đọc · doc-van-ban-thong-tin
- Cũ: "Cuốn sách của em", văn bản thông tin, 137 chữ. Đích: 110–164.
- Mới: "Các phần của một cuốn sách" · văn bản thông tin 3 đoạn.
- Nguồn: `original`.
- Phác: giới thiệu tên sách, tác giả, nhà xuất bản, mục lục là gì, nằm ở đâu; có ví dụ nhỏ. Giữ thứ tự thông tin để làm bước sắp xếp "trình tự trong bài".
- Bước phụ thuộc: `bia-sach-de-men`(bìa "Dế Mèn phiêu lưu kí" là sách thật, thay bằng sách trong game), `doc-cuon-sach`, `nhan-ten-sach`, `nhan-tac-gia`, `nhan-nha-xuat-ban`, `nhan-muc-luc`, `thu-tu-trong-bai`, `cho-dat-ten-sach`, `trang-muc-luc`, `trang-xuong-rong`, `nguoi-vat-hay-viec`(?), `phieu-viet-bai-15`.
- Truyện phụ ("Hoạ mi, vẹt và quạ"): `chat-cua-vet`(?), `xep-tranh-hoa-mi`, `ke-chuyen-hoa-mi`, `ke-cho-nguoi-than`.

### tv2-t08-b16 · Trang sách mở ra giữa vườn đọc sách · tu-chi-dac-diem
- Cũ: "Khi trang sách mở ra", thơ, 90 chữ. Đích: 72–108.
- Mới: "Trang sách có suối" · thơ 5 chữ, 4 khổ.
- Nguồn: `original`.
- Phác: mở sách, trong trang hiện lần lượt cánh chim, suối, cánh buồm, núi; giấy không ướt; kết: trang sách không nói mà em vẫn nghe. Có thứ tự xuất hiện để xếp, vần cuối dòng để tìm, từ chỉ đặc điểm.
- Bước phụ thuộc: `doc-tho-tren-tang-da`, `xep-hang-buoc-ra`, `bien-hien-ra-ben-suoi`, `the-chu-ben-suoi`, `song-vo-kho-cuoi`, `vet-xanh-suu-tam-van`, `danh-thuc-hop-but`(?), `phieu-viet-bai-16`. Bước `ke-dieu-thich-nhat` nhắc "Dế Mèn phiêu lưu kí" và nhân vật Dế Trũi (sách thật): thay.

### tv2-t09-on-giua-ki · Lễ hội lá vàng trước thư viện · doc-truyen (2 bài)
- **Bài 1.** Cũ: "Vịt bơi được mà", truyện cười đối thoại, 77 chữ (có 5 ô dấu câu). Đích: 62–92.
  - Mới: "Treo biển" · truyện cười dân gian Việt, kể lại.
  - Nguồn: `folk` (truyện cười dân gian Việt). Có bản trong sách giáo khoa nhiều cấp: người viết kể rất xa bản in.
  - Phác: người bán hàng treo biển, ai ghé cũng góp ý bớt chữ, cuối cùng chẳng còn gì trên biển. Có lời thoại với dấu chấm hỏi, chấm than, chấm; cần nhân vật để hỏi "vì sao…".
  - Bước phụ thuộc: `doc-vit-boi`, `dau-cau-vit-boi`.
- **Bài 2.** Cũ: "Câu chuyện bó đũa", truyện ngụ ngôn, 182 chữ. Đích: 146–218.
  - Mới: "Thầy bói xem voi" · ngụ ngôn dân gian Việt, kể lại (không lặp đề tài anh em của Cây khế).
  - Nguồn: `folk`.
  - Phác: năm thầy bói mù sờ voi mỗi người một bộ phận, cãi nhau; có chi tiết, trình tự, ba thẻ nghĩa từ (từ mô tả cảm giác, hoạt động), từ chỉ sự vật. Kết: cần nhìn đủ.
  - Bước phụ thuộc: `doc-bo-dua`, `tinh-cam-khi-lon`(đổi thành câu hỏi về cảm nhận), `hoi-dap-bo-dua`, `nghia-tu-1`, `nghia-tu-2`, `nghia-tu-3`, `keo-su-vat-hoat-dong`(?).
- **Phụ thuộc chéo:** `bong-hoa-bai-doc`, `the-mau-cau-hoi`, `tranh-ten-truyen`, `ke-chuyen-em-thich`, `phieu-viet-giua-ki` nhắc tên bài đọc, truyện kể của các quest trước (nhất là "Cô giáo lớp em"): viết sau hoặc cùng đợt khi tên bài mới của các quest b01–b16 đã chốt.

## Chủ điểm 4 (vùng khu-rung-bi-mat)

### tv2-t10-b17 · Tiếng gọi trên đồng cỏ khô · doc-tho
- Cũ: "Gọi bạn", thơ kể chuyện, 70 chữ. Đích: 56–84.
- Mới: "Tiếng vọng bên suối" · thơ kể chuyện 5 chữ, 4 khổ.
- Nguồn: `original`.
- Phác: ngày xưa ở khu rừng nọ có đôi bạn (nai vàng, sóc nâu); mùa khô, sóc đi tìm hạt, lạc đường; nai đi khắp nơi gọi; đến giờ tiếng gọi vẫn vang trên suối. Giữ: khi nào, ở đâu, vì sao đi, bạn làm gì, cảm xúc, có đoạn kết mở để kể tiếp.
- Bước phụ thuộc: `doc-bai-tho`, `vi-sao-be-vang-di`, `de-trang-lam-gi`, `tam-trang-de-trang`, `xep-dong-tho`, `doc-thuoc-long`, `cam-nghi-doi-ban`, `ke-doan-ket`, `an-ui-de-trang`, `bo-buon-ben-suoi`, `xep-tranh-goi-ban`, `ke-theo-tranh`, `phieu-viet-bai-17`.

### tv2-t10-b18 · Lá thư từ xứ băng · tu-ngu-tinh-cam
- Cũ: "Tớ nhớ cậu", truyện, 191 chữ. Đích: 153–229.
- Mới: "Thư của chim én" · truyện.
- Nguồn: `original`.
- Phác: én con phải bay đi theo mùa, hẹn gửi thư cho bạn ếch ở ao; lần đầu gửi thư én viết lại nhiều lần mới ưng; ếch nhận thư, vui và gửi hồi âm. Giữ: cảm xúc lúc chia tay, bạn đồng ý điều gì, vì sao viết lại, nếu không có thư thì sao.
- Bước phụ thuộc: `doc-to-nho-cau`, `soc-nhan-loi`, `kien-viet-di-viet-lai`, `neu-khong-co-thu`, `dong-vai-chia-tay`, `buu-thiep-cua-soc`(?), `thu-cua-ca-bong`(?), `phieu-viet-bai-18`. Bước `bai-tho-gui-kem` nhắc bài thơ của nhà thơ còn bảo hộ ("Chú bò tìm bạn", "Ngỗng và vịt"): thay.

### tv2-t11-b19 · Chữ cái cãi nhau · doc-truyen
- Cũ: "Chữ A và những người bạn", tự sự ngôi thứ nhất, 169 chữ. Đích: 135–203.
- Mới: "Tôi là chữ Đ" · tự sự ngôi thứ nhất.
- Nguồn: `original`.
- Phác: chữ Đ bị trêu vì có "thanh ngang trên đầu", lúc đầu ngượng, sau nhận ra nhờ nó mới có "đi, đẹp, đỏ"; nhờ bạn bè đứng cạnh (D) mới nên vần; lời nhắn nhủ. Giữ: vị trí trong bảng chữ cái, mong ước, nhận ra, lời nhắn, từ chỉ cảm xúc.
- Bước phụ thuộc: `doan-noi-dung`, `doc-chu-a`, `xep-hang-chu-cai`(?), `uoc-mo-chu-a`, `chu-a-nhan-ra`, `loi-nhan-nhu`, `so-tu-cam-xuc`, `loi-cam-on-chu-a`, `cac-chu-lam-lanh`(?), `phieu-viet-bai-19`. Đổi tên các id mang chữ A chỉ khi lead cho phép (id giữ nguyên là mặc định).

### tv2-t11-b20 · Sư Tử Xù muốn có bạn · tu-ngu-tinh-cam
- Cũ: "Nhím nâu kết bạn", truyện, 192 chữ. Đích: 154–230.
- Mới: "Rùa con làm quen" · truyện.
- Nguồn: `original`.
- Phác: rùa con nhút nhát nấp vào mai khi bạn chào; qua vài lần gặp lại, chim sẻ kiên nhẫn chào; mùa mưa rét hai bạn che chung tàu lá; kết ấm áp. Giữ: các lần gặp, vì sao nhận lời, điều làm mùa mưa ấm.
- Bước phụ thuộc: `doc-nhim-nau`, `nhung-lan-gap-nhau`, `vi-sao-nhan-loi`, `mua-dong-am-ap`, `dong-vai-gap-lai`, `la-tu-ngu-ho-van`(?), `ho-van-lam-quen`(?), `phieu-viet-bai-20`.

### tv2-t12-b21 · Cánh diều trên đỉnh đồi gió · doc-tho
- Cũ: "Thả diều", thơ, 81 chữ. Đích: 65–97.
- Mới: "Diều và gió" · thơ 4 chữ, 4 khổ có điệp khúc.
- Nguồn: `original`.
- Phác: khổ nào cũng mở bằng một câu lặp, diều được ví với các vật (chiếc lá lớn, chiếc thuyền, vầng trăng, cánh chim); có từ chỉ âm thanh của sáo diều; khổ tả cánh diều để đặt câu.
- Bước phụ thuộc: `doc-tho-tha-dieu`, `dieu-luc-nao`, `dieu-bien-hinh`, `kho-tho-cuoi`, `tieng-sao-dieu`, `kho-tho-yeu-thich`, `xep-cau-ta-dieu`, `cau-ta-dieu-cua-em`, `phieu-viet-bai-21`.
- Truyện phụ ("Chúng mình là bạn"): `co-duoi-dieu`, `ke-chuyen-ba-ban`.

### tv2-t12-b22 · Lợn Rừng Đốm và chú lê-gô biết nói · cau
- Cũ: "Tớ là lê-gô", tự giới thiệu ngôi thứ nhất, 151 chữ. Đích: 121–181.
- Mới: "Tớ là khối xếp hình" · tự giới thiệu ngôi thứ nhất.
- Nguồn: `original`. Không dùng nhãn hiệu trong bài; tên quest còn "lê-gô" thì để lead quyết ở pha 7.
- Phác: khối xếp hình giới thiệu mình (hình, màu, các anh chị em), cách chơi, lợi ích. Chia được 4 đoạn để làm bước ghép nội dung; có từ chỉ đặc điểm.
- Bước phụ thuộc: `doc-to-la-le-go`, `cach-choi-le-go`, `loi-ich-le-go`, `noi-dung-tung-doan`, `tu-dac-diem-le-go`, `cau-ve-le-go`, `cau-le-go-sac-so`(?), `phieu-viet-bai-22`.

### tv2-t13-b23 · Cáo Tũn quên luật rồng rắn · doc-van-ban-thong-tin
- Cũ: "Rồng rắn lên mây", cách chơi + đồng dao, 136 chữ. Đích: 109–163.
- Mới: "Chi chi chành chành" · cách chơi (tự viết) + lời đồng dao.
- Nguồn: `folk` (trò chơi dân gian + đồng dao). Lời đồng dao theo bản truyền thống, có thể trùng bản trong sách giáo khoa: cần mục duyệt ở `allowed-traditional-passages.json`; phần luật chơi viết bằng lời mình. Dự phòng nếu vân tay vướng: "Kéo cưa lừa xẻ".
- Phác: một người xoè tay, các bạn chạm ngón vào lòng tay; cuối bài đồng dao người xoè tay nắm lại; ai bị bắt phải thay. Có vai (người xoè tay, người chơi), điều kiện "nếu… thì…", từ khó giải nghĩa.
- Bước phụ thuộc: `khoi-dong`(?), `doc-luat-choi`, `xin-thuoc`, `bat-khuc-duoi`, `dut-khuc-giua`, `noi-tiep-luat`, `tu-kho-cua-cao`, `chia-vai`, `cau-tro-choi`(?), `phieu-viet-bai-23`. Các id giữ nguyên (nội dung đổi vai).
- Truyện phụ ("Búp bê biết khóc"): `doan-tranh-hoa`, `xep-tranh-bup-be`, `ke-chuyen-bup-be`, `ke-cho-nguoi-than`.

### tv2-t13-b24 · Hải Ly Cần nặn quà bên suối · dau-cau
- Cũ: "Nặn đồ chơi", thơ, 80 chữ. Đích: 64–96.
- Mới: "Bé nhào đất" · thơ 4 chữ, 4 khổ.
- Nguồn: `original`.
- Phác: em nhào đất sét bên thềm, nặn quả, bát, con vật, tặng bố mẹ, ông bà, bạn; cảm xúc vui của người nhận. Câu thơ có chỗ đặt dấu phẩy khi liệt kê.
- Bước phụ thuộc: `khoi-dong`(?), `doc-bai-tho`, `do-be-da-nan`, `tang-cho-ai`, `tam-long-cua-be`, `em-thich-nan-gi`, `meo-thich-chi`, `tu-vui-mung`(?), `phieu-viet-bai-24`.

## Chủ điểm 5 (vùng xom-mai-am)

### tv2-t14-b25 · Chị em ong và bụi hoa tỉ muội · doc-truyen (đổi bài theo quyết định mới)
- Cũ: gốc "Sự tích hoa tỉ muội" 197 chữ; bản mẫu hiện tại "Hai anh em và đêm trăng gánh thóc" ~230 chữ (truyện kể ở nhiều nước, bị loại). Đích tính theo bài gốc: 158–236.
- Mới: "Cây khế" (ăn khế trả vàng) · truyện cổ tích Việt, kể lại.
- Nguồn: `folk`, tựa "Truyện cổ tích Cây khế" (truyện Việt).
- Phác: hai anh em chia gia tài, người anh chiếm hết, em chỉ được cây khế; chim lạ ăn khế, em may túi ba gang theo lời chim và lấy một ít vàng; anh đổi nhà đòi theo, mang quá nhiều, bị kiệt sức; kể nhẹ: anh mất hết, cuối cùng nhận ra lỗi, em vẫn đón anh. Hợp khung hai chị em ong (nhường và tham). Giữ: từ khó, chi tiết hai anh em đối xử, điều kì lạ, 4 tranh để xếp, kể lại.
- Bước phụ thuộc: `anh-chi-lam-cho-em`(?), `doc-su-tich`, `dem-nu-hoa`, `chi-tiet-dam-am`, `dieu-ki-la`, `ten-hoa-ti-muoi`, `hai-gio-tu-ngu`, `cau-ve-chi-net`, `chia-chum-hoa`, `doan-tranh-hai-anh-em`, `xep-tranh-hai-anh-em`, `ke-hai-anh-em`, `phieu-viet-bai-25`; cả phần tóm tắt, `sevenQuestions.learn`, `title` nhắc "hai anh em gánh thóc". Quest này đã viết xong ở pha 3: sửa lại cùng lượt với đợt này.
- Ghi chú: truyện phụ trong `doan-tranh-hai-anh-em`... đã là truyện chị em ong (không phải bài đọc); giữ nguyên.

### tv2-t14-b26 · Gà Con Mẩy đón em bé · tu-ngu-tinh-cam
- Cũ: "Em mang về yêu thương", thơ, 90 chữ. Đích: 72–108.
- Mới: "Em bé từ đâu đến" · thơ 5 chữ, 4 khổ hỏi – đáp.
- Nguồn: `original`.
- Phác: bạn nhỏ hỏi mẹ em bé đến từ đâu, đoán (từ sao, từ cánh diều, từ quả trứng…), mẹ đáp em mang cười và vui về nhà. Có nhiều từ tả em bé; câu hỏi gợi nhiều đáp án để làm bước nhiều lựa chọn.
- Bước phụ thuộc: `gap-ga-con-chip`(?), `doc-bai-tho`, `ta-em-be`, `em-tu-dau-den`, `em-mang-den-gi`, `tu-ta-em-be`, `cau-khen-em`, `phieu-viet-bai-26`.

### tv2-t15-b27 · Koala Na thao thức đêm hè · doc-tho
- Cũ: "Mẹ", thơ, 70 chữ. Đích: 56–84.
- Mới: "Lời ru của mẹ" · ba khổ ca dao, hát ru gộp lại.
- Nguồn: `folk` (ca dao, hát ru). Gợi ý: "Công cha như núi Thái Sơn…", "Gió mùa thu mẹ ru con ngủ…", "Ví dầu cầu ván đóng đinh…". Người viết đối chiếu ít nhất hai nguồn (như "Tục ngữ phong dao" của Nguyễn Văn Ngọc, 1928, ông mất 26/4/1942) để chốt bản truyền thống. Cần mục duyệt ở `allowed-traditional-passages.json`; vì ca dao có nhiều dị bản nên chọn dị bản khác sách.
- Phác: mẹ thức ru con, quạt, nuôi con; câu cuối nói công lao mẹ. Hợp khung đêm hè, võng, quạt.
- Bước phụ thuộc: `khoi-dong`(?), `doc-bai-tho`, `me-lam-gi`, `cau-tho-cuoi`, `tu-kho-dem-he`(từ khó mới), `tu-chi-hoat-dong`, `dat-cau-hoat-dong`, `xep-sau-dong-tho`, `hoc-thuoc-long`, `loi-nhan-cho-me`(?), `loi-biet-on`, `phieu-viet-bai-27`.
- Truyện phụ ("Sự tích cây vú sữa", truyện dân gian Việt kể lại): `doan-tranh-vu-sua`, `xep-tranh-vu-sua`, `ke-chuyen-vu-sua`, `cau-be-noi-gi`. Giữ nếu kể bằng lời mình.

### tv2-t15-b28 · Quán cỗ trong hang sư tử · dau-cau
- Cũ: "Trò chơi của bố", truyện, 184 chữ. Đích: 147–221.
- Mới: "Quán nhỏ của hai bố con" · truyện.
- Nguồn: `original`.
- Phác: bố và con trai mở "quán" bán hàng giả (lá làm tiền, sỏi làm kẹo), nói năng lịch sự (xưng "quý khách", "xin phép"); mẹ về thấy con đón bằng hai tay và nhớ ra điều gì. Giữ: trò chơi, cách xưng hô, nết ngoan bố dạy, mẹ nhớ lại.
- Bước phụ thuộc: `su-tu-con-doi`(?), `doc-truyen`, `xung-ho`, `me-nho-lai`, `net-ngoan`, `loi-noi-lich-su`(?), `dong-vai-goi-mon`(?), `phieu-viet-bai-28`. Hai đoạn văn phụ nằm trong bước (`tinh-cach-cua-bo`, `ke-ve-ai`, `cau-tinh-cam-voi-me`) và truyện cười `chuyen-cuoi-tu-duong` cũng phải viết lại.

### tv2-t16-b29 · Vết khắc trên cánh cửa chòi · doc-tho
- Cũ: "Cánh cửa nhớ bà", thơ, 61 chữ. Đích: 49–73.
- Mới: "Vạch chiều cao trên cột nhà" · thơ 5 chữ, 3 khổ.
- Nguồn: `original`.
- Phác: ngày bé cháu thấp, bà vạch chiều cao trên cột; năm nào cháu cũng cao thêm; nay cháu đi xa, nhìn vạch lại nhớ bà. Giữ: ai làm việc gì khi cháu nhỏ, vì sao đổi, câu thơ nói nhớ, từ chỉ hoạt động.
- Bước phụ thuộc: `doc-bai-tho`, `vi-sao-ba-cai-then-duoi`, `xep-tranh-ba-kho-tho`, `cau-tho-nho-ba`, `tu-chi-hoat-dong`, `viec-lam-voi-cua`, `phieu-viet-bai-29`. Tên bước nhắc "then dưới": nội dung đổi, id giữ.
- Truyện phụ ("Bà cháu", truyện dân gian Việt): `doan-tranh-ba-chau`, `nghe-chuyen-ba-chau`, `ke-chuyen-ba-chau`, `tap-ke-cho-ba`. Đề xuất thay bằng truyện khác vì "hạt thần, vàng bạc" gần Cây khế.

### tv2-t16-b30 · Dìu ông Vện qua dốc · tu-chi-su-vat-hoat-dong
- Cũ: "Thương ông", thơ kể chuyện, 80 chữ. Đích: 64–96.
- Mới: "Cháu dìu bà qua suối" · thơ kể chuyện 4 chữ.
- Nguồn: `original`. Đổi người được dìu từ ông thành bà trong bài đọc (khung quest vẫn là ông Vện: lời dẫn nối bằng thoại).
- Phác: bà đau chân, bước khó; bé nhanh nhẹn chạy tới dìu; bà bước lên thềm vui, khen cháu bé mà khoẻ. Giữ: bà bị sao, bé làm gì, tả dáng bé, lời khen, học thuộc một khổ.
- Bước phụ thuộc: `doc-thuong-ong`, `viet-giup-ong`, `dang-ve-cua-viet`, `vi-sao-be-ma-khoe`, `loi-khen-cua-ong`, `hoc-thuoc-kho-tho`, `me-may-ba-noi`(?), `buoc-len-them`(?), `phieu-viet-bai-30`.

### tv2-t17-b31 · Đèn vỏ trai cho mẹ Bống · doc-truyen
- Cũ: "Ánh sáng của yêu thương", truyện, 180 chữ. Đích: 144–216.
- Mới: "Khay đồng của Na" · truyện.
- Nguồn: `original`. Không dùng Ê-đi-xơn và tấm gương.
- Phác: đêm cúp đèn ở nhà sàn, bà đau bụng, thầy thuốc đến nhưng đèn dầu quá yếu; Na chạy ra, lấy khay đồng đánh bóng đặt sau đèn, ánh sáng nhân lên; thầy chữa kịp. Giữ: Na làm gì khi thấy bà đau, cách cứu, chi tiết lo lắng, từ khó, tình cảm.
- Bước phụ thuộc: `giup-nguoi-than-bi-met`(?), `doc-anh-sang-yeu-thuong`, `cach-cuu-me`, `chi-tiet-lo-cho-me`, `cau-van-voi-tranh`, `tu-moi-cua-rua`, `tinh-cam-cua-cau-be`, `nhan-vat-em-thich`, `thap-sang-hang`(?), `xep-tranh-e-di-xon`, `ke-theo-tranh`, `ke-cho-nguoi-than`, `phieu-viet-bai-31`. Đổi "mẹ" thành bà hoặc giữ mẹ, tuỳ người viết, miễn cùng quest.

### tv2-t17-b32 · Thỏ Tí giành chong chóng với em · dau-cau
- Cũ: "Chơi chong chóng", truyện, 171 chữ. Đích: 137–205.
- Mới: "Thuyền lá chuối" · truyện.
- Nguồn: `original`. Đồ chơi khác (thuyền lá, không phải chong chóng): đoạn mở tả cái thuyền để có câu tả đồ vật.
- Phác: anh Tuấn gấp thuyền lá chuối cho em Na thi trôi ở mương; anh luôn thắng; Na buồn; anh dạy em gấp mũi nhọn cho thuyền chạy nhanh; Na thắng một lần, hai anh em cười. Giữ: chi tiết tả đồ chơi, vì sao anh thắng, cách anh làm em vui, tình cảm anh em.
- Bước phụ thuộc: `doc-choi-chong-chong`, `vi-sao-an-luon-thang`, `cach-an-lam-em-vui`, `tinh-cam-an-va-mai`, `ta-chiec-chong-chong`, `sieu-va-phung-phiu`(?), `neu-em-la-mai`, `chia-chong-chong`(?), `phieu-viet-bai-32`. Tin nhắn `tin-nhan-cua-soc-nau`, thư ở `dau-phay-*` là văn bản phụ trong bước, cũng viết lại.

## Cuối kì (vùng lau-dai)

### tv2-t18-on-cuoi-ki · Khánh thành cầu treo trước cổng thành · doc-truyen (3 bài)
- **Bài 1.** Cũ: "Niềm vui là gì?", đối thoại ngắn, 55 chữ. Đích: 44–66.
  - Mới: "Biển là gì?" · đối thoại ngắn 3 lượt hỏi – đáp.
  - Nguồn: `original`.
  - Phác: hải âu hỏi cá, sò, thuyền "biển là gì?", mỗi bạn trả lời khác nhau. Đủ cho một câu hỏi "theo bạn X, biển là gì?" và nghe – viết.
  - Bước phụ thuộc: `niem-vui-cua-ban`, `phieu-viet-cuoi-ki`.
- **Bài 2.** Cũ: "Đàn mưa con", thơ, 80 chữ. Đích: 64–96.
  - Mới: "Dòng suối nhỏ đi xa" · thơ 5 chữ, 4 khổ.
  - Nguồn: `original`.
  - Phác: từ khe núi, suối nhỏ chảy qua bản, đồng ruộng, cầu, sông, ra biển; đọc thành tiếng, điền nơi suối đi qua.
  - Bước phụ thuộc: `doc-dan-mua-con`, `giot-mua-roi-dau`.
- **Bài 3.** Cũ: "Cỏ và lúa", truyện ngụ ngôn, 163 chữ. Đích: 130–196.
  - Mới: "Sự tích bánh chưng, bánh giầy" · truyền thuyết Việt, kể lại.
  - Nguồn: `folk`, tựa "Truyền thuyết Sự tích bánh chưng, bánh giầy".
  - Phác: vua cha thử các con tìm món ngon; người con út làm bánh từ gạo nếp, vuông tượng đất, tròn tượng trời; được chọn. Hai nhóm so sánh được (các anh tìm của lạ, con út dùng gạo nếp), hỏi vì sao chọn, ích lợi của lúa gạo, dấu câu.
  - Bước phụ thuộc: `chuyen-co-va-lua`, `co-lua-la-gi-cua-nhau`, `co-khac-lua`, `lua-co-ich`, `vi-sao-khong-ai-ua-co`, `dau-cau-co-va-lua`, `phieu-viet-cuoi-ki`. Đổi id chỉ khi lead cho phép.
- Phụ thuộc chéo: `ten-cac-bai-da-hoc`, `tu-chi-nguoi-chi-vat`, `bai-doc-em-nho-nhat` nhắc tên bài đã học của các quest trước (vd "Thả diều"): viết sau khi tên bài mới đã chốt. Truyện phụ về đàn gà: `xep-tranh-ga-me`, `ke-tiep-chuyen-ga`.

---

## Bảng đối chiếu để không lặp đề tài

- Truyện dân gian đã dùng một lần: Cây khế (t14-b25), Treo biển và Thầy bói xem voi (t09), Bánh chưng bánh giầy (t18), đồng dao Chi chi chành chành (t13-b23), ca dao hát ru (t15-b27). Hai truyện phụ dân gian cần giữ ở dạng kể lại khác: Sự tích cây vú sữa (t15-b27), Bà cháu (t16-b29; đề nghị thay).
- Đề tài tình cảm anh chị em: chỉ Cây khế và Thuyền lá chuối (t17-b32); Cây khế nói nhường và tham, Thuyền lá chuối nói kiên nhẫn, không trùng.
- Tình bạn: t11-b20, t10-b17, t10-b18, t02-b03 có khác nhau (làm quen / tìm bạn / xa cách / cùng chơi).
- Người thân lớn tuổi: t15-b27 (mẹ), t16-b29 (bà, vạch chiều cao), t16-b30 (bà, đau chân), t17-b31 (bà, đèn): các quest này đều có người thân đau/ nhớ; nên tách cảnh (đêm hè / vạch trên cột / suối / nhà sàn mất điện).
- Thơ tự viết: 13 bài, đổi nhịp (4 chữ, 5 chữ, lục bát, điệp khúc). Người viết phải đọc chéo kiểm không lặp câu giữa các bài.

## Tác giả hết bảo hộ: đã xem xét, không dùng

- Không có bài `public-domain` trong danh mục. Đã cân nhắc nguồn tiền chiến (Nguyễn Văn Vĩnh dịch La Fontaine, Quốc văn giáo khoa thư, Thạch Lam); không bài nào khớp thể loại và độ dài của bài cần thay (La Fontaine bản dịch Vĩnh là thơ ngắn, ngôn ngữ cổ, không khớp truyện 150–200 chữ). Không khai tác giả nào trong `source`.
- Chỉ tra được: Nguyễn Văn Ngọc (Ôn Như, 1/3/1890 – 26/4/1942), tác giả "Tục ngữ phong dao" (1928), Goodreads https://www.goodreads.com/author/list/15730049._n_Nh_Nguy_n_V_n_Ng_c và danh mục tham khảo trong https://www.college-de-france.fr/sites/default/files/media/document/2024-03/Bui%20Tran_2022-2023_Cours%205%20juin.pdf . Dùng làm nguồn đối chiếu bản truyền thống cho ca dao, không phải bài đọc. Chưa tra thêm được trang Wikisource xác nhận.

## Câu hỏi mở cho Jev

1. 30/36 bài là `original` (13 thơ, 17 bài văn xuôi, văn bản thông tin, đối thoại). Có muốn thêm ca dao, đồng dao chia vào vài bài thơ hay giữ để người viết tự viết?
2. Ba bài dân gian có nguy cơ trùng vân tay với sách giáo khoa (Chi chi chành chành, ca dao hát ru, Treo biển): chấp nhận thêm mục duyệt hay đổi bài?
3. Quest `tv2-t09` và `tv2-t18` phụ thuộc tên bài của các quest khác: viết hai quest này sau cùng.
4. Truyện phụ (nghe/kể theo tranh) có 12 quest cần lời kể trong game: viết riêng trong từng đợt hay lập thêm danh mục truyện phụ?
