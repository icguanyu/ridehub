import { useNavigate } from 'react-router-dom';
import { Center, Box, Card, Stack, Title, TextInput, PasswordInput, Button, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useAdminLogin } from '@/hooks/useAdmin';
import { notifyErr } from '@/lib/notify';

export default function AdminLogin() {
  const navigate = useNavigate();
  const login = useAdminLogin();
  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: {
      email: (v) => (/^\S+@\S+$/.test(v) ? null : '請輸入 email'),
      password: (v) => (v ? null : '請輸入密碼'),
    },
  });

  const submit = form.onSubmit((v) => {
    login.mutate(v, {
      onSuccess: () => navigate('/admin', { replace: true }),
      onError: (e) => notifyErr(e, '登入失敗'),
    });
  });

  return (
    <Center mih="100vh" px="md" style={{ background: '#FAF7EB' }}>
      <Box w="100%" maw={360}>
        <Card radius="lg" p="lg">
          <form onSubmit={submit}>
            <Stack>
              <Title order={4}>平台管理後台</Title>
              <TextInput label="Email" {...form.getInputProps('email')} />
              <PasswordInput label="密碼" {...form.getInputProps('password')} />
              <Button type="submit" loading={login.isPending} fullWidth>
                登入
              </Button>
              <Text size="xs" c="dimmed">
                僅限 ADMIN_EMAILS 名單內的帳號。
              </Text>
            </Stack>
          </form>
        </Card>
      </Box>
    </Center>
  );
}
