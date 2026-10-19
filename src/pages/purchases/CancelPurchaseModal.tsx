import { useEffect, useState } from 'react';
import { Modal, Input, Flex, Alert, Typography, App } from 'antd';
import { useCancelPurchase } from '@/hooks/queries/usePurchases';
import { getErrorMessage } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import type { PurchaseListRow } from '@/types/purchase';

interface Props {
  open: boolean;
  purchase: PurchaseListRow | null;
  onClose: () => void;
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  marginBottom: 4,
  fontSize: 13,
  color: 'rgba(0,0,0,0.88)',
};

export function CancelPurchaseModal({ open, purchase, onClose }: Props) {
  const { message } = App.useApp();
  const mutation = useCancelPurchase();
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  const handleOk = async () => {
    if (!purchase) return;
    try {
      await mutation.mutateAsync({
        id: purchase.Id,
        reason: reason.trim() || undefined,
      });
      message.success('Purchase cancelled');
      onClose();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  return (
    <Modal
      title="Cancel purchase"
      open={open}
      onCancel={mutation.isPending ? undefined : onClose}
      onOk={handleOk}
      okText="Cancel purchase"
      okButtonProps={{ danger: true }}
      confirmLoading={mutation.isPending}
      destroyOnClose
      maskClosable={!mutation.isPending}
    >
      {purchase && (
        <Flex vertical gap={8} style={{ marginBottom: 12 }}>
          <Alert
            type="warning"
            showIcon
            message="Stock will be reversed"
            description={
              <>
                All line items are removed from{' '}
                <strong>{purchase.Warehouse.Name}</strong> via{' '}
                <code>PURCHASE_RETURN</code> movements. This fails if the stock
                has already been sold — you can't un-buy goods that are gone.
              </>
            }
          />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {purchase.Code} · {purchase.Supplier.Name} ·{' '}
            {formatMoney(purchase.TotalAmount)}
          </Typography.Text>
          {Number(purchase.PaidAmount) > 0 && (
            <Alert
              type="error"
              showIcon
              message={`This purchase already has payments totalling ${formatMoney(
                purchase.PaidAmount,
              )}. Reverse those first.`}
            />
          )}
        </Flex>
      )}

      <div>
        <label style={LABEL_STYLE}>Reason (optional)</label>
        <Input.TextArea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          maxLength={500}
          showCount
          placeholder="e.g. Wrong supplier invoice, duplicate entry"
          disabled={mutation.isPending}
        />
      </div>
    </Modal>
  );
}