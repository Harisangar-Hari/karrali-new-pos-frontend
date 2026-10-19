import { useEffect, useMemo, useState } from 'react';
import { Drawer, Button, Flex, App, Alert, Select, Typography, Skeleton } from 'antd';
import { useAssignRoles, useRoles } from '@/hooks/queries/useUsers';
import { getErrorMessage } from '@/lib/api';
import type { UserRow } from '@/types/user';

interface Props {
  open: boolean;
  user: UserRow | null;
  currentUserId: string | null;
  onClose: () => void;
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  marginBottom: 4,
  fontSize: 13,
  color: 'rgba(0,0,0,0.88)',
};

export function AssignRolesDrawer({
  open,
  user,
  currentUserId,
  onClose,
}: Props) {
  const { message } = App.useApp();
  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const mutation = useAssignRoles(user?.Id ?? '');

  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (open && user) {
      setSelected(user.UserRoles.map((ur) => ur.Role.Id));
    }
  }, [open, user]);

  const roleOptions = useMemo(
    () =>
      roles.map((r) => ({
        label: (
          <Flex vertical gap={0}>
            <span>{r.Name}</span>
            {r.Description && (
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                {r.Description}
              </Typography.Text>
            )}
          </Flex>
        ),
        value: r.Id,
      })),
    [roles],
  );

  const submitting = mutation.isPending;

  const handleSave = async () => {
    if (!user) return;
    if (selected.length === 0) {
      message.error('Pick at least one role');
      return;
    }
    try {
      await mutation.mutateAsync({ RoleIds: selected });
      message.success('Roles updated — user will be logged out');
      onClose();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  const isSelf = user?.Id === currentUserId;
  const losesAdmin =
    isSelf &&
    user?.UserRoles.some((ur) => ur.Role.Name === 'ADMIN') === true &&
    !roles
      .filter((r) => selected.includes(r.Id))
      .some((r) => r.Name === 'ADMIN');

  return (
    <Drawer
      title={user ? `Roles — ${user.Username}` : 'Roles'}
      open={open}
      onClose={submitting ? undefined : onClose}
      width={400}
      destroyOnClose
      maskClosable={!submitting}
      extra={
        <Flex gap={8}>
          <Button onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="primary"
            loading={submitting}
            disabled={!user || rolesLoading}
            onClick={handleSave}
          >
            Save roles
          </Button>
        </Flex>
      }
    >
      {rolesLoading || !user ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : (
        <Flex vertical gap={12}>
          <Alert
            type="warning"
            showIcon
            message="User will be logged out"
            description="Changing roles bumps the session version. The user must sign in again for the new permissions to take effect."
          />

          <div>
            <label style={LABEL_STYLE}>Roles *</label>
            <Select
              mode="multiple"
              value={selected}
              onChange={setSelected}
              options={roleOptions}
              optionFilterProp="label"
              placeholder="Pick at least one role"
              style={{ width: '100%' }}
            />
          </div>

          {losesAdmin && (
            <Alert
              type="error"
              showIcon
              message="You are removing your own ADMIN role"
              description="This will be rejected by the backend. Promote another admin first."
            />
          )}
        </Flex>
      )}
    </Drawer>
  );
}