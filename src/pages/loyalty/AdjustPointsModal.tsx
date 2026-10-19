import { useEffect, useState } from 'react';
import {
  Modal,
  Input,
  InputNumber,
  Flex,
  Alert,
  Typography,
  App,
  Segmented,
} from 'antd';
import { useAdjustLoyaltyPoints } from '@/hooks/queries/useLoyalty';
import { getErrorMessage } from '@/lib/api';
import type { LoyaltyStatus } from '@/types/loyalty';

interface Props {
  open: boolean;
  customerId: string | null;
  customerName?: string;
  currentPoints?: number;
  onClose: () => void;
  onSuccess?: (status: LoyaltyStatus) => void;
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

export function AdjustPointsModal({
  open,
  customerId,
  customerName,
  currentPoints,
  onClose,
  onSuccess,
}: Props) {
  const { message } = App.useApp();
  const mutation = useAdjustLoyaltyPoints(customerId ?? '');

  const [direction, setDirection] = useState<'credit' | 'debit'>('credit');
  const [amount, setAmount] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDirection('credit');
      setAmount(null);
      setReason('');
      setError(null);
    }
  }, [open]);

  const submitting = mutation.isPending;

  const projected =
    amount === null || currentPoints === undefined
      ? null
      : direction === 'credit'
        ? currentPoints + amount
        : currentPoints - amount;

  const wouldGoNegative =
    direction === 'debit' &&
    amount !== null &&
    currentPoints !== undefined &&
    amount > currentPoints;

  const handleOk = async () => {
    setError(null);
    if (!customerId) return;
    if (amount === null || amount <= 0) {
      setError('Enter a positive number');
      return;
    }
    if (!Number.isInteger(amount)) {
      setError('Points must be a whole number');
      return;
    }
    if (!reason.trim()) {
      setError('Reason is required');
      return;
    }
    if (wouldGoNegative) {
      setError(
        `Balance would go below zero (current: ${currentPoints}, debit: ${amount})`,
      );
      return;
    }
    try {
      const status = await mutation.mutateAsync({
        Points: direction === 'credit' ? amount : -amount,
        Reason: reason.trim(),
      });
      message.success(
        `Points ${direction === 'credit' ? 'added' : 'deducted'} — new balance ${status.Points}`,
      );
      onSuccess?.(status);
      onClose();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  return (
    <Modal
      title={
        customerName
          ? `Adjust points — ${customerName}`
          : 'Adjust loyalty points'
      }
      open={open}
      onCancel={submitting ? undefined : onClose}
      onOk={handleOk}
      okText="Apply adjustment"
      confirmLoading={submitting}
      destroyOnClose
      maskClosable={!submitting}
    >
      <Flex vertical gap={12}>
        {currentPoints !== undefined && (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Current balance:{' '}
            <strong>{currentPoints.toLocaleString()} points</strong>
          </Typography.Text>
        )}

        <div>
          <label style={LABEL_STYLE}>Direction</label>
          <Segmented
            value={direction}
            onChange={(v) => setDirection(v as 'credit' | 'debit')}
            block
            options={[
              { label: 'Credit (+)', value: 'credit' },
              { label: 'Debit (−)', value: 'debit' },
            ]}
          />
        </div>

        <div>
          <label style={LABEL_STYLE}>Points *</label>
          <InputNumber
            value={amount ?? undefined}
            onChange={(v) => {
              setAmount(v === null ? null : Number(v));
              if (error) setError(null);
            }}
            min={1}
            precision={0}
            size="large"
            style={{ width: '100%' }}
            placeholder="e.g. 200"
          />
        </div>

        {projected !== null && amount !== null && amount > 0 && (
          <Alert
            type={wouldGoNegative ? 'error' : 'info'}
            showIcon
            message={`New balance will be ${projected.toLocaleString()} points`}
          />
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
            placeholder="e.g. Goodwill for delayed delivery"
            status={error ? 'error' : undefined}
            disabled={submitting}
          />
          <div style={ERR_STYLE}>{error ?? ''}</div>
        </div>

        <Alert
          type="info"
          showIcon
          message="Recorded in the audit log"
          description="The adjustment creates an ADJUST loyalty transaction with the reason attached."
        />
      </Flex>
    </Modal>
  );
}