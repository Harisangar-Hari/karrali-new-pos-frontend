import { useEffect, useState } from 'react';
import { Modal, Input, Flex, Typography, Alert, App } from 'antd';
import { useDeleteCashMovement } from '@/hooks/queries/useCashMovements';
import { getErrorMessage } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import type { CashMovementRow } from '@/types/cashMovement';

interface Props {
  open: boolean;
  movement: CashMovementRow | null;
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

export function DeleteCashMovementModal({ open, movement, onClose }: Props) {
  const { message } = App.useApp();
  const mutation = useDeleteCashMovement();
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
    if (!movement) return;
    if (!reason.trim()) {
      setError('Reason is required');
      return;
    }
    try {
      await mutation.mutateAsync({ id: movement.Id, reason: reason.trim() });
      message.success('Cash movement deleted');
      onClose();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  return (
    <Modal
      title="Delete cash movement"
      open={open}
      onCancel={mutation.isPending ? undefined : onClose}
      onOk={handleOk}
      okText="Delete movement"
      okButtonProps={{ danger: true }}
      confirmLoading={mutation.isPending}
      destroyOnClose
      maskClosable={!mutation.isPending}
    >
      {movement && (
        <Flex vertical gap={8} style={{ marginBottom: 12 }}>
          <Alert
            type="warning"
            showIcon
            message="The ledger effect will be reversed"
            description={
              <>
                Deleting writes an opposite{' '}
                {movement.Type === 'CASH_IN' ? 'CASH_OUT' : 'CASH_IN'} entry
                for{' '}
                <strong>
                  {movement.Type === 'CASH_IN' ? '−' : '+'}
                  {formatMoney(movement.Amount)}
                </strong>{' '}
                to the current drawer. The original entry is preserved in the
                audit log.
              </>
            }
          />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {movement.Code} · {movement.Type} · {formatMoney(movement.Amount)} ·{' '}
            {movement.Reason}
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
          placeholder="e.g. Entered twice by mistake"
          status={error ? 'error' : undefined}
          disabled={mutation.isPending}
        />
        <div style={ERR_STYLE}>{error ?? ''}</div>
      </div>
    </Modal>
  );
}