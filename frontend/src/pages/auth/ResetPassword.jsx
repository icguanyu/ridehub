import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, PasswordInput, Button, Stack, Title, Text, Anchor, Loader, Center } from '@mantine/core';
import { useForm } from '@mantine/form';
import { supabase } from '@/lib/supabase';
import { notifyOk, notifyErr } from '@/lib/notify';

// 'checking' → 判斷 recovery 連結有沒有效
// 'ready'    → 有暫時 session，可設定新密碼
// 'invalid'  → 連結無效 / 已過期 / 直接開這頁
export default function ResetPassword() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let settled = false;
    const ok = () => {
      settled = true;
      setStatus('ready');
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) ok();
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) ok();
    });

    const timer = setTimeout(() => {
      if (!settled) setStatus('invalid');
    }, 2500);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const form = useForm({
    initialValues: { password: '', confirm: '' },
    validate: {
      password: (v) => (v.length >= 8 ? null : '密碼至少 8 碼'),
      confirm: (v, values) => (v === values.password ? null : '兩次輸入不一致'),
    },
  });

  const submit = form.onSubmit(async ({ password }) => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await supabase.auth.signOut();
      notifyOk('密碼已更新，請用新密碼登入');
      navigate('/login', { replace: true });
    } catch (e) {
      notifyErr(e, '更新失敗，連結可能已過期');
    } finally {
      setSaving(false);
    }
  });

  if (status === 'checking') {
    return (
      <Card radius="xl" p="lg">
        <Center py="xl">
          <Loader size="sm" />
        </Center>
      </Card>
    );
  }

  if (status === 'invalid') {
    return (
      <Card radius="xl" p="lg">
        <Stack>
          <Title order={3}>連結無效或已過期</Title>
          <Text size="sm" c="dimmed">
            重設連結只在 1 小時內有效，且僅能使用一次。請重新申請。
          </Text>
          <Anchor component={Link} to="/forgot-password" size="sm">
            重新申請重設連結
          </Anchor>
        </Stack>
      </Card>
    );
  }

  return (
    <Card radius="xl" p="lg">
      <form onSubmit={submit}>
        <Stack>
          <Title order={3}>設定新密碼</Title>
          <PasswordInput label="新密碼" {...form.getInputProps('password')} />
          <PasswordInput label="再次輸入新密碼" {...form.getInputProps('confirm')} />
          <Button type="submit" loading={saving} fullWidth>
            更新密碼
          </Button>
        </Stack>
      </form>
    </Card>
  );
}
