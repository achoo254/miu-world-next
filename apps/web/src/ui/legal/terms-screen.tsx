// NEW SCREEN: trang Điều khoản sử dụng công khai (không cần đăng nhập), chỉ để đọc: không ai phải chấp nhận, lời đồng ý
// không nhắc tới. Nội dung ở content/legal/terms-vi.json; địa chỉ liên hệ là contactEmail của trang Quyền riêng tư.
import { PrivacyDocument, TermsDocument } from '@miu/schema/content';
import privacyJson from '../../../../../content/legal/privacy-vi.json';
import termsJson from '../../../../../content/legal/terms-vi.json';
import { LegalPage } from './legal-page';

const TERMS = TermsDocument.parse(termsJson);
/** One address for both pages; content:check fails while the terms point to it and it is unset. */
const CONTACT_EMAIL = PrivacyDocument.parse(privacyJson).contactEmail;

export function TermsScreen() {
  return (
    <LegalPage text={TERMS} dataId="terms">
      {CONTACT_EMAIL ? (
        <section data-id="terms-contact">
          <h2>Liên hệ</h2>
          <p>
            Câu hỏi về điều khoản, hay một quyết định kiểm duyệt bạn thấy chưa đúng, gửi thư tới <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Đừng gửi mật khẩu hay thông tin của trẻ qua thư.
          </p>
        </section>
      ) : null}
    </LegalPage>
  );
}
