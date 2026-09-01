import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, TextInput, Button, Stack, Title, Text, Anchor } from '@mantine/core';
import { useForm } from '@mantine/form';
import { supabase } from '@/lib/supabase';
import { notifyErr } from '@/lib/notify';

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: { email: '' },
    validate: {
      email: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : '請輸入有效的 Email'),
    },
  });

  const submit = form.onSubmit(async ({ email }) => {
    setLoading(true);
    try {
      // resetPasswordForEmail 不論該 email 是否存在都回成功，避免帳號枚舉
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (e) {
      notifyErr(e, '寄送失敗');
    } finally {
      setLoading(false);
    }
  });

  return (
    <Card radius="xl" p="lg">
      {sent ? (
        <Stack>
          <Title order={3}>信件已寄出</Title>
          <Text size="sm" c="dimmed">
            如果這個 Email 有註冊過司機帳號，我們已寄出一封重設密碼的信。
            連結 1 小時內有效，請到信箱收信（也看一下垃圾郵件夾）。
          </Text>
          <Anchor component={Link} to="/login" size="sm">
            返回登入
          </Anchor>
        </Stack>
      ) : (
        <form onSubmit={submit}>
          <Stack>
            <Title order={3}>忘記密碼</Title>
            <Text size="sm" c="dimmed">
              輸入你註冊時使用的 Email，我們會寄一封重設連結給你。
            </Text>
            <TextInput
              label="Email"
              placeholder="you@example.com"
              inputMode="email"
              {...form.getInputProps('email')}
            />
            <Button type="submit" loading={loading} fullWidth>
              寄送重設連結
            </Button>
            <Anchor component={Link} to="/login" size="sm" ta="center">
              返回登入
            </Anchor>
          </Stack>
        </form>
      )}
    </Card>
  );
}
