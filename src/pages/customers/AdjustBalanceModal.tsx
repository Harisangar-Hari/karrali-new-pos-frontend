import { useEffect } from 'react';
import { Modal, Input, InputNumber, Typography, Flex, App } from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAdjustCustomerBalance } from '@/hooks/queries/useCustomers';
import { getErrorMessage } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import type { CustomerRow } from '@/types/customer';

const schema = z.object({
  Amount: z
    .number({ required_error: 'Required' })
    .refine((v) => v !== 0, 'Must be non-zero'),
  Reason: z.string().min(1, 'Reason is required').max(500),
});

type Form = z.infer<typeof schema>;

interface Props {
  open: boolean;
  customer: CustomerRow | null;
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

export function AdjustBalanceModal({ open, customer, onClose }: Props) {
  const { message } = App.useApp();
  const mutation = useAdjustCustomerBalance(customer?.Id ?? '');

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { Amount: 0, Reason: '' },
    mode: 'onTouched',
  });

  useEffect(() => {
    if (open) reset({ Amount: 0, Reason: '' });
  }, [open, reset]);

  const submitting = isSubmitting || mutation.isPending;

  const onSubmit = async (values: Form) => {
    try {
      await mutation.mutateAsync(values);
      message.success('Balance adjusted');
      onClose();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  return (
    <Modal
      title={`Adjust balance — ${customer?.Name ?? ''}`}
      open={open}
      onCancel={submitting ? undefined : onClose}
      onOk={handleSubmit(onSubmit)}
      okText="Apply adjustment"
      confirmLoading={submitting}
      destroyOnClose
      maskClosable={!submitting}
    >
      {customer && (
        <Flex vertical gap={4} style={{ marginBottom: 16 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Current balance
          </Typography.Text>
          <Typography.Text strong style={{ fontSize: 18 }}>
            {formatMoney(customer.Balance)}
          </Typography.Text>
        </Flex>
      )}

      <div style={{ marginBottom: 12 }}>
        <label style={LABEL_STYLE}>Amount *</label>
        <Controller
          name="Amount"
          control={control}
          render={({ field, fieldState }) => (
            <>
              <InputNumber
                value={field.value}
                onChange={(v) => field.onChange(v ?? 0)}
                precision={4}
                step={100}
                style={{ width: '100%' }}
                status={fieldState.error ? 'error' : undefined}
                placeholder="Positive = customer owes more"
              />
              <div style={ERR_STYLE}>{fieldState.error?.message ?? ''}</div>
            </>
          )}
        />
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          Positive increases what the customer owes. Negative reduces it.
        </Typography.Text>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={LABEL_STYLE}>Reason *</label>
        <Controller
          name="Reason"
          control={control}
          render={({ field, fieldState }) => (
            <>
              <Input.TextArea
                {...field}
                rows={3}
                maxLength={500}
                showCount
                status={fieldState.error ? 'error' : undefined}
                placeholder="e.g. Write-off of damaged goods"
              />
              <div style={ERR_STYLE}>{fieldState.error?.message ?? ''}</div>
            </>
          )}
        />
      </div>

      <Typography.Paragraph type="secondary" style={{ fontSize: 11, margin: 0 }}>
        Writes an ADJUSTMENT row to the customer ledger. Reason is required and
        logged in the audit trail.
      </Typography.Paragraph>
    </Modal>
  );
}