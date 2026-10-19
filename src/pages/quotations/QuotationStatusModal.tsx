import { useEffect, useState } from 'react';
import { Modal, Input, Flex, Alert, App } from 'antd';
import {
  useCancelQuotation,
  useRejectQuotation,
} from '@/hooks/queries/useQuotations';
import { getErrorMessage } from '@/lib/api';
import type { QuotationDetail } from '@/types/quotation';

export type QuotationStatusAction = 'reject' | 'cancel';

interface Props {
  open: boolean;
  action: QuotationStatusAction;
  quotation: QuotationDetail | null;
  onClose: () => void;
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  marginBottom: 4,
  fontSize: 13,
  color: 'rgba(0,0,0,0.88)',
};

export function QuotationStatusModal({
  open,
  action,
  quotation,
  onClose,
}: Props) {
  const { message } = App.useApp();
  const rejectMutation = useRejectQuotation();
  const cancelMutation = useCancelQuotation();

  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason('');
      setError(null);
    }
  }, [open]);

  const submitting = rejectMutation.isPending || cancelMutation.isPending;

  const handleOk = async () => {
    if (!quotation) return;
    setError(null);
    if (!reason.trim()) {
      setError('Reason is required');
      return;
    }
    try {
      if (action === 'reject') {
        await rejectMutation.mutateAsync({
          id: quotation.Id,
          input: { Reason: reason.trim() },
        });
        message.success('Quotation rejected');
      } else {
        await cancelMutation.mutateAsync({
          id: quotation.Id,
          input: { Reason: reason.trim() },
        });
        message.success('Quotation cancelled');
      }
      onClose();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  return (
    <Modal
      title={action === 'reject' ? 'Reject quotation' : 'Cancel quotation'}
      open={open}
      onCancel={submitting ? undefined : onClose}
      onOk={handleOk}
      okText={action === 'reject' ? 'Mark rejected' : 'Cancel quotation'}
      okButtonProps={{ danger: true }}
      confirmLoading={submitting}
      destroyOnClose
      maskClosable={!submitting}
    >
      {quotation && (
        <Flex vertical gap={8} style={{ marginBottom: 12 }}>
          <Alert
            type="warning"
            showIcon
            message={
              action === 'reject'
                ? 'The quotation will be marked REJECTED.'
                : 'The quotation will be marked CANCELLED.'
            }
            description="Both are terminal — the quotation cannot be edited or converted afterwards."
          />
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
          placeholder={
            action === 'reject'
              ? 'e.g. Customer chose a competing quote'
              : 'e.g. Customer changed requirements'
          }
          status={error ? 'error' : undefined}
          disabled={submitting}
        />
      </div>
      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          style={{ marginTop: 8 }}
        />
      )}
    </Modal>
  );
}