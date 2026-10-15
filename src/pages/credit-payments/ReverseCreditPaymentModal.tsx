import { useEffect, useState } from 'react';
import { Modal, Input, Typography, Flex, Alert, App } from 'antd';
import { useReverseCreditPayment } from '@/hooks/queries/useCreditPayments';
import { getErrorMessage } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import type { CreditPaymentRow } from '@/types/creditPayment';

interface Props {
  open: boolean;
  payment: CreditPaymentRow | null;
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

export function ReverseCreditPaymentModal({ open, payment, onClose }: Props) {
  const { message } = App.useApp();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mutation = useReverseCreditPayment();

  useEffect(() => {
    if (open) {
      setReason('');
      setError(null);
    }
  }, [open]);

  const handleOk = async () => {
    setError(null);
    if (!payment) return;
    if (!reason.trim()) {
      setError('Reason is required');
      return;
    }
    try {
      await mutation.mutateAsync({ id: payment.Id, reason: reason.trim() });
      message.success('Payment reversed');
      onClose();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  return (
    <Modal
      title="Reverse credit payment"
      open={open}
      onCancel={mutation.isPending ? undefined : onClose}
      onOk={handleOk}
      okText="Reverse"
      okButtonProps={{ danger: true }}
      confirmLoading={mutation.isPending}
      destroyOnClose
      maskClosable={!mutation.isPending}
    >
      {payment && (
        <Flex vertical gap={8} style={{ marginBottom: 12 }}>
          <Alert
            type="warning"
            showIcon
            message="This will undo the payment"
            description={
              <>
                The customer's balance goes back up by{' '}
                <strong>{formatMoney(payment.Amount)}</strong> and the drawer
                drops by the same amount.
              </>
            }
          />
          <Flex vertical gap={2}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Payment {payment.Code} · {payment.Customer.Name}
            </Typography.Text>
          </Flex>
        </Flex>
      )}

      <div>
        <label style={LABEL_STYLE}>Reason *</label>
        <Input.TextArea
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (error) setError(null);
          }}
          rows={3}
          maxLength={500}
          showCount
          placeholder="e.g. Cashier entered wrong amount"
          status={error ? 'error' : undefined}
          disabled={mutation.isPending}
        />
        <div style={ERR_STYLE}>{error ?? ''}</div>
      </div>
    </Modal>
  );
}