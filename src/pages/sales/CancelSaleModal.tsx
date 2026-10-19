import { useEffect, useState } from 'react';
import { Modal, Input, Flex, Alert, Typography, App } from 'antd';
import { useCancelSale } from '@/hooks/queries/useSales';
import { getErrorMessage } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import type { SaleDetail } from '@/types/sale';

interface Props {
  open: boolean;
  sale: SaleDetail | null;
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

export function CancelSaleModal({ open, sale, onClose }: Props) {
  const { message } = App.useApp();
  const mutation = useCancelSale();
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
    if (!sale) return;
    if (!reason.trim()) {
      setError('Reason is required');
      return;
    }
    try {
      await mutation.mutateAsync({ id: sale.Id, reason: reason.trim() });
      message.success(`Sale ${sale.InvoiceNumber} cancelled`);
      onClose();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  // Detect cheque blockers client-side so we can disable submit + warn early.
  const attachedCheques = sale?.Cheques ?? [];
  const hasPendingOrCleared = attachedCheques.some(
    (c) => c.Status === 'PENDING' || c.Status === 'CLEARED',
  );

  return (
    <Modal
      title="Cancel sale"
      open={open}
      onCancel={mutation.isPending ? undefined : onClose}
      onOk={handleOk}
      okText="Cancel sale"
      okButtonProps={{ danger: true, disabled: hasPendingOrCleared }}
      confirmLoading={mutation.isPending}
      destroyOnClose
      maskClosable={!mutation.isPending}
    >
      {sale && (
        <Flex vertical gap={10} style={{ marginBottom: 12 }}>
          <Alert
            type="warning"
            showIcon
            message="This reverses the entire sale"
            description={
              <>
                Stock is returned to the warehouse, cash refunded from the
                drawer, credit removed from the customer balance, and loyalty
                points reversed. The card portion is <strong>not</strong>{' '}
                auto-refunded — the accountant handles that via the bank.
              </>
            }
          />

          <Flex vertical gap={2}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Invoice
            </Typography.Text>
            <Typography.Text strong>{sale.InvoiceNumber}</Typography.Text>
          </Flex>

          <Flex gap={16} wrap="wrap">
            <Flex vertical gap={2}>
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                Total
              </Typography.Text>
              <Typography.Text strong>
                {formatMoney(sale.TotalAmount)}
              </Typography.Text>
            </Flex>
            {Number(sale.CashAmount) > 0 && (
              <Flex vertical gap={2}>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  Cash
                </Typography.Text>
                <Typography.Text style={{ color: '#16a34a' }}>
                  {formatMoney(sale.CashAmount)}
                </Typography.Text>
              </Flex>
            )}
            {Number(sale.CardAmount) > 0 && (
              <Flex vertical gap={2}>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  Card
                </Typography.Text>
                <Typography.Text style={{ color: '#f59e0b' }}>
                  {formatMoney(sale.CardAmount)}
                </Typography.Text>
              </Flex>
            )}
            {Number(sale.CreditAmount) > 0 && (
              <Flex vertical gap={2}>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  Credit
                </Typography.Text>
                <Typography.Text style={{ color: '#dc2626' }}>
                  {formatMoney(sale.CreditAmount)}
                </Typography.Text>
              </Flex>
            )}
            {Number(sale.ChequeAmount) > 0 && (
              <Flex vertical gap={2}>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  Cheque
                </Typography.Text>
                <Typography.Text style={{ color: '#7c3aed' }}>
                  {formatMoney(sale.ChequeAmount)}
                </Typography.Text>
              </Flex>
            )}
          </Flex>

          {hasPendingOrCleared && (
            <Alert
              type="error"
              showIcon
              message="Cannot cancel — cheques attached"
              description={`This sale has ${attachedCheques.filter((c) => c.Status === 'PENDING' || c.Status === 'CLEARED').length} cheque(s) pending or cleared. Void pending cheques first, or use Sale Returns for cleared ones.`}
            />
          )}
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
          placeholder="e.g. Customer changed mind, entered wrong items"
          status={error ? 'error' : undefined}
          disabled={mutation.isPending || hasPendingOrCleared}
        />
        <div style={ERR_STYLE}>{error ?? ''}</div>
      </div>
    </Modal>
  );
}