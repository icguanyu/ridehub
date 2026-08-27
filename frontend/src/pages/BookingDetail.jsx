import { useParams } from 'react-router-dom';
import Stub from '@/pages/_Stub';
export default function BookingDetail() {
  const { bookingId } = useParams();
  return <Stub title="預約詳情" note={`Step 8 實作：預約 ${bookingId} 的接受 / 拒絕操作。`} />;
}
