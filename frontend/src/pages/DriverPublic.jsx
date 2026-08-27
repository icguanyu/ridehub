import { useParams } from 'react-router-dom';
import Stub from '@/pages/_Stub';
export default function DriverPublic() {
  const { driverId } = useParams();
  return <Stub title="司機專屬頁" note={`Step 9 實作：司機 ${driverId} 的公開資訊 + 「預約此司機」。`} />;
}
