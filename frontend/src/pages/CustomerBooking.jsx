import { useParams } from 'react-router-dom';
import Stub from '@/pages/_Stub';
export default function CustomerBooking() {
  const { driverId } = useParams();
  return <Stub title="預約表單" note={`Step 9 實作：向司機 ${driverId} 送出預約 + 預估價格。`} />;
}
