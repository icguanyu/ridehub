import { useState, useEffect } from 'react';
import { Modal, Textarea, Button, Group, Text } from '@mantine/core';

export default function RejectBookingModal({ booking, opened, onClose, onConfirm, busy }) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (opened) setReason('');
  }, [opened]);

  return (
    <Modal opened={opened} onClose={onClose} title="拒絕預約" centered>
      <Text size="sm" c="dimmed" mb="sm">
        {booking?.customerName}・{booking?.pickupLocation} → {booking?.destination}
      </Text>
      <Textarea
        label="拒絕原因（選填，會通知客人）"
        placeholder="例如：該時段已有預約"
        autosize
        minRows={2}
        maxLength={500}
        value={reason}
        onChange={(e) => setReason(e.currentTarget.value)}
      />
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onClose}>
          取消
        </Button>
        <Button color="danger" loading={busy} onClick={() => onConfirm(reason)}>
          確認拒絕
        </Button>
      </Group>
    </Modal>
  );
}
