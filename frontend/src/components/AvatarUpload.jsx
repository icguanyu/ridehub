import { useRef, useState } from 'react';
import { Avatar, Button, Group, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { notifyOk, notifyErr } from '@/lib/notify';
import { compressImage } from '@/lib/image';

// 選圖上限（壓縮前）。避免使用者丟進超巨大的原檔把瀏覽器卡死。
const MAX_PICK_BYTES = 20 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

// onUpload(file) / onRemove() 皆回傳 Promise（通常是 mutation 的 mutateAsync）
export default function AvatarUpload({ url, name, onUpload, onRemove, busy = false }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  const clientError = (msg) =>
    notifications.show({ color: 'red', title: '錯誤', message: msg });

  const [working, setWorking] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ALLOWED.includes(file.type)) return clientError('只接受 JPG / PNG / WebP 圖片');
    if (file.size > MAX_PICK_BYTES) return clientError('原始檔案過大，請選小一點的圖片');

    setWorking(true);
    let localUrl;
    try {
      // 縮到 512px、壓到 ~300KB 再上傳，不送原圖。
      const compressed = await compressImage(file, { maxDim: 512, targetBytes: 300 * 1024 });
      localUrl = URL.createObjectURL(compressed);
      setPreview(localUrl);
      await onUpload(compressed);
      notifyOk('大頭貼已更新');
    } catch (err) {
      notifyErr(err);
    } finally {
      if (localUrl) URL.revokeObjectURL(localUrl);
      setPreview(null);
      setWorking(false);
    }
  };

  const handleRemove = async () => {
    try {
      await onRemove();
      notifyOk('已移除大頭貼');
    } catch (err) {
      notifyErr(err);
    }
  };

  const pending = busy || working;

  return (
    <Group wrap="nowrap">
      <Avatar src={preview || url || null} name={name ? name[0] : undefined} size={72} radius="50%" color="teal" />
      <Stack gap={6}>
        <Group gap="xs">
          <Button size="xs" variant="light" loading={pending} onClick={() => inputRef.current?.click()}>
            {url ? '更換' : '上傳大頭貼'}
          </Button>
          {url && (
            <Button size="xs" variant="subtle" color="red" disabled={pending} onClick={handleRemove}>
              移除
            </Button>
          )}
        </Group>
        <Text size="xs" c="dimmed">
          JPG / PNG / WebP，系統會自動壓縮，直接選原圖即可
        </Text>
      </Stack>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={handleFile}
      />
    </Group>
  );
}
