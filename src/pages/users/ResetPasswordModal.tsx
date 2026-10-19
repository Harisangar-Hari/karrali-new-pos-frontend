import { useEffect, useState } from 'react';
import { Modal, Input, Flex, Alert, App, Typography } from 'antd';
import { useResetPassword } from '@/hooks/queries/useUsers';
import { getErrorMessage } from '@/lib/api';
import type { UserRow } from '@/types/user';

interface Props {
  open: boolean;
  user: UserRow | null;
  onClose: () => void;
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  marginBottom: 4,
  fontSize: 13,
  color: 'rgba(0,0,0,0.88)',
};
const ERR_STYLE: React.CSSProperties = {
  color: '#ff4d4f',
  fontSize: 12,
  marginTop: 4,
  minHeight: 16,
};

const PWD_MIN = 8;

export function ResetPasswordModal({ open, user, onClose }: Props) {
  const { message } = App.useApp();
  const mutation = useResetPassword(user?.Id ?? '');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPassword('');
      setConfirm('');
      setError(null);
    }
  }, [open]);

  const submitting = mutation.isPending;

  const handleOk = async () => {
    setError(null);
    if (!user) return;
    if (password.length < PWD_MIN) {
      setError(`Password must be at least ${PWD_MIN} characters`);
      return;
    }
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError('Password must contain at least one letter and one digit');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    try {
      await mutation.mutateAsync({ NewPassword: password });
      message.success(
        `Password reset for ${user.Username} — user will need to sign in again`,
      );
      onClose();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  return (
    <Modal
      title={user ? `Reset password — ${user.Username}` : 'Reset password'}
      open={open}
      onCancel={submitting ? undefined : onClose}
      onOk={handleOk}
      okText="Reset password"
      okButtonProps={{ danger: true }}
      confirmLoading={submitting}
      destroyOnClose
      maskClosable={!submitting}
    >
      <Flex vertical gap={12}>
        <Alert
          type="warning"
          showIcon
          message="User will be logged out"
          description={
            <>
              The user's current sessions are revoked. Share the new password
              with them out-of-band, and tell them to change it after sign-in.
            </>
          }
        />

        <div>
          <label style={LABEL_STYLE}>New password *</label>
          <Input.Password
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            maxLength={100}
            placeholder="Min 8 chars, letter + digit"
            disabled={submitting}
          />
        </div>

        <div>
          <label style={LABEL_STYLE}>Confirm password *</label>
          <Input.Password
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              if (error) setError(null);
            }}
            maxLength={100}
            status={error ? 'error' : undefined}
            disabled={submitting}
          />
          <div style={ERR_STYLE}>{error ?? ''}</div>
        </div>

        {user?.Email && (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            The user's email on file: {user.Email}
          </Typography.Text>
        )}
      </Flex>
    </Modal>
  );
}