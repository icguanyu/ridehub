import { useState } from 'react';
import {
  Card,
  Stack,
  Title,
  Text,
  Button,
  Group,
  Badge,
  Code,
  Anchor,
  Collapse,
  TextInput,
  Divider,
  CopyButton,
} from '@mantine/core';
import { QRCodeCanvas } from 'qrcode.react';
import { useForm } from '@mantine/form';
import { useCreateLineLinkCode, useBindLine, useDriver } from '@/hooks/useDriver';
import { notifyOk, notifyErr } from '@/lib/notify';

export default function LineBindingCard({ driverId }) {
  const { data: driver, refetch, isFetching } = useDriver(driverId);
  const createCode = useCreateLineLinkCode(driverId);
  const bindLine = useBindLine(driverId);
  const [code, setCode] = useState(null);
  const [showManual, setShowManual] = useState(false);

  const linked = Boolean(driver?.lineId);

  const manualForm = useForm({
    initialValues: { lineId: '' },
    validate: { lineId: (v) => (v.trim() ? null : '請輸入 LINE User ID') },
  });

  const genCode = () =>
    createCode.mutate(undefined, {
      onSuccess: (d) => setCode(d),
      onError: (e) => notifyErr(e),
    });

  const submitManual = manualForm.onSubmit((v) =>
    bindLine.mutate(v.lineId.trim(), {
      onSuccess: () => {
        notifyOk('LINE 已綁定');
        setShowManual(false);
      },
      onError: (e) => notifyErr(e),
    }),
  );

  return (
    <Card withBorder radius="md" p="lg">
      <Stack>
        <Group justify="space-between">
          <Title order={4}>LINE 通知</Title>
          {linked ? (
            <Badge color="brand" variant="light">
              已綁定
            </Badge>
          ) : (
            <Badge color="gray" variant="light">
              未綁定
            </Badge>
          )}
        </Group>

        {linked ? (
          <>
            <Text size="sm" c="dimmed">
              新預約、客人回應報價都會即時推播到你的 LINE。
            </Text>
            <Button variant="light" size="xs" w="fit-content" onClick={genCode} loading={createCode.isPending}>
              重新綁定其他 LINE 帳號
            </Button>
          </>
        ) : (
          <Text size="sm" c="dimmed">
            綁定後，新預約會即時推播到你的 LINE。點下方產生綁定碼，加官方帳號好友後把碼傳給它即可。
          </Text>
        )}

        {!linked && !code && (
          <Button onClick={genCode} loading={createCode.isPending}>
            產生綁定碼
          </Button>
        )}

        {code && (
          <Card withBorder bg="brand.0" radius="md" p="md">
            <Stack gap="sm" align="center">
              <Text size="sm" c="dimmed">
                步驟 1：加入官方帳號好友
              </Text>
              {code.addFriendUrl ? (
                <>
                  <QRCodeCanvas value={code.addFriendUrl} size={130} />
                  <Anchor href={code.addFriendUrl} target="_blank" size="sm">
                    或點此加入
                  </Anchor>
                </>
              ) : (
                <Text size="xs" c="dimmed">
                  （尚未設定官方帳號連結，請掃描官方帳號 QR 或搜尋其 ID 加好友）
                </Text>
              )}

              <Divider w="100%" />

              <Text size="sm" c="dimmed">
                步驟 2：把這組代碼傳給官方帳號（{code.ttlMinutes} 分鐘內有效）
              </Text>
              <Group>
                <Code fz="xl" fw={700} px="md" py={4}>
                  {code.code}
                </Code>
                <CopyButton value={code.code}>
                  {({ copied, copy }) => (
                    <Button size="xs" variant="default" onClick={copy}>
                      {copied ? '已複製' : '複製'}
                    </Button>
                  )}
                </CopyButton>
              </Group>

              <Button
                mt="xs"
                variant="light"
                loading={isFetching}
                onClick={() =>
                  refetch().then((r) => {
                    if (r.data?.lineId) {
                      notifyOk('LINE 綁定成功！');
                      setCode(null);
                    } else {
                      notifyErr(new Error('尚未偵測到綁定，請確認已把代碼傳給官方帳號'));
                    }
                  })
                }
              >
                我已傳送，檢查綁定狀態
              </Button>
            </Stack>
          </Card>
        )}

        <Anchor size="xs" c="dimmed" onClick={() => setShowManual((s) => !s)} component="button" type="button">
          {showManual ? '收起' : '進階：直接輸入 LINE User ID'}
        </Anchor>
        <Collapse in={showManual}>
          <form onSubmit={submitManual}>
            <Group align="end">
              <TextInput
                flex={1}
                label="LINE User ID"
                placeholder="U1234567890abcdef..."
                {...manualForm.getInputProps('lineId')}
              />
              <Button type="submit" variant="light" loading={bindLine.isPending}>
                綁定
              </Button>
            </Group>
          </form>
        </Collapse>
      </Stack>
    </Card>
  );
}
