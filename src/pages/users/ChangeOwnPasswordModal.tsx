import { useEffect, useState } from 'react';
import { Modal, Input, Flex, Alert, App } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useChangeOwnPassword } from '@/hooks/queries/useUsers';
import { getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

interface Props {
  open: boolean;
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

export function ChangeOwnPasswordModal({ open, onClose }: Props) {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const clear = useAuthStore((s) => s.clear);
  const mutation = useChangeOwnPassword();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setOldPassword('');
      setNewPassword('');
      setConfirm('');
      setError(null);
    }
  }, [open]);

  const submitting = mutation.isPending;

  const handleOk = async () => {
    setError(null);
    if (!oldPassword) {
      setError('Current password is required');
      return;
    }
    if (newPassword.length < PWD_MIN) {
      setError(`New password must be at least ${PWD_MIN} characters`);
      return;
    }
    if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setError('New password must contain at least one letter and one digit');
      return;
    }
    if (newPassword !== confirm) {
      setError('New passwords do not match');
      return;
    }
    if (oldPassword === newPassword) {
      setError('New password must differ from the current one');
      return;
    }
    try {
      await mutation.mutateAsync({
        OldPassword: oldPassword,
        NewPassword: newPassword,
      });
      message.success('Password changed — please sign in again');
      // Backend bumped SessionVersion; every session is dead. Clear local
      // state and bounce to login.
      clear();
      onClose();
      navigate('/login', { replace: true });
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  return (
    <Modal
      title="Change your password"
      open={open}
      onCancel={submitting ? undefined : onClose}
      onOk={handleOk}
      okText="Change password"
      confirmLoading={submitting}
      destroyOnClose
      maskClosable={!submitting}
    >
      <Flex vertical gap={12}>
        <Alert
          type="info"
          showIcon
          message="You will be signed out"
          description="Changing your password invalidates every active session, including this one. You'll need to sign in again with the new password."
        />

        <div>
          <label style={LABEL_STYLE}>Current password *</label>
          <Input.Password
            value={oldPassword}
            onChange={(e) => {
              setOldPassword(e.target.value);
              if (error) setError(null);
            }}
            autoFocus
            disabled={submitting}
          />
        </div>

        <div>
          <label style={LABEL_STYLE}>New password *</label>
          <Input.Password
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (error) setError(null);
            }}
            maxLength={100}
            placeholder="Min 8 chars, letter + digit"
            disabled={submitting}
          />
        </div>

        <div>
          <label style={LABEL_STYLE}>Confirm new password *</label>
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
      </Flex>
    </Modal>
  );
}