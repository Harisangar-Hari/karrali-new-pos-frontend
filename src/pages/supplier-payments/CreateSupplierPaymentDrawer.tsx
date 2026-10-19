import { useEffect, useMemo, useState } from 'react';
import {
  Drawer,
  Input,
  InputNumber,
  DatePicker,
  Segmented,
  Button,
  Flex,
  Grid,
  Typography,
  App,
  Alert,
  Skeleton,
  Select,
  Divider,
  Card,
} from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs, { type Dayjs } from 'dayjs';
import {
  useCreateSupplierPayment,
} from '@/hooks/queries/useSupplierPayments';
import { usePurchase } from '@/hooks/queries/usePurchases';
import { usePurchases } from '@/hooks/queries/usePurchases';
import { getErrorMessage } from '@/lib/api';
import { formatMoney, formatDate } from '@/lib/format';

const { useBreakpoint } = Grid;

const schema = z.object({
  Method: z.enum(['CASH', 'BANK_TRANSFER']),
  Amount: z.number({ required_error: 'Required' }).positive('Must be > 0'),
  PaidAt: z.custom<Dayjs>((v) => dayjs.isDayjs(v), 'Required'),
  Notes: z.string().max(1000).optional().or(z.literal('')),
});

type Form = z.infer<typeof schema>;

interface Props {
  open: boolean;
  /** When set, skips the purchase picker and goes straight to the form. */
  presetPurchaseId?: string | null;
  onClose: () => void;
  onSuccess?: () => void;
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

export function CreateSupplierPaymentDrawer({
  open,
  presetPurchaseId,
  onClose,
  onSuccess,
}: Props) {
  const { message } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(
    presetPurchaseId ?? null,
  );

  useEffect(() => {
    if (open) {
      setSelectedPurchaseId(presetPurchaseId ?? null);
    }
  }, [open, presetPurchaseId]);

  const handleClose = () => {
    setSelectedPurchaseId(null);
    onClose();
  };

  // Mode 1 — no purchase selected yet → show picker
  if (!selectedPurchaseId) {
    return (
      <Drawer
        title="Record supplier payment"
        open={open}
        onClose={handleClose}
        width={isMobile ? '100%' : 520}
        destroyOnClose
      >
        <PurchasePickerStep onPick={setSelectedPurchaseId} />
      </Drawer>
    );
  }

  // Mode 2 — purchase selected → show form
  return (
    <PaymentForm
      purchaseId={selectedPurchaseId}
      canChangePurchase={!presetPurchaseId}
      onBack={() => setSelectedPurchaseId(null)}
      onClose={handleClose}
      onSuccess={onSuccess}
      isMobile={isMobile}
    />
  );
}

// ============================================================
// Step 1 — pick a purchase
// ============================================================
function PurchasePickerStep({ onPick }: { onPick: (id: string) => void }) {
  const [search, setSearch] = useState('');
  const [input, setInput] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearch(input.trim()), 300);
    return () => clearTimeout(t);
  }, [input]);

  const { data, isLoading, isFetching } = usePurchases({
    search: search || undefined,
    Status: 'POSTED',
    limit: 30,
    sortBy: 'InvoiceDate',
    sortOrder: 'desc',
  });

  // Hide fully-paid purchases.
  const results = useMemo(() => {
    return (data?.data ?? []).filter(
      (p) => Number(p.PaidAmount) < Number(p.TotalAmount),
    );
  }, [data]);

  return (
    <Flex vertical gap={12}>
      <Input
        autoFocus
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Search by purchase code or supplier invoice"
        size="large"
        allowClear
      />

      {isLoading || (isFetching && results.length === 0) ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : results.length === 0 ? (
        <Typography.Text type="secondary" style={{ padding: 12 }}>
          No unpaid purchases match.
        </Typography.Text>
      ) : (
        <Flex vertical style={{ maxHeight: 520, overflowY: 'auto' }}>
          {results.map((p) => {
            const remaining =
              Number(p.TotalAmount) - Number(p.PaidAmount);
            return (
              <Flex
                key={p.Id}
                align="center"
                gap={8}
                style={{
                  padding: '10px 8px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0',
                }}
                className="pos-product-row"
                onClick={() => onPick(p.Id)}
              >
                <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                  <Flex align="center" gap={6}>
                    <Typography.Text strong>{p.Code}</Typography.Text>
                    {p.SupplierInvoiceNo && (
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 11 }}
                      >
                        Inv {p.SupplierInvoiceNo}
                      </Typography.Text>
                    )}
                  </Flex>
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    {p.Supplier.Name} · {formatDate(p.InvoiceDate)}
                  </Typography.Text>
                </Flex>
                <Flex vertical gap={2} align="flex-end">
                  <Typography.Text strong style={{ color: '#dc2626' }}>
                    {formatMoney(remaining.toFixed(4))}
                  </Typography.Text>
                  <Typography.Text
                    type="secondary"
                    style={{ fontSize: 11 }}
                  >
                    of {formatMoney(p.TotalAmount)}
                  </Typography.Text>
                </Flex>
              </Flex>
            );
          })}
        </Flex>
      )}
    </Flex>
  );
}

// ============================================================
// Step 2 — fill payment form
// ============================================================
function PaymentForm({
  purchaseId,
  canChangePurchase,
  onBack,
  onClose,
  onSuccess,
  isMobile,
}: {
  purchaseId: string;
  canChangePurchase: boolean;
  onBack: () => void;
  onClose: () => void;
  onSuccess?: () => void;
  isMobile: boolean;
}) {
  const { message } = App.useApp();
  const { data: purchase, isLoading } = usePurchase(purchaseId);
  const createMutation = useCreateSupplierPayment();

  const [method, setMethod] = useState<'CASH' | 'BANK_TRANSFER'>('CASH');

  const remaining = useMemo(() => {
    if (!purchase) return 0;
    return Number(purchase.TotalAmount) - Number(purchase.PaidAmount);
  }, [purchase]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      Method: 'CASH',
      Amount: undefined as unknown as number,
      PaidAt: dayjs(),
      Notes: '',
    },
    mode: 'onTouched',
  });

  // Prefill full remaining balance when the purchase loads.
  useEffect(() => {
    if (purchase) {
      reset({
        Method: 'CASH',
        Amount: Number(
          (Number(purchase.TotalAmount) - Number(purchase.PaidAmount)).toFixed(4),
        ),
        PaidAt: dayjs(),
        Notes: '',
      });
      setMethod('CASH');
    }
  }, [purchase, reset]);

  const watchedMethod = watch('Method');
  useEffect(() => {
    setMethod(watchedMethod);
  }, [watchedMethod]);

  const submitting = isSubmitting || createMutation.isPending;

  const onSubmit = async (values: Form) => {
    if (!purchase) return;
    if (values.Amount > remaining + 0.0001) {
      message.error(`Amount exceeds remaining ${formatMoney(remaining.toFixed(4))}`);
      return;
    }
    try {
      await createMutation.mutateAsync({
        PurchaseId: purchase.Id,
        Method: values.Method,
        Amount: values.Amount,
        PaidAt: values.PaidAt.toISOString(),
        Notes: values.Notes || undefined,
      });
      message.success('Payment recorded');
      onSuccess?.();
      onClose();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  return (
    <Drawer
      title="Record supplier payment"
      open={true}
      onClose={submitting ? undefined : onClose}
      width={isMobile ? '100%' : 520}
      destroyOnClose
      maskClosable={!submitting}
      extra={
        <Flex gap={8}>
          {canChangePurchase && (
            <Button onClick={onBack} disabled={submitting}>
              Change
            </Button>
          )}
          <Button onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="primary"
            loading={submitting}
            disabled={!purchase}
            onClick={handleSubmit(onSubmit)}
          >
            Record payment
          </Button>
        </Flex>
      }
    >
      {isLoading || !purchase ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Purchase summary */}
          <Card
            size="small"
            styles={{ body: { padding: 12 } }}
            style={{ marginBottom: 16 }}
          >
            <Flex vertical gap={4}>
              <Flex justify="space-between">
                <Typography.Text strong>{purchase.Code}</Typography.Text>
                <Typography.Text>
                  {formatDate(purchase.InvoiceDate)}
                </Typography.Text>
              </Flex>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {purchase.Supplier.Name} ({purchase.Supplier.Code})
              </Typography.Text>
              {purchase.SupplierInvoiceNo && (
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  Supplier invoice: {purchase.SupplierInvoiceNo}
                </Typography.Text>
              )}
              <Divider style={{ margin: '8px 0' }} />
              <Flex justify="space-between">
                <Typography.Text style={{ fontSize: 12 }}>
                  Total
                </Typography.Text>
                <Typography.Text style={{ fontSize: 12 }}>
                  {formatMoney(purchase.TotalAmount)}
                </Typography.Text>
              </Flex>
              <Flex justify="space-between">
                <Typography.Text style={{ fontSize: 12 }}>
                  Already paid
                </Typography.Text>
                <Typography.Text style={{ fontSize: 12 }}>
                  {formatMoney(purchase.PaidAmount)}
                </Typography.Text>
              </Flex>
              <Flex justify="space-between">
                <Typography.Text strong>Remaining</Typography.Text>
                <Typography.Text strong style={{ color: '#dc2626' }}>
                  {formatMoney(remaining.toFixed(4))}
                </Typography.Text>
              </Flex>
            </Flex>
          </Card>

          {/* Method */}
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL_STYLE}>Method *</label>
            <Controller
              name="Method"
              control={control}
              render={({ field }) => (
                <Segmented
                  value={field.value}
                  onChange={(v) => field.onChange(v)}
                  block
                  options={[
                    { label: 'Cash', value: 'CASH' },
                    { label: 'Bank transfer', value: 'BANK_TRANSFER' },
                  ]}
                />
              )}
            />
          </div>

          {/* Amount */}
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL_STYLE}>Amount *</label>
            <Controller
              name="Amount"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <InputNumber
                    value={field.value ?? undefined}
                    onChange={(v) =>
                      field.onChange(v === null ? undefined : Number(v))
                    }
                    min={0.0001}
                    max={remaining}
                    precision={4}
                    step={100}
                    size="large"
                    style={{ width: '100%' }}
                    status={fieldState.error ? 'error' : undefined}
                  />
                  <div style={ERR_STYLE}>{fieldState.error?.message ?? ''}</div>
                </>
              )}
            />
            <Button
              size="small"
              type="link"
              style={{ padding: 0, fontSize: 12 }}
              onClick={() => setValue('Amount', remaining)}
            >
              Pay full remaining ({formatMoney(remaining.toFixed(4))})
            </Button>
          </div>

          {/* Paid at */}
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL_STYLE}>Paid at *</label>
            <Controller
              name="PaidAt"
              control={control}
              render={({ field }) => (
                <DatePicker
                  showTime
                  value={field.value ?? null}
                  onChange={(d) => field.onChange(d ?? null)}
                  style={{ width: '100%' }}
                />
              )}
            />
          </div>

          {/* Notes */}
          <div>
            <label style={LABEL_STYLE}>Notes</label>
            <Controller
              name="Notes"
              control={control}
              render={({ field }) => (
                <Input.TextArea
                  {...field}
                  value={field.value ?? ''}
                  rows={2}
                  maxLength={1000}
                  showCount
                  placeholder="Optional"
                />
              )}
            />
          </div>

          {method === 'CASH' && (
            <Alert
              type="info"
              showIcon
              message="Cash payments affect the drawer"
              description="Recording a cash payment writes a negative CASH_OUT entry to the ledger, reducing expected drawer cash for the current shift."
              style={{ marginTop: 12 }}
            />
          )}
        </form>
      )}
    </Drawer>
  );
}