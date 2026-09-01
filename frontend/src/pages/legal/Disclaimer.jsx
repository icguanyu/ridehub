import { List } from '@mantine/core';
import LegalPage, { Section, P } from './LegalPage';

export default function Disclaimer() {
  return (
    <LegalPage title="使用須知" updated="2026-09-01">
      <Section heading="RideHub 是什麼">
        <P>
          RideHub 是一個<b>免費</b>的媒合工具，幫司機和乘客互相找到對方。
          我們不是車行、不派車，也不是乘車契約的一方——車是司機開的，行程是你們之間的約定。
        </P>
        <P>本平台由 icguanyu@gmail.com 營運。</P>
      </Section>

      <Section heading="使用年齡限制">
        <P>
          本服務僅供年滿 18 歲或具有完全行為能力的人使用。未成年人請勿自行使用本平台，
          如需使用請由法定代理人代為操作並承擔相關責任。
        </P>
      </Section>

      <Section heading="不收費、不經手錢">
        <P>
          平台完全免費，也不經手任何車資。頁面上的價格是司機自己設定的，
          實際費用與付款方式請你們自行談定、直接結算。
        </P>
      </Section>

      <Section heading="我們不做身分或安全查核">
        <P>
          我們不會查核司機的駕照、保險、車況，也不查乘客的身分。
          要不要上車、要不要接這筆單，請自行評估。乘車前建議先確認對方身分與第三人責任險，並留下紀錄。
        </P>
      </Section>

      <Section heading="司機須自行確認合法性">
        <P>
          透過本平台提供載客服務的司機，須自行確認其行為符合中華民國道路交通相關法令。
          平台不代表任何司機具有合法營業資格，亦不對司機行為的合法性負責。
          若因違規載客遭受裁罰或其他法律後果，由司機自行承擔。
        </P>
      </Section>

      <Section heading="風險與糾紛由雙方自理">
        <P>乘車過程中的任何狀況，由司機和乘客自行處理，平台不負責、也不介入調解，包括：</P>
        <List size="sm" spacing="xs" withPadding>
          <List.Item>交通事故、受傷、財物損失</List.Item>
          <List.Item>車資爭議、拒付、爽約、遲到、繞路</List.Item>
          <List.Item>言語衝突、騷擾或其他不法行為</List.Item>
        </List>
        <P>發生事故或涉及犯罪，請直接報警或聯絡相關單位。</P>
      </Section>

      <Section heading="服務現況">
        <P>
          服務仍在初期營運，可能調整功能或短暫暫停維護；LINE 通知也可能延遲或未送達，
          請勿僅依賴通知確認預約狀態。我們保留停用違規或影響他人帳號的權利。
        </P>
      </Section>

      <Section heading="準據法與管轄">
        <P>
          本使用須知依中華民國法律解釋及執行。因使用本平台所生之任何爭議，
          以台灣台北地方法院為第一審合意管轄法院。
        </P>
      </Section>

      <Section heading="聯絡我們">
        <P>有任何問題，來信 icguanyu@gmail.com。本頁若有更新會直接公告於此。</P>
      </Section>
    </LegalPage>
  );
}
