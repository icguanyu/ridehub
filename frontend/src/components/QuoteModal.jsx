import { useState, useEffect } from 'react';
import { Modal, NumberInput, Textarea, Button, Group, Text } from '@mantine/core';
import { fmtMoney } from '@/lib/format';

export default function QuoteModal({ booking, opened, onClose, onConfirm, busy }) {
  const [price, setPrice] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (opened) {
      setPrice(booking?.estimatedPrice ?? '');
      setNote('');
    }
  }, [opened, booking]);

  return (
    <Modal opened={opened} onClose={onClose} title="重新報價" centered>
      <Text size="sm" c="dimmed" mb="sm">
        {booking?.customerName}・{booking?.pickupLocation} → {booking?.destination}
        <br />
        原預估：{fmtMoney(booking?.estimatedPrice)}
      </Text>
      <NumberInput
        label="新報價 (NT$)"
        min={1}
        value={price}
        onChange={setPrice}
        thousandSeparator=","
      />
      <Textarea
        mt="sm"
        label="給客人的說明（選填）"
        placeholder="例如：往返含等候一小時"
        autosize
        minRows={2}
        maxLength={500}
        value={note}
        onChange={(e) => setNote(e.currentTarget.value)}
      />
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onClose}>
          取消
        </Button>
        <Button
          color="orange"
          loading={busy}
          disabled={!price || Number(price) <= 0}
          onClick={() => onConfirm({ price: Number(price), note })}
        >
          送出報價
        </Button>
      </Group>
    </Modal>
  );
}
