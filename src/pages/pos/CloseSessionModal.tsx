import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Input,
  InputNumber,
  Typography,
  Flex,
  Divider,
  Button,
  Alert,
  Skeleton,
  App,
} from 'antd';
import Decimal from 'decimal.js';
import { useExpectedCash, useCloseCashSession } from '@/hooks/queries/useCashSession';
import { formatMoney, formatDateTime } from '@/lib/format';
import { getErrorMessage } from '@/lib/api';
import type { OpenSessionSummary } from '@/types/cashSession';

interface Props {
  open: boolean;
  session: OpenSessionSummary;
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

const EPSILON = new Decimal('0.0001');

export function CloseSessionModal({ open, session, onClose }: Props) {
  const { message, notification } = App.useApp();
  const closeMutation = useCloseCashSession(session.Id);

  const { data: expected, isLoading } = useExpectedCash(session.Id, open);

  const [counted, setCounted] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);

  // Reset the form every time the modal opens.
  useEffect(() => {
    if (open) {
      setCounted(null);
      setReason('');
      setNotes('');
      setReasonError(null);
    }
  }, [open]);

  const expectedDec = useMemo(
    () => (expected ? new Decimal(expected.ExpectedCash) : null),
    [expected],
  );

  const countedDec = useMemo(
    () => (counted === null ? null : new Decimal(counted)),
    [counted],
  );

  const difference = useMemo(() => {
    if (!expectedDec || !countedDec) return null;
    return countedDec.sub(expectedDec);
  }, [expectedDec, countedDec]);

  const hasDiscrepancy =
    difference !== null && difference.abs().gt(EPSILON);

  const canSubmit =
    !closeMutation.isPending &&
    counted !== null &&
    counted >= 0 &&
    (!hasDiscrepancy || reason.trim().length > 0);

  const handleSubmit = async () => {
    setReasonError(null);

    if (counted === null || counted < 0) {
      message.error('Enter the counted cash amount');
      return;
    }

    if (hasDiscrepancy && reason.trim().length === 0) {
      setReasonError('Discrepancy reason is required when counted ≠ expected');
      return;
    }

    try {
      await closeMutation.mutateAsync({
        CountedCash: counted,
        DiscrepancyReason: hasDiscrepancy ? reason.trim() : undefined,
        Notes: notes.trim() || undefined,
      });

      // Summary toast before the modal unmounts.
      const diffAbs = difference!.abs();
      if (diffAbs.gt(EPSILON)) {
        notification.warning({
          message: 'Drawer closed with a discrepancy',
          description:
            difference!.isNegative()
              ? `Short by ${formatMoney(diffAbs.toFixed(4))}`
              : `Over by ${formatMoney(diffAbs.toFixed(4))}`,
          duration: 6,
        });
      } else {
        notification.success({
          message: 'Drawer closed',
          description: `Counted ${formatMoney(countedDec!.toFixed(4))} — matches expected.`,
          duration: 4,
        });
      }

      onClose();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  const submitting = closeMutation.isPending;

  return (
    <Modal
      title="Close cash drawer"
      open={open}
      onCancel={submitting ? undefined : onClose}
      destroyOnClose
      width={480}
      maskClosable={!submitting}
      footer={
        <Flex justify="flex-end" gap={8}>
          <Button onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="primary"
            loading={submitting}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            Close drawer
          </Button>
        </Flex>
      }
    >
      {/* Session context */}
      <Flex vertical gap={2} style={{ marginBottom: 16 }}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {session.Terminal.Name} ({session.Terminal.Code})
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Opened {formatDateTime(session.OpenedAt)}
        </Typography.Text>
      </Flex>

      <Divider orientation="left" plain style={{ margin: '0 0 12px' }}>
        Expected cash
      </Divider>

      {isLoading || !expected ? (
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : (
        <Flex vertical gap={6} style={{ marginBottom: 12 }}>
          <Row label="Starting cash" value={formatMoney(expected.StartingCash)} />
          <Row
            label={`Movements (${expected.EntryCount} entr${expected.EntryCount === 1 ? 'y' : 'ies'})`}
            value={formatMoney(expected.LedgerTotal)}
            valueColor={Number(expected.LedgerTotal) < 0 ? '#dc2626' : undefined}
          />
          <Divider style={{ margin: '6px 0' }} />
          <Flex justify="space-between" align="center">
            <Typography.Text strong>Expected in drawer</Typography.Text>
            <Typography.Text strong style={{ fontSize: 18 }}>
              {formatMoney(expected.ExpectedCash)}
            </Typography.Text>
          </Flex>
        </Flex>
      )}

      <Divider orientation="left" plain style={{ margin: '16px 0 12px' }}>
        Physical count
      </Divider>

      <div style={{ marginBottom: 12 }}>
        <label style={LABEL_STYLE}>Counted cash *</label>
        <InputNumber
          autoFocus
          value={counted}
          onChange={(v) => setCounted(v === null ? null : Number(v))}
          min={0}
          precision={4}
          step={100}
          size="large"
          style={{ width: '100%' }}
          placeholder="0.0000"
          disabled={submitting}
        />
      </div>

      {difference !== null && (
        <Flex
          justify="space-between"
          align="center"
          style={{
            padding: '10px 12px',
            borderRadius: 6,
            background: hasDiscrepancy
              ? difference.isNegative()
                ? '#fef2f2'
                : '#fffbeb'
              : '#f0fdf4',
            border: hasDiscrepancy
              ? difference.isNegative()
                ? '1px solid #fecaca'
                : '1px solid #fde68a'
              : '1px solid #bbf7d0',
            marginBottom: 12,
          }}
        >
          <Typography.Text strong style={{ fontSize: 13 }}>
            {hasDiscrepancy
              ? difference.isNegative()
                ? 'Short'
                : 'Over'
              : 'Balanced'}
          </Typography.Text>
          <Typography.Text
            strong
            style={{
              fontSize: 16,
              color: hasDiscrepancy
                ? difference.isNegative()
                  ? '#dc2626'
                  : '#d97706'
                : '#16a34a',
            }}
          >
            {formatMoney(difference.abs().toFixed(4))}
          </Typography.Text>
        </Flex>
      )}

      {hasDiscrepancy && (
        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Discrepancy reason *</label>
          <Input.TextArea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (reasonError) setReasonError(null);
            }}
            rows={2}
            maxLength={500}
            showCount
            placeholder="e.g. Change given short — recount with manager"
            status={reasonError ? 'error' : undefined}
            disabled={submitting}
          />
          <div style={ERR_STYLE}>{reasonError ?? ''}</div>
        </div>
      )}

      {!hasDiscrepancy && difference !== null && (
        <Alert
          type="success"
          showIcon
          message="Counted cash matches expected"
          style={{ marginBottom: 12 }}
        />
      )}

      <div style={{ marginBottom: 4 }}>
        <label style={LABEL_STYLE}>Close notes</label>
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
    </Modal>
  );
}

function Row({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <Flex justify="space-between">
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {label}
      </Typography.Text>
      <Typography.Text style={{ fontSize: 12, color: valueColor }}>
        {value}
      </Typography.Text>
    </Flex>
  );
}