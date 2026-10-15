import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  InputNumber,
  Typography,
  Flex,
  Divider,
  Button,
  Segmented,
  Input,
  DatePicker,
  Alert,
  App,
} from 'antd';
import { Trash2, Plus } from 'lucide-react';
import Decimal from 'decimal.js';
import dayjs, { type Dayjs } from 'dayjs';
import { useCreateSale } from '@/hooks/queries/useCreateSale';
import { effectiveLineDiscount, usePosCartStore } from '@/stores/posCartStore';
import { formatMoney } from '@/lib/format';
import { getErrorMessage } from '@/lib/api';
import type { SaleDetail, SalePaymentMethod } from '@/types/sale';
import type { OpenSessionSummary } from '@/types/cashSession';

interface Props {
  open: boolean;
  total: string;
  session: OpenSessionSummary;
  hasCustomer: boolean;
  onClose: () => void;
  onSuccess: (sale: SaleDetail) => void;
}

interface PaymentLine {
  id: string;
  Method: SalePaymentMethod;
  Amount: number | null;
  // Cheque fields
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

let lineCounter = 0;
function newLineId() {
  lineCounter += 1;
  return `p-${lineCounter}`;
}

export function CheckoutModal({
  open,
  total,
  session,
  hasCustomer,
  onClose,
  onSuccess,
}: Props) {
  const { message } = App.useApp();
  const lines = usePosCartStore((s) => s.lines);
  const customerId = usePosCartStore((s) => s.customerId);
  const notes = usePosCartStore((s) => s.notes);
  const invoiceDiscount = usePosCartStore((s) => s.invoiceDiscount);
  const clear = usePosCartStore((s) => s.clear);
  const createSale = useCreateSale();

  const [payments, setPayments] = useState<PaymentLine[]>([]);

  useEffect(() => {
    if (open) {
      setPayments([
        { id: newLineId(), Method: 'CASH', Amount: Number(total) },
      ]);
    }
  }, [open, total]);

  const totalDec = useMemo(() => new Decimal(total), [total]);

  const paidTotal = useMemo(
    () =>
      payments.reduce(
        (s, p) => s.add(new Decimal(p.Amount ?? 0)),
        new Decimal(0),
      ),
    [payments],
  );

  const remaining = totalDec.sub(paidTotal);
  const remainingAbs = remaining.abs();
  const balanced = remainingAbs.lt(new Decimal('0.0001'));
  const isShort = remaining.gt(new Decimal('0.0001'));


   const validPayments = payments.filter((p) => (p.Amount ?? 0) > 0);

  const hasCredit = validPayments.some((p) => p.Method === 'CREDIT');
  const hasCheque = validPayments.some((p) => p.Method === 'CHEQUE');
  const creditMissingCustomer = hasCredit && !customerId;
  const chequeMissingCustomer = hasCheque && !customerId;

  const chequeIncomplete = validPayments.some(
    (p) =>
      p.Method === 'CHEQUE' &&
      (!p.ChequeNumber || !p.ChequeIssueDate || !p.ChequeDueDate),
  );

  const canSubmit =
    !createSale.isPending &&
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
        id: newLineId(),
        Method: method,
        Amount: isShort ? Number(remaining.toFixed(4)) : 0,
      },
    ]);
  };

  const removePayment = (id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
  };

  const handleConfirm = async () => {
    try {
      const sale = await createSale.mutateAsync({
        TerminalId: session.TerminalId,
        CustomerId: customerId ?? undefined,
        Notes: notes || undefined,
        Items: lines.map((l) => ({
          ProductId: l.ProductId,
          Qty: l.Qty,
          UnitPrice: Number(l.UnitPrice),
          // Send the compound effective % so backend math matches the
          // frontend's post-invoice-discount total exactly.
          Discount: effectiveLineDiscount(l, invoiceDiscount),
          TaxRate: l.TaxRate ?? undefined,
        })),
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
      });
      clear();
      onSuccess(sale);
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

    // Compute a human-readable reason why submit is blocked, if any.
  const blockReason: string | null = (() => {
    if (createSale.isPending) return null;
    if (validPayments.length === 0) {
      return payments.some((p) => p.Method === 'CREDIT' && (p.Amount ?? 0) === 0)
        ? 'Credit line is 0 — this sale adds nothing to the customer\'s debt. Remove it or set an amount.'
        : 'Add at least one payment line with an amount greater than 0.';
    }
    if (!balanced && isShort) {
      return `Remaining ${formatMoney(remaining.toFixed(4))} — add another payment or increase an amount.`;
    }
    if (!balanced) {
      return `Over by ${formatMoney(remaining.abs().toFixed(4))} — reduce a payment amount.`;
    }
    if (creditMissingCustomer) {
      return 'Attach a customer from the POS header to use Credit.';
    }
    if (chequeMissingCustomer) {
      return 'Attach a customer from the POS header to use Cheque.';
    }
    if (chequeIncomplete) {
      return 'Fill in all required cheque fields (number, issue date, due date).';
    }
    return null;
  })();

  return (
    <Modal
      title="Take payment"
      open={open}
      onCancel={createSale.isPending ? undefined : onClose}
      destroyOnClose
      maskClosable={!createSale.isPending}
      width={560}
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
            <Button onClick={onClose} disabled={createSale.isPending}>
              Cancel
            </Button>
            <Button
              type="primary"
              disabled={!canSubmit}
              loading={createSale.isPending}
              onClick={handleConfirm}
            >
              Complete sale
            </Button>
          </Flex>
        </Flex>
      }
    >
      <Flex vertical gap={4} align="center" style={{ padding: '4px 0 16px' }}>
        <Typography.Text type="secondary">Total to pay</Typography.Text>
        <Typography.Title level={2} style={{ margin: 0, color: '#0d9488' }}>
          {formatMoney(total)}
        </Typography.Title>
      </Flex>

      {creditMissingCustomer && (
        <Alert
          type="warning"
          showIcon
          message="Credit payment requires a customer"
          description="Attach a customer from the POS header before completing this sale."
          style={{ marginBottom: 12 }}
        />
      )}
      {chequeMissingCustomer && !creditMissingCustomer && (
        <Alert
          type="warning"
          showIcon
          message="Cheque payment requires a customer"
          description="Cheques are linked to a customer for collection tracking."
          style={{ marginBottom: 12 }}
        />
      )}

      {/* Add-method bar */}
      <Flex
        align="center"
        justify="space-between"
        gap={8}
        wrap="wrap"
        style={{ marginBottom: 8 }}
      >
        <Flex align="center" gap={8} wrap="wrap">
          <Typography.Text style={{ fontSize: 12 }}>Add payment:</Typography.Text>
          <Segmented
            options={METHODS.map((m) => ({
              label: m.label,
              value: m.value,
            }))}
            onChange={(v) => addPayment(v as SalePaymentMethod)}
          />
        </Flex>
        <Button
          size="small"
          type="link"
          style={{ padding: 0, fontSize: 12 }}
          onClick={() => {
            setPayments([
              { id: newLineId(), Method: 'CREDIT', Amount: Number(total) },
            ]);
          }}
        >
          Full credit sale
        </Button>
      </Flex>

      {/* Semantics hint — kills the "what does credit mean" confusion */}
      <Typography.Text
        type="secondary"
        style={{ fontSize: 11, display: 'block', marginBottom: 12 }}
      >
        <strong>Cash / Card / Cheque</strong> = customer pays now.{' '}
        <strong>Credit</strong> = amount added to their debt (they pay later).
        Do not add a Credit line with 0 — just don't add one at all.
      </Typography.Text>

      <Divider style={{ margin: '4px 0 12px' }} />

      {/* Payment lines */}
      <Flex vertical gap={10} style={{ maxHeight: 360, overflowY: 'auto' }}>
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
              <Typography.Text strong style={{ width: 70 }}>
                {p.Method}
              </Typography.Text>
              <InputNumber
                value={p.Amount ?? undefined}
                onChange={(v) =>
                  updatePayment(p.id, { Amount: v === null ? null : Number(v) })
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
              <Flex vertical gap={8} style={{ marginTop: 10 }}>
                <Flex gap={8} wrap="wrap">
                  <Input
                    value={p.ChequeNumber ?? ''}
                    onChange={(e) =>
                      updatePayment(p.id, { ChequeNumber: e.target.value })
                    }
                    placeholder="Cheque number *"
                    style={{ flex: 1, minWidth: 140 }}
                    maxLength={32}
                  />
                  <Input
                    value={p.BankName ?? ''}
                    onChange={(e) =>
                      updatePayment(p.id, { BankName: e.target.value })
                    }
                    placeholder="Bank"
                    style={{ flex: 1, minWidth: 140 }}
                    maxLength={100}
                  />
                </Flex>
                <Flex gap={8} wrap="wrap">
                  <Input
                    value={p.BankBranch ?? ''}
                    onChange={(e) =>
                      updatePayment(p.id, { BankBranch: e.target.value })
                    }
                    placeholder="Branch"
                    style={{ flex: 1, minWidth: 140 }}
                    maxLength={100}
                  />
                  <DatePicker
                    value={p.ChequeIssueDate ?? null}
                    onChange={(d) =>
                      updatePayment(p.id, {
                        ChequeIssueDate: d ? dayjs(d) : undefined,
                      })
                    }
                    placeholder="Issue date *"
                    style={{ flex: 1, minWidth: 140 }}
                  />
                  <DatePicker
                    value={p.ChequeDueDate ?? null}
                    onChange={(d) =>
                      updatePayment(p.id, {
                        ChequeDueDate: d ? dayjs(d) : undefined,
                      })
                    }
                    placeholder="Due date *"
                    style={{ flex: 1, minWidth: 140 }}
                  />
                </Flex>
              </Flex>
            )}

            {p.Method === 'CREDIT' && !customerId && (
              <Typography.Text
                type="secondary"
                style={{ fontSize: 11, display: 'block', marginTop: 6 }}
              >
                Needs a customer — attach one from the POS header.
              </Typography.Text>
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

      <Divider style={{ margin: '16px 0 12px' }} />

      <Flex vertical gap={4}>
        <Summary label="Total" value={formatMoney(total)} />
        <Summary label="Paid now" value={formatMoney(paidTotal.toFixed(4))} />
        <Summary
          label="Remaining"
          value={formatMoney(remaining.toFixed(4))}
          valueColor={balanced ? '#16a34a' : isShort ? '#dc2626' : '#f59e0b'}
        />
      </Flex>

      {blockReason && (
        <Alert
          type="info"
          showIcon
          message={blockReason}
          style={{ marginTop: 12 }}
        />
      )}
    </Modal>
  );

}

function Summary({
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