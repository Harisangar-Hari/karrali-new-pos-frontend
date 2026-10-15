import { useEffect, useState } from 'react';
import {
  Modal,
  Input,
  DatePicker,
  Flex,
  Typography,
  Alert,
  App,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import {
  useBounceCustomerCheque,
  useClearCustomerCheque,
  useVoidCustomerCheque,
} from '@/hooks/queries/useCustomerCheques';
import { getErrorMessage } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import type { CustomerChequeRow } from '@/types/customerCheque';

export type ChequeActionMode = 'clear' | 'bounce' | 'void';

interface Props {
  open: boolean;
  mode: ChequeActionMode;
  cheque: CustomerChequeRow | null;
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

const TITLES: Record<ChequeActionMode, string> = {
  clear: 'Mark cheque as cleared',
  bounce: 'Mark cheque as bounced',
  void: 'Void pending cheque',
};

export function ChequeActionModal({ open, mode, cheque, onClose }: Props) {
  const { message } = App.useApp();

  const clearMutation = useClearCustomerCheque();
  const bounceMutation = useBounceCustomerCheque();
  const voidMutation = useVoidCustomerCheque();

  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [clearedAt, setClearedAt] = useState<Dayjs | null>(dayjs());
  const [bouncedAt, setBouncedAt] = useState<Dayjs | null>(dayjs());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason('');
      setNotes('');
      setClearedAt(dayjs());
      setBouncedAt(dayjs());
      setError(null);
    }
  }, [open, mode]);

  const submitting =
    clearMutation.isPending ||
    bounceMutation.isPending ||
    voidMutation.isPending;

  const handleOk = async () => {
    if (!cheque) return;
    setError(null);

    if ((mode === 'bounce' || mode === 'void') && !reason.trim()) {
      setError('Reason is required');
      return;
    }

    try {
      if (mode === 'clear') {
        await clearMutation.mutateAsync({
          id: cheque.Id,
          input: {
            ClearedAt: clearedAt ? clearedAt.toISOString() : undefined,
            Notes: notes.trim() || undefined,
          },
        });
        message.success('Cheque cleared');
      } else if (mode === 'bounce') {
        await bounceMutation.mutateAsync({
          id: cheque.Id,
          input: {
            Reason: reason.trim(),
            BouncedAt: bouncedAt ? bouncedAt.toISOString() : undefined,
            Notes: notes.trim() || undefined,
          },
        });
        message.success('Cheque bounced');
      } else {
        await voidMutation.mutateAsync({
          id: cheque.Id,
          input: { Reason: reason.trim() },
        });
        message.success('Cheque voided');
      }
      onClose();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  return (
    <Modal
      title={TITLES[mode]}
      open={open}
      onCancel={submitting ? undefined : onClose}
      onOk={handleOk}
      okText={
        mode === 'clear' ? 'Mark cleared' : mode === 'bounce' ? 'Mark bounced' : 'Void'
      }
      okButtonProps={{ danger: mode !== 'clear' }}
      confirmLoading={submitting}
      destroyOnClose
      maskClosable={!submitting}
    >
      {cheque && (
        <Flex vertical gap={8} style={{ marginBottom: 12 }}>
          {mode === 'clear' && (
            <Alert
              type="success"
              showIcon
              message="No ledger effect"
              description="The customer's balance already moved when this cheque was issued. Clearing is a status-only confirmation."
            />
          )}
          {mode === 'bounce' && (
            <Alert
              type="warning"
              showIcon
              message="Balance will be restored"
              description={`Customer's balance goes back up by ${formatMoney(cheque.Amount)}. If this cheque paid a sale or a credit payment, that record is reversed.`}
            />
          )}
          {mode === 'void' && (
            <Alert
              type="warning"
              showIcon
              message="Same effect as bounce, distinct audit trail"
              description={`Customer's balance goes back up by ${formatMoney(cheque.Amount)}. Recorded as CHEQUE_VOIDED in the ledger.`}
            />
          )}
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Cheque {cheque.ChequeNumber} · {cheque.Customer.Name} ·{' '}
            {formatMoney(cheque.Amount)}
          </Typography.Text>
        </Flex>
      )}

      {mode === 'clear' && (
        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Cleared at</label>
          <DatePicker
            showTime
            value={clearedAt}
            onChange={(d) => setClearedAt(d)}
            style={{ width: '100%' }}
            disabled={submitting}
          />
        </div>
      )}

      {mode === 'bounce' && (
        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Bounced at</label>
          <DatePicker
            showTime
            value={bouncedAt}
            onChange={(d) => setBouncedAt(d)}
            style={{ width: '100%' }}
            disabled={submitting}
          />
        </div>
      )}

      {(mode === 'bounce' || mode === 'void') && (
        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Reason *</label>
          <Input.TextArea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            rows={2}
            maxLength={500}
            showCount
            placeholder={
              mode === 'bounce'
                ? 'e.g. Insufficient funds'
                : 'e.g. Wrong amount — reissuing'
            }
            status={error ? 'error' : undefined}
            disabled={submitting}
          />
          <div style={ERR_STYLE}>{error ?? ''}</div>
        </div>
      )}

      {(mode === 'clear' || mode === 'bounce') && (
        <div style={{ marginBottom: 4 }}>
          <label style={LABEL_STYLE}>Notes</label>
          <Input.TextArea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            maxLength={500}
            showCount
            placeholder="Optional"
            disabled={submitting}
          />
        </div>
      )}
    </Modal>
  );
}