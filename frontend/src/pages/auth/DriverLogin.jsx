import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Card, TextInput, PasswordInput, Button, Stack, Title, Text, Anchor } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useLogin } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { notifyErr } from '@/lib/notify';

export default function DriverLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useAuthStore((s) => s.token);
  const login = useLogin();
  const redirectTo = location.state?.from || '/dashboard';

  useEffect(() => {
    if (token) navigate(redirectTo, { replace: true });
  }, [token, navigate, redirectTo]);

  const form = useForm({
    initialValues: { phone: '', password: '' },
    validate: {
      phone: (v) => (/^09\d{8}$/.test(v) ? null : '手機格式需為 09xxxxxxxx'),
      password: (v) => (v.length >= 1 ? null : '請輸入密碼'),
    },
  });

  const submit = form.onSubmit((values) => {
    login.mutate(values, {
      onSuccess: () => navigate(redirectTo, { replace: true }),
      onError: (e) => notifyErr(e, '登入失敗'),
    });
  });

  return (
    <Card withBorder shadow="sm" radius="md" p="lg">
      <form onSubmit={submit}>
        <Stack>
          <Title order={3}>司機登入</Title>
          <TextInput
            label="手機"
            placeholder="0912345678"
            inputMode="numeric"
            {...form.getInputProps('phone')}
          />
          <PasswordInput label="密碼" {...form.getInputProps('password')} />
          <Button type="submit" loading={login.isPending} fullWidth>
            登入
          </Button>
          <Text size="sm" c="dimmed" ta="center">
            還沒有帳號？{' '}
            <Anchor component={Link} to="/signup">
              註冊
            </Anchor>
          </Text>
        </Stack>
      </form>
    </Card>
  );
}
