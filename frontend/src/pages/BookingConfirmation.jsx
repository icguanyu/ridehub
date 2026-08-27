import { useParams, useSearchParams } from 'react-router-dom';
import Stub from '@/pages/_Stub';
export default function BookingConfirmation() {
  const { bookingId } = useParams();
  const [sp] = useSearchParams();
  return (
    <Stub
      title="預約狀態"
      note={`Step 9 實作：以 token 查詢預約 ${bookingId} 狀態（token=${sp.get('token') ? '已帶' : '缺'}）。`}
    />
  );
}
