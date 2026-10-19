import { useEffect, useMemo, useState } from 'react';
import {
  Drawer,
  Input,
  InputNumber,
  Segmented,
  Button,
  Flex,
  Grid,
  Typography,
  App,
  Select,
  Alert,
  Tooltip,
} from 'antd';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Landmark,
} from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateCashMovement } from '@/hooks/queries/useCashMovements';
import { useBankAccountsLookup } from '@/hooks/queries/useExpenseLookups';
import { useMyOpenSession } from '@/hooks/queries/useCashSession';
import { NoOpenSessionWarning } from '@/components/NoOpenSessionWarning';
import { getErrorMessage } from '@/lib/api';
import type { CashMovementType } from '@/types/cashMovement';

const { useBreakpoint } = Grid;

const schema = z.object({
  Type: z.enum(['CASH_IN', 'CASH_OUT']),
  Amount: z.number({ required_error: 'Required' }).positive('Must be > 0'),
  Reason: z.string().min(1, 'Required').max(500),
  BankAccountId: z.string().uuid().nullable().optional().or(z.literal('')),
  Notes: z.string().max(1000).optional().or(z.literal('')),
});

type Form = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
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

export function CreateCashMovementDrawer({
  open,
  onClose,
  onSuccess,
}: Props) {
  const { message } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const { data: bankAccounts = [], isLoading: bankLoading } =
    useBankAccountsLookup();
  const { data: openSession, isLoading: sessionLoading } = useMyOpenSession();
  const hasSession = !!openSession;

  const createMutation = useCreateCashMovement();

  const [type, setType] = useState<CashMovementType>('CASH_IN');

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      Type: 'CASH_IN',
      Amount: undefined as unknown as number,
      Reason: '',
      BankAccountId: '',
      Notes: '',
    },
    mode: 'onTouched',
  });

  useEffect(() => {
    if (open) {
      reset({
        Type: 'CASH_IN',
        Amount: undefined as unknown as number,
        Reason: '',
        BankAccountId: '',
        Notes: '',
      });
      setType('CASH_IN');
    }
  }, [open, reset]);

  const watchedType = watch('Type');
  useEffect(() => {
    setType(watchedType);
  }, [watchedType]);

  const hasBankAccount = !!watch('BankAccountId');

  const semantics = useMemo(() => {
    if (type === 'CASH_IN' && hasBankAccount) {
      return {
        title: 'Withdrawal from bank → into drawer',
        description:
          'Money leaves the bank account and enters the physical drawer.',
        color: '#16a34a',
      };
    }
    if (type === 'CASH_IN' && !hasBankAccount) {
      return {
        title: 'Cash in — money into the drawer',
        description:
          'Physical cash enters the drawer from an external source (e.g. capital injection, refund from supplier).',
        color: '#16a34a',
      };
    }
    if (type === 'CASH_OUT' && hasBankAccount) {
      return {
        title: 'Deposit from drawer → into bank',
        description:
          'Physical cash leaves the drawer and enters the bank account.',
        color: '#dc2626',
      };
    }
    return {
      title: 'Cash out — money out of the drawer',
      description:
        'Physical cash leaves the drawer (e.g. owner draw, petty cash).',
      color: '#dc2626',
    };
  }, [type, hasBankAccount]);

  const submitting = isSubmitting || createMutation.isPending;
  const blockedBySession = !sessionLoading && !hasSession;
  const canSubmit = !submitting && !blockedBySession;

  const onSubmit = async (values: Form) => {
    if (!hasSession) {
      message.error(
        'Open a cash drawer before recording a movement.',
      );
      return;
    }
    try {
      await createMutation.mutateAsync({
        Type: values.Type,
        Amount: values.Amount,
        Reason: values.Reason,
        BankAccountId: values.BankAccountId || undefined,
        Notes: values.Notes || undefined,
      });
      message.success('Cash movement recorded');
      onSuccess?.();
      onClose();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  return (
    <Drawer
      title="Record cash movement"
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
          <Tooltip
            title={
              blockedBySession
                ? 'Open a cash drawer first — this movement must attach to a session'
                : undefined
            }
          >
            <Button
              type="primary"
              loading={submitting}
              disabled={!canSubmit}
              onClick={handleSubmit(onSubmit)}
            >
              Record movement
            </Button>
          </Tooltip>
        </Flex>
      }
    >
      {blockedBySession && (
        <NoOpenSessionWarning context="Recording a cash movement" />
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Type */}
        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Direction *</label>
          <Controller
            name="Type"
            control={control}
            render={({ field }) => (
              <Segmented
                value={field.value}
                onChange={(v) => field.onChange(v)}
                block
                options={[
                  {
                    label: (
                      <Flex align="center" justify="center" gap={6}>
                        <ArrowDownToLine size={14} />
                        <span>Cash In</span>
                      </Flex>
                    ),
                    value: 'CASH_IN',
                  },
                  {
                    label: (
                      <Flex align="center" justify="center" gap={6}>
                        <ArrowUpFromLine size={14} />
                        <span>Cash Out</span>
                      </Flex>
                    ),
                    value: 'CASH_OUT',
                  },
                ]}
              />
            )}
          />
        </div>

        {/* Semantics banner */}
        <Alert
          type={type === 'CASH_IN' ? 'success' : 'warning'}
          showIcon
          message={semantics.title}
          description={semantics.description}
          style={{ marginBottom: 16 }}
        />

        <Flex gap={12} wrap="wrap">
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={LABEL_STYLE}>Amount *</label>
            <Controller
              name="Amount"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <InputNumber
                    value={field.value ?? undefined}
                    onChange={(v) =>
                      field.onChange(v === null ? undefined : Number(v))
                    }
                    min={0.0001}
                    precision={4}
                    step={100}
                    size="large"
                    style={{ width: '100%' }}
                    status={fieldState.error ? 'error' : undefined}
                    placeholder="0.0000"
                  />
                  <div style={ERR_STYLE}>
                    {fieldState.error?.message ?? ''}
                  </div>
                </>
              )}
            />
          </div>
        </Flex>

        {/* Bank account — optional */}
        <div style={{ marginTop: 12, marginBottom: 12 }}>
          <label style={LABEL_STYLE}>
            Bank account{' '}
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              (optional — set only if this moves money between drawer and bank)
            </Typography.Text>
          </label>
          <Controller
            name="BankAccountId"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || undefined}
                onChange={(v) => field.onChange(v ?? '')}
                loading={bankLoading}
                placeholder="None — drawer ↔ external"
                options={bankAccounts.map((a) => ({
                  label: a.Code ? `${a.Name} (${a.Code})` : a.Name,
                  value: a.Id,
                }))}
                allowClear
                showSearch
                optionFilterProp="label"
                style={{ width: '100%' }}
                suffixIcon={<Landmark size={12} color="#94a3b8" />}
              />
            )}
          />
        </div>

        {/* Reason */}
        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Reason *</label>
          <Controller
            name="Reason"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Input.TextArea
                  {...field}
                  rows={2}
                  maxLength={500}
                  showCount
                  placeholder="e.g. Owner draw, supplier refund, daily bank deposit"
                  status={fieldState.error ? 'error' : undefined}
                />
                <div style={ERR_STYLE}>
                  {fieldState.error?.message ?? ''}
                </div>
              </>
            )}
          />
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Notes</label>
          <Controller
            name="Notes"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                value={field.value ?? ''}
                rows={2}
                maxLength={1000}
                showCount
                placeholder="Optional"
              />
            )}
          />
        </div>
      </form>
    </Drawer>
  );
}