import { List } from '@mantine/core';
import LegalPage, { Section, P } from './LegalPage';

export default function Disclaimer() {
  return (
    <LegalPage title="使用須知" updated="2026-08-28">
      <Section heading="RideHub 是什麼">
        <P>
          RideHub 是一個<b>免費、測試中</b>的媒合工具，幫司機和乘客互相找到對方。
          我們不是車行、不派車，也不是乘車契約的一方——車是司機開的，行程是你們之間的約定。
        </P>
        <P>本平台由 icguanyu@gmail.com 營運。</P>
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
          要不要上車、要不要接這筆單，請自行評估。乘車前建議先確認對方身分與保險，並留下紀錄。
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

      <Section heading="還在測試階段">
        <P>
          服務仍在試營運，可能有錯誤、可能暫停或隨時調整功能；LINE／簡訊通知也可能延遲或未送達，
          請不要只依賴通知，並多多包涵。我們得隨時停用違規或影響他人的帳號。
        </P>
      </Section>

      <Section heading="聯絡我們">
        <P>有任何問題，來信 icguanyu@gmail.com。本頁若有更新會直接公告於此。</P>
      </Section>
    </LegalPage>
  );
}
