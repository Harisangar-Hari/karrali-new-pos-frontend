import { useEffect, useState } from 'react';
import {
  Drawer,
  Input,
  InputNumber,
  DatePicker,
  Button,
  Flex,
  Grid,
  Typography,
  App,
  Alert,
  Select,
  Divider,
  Empty,
} from 'antd';
import { Plus, Trash2 } from 'lucide-react';
import dayjs, { type Dayjs } from 'dayjs';
import Decimal from 'decimal.js';
import { useBulkCreateCustomerCheques } from '@/hooks/queries/useCustomerCheques';
import { useCustomersLookup } from '@/hooks/queries/useCustomersLookup';
import { getErrorMessage } from '@/lib/api';
import { formatMoney } from '@/lib/format';

const { useBreakpoint } = Grid;

interface BulkRow {
  id: string;
  ChequeNumber: string;
  Amount: number | null;
  IssueDate: Dayjs | null;
  DueDate: Dayjs | null;
}

let rowCounter = 0;
function newRow(): BulkRow {
  rowCounter += 1;
  return {
    id: `r-${rowCounter}`,
    ChequeNumber: '',
    Amount: null,
    IssueDate: dayjs(),
    DueDate: dayjs().add(30, 'day'),
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  marginBottom: 4,
  fontSize: 13,
  color: 'rgba(0,0,0,0.88)',
};

export function BulkChequeDrawer({ open, onClose, onSuccess }: Props) {
  const { message } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const { data: customers = [] } = useCustomersLookup();
  const bulkMutation = useBulkCreateCustomerCheques();

  const [customerId, setCustomerId] = useState<string | undefined>();
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<BulkRow[]>([newRow()]);

  useEffect(() => {
    if (open) {
      setCustomerId(undefined);
      setBankName('');
      setBankBranch('');
      setNotes('');
      setRows([newRow()]);
    }
  }, [open]);

  const updateRow = (id: string, patch: Partial<BulkRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
  };

  const removeRow = (id: string) => {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((r) => r.id !== id)));
  };

  const totalAmount = rows.reduce(
    (s, r) => s.add(new Decimal(r.Amount ?? 0)),
    new Decimal(0),
  );

  const canSubmit =
    !bulkMutation.isPending &&
    !!customerId &&
    rows.length > 0 &&
    rows.every(
      (r) =>
        r.ChequeNumber.trim().length > 0 &&
        (r.Amount ?? 0) > 0 &&
        r.IssueDate &&
        r.DueDate,
    );

  const handleSubmit = async () => {
    if (!customerId) return;
    try {
      const payload = {
        Cheques: rows.map((r) => ({
          CustomerId: customerId,
          ChequeNumber: r.ChequeNumber.trim(),
          BankName: bankName.trim() || undefined,
          BankBranch: bankBranch.trim() || undefined,
          Amount: Number(r.Amount),
          IssueDate: r.IssueDate!.toISOString(),
          DueDate: r.DueDate!.toISOString(),
          Notes: notes.trim() || undefined,
        })),
      };
      const res = await bulkMutation.mutateAsync(payload);
      message.success(`${res.count} cheque${res.count === 1 ? '' : 's'} recorded`);
      onSuccess?.();
      onClose();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  const submitting = bulkMutation.isPending;

  return (
    <Drawer
      title="Bulk-record customer cheques"
      open={open}
      onClose={submitting ? undefined : onClose}
      width={isMobile ? '100%' : 640}
      destroyOnClose
      maskClosable={!submitting}
      extra={
        <Flex gap={8}>
          <Button onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="primary"
            loading={submitting}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            Record {rows.length} cheque{rows.length === 1 ? '' : 's'}
          </Button>
        </Flex>
      }
    >
      <Alert
        type="info"
        showIcon
        message="Atomic batch"
        description="If any entry is invalid, none are written. One audit entry summarises the batch."
        style={{ marginBottom: 16 }}
      />

      {/* Shared header fields */}
      <div style={{ marginBottom: 12 }}>
        <label style={LABEL_STYLE}>Customer *</label>
        <Select
          value={customerId}
          onChange={setCustomerId}
          placeholder="Pick a customer"
          options={customers.map((c) => ({
            label: `${c.Name} (${c.Code ?? ''})`,
            value: c.Id,
          }))}
          showSearch
          optionFilterProp="label"
          style={{ width: '100%' }}
        />
      </div>

      <Flex gap={12} wrap="wrap">
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={LABEL_STYLE}>Bank (applied to all)</label>
          <Input
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            maxLength={100}
            placeholder="Optional"
          />
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={LABEL_STYLE}>Branch</label>
          <Input
            value={bankBranch}
            onChange={(e) => setBankBranch(e.target.value)}
            maxLength={100}
            placeholder="Optional"
          />
        </div>
      </Flex>

      <Divider orientation="left" plain style={{ marginTop: 20 }}>
        Cheques ({rows.length})
      </Divider>

      {rows.length === 0 ? (
        <Empty description="No rows" />
      ) : (
        <Flex vertical gap={8}>
          {rows.map((row, idx) => (
            <div
              key={row.id}
              style={{
                padding: 10,
                border: '1px solid #f0f0f0',
                borderRadius: 6,
                background: '#fafafa',
              }}
            >
              <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                <Typography.Text strong style={{ fontSize: 12 }}>
                  #{idx + 1}
                </Typography.Text>
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<Trash2 size={14} />}
                  disabled={rows.length === 1}
                  onClick={() => removeRow(row.id)}
                />
              </Flex>

              <Flex gap={8} wrap="wrap">
                <Input
                  value={row.ChequeNumber}
                  onChange={(e) =>
                    updateRow(row.id, { ChequeNumber: e.target.value })
                  }
                  placeholder="Cheque number *"
                  style={{ flex: 1, minWidth: 140 }}
                  maxLength={32}
                />
                <InputNumber
                  value={row.Amount}
                  onChange={(v) =>
                    updateRow(row.id, { Amount: v === null ? null : Number(v) })
                  }
                  placeholder="Amount *"
                  min={0.0001}
                  precision={4}
                  step={100}
                  style={{ flex: 1, minWidth: 140 }}
                />
              </Flex>

              <Flex gap={8} wrap="wrap" style={{ marginTop: 8 }}>
                <DatePicker
                  value={row.IssueDate}
                  onChange={(d) => updateRow(row.id, { IssueDate: d ?? null })}
                  placeholder="Issue date *"
                  style={{ flex: 1, minWidth: 140 }}
                />
                <DatePicker
                  value={row.DueDate}
                  onChange={(d) => updateRow(row.id, { DueDate: d ?? null })}
                  placeholder="Due date *"
                  style={{ flex: 1, minWidth: 140 }}
                />
              </Flex>
            </div>
          ))}
        </Flex>
      )}

      <Button
        type="dashed"
        block
        icon={<Plus size={14} />}
        onClick={() => setRows((prev) => [...prev, newRow()])}
        style={{ marginTop: 12 }}
      >
        Add row
      </Button>

      <Divider style={{ margin: '20px 0 12px' }} />

      <Flex justify="space-between" align="center">
        <Typography.Text strong>Batch total</Typography.Text>
        <Typography.Text strong style={{ fontSize: 18, color: '#0d9488' }}>
          {formatMoney(totalAmount.toFixed(4))}
        </Typography.Text>
      </Flex>

      <div style={{ marginTop: 16 }}>
        <label style={LABEL_STYLE}>Notes (applied to all)</label>
        <Input.TextArea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          maxLength={500}
          showCount
          placeholder="Optional"
        />
      </div>
    </Drawer>
  );
}