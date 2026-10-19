import { useEffect, useState } from 'react';
import { Modal, Input, Flex, Alert, Typography, App } from 'antd';
import { useReverseSupplierPayment } from '@/hooks/queries/useSupplierPayments';
import { getErrorMessage } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import type { SupplierPaymentRow } from '@/types/supplierPayment';

interface Props {
  open: boolean;
  payment: SupplierPaymentRow | null;
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

export function ReversePaymentModal({ open, payment, onClose }: Props) {
  const { message } = App.useApp();
  const mutation = useReverseSupplierPayment();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

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
      title="Reverse supplier payment"
      open={open}
      onCancel={mutation.isPending ? undefined : onClose}
      onOk={handleOk}
      okText="Reverse payment"
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
            message="The payment will be deleted"
            description={
              <>
                The purchase's paid amount is rolled back by{' '}
                <strong>{formatMoney(payment.Amount)}</strong>, and any cash
                effect (for CASH payments) is reversed in the drawer ledger.
              </>
            }
          />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {payment.Code} · {payment.Supplier.Name} · {payment.Purchase.Code}
          </Typography.Text>
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
          placeholder="e.g. Duplicate entry — original payment recorded twice"
          status={error ? 'error' : undefined}
          disabled={mutation.isPending}
        />
        <div style={ERR_STYLE}>{error ?? ''}</div>
      </div>
    </Modal>
  );
}