import { useEffect, useMemo } from 'react';
import {
  Drawer,
  Input,
  Switch,
  Button,
  Flex,
  Grid,
  Typography,
  App,
  Select,
  Alert,
} from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCreateUser,
  useRoles,
  useUpdateUser,
} from '@/hooks/queries/useUsers';
import { getErrorMessage } from '@/lib/api';
import type { UserRow } from '@/types/user';

const { useBreakpoint } = Grid;

const passwordRules = z
  .string()
  .min(8, 'At least 8 characters')
  .max(100, 'At most 100 characters')
  .regex(/[A-Za-z]/, 'Must contain at least one letter')
  .regex(/\d/, 'Must contain at least one digit');

const createSchema = z.object({
  Username: z
    .string()
    .min(3, 'At least 3 characters')
    .max(50, 'At most 50 characters')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Letters, digits, dot, underscore, hyphen only'),
  Password: passwordRules,
  FullName: z.string().max(200).optional().or(z.literal('')),
  Email: z.union([z.string().email('Invalid email'), z.literal('')]).optional(),
  IsActive: z.boolean(),
  RoleIds: z.array(z.string().uuid()).min(1, 'Pick at least one role'),
});

const editSchema = z.object({
  FullName: z.string().max(200).optional().or(z.literal('')),
  Email: z.union([z.string().email('Invalid email'), z.literal('')]).optional(),
  IsActive: z.boolean(),
});

type CreateForm = z.infer<typeof createSchema>;
type EditForm = z.infer<typeof editSchema>;
type Form = CreateForm | EditForm;

interface Props {
  open: boolean;
  user?: UserRow | null;
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

function buildCreateDefaults(): CreateForm {
  return {
    Username: '',
    Password: '',
    FullName: '',
    Email: '',
    IsActive: true,
    RoleIds: [],
  };
}

function buildEditDefaults(user: UserRow): EditForm {
  return {
    FullName: user.FullName ?? '',
    Email: user.Email ?? '',
    IsActive: user.IsActive,
  };
}

export function UserFormDrawer({ open, user, onClose }: Props) {
  const { message } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isEdit = !!user;

  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser(user?.Id ?? '');

  const schema = isEdit ? editSchema : createSchema;

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<Form>({
   
    resolver: zodResolver(schema),
    defaultValues: user ? buildEditDefaults(user) : buildCreateDefaults(),
    mode: 'onTouched',
  });

  useEffect(() => {
    if (open) {
      if (user) reset(buildEditDefaults(user));
      else reset(buildCreateDefaults());
    }
  }, [open, user, reset]);

  const submitting =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  const onSubmit = async (values: Form) => {
    try {
      if (isEdit && user) {
        const v = values as EditForm;
        await updateMutation.mutateAsync({
          FullName: v.FullName || undefined,
          Email: v.Email || undefined,
          IsActive: v.IsActive,
        });
        message.success('User updated');
      } else {
        const v = values as CreateForm;
        await createMutation.mutateAsync({
          Username: v.Username.toLowerCase().trim(),
          Password: v.Password,
          FullName: v.FullName || undefined,
          Email: v.Email || undefined,
          IsActive: v.IsActive,
          RoleIds: v.RoleIds,
        });
        message.success('User created');
      }
      onClose();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

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

  return (
    <Drawer
      title={isEdit ? `Edit user — ${user?.Username}` : 'New user'}
      open={open}
      onClose={submitting ? undefined : onClose}
      width={isMobile ? '100%' : 460}
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
            onClick={handleSubmit(onSubmit)}
          >
            {isEdit ? 'Save changes' : 'Create user'}
          </Button>
        </Flex>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {isEdit && (
          <Alert
            type="info"
            showIcon
            message="Username cannot be changed"
            description="To change roles, use the 'Change roles' action from the users list."
            style={{ marginBottom: 16 }}
          />
        )}

        {!isEdit && (
          <>
            <div style={{ marginBottom: 12 }}>
              <label style={LABEL_STYLE}>Username *</label>
              <Controller
                name="Username"
                control={control}
                render={({ field, fieldState }) => (
                  <>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder="e.g. kasun"
                      maxLength={50}
                      autoFocus
                      status={fieldState.error ? 'error' : undefined}
                    />
                    <div style={ERR_STYLE}>
                      {fieldState.error?.message ?? ''}
                    </div>
                  </>
                )}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={LABEL_STYLE}>Password *</label>
              <Controller
                name="Password"
                control={control}
                render={({ field, fieldState }) => (
                  <>
                    <Input.Password
                      {...field}
                      value={field.value ?? ''}
                      maxLength={100}
                      placeholder="Min 8 chars, letter + digit"
                      status={fieldState.error ? 'error' : undefined}
                    />
                    <div style={ERR_STYLE}>
                      {fieldState.error?.message ?? ''}
                    </div>
                  </>
                )}
              />
            </div>
          </>
        )}

        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Full name</label>
          <Controller
            name="FullName"
            control={control}
            render={({ field }) => (
              <Input {...field} value={field.value ?? ''} maxLength={200} />
            )}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Email</label>
          <Controller
            name="Email"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  maxLength={200}
                  status={fieldState.error ? 'error' : undefined}
                />
                <div style={ERR_STYLE}>{fieldState.error?.message ?? ''}</div>
              </>
            )}
          />
        </div>

        {!isEdit && (
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL_STYLE}>Roles *</label>
            <Controller
              name="RoleIds"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <Select
                    mode="multiple"
                    value={field.value ?? []}
                    onChange={(v) => field.onChange(v)}
                    loading={rolesLoading}
                    placeholder="Pick at least one role"
                    options={roleOptions}
                    optionFilterProp="label"
                    style={{ width: '100%' }}
                    status={fieldState.error ? 'error' : undefined}
                  />
                  <div style={ERR_STYLE}>
                    {fieldState.error?.message ?? ''}
                  </div>
                </>
              )}
            />
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Active</label>
          <Controller
            name="IsActive"
            control={control}
            render={({ field }) => (
              <Flex vertical gap={4}>
                <Switch checked={field.value} onChange={field.onChange} />
                {isEdit && field.value === false && (
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    Deactivating bumps the session version — this user will be
                    logged out on their next request.
                  </Typography.Text>
                )}
              </Flex>
            )}
          />
        </div>
      </form>
    </Drawer>
  );
}