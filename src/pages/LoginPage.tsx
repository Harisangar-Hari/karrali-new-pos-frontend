import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Card, Input, Typography, Alert, Flex } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { api, getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { AuthUser, LoginRequest } from '@/types/auth';

const loginSchema = z.object({
  username: z
    .string()
    .min(3, 'At least 3 characters')
    .max(50, 'At most 50 characters')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Only letters, digits, _ . -'),
  password: z
    .string()
    .min(6, 'At least 6 characters')
    .max(200, 'At most 200 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

const fieldLabelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 4,
  fontSize: 14,
  color: 'rgba(0,0,0,0.88)',
};

const fieldErrorStyle: React.CSSProperties = {
  color: '#ff4d4f',
  fontSize: 12,
  marginTop: 4,
  minHeight: 18,
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const status = useAuthStore((s) => s.status);
  const setUser = useAuthStore((s) => s.setUser);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
    mode: 'onTouched',
  });

  if (status === 'authenticated') {
    const from =
      (location.state as { from?: Location } | null)?.from?.pathname ?? '/';
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (values: LoginForm) => {
    setServerError(null);
    setSubmitting(true);
    try {
      await api.post('/auth/login', values satisfies LoginRequest);
      const { data } = await api.get<AuthUser>('/auth/me');
      setUser(data);
      const from =
        (location.state as { from?: Location } | null)?.from?.pathname ?? '/';
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Flex
      align="center"
      justify="center"
      style={{
        minHeight: '100vh',
        background: '#0f172a',
        padding: 16,
      }}
    >
      <Card
        variant="borderless"
        style={{ width: '100%', maxWidth: 400 }}
        styles={{ body: { padding: 24 } }}
      >
        <Flex vertical align="center" style={{ marginBottom: 24 }}>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            Karrali POS
          </Typography.Title>
          <Typography.Text type="secondary">Sign in to continue</Typography.Text>
        </Flex>

        {serverError && (
          <Alert
            type="error"
            message={serverError}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div style={{ marginBottom: 16 }}>
            <label style={fieldLabelStyle}>Username</label>
            <Controller
              name="username"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    prefix={<UserOutlined />}
                    placeholder="admin"
                    autoComplete="username"
                    autoFocus
                    size="large"
                    disabled={submitting}
                    status={fieldState.error ? 'error' : undefined}
                  />
                  <div style={fieldErrorStyle}>
                    {fieldState.error?.message ?? ''}
                  </div>
                </>
              )}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={fieldLabelStyle}>Password</label>
            <Controller
              name="password"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <Input.Password
                    {...field}
                    prefix={<LockOutlined />}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    size="large"
                    disabled={submitting}
                    status={fieldState.error ? 'error' : undefined}
                  />
                  <div style={fieldErrorStyle}>
                    {fieldState.error?.message ?? ''}
                  </div>
                </>
              )}
            />
          </div>

          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={submitting}
          >
            Sign in
          </Button>
        </form>
      </Card>
    </Flex>
  );
}