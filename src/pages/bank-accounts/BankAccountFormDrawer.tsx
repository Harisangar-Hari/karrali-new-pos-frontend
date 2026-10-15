import { useEffect } from 'react';
import {
  Drawer,
  Input,
  Switch,
  Button,
  Flex,
  Grid,
  Typography,
  Alert,
  App,
} from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCreateBankAccount,
  useUpdateBankAccount,
} from '@/hooks/queries/useBankAccounts';
import { getErrorMessage } from '@/lib/api';
import type { BankAccountRow } from '@/types/bankAccount';

const { useBreakpoint } = Grid;

const schema = z.object({
  Name: z.string().min(1, 'Required').max(100),
  BankName: z.string().min(1, 'Required').max(100),
  AccountNumber: z.string().min(1, 'Required').max(50),
  Branch: z.string().max(100).optional().or(z.literal('')),
  Swift: z.string().max(20).optional().or(z.literal('')),
  IsActive: z.boolean(),
  IsDefault: z.boolean(),
});

type Form = z.infer<typeof schema>;

interface Props {
  open: boolean;
  bankAccount?: BankAccountRow | null;
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

function buildDefaults(b?: BankAccountRow | null): Form {
  if (!b) {
    return {
      Name: '',
      BankName: '',
      AccountNumber: '',
      Branch: '',
      Swift: '',
      IsActive: true,
      IsDefault: false,
    };
  }
  return {
    Name: b.Name,
    BankName: b.BankName,
    AccountNumber: b.AccountNumber,
    Branch: b.Branch ?? '',
    Swift: b.Swift ?? '',
    IsActive: b.IsActive,
    IsDefault: b.IsDefault,
  };
}

export function BankAccountFormDrawer({ open, bankAccount, onClose }: Props) {
  const { message } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isEdit = !!bankAccount;

  const createMutation = useCreateBankAccount();
  const updateMutation = useUpdateBankAccount(bankAccount?.Id ?? '');

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaults(bankAccount),
    mode: 'onTouched',
  });

  useEffect(() => {
    if (open) reset(buildDefaults(bankAccount));
  }, [open, bankAccount, reset]);

  const submitting =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  const isDefaultValue = watch('IsDefault');
  const showDefaultWarning =
    isEdit && bankAccount?.IsDefault && isDefaultValue === false;

  const onSubmit = async (values: Form) => {
    const payload = {
      Name: values.Name,
      BankName: values.BankName,
      AccountNumber: values.AccountNumber,
      Branch: values.Branch || undefined,
      Swift: values.Swift || undefined,
      IsActive: values.IsActive,
      IsDefault: values.IsDefault,
    };
    try {
      if (isEdit && bankAccount) {
        await updateMutation.mutateAsync(payload);
        message.success('Bank account updated');
      } else {
        await createMutation.mutateAsync(payload);
        message.success('Bank account created');
      }
      onClose();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  return (
    <Drawer
      title={isEdit ? 'Edit bank account' : 'New bank account'}
      open={open}
      onClose={submitting ? undefined : onClose}
      width={isMobile ? '100%' : 480}
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
            {isEdit ? 'Save changes' : 'Create account'}
          </Button>
        </Flex>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Account name *</label>
          <Controller
            name="Name"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Input
                  {...field}
                  placeholder="e.g. Main Operating Account"
                  status={fieldState.error ? 'error' : undefined}
                  autoFocus
                />
                <div style={ERR_STYLE}>{fieldState.error?.message ?? ''}</div>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  A friendly label used in dropdowns across the app.
                </Typography.Text>
              </>
            )}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Bank name *</label>
          <Controller
            name="BankName"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Input
                  {...field}
                  placeholder="e.g. Commercial Bank"
                  status={fieldState.error ? 'error' : undefined}
                />
                <div style={ERR_STYLE}>{fieldState.error?.message ?? ''}</div>
              </>
            )}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Account number *</label>
          <Controller
            name="AccountNumber"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Input
                  {...field}
                  placeholder="e.g. 8001234567"
                  maxLength={50}
                  status={fieldState.error ? 'error' : undefined}
                />
                <div style={ERR_STYLE}>{fieldState.error?.message ?? ''}</div>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  Unique across all accounts, including soft-deleted ones.
                </Typography.Text>
              </>
            )}
          />
        </div>

        <Flex gap={12} wrap="wrap" style={{ marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={LABEL_STYLE}>Branch</label>
            <Controller
              name="Branch"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ''}
                  maxLength={100}
                  placeholder="Optional"
                />
              )}
            />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={LABEL_STYLE}>SWIFT</label>
            <Controller
              name="Swift"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ''}
                  maxLength={20}
                  placeholder="Optional"
                />
              )}
            />
          </div>
        </Flex>

        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Active</label>
          <Controller
            name="IsActive"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onChange={field.onChange} />
            )}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Default account</label>
          <Controller
            name="IsDefault"
            control={control}
            render={({ field }) => (
              <Flex vertical gap={4}>
                <Switch
                  checked={field.value}
                  onChange={field.onChange}
                  disabled={isEdit && bankAccount?.IsDefault}
                />
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  Only one account can be default. Turning this on demotes the
                  current default automatically.
                </Typography.Text>
              </Flex>
            )}
          />
        </div>

        {showDefaultWarning && (
          <Alert
            type="warning"
            showIcon
            message="Cannot unset the default"
            description="Promote another account to default first, then come back to unset this one."
            style={{ marginTop: 8 }}
          />
        )}
      </form>
    </Drawer>
  );
}