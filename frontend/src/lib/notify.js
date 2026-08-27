import { notifications } from '@mantine/notifications';
import { apiErrorMessage } from '@/lib/api';

export const notifyOk = (message, title = '成功') =>
  notifications.show({ color: 'green', title, message });

export const notifyErr = (err, title = '錯誤') =>
  notifications.show({ color: 'red', title, message: apiErrorMessage(err) });
