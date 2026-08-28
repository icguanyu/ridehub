import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Card, TextInput, PasswordInput, Button, Stack, Title, Text, Anchor } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useRegister } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { notifyErr, notifyOk } from '@/lib/notify';

export default function DriverSignup() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const register = useRegister();

  useEffect(() => {
    if (token) navigate('/dashboard', { replace: true });
  }, [token, navigate]);

  const form = useForm({
    initialValues: { name: '', phone: '', email: '', password: '' },
    validate: {
      name: (v) => (v.trim() ? null : '請輸入姓名'),
      phone: (v) => (/^09\d{8}$/.test(v) ? null : '手機格式需為 09xxxxxxxx'),
      email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'email 格式錯誤'),
      password: (v) => (v.length >= 8 ? null : '密碼至少 8 碼'),
    },
  });

  const submit = form.onSubmit((values) => {
    register.mutate(values, {
      onSuccess: () => {
        notifyOk('註冊成功，歡迎加入！');
        navigate('/dashboard/edit', { replace: true });
      },
      onError: (e) => notifyErr(e, '註冊失敗'),
    });
  });

  return (
    <Card radius="xl" p="lg">
      <form onSubmit={submit}>
        <Stack>
          <Title order={3}>司機註冊</Title>
          <TextInput label="姓名" placeholder="王小明" {...form.getInputProps('name')} />
          <TextInput
            label="手機"
            placeholder="0912345678"
            inputMode="numeric"
            {...form.getInputProps('phone')}
          />
          <TextInput
            label="Email"
            placeholder="you@example.com"
            {...form.getInputProps('email')}
          />
          <PasswordInput label="密碼" description="至少 8 碼" {...form.getInputProps('password')} />
          <Button type="submit" loading={register.isPending} fullWidth>
            建立帳號
          </Button>
          <Text size="sm" c="dimmed" ta="center">
            已經有帳號？{' '}
            <Anchor component={Link} to="/login">
              登入
            </Anchor>
          </Text>
        </Stack>
      </form>
    </Card>
  );
}
