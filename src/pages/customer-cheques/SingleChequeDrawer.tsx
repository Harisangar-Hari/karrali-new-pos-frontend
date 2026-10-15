import { useEffect } from 'react';
import {
  Drawer,
  Input,
  InputNumber,
  DatePicker,
  Button,
  Flex,
  Grid,
  Typography,
  App,
  Alert,
} from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs, { type Dayjs } from 'dayjs';
import { useCreateCustomerCheque } from '@/hooks/queries/useCustomerCheques';
import { useCustomersLookup } from '@/hooks/queries/useCustomersLookup';
import { getErrorMessage } from '@/lib/api';
import { Select } from 'antd';

const { useBreakpoint } = Grid;

const schema = z.object({
  CustomerId: z.string().uuid('Pick a customer'),
  ChequeNumber: z.string().min(1, 'Required').max(32),
  BankName: z.string().max(100).optional().or(z.literal('')),
  BankBranch: z.string().max(100).optional().or(z.literal('')),
  Amount: z.number({ required_error: 'Required' }).positive('Must be > 0'),
  IssueDate: z.custom<Dayjs>((v) => dayjs.isDayjs(v), 'Required'),
  DueDate: z.custom<Dayjs>((v) => dayjs.isDayjs(v), 'Required'),
  Notes: z.string().max(500).optional().or(z.literal('')),
});

type Form = z.infer<typeof schema>;

interface Props {
  open: boolean;
  presetCustomerId?: string | null;
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

export function SingleChequeDrawer({
  open,
  presetCustomerId,
  onClose,
  onSuccess,
}: Props) {
  const { message } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const { data: customers = [] } = useCustomersLookup();
  const createMutation = useCreateCustomerCheque();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      CustomerId: presetCustomerId ?? '',
      ChequeNumber: '',
      BankName: '',
      BankBranch: '',
      Amount: undefined as unknown as number,
      IssueDate: dayjs(),
      DueDate: dayjs().add(30, 'day'),
      Notes: '',
    },
    mode: 'onTouched',
  });

  useEffect(() => {
    if (open) {
      reset({
        CustomerId: presetCustomerId ?? '',
        ChequeNumber: '',
        BankName: '',
        BankBranch: '',
        Amount: undefined as unknown as number,
        IssueDate: dayjs(),
        DueDate: dayjs().add(30, 'day'),
        Notes: '',
      });
    }
  }, [open, presetCustomerId, reset]);

  const submitting = isSubmitting || createMutation.isPending;

  const onSubmit = async (values: Form) => {
    try {
      await createMutation.mutateAsync({
        CustomerId: values.CustomerId,
        ChequeNumber: values.ChequeNumber,
        BankName: values.BankName || undefined,
        BankBranch: values.BankBranch || undefined,
        Amount: values.Amount,
        IssueDate: values.IssueDate.toISOString(),
        DueDate: values.DueDate.toISOString(),
        Notes: values.Notes || undefined,
      });
      message.success('Cheque recorded');
      onSuccess?.();
      onClose();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  return (
    <Drawer
      title="Record customer cheque"
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
            Record cheque
          </Button>
        </Flex>
      }
    >
      <Alert
        type="info"
        showIcon
        message="Balance effect"
        description="The customer's outstanding balance drops by the cheque amount immediately. If the cheque later bounces, the balance is restored."
        style={{ marginBottom: 16 }}
      />

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Customer *</label>
          <Controller
            name="CustomerId"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Select
                  value={field.value || undefined}
                  onChange={(v) => field.onChange(v ?? '')}
                  placeholder="Pick a customer"
                  options={customers.map((c) => ({
                    label: `${c.Name} (${c.Code ?? ''})`,
                    value: c.Id,
                  }))}
                  showSearch
                  optionFilterProp="label"
                  style={{ width: '100%' }}
                  disabled={!!presetCustomerId}
                  status={fieldState.error ? 'error' : undefined}
                />
                <div style={ERR_STYLE}>{fieldState.error?.message ?? ''}</div>
              </>
            )}
          />
        </div>

        <Flex gap={12} wrap="wrap">
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={LABEL_STYLE}>Cheque number *</label>
            <Controller
              name="ChequeNumber"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    maxLength={32}
                    status={fieldState.error ? 'error' : undefined}
                  />
                  <div style={ERR_STYLE}>{fieldState.error?.message ?? ''}</div>
                </>
              )}
            />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={LABEL_STYLE}>Amount *</label>
            <Controller
              name="Amount"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <InputNumber
                    value={field.value ?? undefined}
                    onChange={(v) => field.onChange(v === null ? undefined : Number(v))}
                    min={0.0001}
                    precision={4}
                    step={100}
                    style={{ width: '100%' }}
                    status={fieldState.error ? 'error' : undefined}
                  />
                  <div style={ERR_STYLE}>{fieldState.error?.message ?? ''}</div>
                </>
              )}
            />
          </div>
        </Flex>

        <Flex gap={12} wrap="wrap" style={{ marginTop: 12 }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={LABEL_STYLE}>Bank</label>
            <Controller
              name="BankName"
              control={control}
              render={({ field }) => (
                <Input {...field} value={field.value ?? ''} maxLength={100} />
              )}
            />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={LABEL_STYLE}>Branch</label>
            <Controller
              name="BankBranch"
              control={control}
              render={({ field }) => (
                <Input {...field} value={field.value ?? ''} maxLength={100} />
              )}
            />
          </div>
        </Flex>

        <Flex gap={12} wrap="wrap" style={{ marginTop: 12 }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={LABEL_STYLE}>Issue date *</label>
            <Controller
              name="IssueDate"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <DatePicker
                    value={field.value ?? null}
                    onChange={(d) => field.onChange(d ?? null)}
                    style={{ width: '100%' }}
                    status={fieldState.error ? 'error' : undefined}
                  />
                  <div style={ERR_STYLE}>{fieldState.error?.message ?? ''}</div>
                </>
              )}
            />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={LABEL_STYLE}>Due date *</label>
            <Controller
              name="DueDate"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <DatePicker
                    value={field.value ?? null}
                    onChange={(d) => field.onChange(d ?? null)}
                    style={{ width: '100%' }}
                    status={fieldState.error ? 'error' : undefined}
                  />
                  <div style={ERR_STYLE}>{fieldState.error?.message ?? ''}</div>
                </>
              )}
            />
          </div>
        </Flex>

        <div style={{ marginTop: 12 }}>
          <label style={LABEL_STYLE}>Notes</label>
          <Controller
            name="Notes"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                value={field.value ?? ''}
                rows={2}
                maxLength={500}
                showCount
              />
            )}
          />
        </div>
      </form>
    </Drawer>
  );
}