import { List, Anchor } from '@mantine/core';
import LegalPage, { Section, P } from './LegalPage';

export default function PrivacyPolicy() {
  return (
    <LegalPage title="隱私說明" updated="2026-09-01">
      <Section heading="誰在處理你的資料">
        <P>
          本平台由 icguanyu@gmail.com 營運，並依此說明蒐集、處理及利用你的個人資料。
          蒐集依據為當事人同意（個人資料保護法第 19 條第 1 項第 5 款）。
        </P>
      </Section>

      <Section heading="我們收集什麼">
        <P>司機：姓名、電話、Email、LINE ID、車型車牌、服務區域、定價。</P>
        <P>
          乘客：姓名、手機號碼、LINE ID（選填）、上車與目的地、預約時間、乘車人數、備註。
          我們不會抓取你的定位，地點都是你自己輸入的。
        </P>
      </Section>

      <Section heading="拿來做什麼">
        <List size="sm" spacing="xs" withPadding>
          <List.Item>幫司機和乘客媒合、管理預約</List.Item>
          <List.Item>透過 LINE 通知司機新預約與報價回應</List.Item>
          <List.Item>提供司機看自己的營運數字（筆數、營收、乘客數）</List.Item>
        </List>
      </Section>

      <Section heading="誰看得到">
        <List size="sm" spacing="xs" withPadding>
          <List.Item>乘客送出預約後，資料會提供給被預約的那位司機，方便聯繫。</List.Item>
          <List.Item>司機的名稱、車型、服務區域、參考價格、對外 LINE ID 會顯示在他的公開頁面。</List.Item>
          <List.Item>
            給司機的通知經由 LINE（LINE Corporation）傳送，LINE 訊息內容受 LINE 隱私政策規範；
            資料存放在雲端資料庫（Supabase，伺服器位於美國，符合 SOC 2 資安標準）。
          </List.Item>
        </List>
        <P>我們不會販售你的個人資料。</P>
      </Section>

      <Section heading="資料保存期限">
        <P>
          帳號刪除後，個人資料將於 90 天內自資料庫移除。
          預約紀錄在完成或取消後保存 180 天，屆期自動刪除。
          若本服務永久終止，我們將提前 30 天公告，並在公告期滿後 30 天內刪除所有個人資料。
        </P>
      </Section>

      <Section heading="瀏覽器儲存">
        <P>
          我們用瀏覽器的 localStorage 記住少量資料（例如查詢行程時「記住我」的手機號碼、司機登入憑證），
          你可以自行在瀏覽器清除。
        </P>
      </Section>

      <Section heading="想查詢或刪除資料">
        <P>
          寄信到 <Anchor href="mailto:icguanyu@gmail.com">icguanyu@gmail.com</Anchor>，
          就可以要求查詢、更正或刪除你的資料。刪除後可能就無法繼續使用服務。
        </P>
      </Section>

      <Section heading="這頁可能會改">
        <P>內容有更新時會公告於本頁並更新日期。</P>
      </Section>
    </LegalPage>
  );
}
