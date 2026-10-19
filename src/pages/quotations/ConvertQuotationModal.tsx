import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Input,
  InputNumber,
  Button,
  Flex,
  Segmented,
  Alert,
  Divider,
  Typography,
  DatePicker,
  App,
  Select,
} from 'antd';
import { Trash2, Plus } from 'lucide-react';
import Decimal from 'decimal.js';
import dayjs, { type Dayjs } from 'dayjs';
import {
  useConvertQuotation,
} from '@/hooks/queries/useQuotations';
import { useTerminalsLookup } from '@/hooks/queries/useTerminalsLookup';
import { getErrorMessage } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import type { QuotationDetail } from '@/types/quotation';
import type { SalePaymentMethod } from '@/types/sale';

interface Props {
  open: boolean;
  quotation: QuotationDetail | null;
  onClose: () => void;
  onSuccess?: (saleInvoiceNumber: string) => void;
}

interface PaymentLine {
  id: string;
  Method: SalePaymentMethod;
  Amount: number | null;
  ChequeNumber?: string;
  BankName?: string;
  BankBranch?: string;
  ChequeIssueDate?: Dayjs;
  ChequeDueDate?: Dayjs;
}

const METHODS: { label: string; value: SalePaymentMethod }[] = [
  { label: 'Cash', value: 'CASH' },
  { label: 'Card', value: 'CARD' },
  { label: 'Credit', value: 'CREDIT' },
  { label: 'Cheque', value: 'CHEQUE' },
];

let paymentCounter = 0;
function newPaymentId() {
  paymentCounter += 1;
  return `qp-${paymentCounter}`;
}

export function ConvertQuotationModal({
  open,
  quotation,
  onClose,
  onSuccess,
}: Props) {
  const { message } = App.useApp();
  const { data: terminals = [] } = useTerminalsLookup();
  const convertMutation = useConvertQuotation();

  const [terminalId, setTerminalId] = useState<string | undefined>();
  const [payments, setPayments] = useState<PaymentLine[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open && quotation) {
      setTerminalId(undefined);
      setNotes('');
      setPayments([
        {
          id: newPaymentId(),
          Method: 'CASH',
          Amount: Number(quotation.TotalAmount),
        },
      ]);
    }
  }, [open, quotation]);

  // Auto-select when only one terminal
  useEffect(() => {
    const only = terminals[0];
    if (terminals.length === 1 && only) {
      setTerminalId(only.Id);
    }
  }, [terminals]);

  const total = useMemo(
    () => new Decimal(quotation?.TotalAmount ?? 0),
    [quotation],
  );

  const paidTotal = useMemo(
    () =>
      payments.reduce(
        (s, p) => s.add(new Decimal(p.Amount ?? 0)),
        new Decimal(0),
      ),
    [payments],
  );

  const remaining = total.sub(paidTotal);
  const balanced = remaining.abs().lt(new Decimal('0.0001'));
  const isShort = remaining.gt(new Decimal('0.0001'));

  const validPayments = payments.filter((p) => (p.Amount ?? 0) > 0);
  const hasCredit = validPayments.some((p) => p.Method === 'CREDIT');
  const hasCheque = validPayments.some((p) => p.Method === 'CHEQUE');
  const customerId = quotation?.CustomerId ?? null;
  const creditMissingCustomer = hasCredit && !customerId;
  const chequeMissingCustomer = hasCheque && !customerId;
  const chequeIncomplete = validPayments.some(
    (p) =>
      p.Method === 'CHEQUE' &&
      (!p.ChequeNumber || !p.ChequeIssueDate || !p.ChequeDueDate),
  );

  const canSubmit =
    !convertMutation.isPending &&
    !!terminalId &&
    validPayments.length > 0 &&
    balanced &&
    !creditMissingCustomer &&
    !chequeMissingCustomer &&
    !chequeIncomplete;

  const updatePayment = (id: string, patch: Partial<PaymentLine>) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    );
  };

  const addPayment = (method: SalePaymentMethod) => {
    setPayments((prev) => [
      ...prev,
      {
        id: newPaymentId(),
        Method: method,
        Amount: isShort ? Number(remaining.toFixed(4)) : 0,
      },
    ]);
  };

  const removePayment = (id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = async () => {
    if (!quotation || !terminalId) return;
    try {
      const result = await convertMutation.mutateAsync({
        id: quotation.Id,
        input: {
          TerminalId: terminalId,
          Notes: notes.trim() || undefined,
          Payments: validPayments.map((p) => {
            const base = {
              Method: p.Method,
              Amount: Number((p.Amount ?? 0).toFixed(4)),
            };
            if (p.Method === 'CHEQUE') {
              return {
                ...base,
                ChequeNumber: p.ChequeNumber!,
                BankName: p.BankName || undefined,
                BankBranch: p.BankBranch || undefined,
                ChequeIssueDate: p.ChequeIssueDate!.toISOString(),
                ChequeDueDate: p.ChequeDueDate!.toISOString(),
              };
            }
            return base;
          }),
        },
      });
      message.success(
        `Converted to sale ${result.Sale?.InvoiceNumber ?? ''}`.trim(),
      );
      onSuccess?.(result.Sale?.InvoiceNumber ?? '');
      onClose();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  if (!quotation) return null;

  return (
    <Modal
      title={`Convert ${quotation.Code} to sale`}
      open={open}
      onCancel={convertMutation.isPending ? undefined : onClose}
      width={600}
      destroyOnClose
      maskClosable={!convertMutation.isPending}
      footer={
        <Flex justify="space-between" align="center">
          <Flex vertical>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              Remaining
            </Typography.Text>
            <Typography.Text
              strong
              style={{
                fontSize: 15,
                color: balanced
                  ? '#16a34a'
                  : isShort
                    ? '#dc2626'
                    : '#f59e0b',
              }}
            >
              {formatMoney(remaining.toFixed(4))}
            </Typography.Text>
          </Flex>
          <Flex gap={8}>
            <Button onClick={onClose} disabled={convertMutation.isPending}>
              Cancel
            </Button>
            <Button
              type="primary"
              disabled={!canSubmit}
              loading={convertMutation.isPending}
              onClick={handleSubmit}
            >
              Convert to sale
            </Button>
          </Flex>
        </Flex>
      }
    >
      <Flex vertical gap={12}>
        <Alert
          type="info"
          showIcon
          message="Creates a completed sale"
          description="Stock is deducted, ledgers are written, and the quotation is marked CONVERTED. This cannot be undone — cancel or return the sale to reverse it."
        />

        {/* Quotation summary */}
        <Flex justify="space-between" align="center">
          <Typography.Text type="secondary">Total to pay</Typography.Text>
          <Typography.Title level={3} style={{ margin: 0, color: '#0d9488' }}>
            {formatMoney(quotation.TotalAmount)}
          </Typography.Title>
        </Flex>

        {!quotation.CustomerId && (
          <Alert
            type="warning"
            showIcon
            message="No customer on this quotation"
            description="Credit and cheque payments require a customer. Use cash or card, or attach a customer before converting."
          />
        )}

        {/* Terminal */}
        <div>
          <Typography.Text style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>
            Terminal *
          </Typography.Text>
          <Select
            value={terminalId}
            onChange={setTerminalId}
            placeholder="Pick a terminal"
            options={terminals.map((t) => ({
              label: `${t.Name} (${t.Code})`,
              value: t.Id,
            }))}
            showSearch
            optionFilterProp="label"
            style={{ width: '100%' }}
          />
        </div>

        {/* Add payment bar */}
        <Flex align="center" gap={8} wrap="wrap">
          <Typography.Text style={{ fontSize: 12 }}>Add payment:</Typography.Text>
          <Segmented
            options={METHODS.map((m) => ({ label: m.label, value: m.value }))}
            onChange={(v) => addPayment(v as SalePaymentMethod)}
          />
        </Flex>

        {/* Payment lines */}
        <Flex vertical gap={8} style={{ maxHeight: 340, overflowY: 'auto' }}>
          {payments.map((p) => (
            <div
              key={p.id}
              style={{
                padding: 10,
                border: '1px solid #f0f0f0',
                borderRadius: 6,
                background: '#fafafa',
              }}
            >
              <Flex align="center" gap={8}>
                <Typography.Text strong style={{ width: 70, fontSize: 12 }}>
                  {p.Method}
                </Typography.Text>
                <InputNumber
                  value={p.Amount ?? undefined}
                  onChange={(v) =>
                    updatePayment(p.id, {
                      Amount: v === null ? null : Number(v),
                    })
                  }
                  min={0}
                  precision={4}
                  step={100}
                  style={{ flex: 1 }}
                  placeholder="Amount"
                />
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<Trash2 size={14} />}
                  onClick={() => removePayment(p.id)}
                  disabled={payments.length === 1}
                />
              </Flex>

              {p.Method === 'CHEQUE' && (
                <Flex vertical gap={8} style={{ marginTop: 8 }}>
                  <Flex gap={8} wrap="wrap">
                    <Input
                      value={p.ChequeNumber ?? ''}
                      onChange={(e) =>
                        updatePayment(p.id, { ChequeNumber: e.target.value })
                      }
                      placeholder="Cheque number *"
                      style={{ flex: 1, minWidth: 120 }}
                      maxLength={32}
                    />
                    <Input
                      value={p.BankName ?? ''}
                      onChange={(e) =>
                        updatePayment(p.id, { BankName: e.target.value })
                      }
                      placeholder="Bank"
                      style={{ flex: 1, minWidth: 120 }}
                      maxLength={100}
                    />
                  </Flex>
                  <Flex gap={8} wrap="wrap">
                    <DatePicker
                      value={p.ChequeIssueDate ?? null}
                      onChange={(d) =>
                        updatePayment(p.id, {
                          ChequeIssueDate: d ? dayjs(d) : undefined,
                        })
                      }
                      placeholder="Issue date *"
                      style={{ flex: 1, minWidth: 120 }}
                    />
                    <DatePicker
                      value={p.ChequeDueDate ?? null}
                      onChange={(d) =>
                        updatePayment(p.id, {
                          ChequeDueDate: d ? dayjs(d) : undefined,
                        })
                      }
                      placeholder="Due date *"
                      style={{ flex: 1, minWidth: 120 }}
                    />
                  </Flex>
                </Flex>
              )}
            </div>
          ))}

          {isShort && (
            <Button
              type="dashed"
              icon={<Plus size={14} />}
              onClick={() => addPayment('CASH')}
              block
            >
              Add another payment — {formatMoney(remaining.toFixed(4))} remaining
            </Button>
          )}
        </Flex>

        {/* Notes */}
        <div>
          <Typography.Text style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
            Notes (appended to the sale)
          </Typography.Text>
          <Input.TextArea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            maxLength={1000}
            showCount
            placeholder="Optional"
          />
        </div>

        <Divider style={{ margin: 0 }} />

        <Flex vertical gap={4}>
          <Flex justify="space-between">
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Total
            </Typography.Text>
            <Typography.Text style={{ fontSize: 12 }}>
              {formatMoney(total.toFixed(4))}
            </Typography.Text>
          </Flex>
          <Flex justify="space-between">
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Paid
            </Typography.Text>
            <Typography.Text style={{ fontSize: 12 }}>
              {formatMoney(paidTotal.toFixed(4))}
            </Typography.Text>
          </Flex>
          <Flex justify="space-between">
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Remaining
            </Typography.Text>
            <Typography.Text
              style={{
                fontSize: 12,
                color: balanced ? '#16a34a' : isShort ? '#dc2626' : '#f59e0b',
              }}
            >
              {formatMoney(remaining.toFixed(4))}
            </Typography.Text>
          </Flex>
        </Flex>
      </Flex>
    </Modal>
  );
}