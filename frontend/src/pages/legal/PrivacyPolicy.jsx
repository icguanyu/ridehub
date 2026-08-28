import { List, Anchor } from '@mantine/core';
import LegalPage, { Section, P } from './LegalPage';

export default function PrivacyPolicy() {
  return (
    <LegalPage title="隱私權政策" updated="2026-08-28">
      <Section heading="1. 總則">
        <P>
          RideHub（以下稱「本平台」，由 [營運者名稱／統一編號] 營運）依《個人資料保護法》
          及相關法令蒐集、處理及利用您的個人資料。使用本服務即表示您已閱讀並同意本政策。
        </P>
      </Section>

      <Section heading="2. 蒐集的資料">
        <P>司機：姓名、電話、電子郵件、LINE ID、車型與車牌、服務區域、定價設定、帳號登入資訊。</P>
        <P>
          乘客：姓名、手機號碼、LINE ID（選填）、上車與目的地、預約與回程時間、乘車人數、
          特殊需求備註。本平台不主動蒐集您的精確定位，地點由您自行輸入。
        </P>
        <P>
          系統自動記錄：通知發送狀態記錄（notifications_log）、必要的操作與錯誤紀錄。
        </P>
      </Section>

      <Section heading="3. 利用目的">
        <List size="sm" spacing="xs" withPadding>
          <List.Item>媒合司機與乘客、建立與管理預約</List.Item>
          <List.Item>透過 LINE 或簡訊發送預約狀態通知</List.Item>
          <List.Item>將必要資訊顯示給對應的另一方（見第 4 點）</List.Item>
          <List.Item>司機營運數據統計（成交筆數、營收、乘客數）</List.Item>
          <List.Item>帳號驗證、客訴處理、防範濫用與履行法令義務</List.Item>
        </List>
      </Section>

      <Section heading="4. 資料揭露與第三方">
        <List size="sm" spacing="xs" withPadding>
          <List.Item>
            <b>提供給司機</b>：乘客送出預約後，其姓名、電話、LINE ID、行程資訊會提供給
            被預約的該位司機，以利聯繫與提供服務。
          </List.Item>
          <List.Item>
            <b>公開顯示</b>：司機的名稱、車型、服務區域、參考價格、對外 LINE ID 會顯示於
            該司機的公開頁面。
          </List.Item>
          <List.Item>
            <b>通知服務商</b>：通知經由 LINE（LINE Corporation）及簡訊服務商（Twilio）傳送，
            內容包含姓名、電話、行程摘要。
          </List.Item>
          <List.Item>
            <b>雲端服務</b>：資料儲存於 Supabase 提供之資料庫服務，伺服器可能位於中華民國境外。
          </List.Item>
          <List.Item>
            <b>法令要求</b>：於司法或主管機關依法要求時，本平台將配合提供。
          </List.Item>
        </List>
        <P>本平台不會出售您的個人資料。</P>
      </Section>

      <Section heading="5. Cookie 與本機儲存">
        <P>
          本平台使用瀏覽器 localStorage 儲存少量資料以提升便利性，例如：查詢行程時
          「記住我」所保存的手機號碼、司機登入憑證。您可自行於瀏覽器清除。
        </P>
      </Section>

      <Section heading="6. 外部連結">
        <P>
          本平台頁面可能包含前往 LINE 加好友、Google 地圖導航等第三方連結。這些網站
          有其各自的隱私權政策，本平台不負責其資料處理行為。
        </P>
      </Section>

      <Section heading="7. 保存期間">
        <P>
          您的個人資料於帳號存續期間及達成上述利用目的之必要期間內保存；逾期或經您請求
          刪除後，除法令另有規定外，本平台將刪除或匿名化。
        </P>
      </Section>

      <Section heading="8. 您的權利">
        <P>依《個人資料保護法》第 3 條，您得就本平台保有之個人資料行使下列權利：</P>
        <List size="sm" spacing="xs" withPadding>
          <List.Item>查詢、請求閱覽或請求製給複製本</List.Item>
          <List.Item>請求補充或更正</List.Item>
          <List.Item>請求停止蒐集、處理或利用</List.Item>
          <List.Item>請求刪除</List.Item>
        </List>
        <P>行使方式：來信 [聯絡信箱]，本平台將於法定期限內回覆。部分請求可能導致無法繼續提供服務。</P>
      </Section>

      <Section heading="9. 兒童">
        <P>本服務非針對未滿 18 歲之未成年人設計。未成年人應在法定代理人同意下使用。</P>
      </Section>

      <Section heading="10. 政策修改">
        <P>本政策修訂後將公告於本頁面，並更新「最後更新」日期。</P>
      </Section>

      <Section heading="11. 聯絡方式">
        <P>
          個資相關事項請聯絡：<Anchor href="mailto:[聯絡信箱]">[聯絡信箱]</Anchor>
        </P>
      </Section>
    </LegalPage>
  );
}
