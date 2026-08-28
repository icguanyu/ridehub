import { List, Text } from '@mantine/core';
import LegalPage, { Section, P } from './LegalPage';

export default function Disclaimer() {
  return (
    <LegalPage title="免責聲明與服務條款" updated="2026-08-28">
      <Section heading="1. 平台性質">
        <P>
          RideHub（以下稱「本平台」）由 [營運者名稱／統一編號] 營運，係一「資訊媒合平台」，
          僅提供司機刊登服務資訊、乘客提出預約需求，以及雙方聯繫所需之技術工具。
        </P>
        <P>
          本平台<Text span fw={700}>不是運輸業者、不是計程車行、不是車隊，也不是任何運送契約的當事人</Text>。
          運送服務之提供者為司機本人，乘車契約存在於司機與乘客之間，與本平台無涉。
        </P>
      </Section>

      <Section heading="2. 不涉及金流">
        <P>
          本平台<Text span fw={700}>不向司機或乘客收取任何費用，也不經手、代收或代付任何車資</Text>。
          頁面上顯示的價格僅為司機自行設定之估算或報價，實際車資、付款方式與時點，
          均由司機與乘客自行約定並直接結算，本平台不介入、不擔保、不負責。
        </P>
      </Section>

      <Section heading="3. 不擔保事項">
        <P>本平台不對下列事項作任何明示或默示之擔保：</P>
        <List size="sm" spacing="xs" withPadding>
          <List.Item>司機之身分、駕照、職業登記、犯罪紀錄、健康狀況或駕駛能力</List.Item>
          <List.Item>車輛之所有權、檢驗狀態、保養狀況、乘客責任險或其他保險之有無與額度</List.Item>
          <List.Item>行駛過程之安全、準時、路線合理性或服務品質</List.Item>
          <List.Item>乘客之身分、行為、付款意願與能力</List.Item>
          <List.Item>預約必然成立、司機必然到場、行程必然完成</List.Item>
          <List.Item>平台資訊（含價格、時間、地點、聯絡方式）之正確性、即時性或完整性</List.Item>
        </List>
        <P>
          使用者應於乘車前自行查證對方身分、確認保險與安全狀況，並自行保留必要紀錄。
        </P>
      </Section>

      <Section heading="4. 風險自負與糾紛處理">
        <P>
          使用本平台媒合之服務，其一切風險由司機與乘客自行承擔。對於下列情形，
          本平台<Text span fw={700}>不負任何責任，亦非調解或仲裁之一方</Text>：
        </P>
        <List size="sm" spacing="xs" withPadding>
          <List.Item>交通事故、人身傷亡、財物毀損或遺失</List.Item>
          <List.Item>車資爭議、拒付、超收、找零糾紛</List.Item>
          <List.Item>爽約、遲到、臨時取消、繞路</List.Item>
          <List.Item>言語衝突、騷擾、歧視、暴力或其他不法行為</List.Item>
          <List.Item>因對方提供不實資訊所生之損害</List.Item>
        </List>
        <P>
          上述糾紛應由司機與乘客自行協商解決；涉及犯罪或事故者，應逕向警方、消防或
          相關主管機關報案處理。
        </P>
      </Section>

      <Section heading="5. 通知服務">
        <P>
          本平台透過 LINE 或簡訊發送預約相關通知，惟不擔保訊息必然送達或即時送達。
          使用者不得僅以「未收到通知」為由，向本平台主張任何權利或損害賠償。
        </P>
      </Section>

      <Section heading="6. 責任限制">
        <P>
          在中華民國法律允許之最大範圍內，本平台就使用者因使用或無法使用本服務所生之
          任何直接、間接、附隨或衍生之損害，不負賠償責任。若依法仍應負責，其賠償總額
          以使用者實際支付予本平台之費用為上限（因本服務免費，故為新臺幣 0 元）。
        </P>
        <P>
          本條不排除依法不得預先免除之責任（例如故意或重大過失所致者）。
        </P>
      </Section>

      <Section heading="7. 服務變更與中斷">
        <P>
          本平台得隨時新增、修改、暫停或終止全部或部分服務，並得停權或移除違反本聲明、
          法令或有損其他使用者權益之帳號，無須事先通知，亦不負賠償責任。
        </P>
      </Section>

      <Section heading="8. 準據法與管轄">
        <P>
          本聲明之解釋與適用，以中華民國法律為準據法。因本服務所生之爭議，
          以 [臺灣○○地方法院] 為第一審管轄法院。
        </P>
      </Section>

      <Section heading="9. 條款修改">
        <P>
          本平台得隨時修訂本聲明，修訂後公告於本頁面即生效。使用者於修訂後繼續使用本服務，
          視為同意修訂內容。
        </P>
      </Section>

      <Section heading="10. 聯絡方式">
        <P>對本聲明有疑問，請來信 [聯絡信箱]。</P>
      </Section>
    </LegalPage>
  );
}
