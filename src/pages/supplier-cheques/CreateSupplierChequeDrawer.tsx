import { useEffect, useMemo, useState } from 'react';
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
  Skeleton,
  Card,
  Divider,
  Alert,
} from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs, { type Dayjs } from 'dayjs';
import Decimal from 'decimal.js';
import { useCreateSupplierCheque } from '@/hooks/queries/useSupplierCheques';
import { usePurchase, usePurchases } from '@/hooks/queries/usePurchases';
import { useSupplierCheques } from '@/hooks/queries/useSupplierCheques';
import { getErrorMessage } from '@/lib/api';
import { formatMoney, formatDate } from '@/lib/format';

const { useBreakpoint } = Grid;

const schema = z
  .object({
    ChequeNumber: z.string().min(1, 'Required').max(32),
    BankName: z.string().max(100).optional().or(z.literal('')),
    Amount: z.number({ required_error: 'Required' }).positive('Must be > 0'),
    IssueDate: z.custom<Dayjs>((v) => dayjs.isDayjs(v), 'Required'),
    DueDate: z.custom<Dayjs>((v) => dayjs.isDayjs(v), 'Required'),
    Notes: z.string().max(1000).optional().or(z.literal('')),
  })
  .superRefine((values, ctx) => {
    if (
      values.IssueDate &&
      values.DueDate &&
      values.DueDate.isBefore(values.IssueDate, 'day')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Due date must be on or after issue date',
        path: ['DueDate'],
      });
    }
  });

type Form = z.infer<typeof schema>;

interface Props {
  open: boolean;
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

export function CreateSupplierChequeDrawer({
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
    if (open) setSelectedPurchaseId(presetPurchaseId ?? null);
  }, [open, presetPurchaseId]);

  const handleClose = () => {
    setSelectedPurchaseId(null);
    onClose();
  };

  if (!selectedPurchaseId) {
    return (
      <Drawer
        title="Issue supplier cheque"
        open={open}
        onClose={handleClose}
        width={isMobile ? '100%' : 520}
        destroyOnClose
      >
        <PurchasePickerStep onPick={setSelectedPurchaseId} />
      </Drawer>
    );
  }

  return (
    <ChequeForm
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
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');

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
        placeholder="Search purchase code or supplier invoice"
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
            const remaining = Number(p.TotalAmount) - Number(p.PaidAmount);
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
                    remaining
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
// Step 2 — cheque form
// ============================================================
function ChequeForm({
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

  // Pending cheques reduce the amount we can commit.
  const { data: pendingCheques } = useSupplierCheques({
    PurchaseId: purchaseId,
    Status: 'PENDING',
    limit: 100,
  });

  const createMutation = useCreateSupplierCheque();

  const pendingSum = useMemo(() => {
    if (!pendingCheques?.data) return new Decimal(0);
    return pendingCheques.data.reduce(
      (s, c) => s.add(new Decimal(c.Amount)),
      new Decimal(0),
    );
  }, [pendingCheques]);

  const uncommitted = useMemo(() => {
    if (!purchase) return new Decimal(0);
    return new Decimal(purchase.TotalAmount)
      .sub(purchase.PaidAmount)
      .sub(pendingSum);
  }, [purchase, pendingSum]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      ChequeNumber: '',
      BankName: '',
      Amount: undefined as unknown as number,
      IssueDate: dayjs(),
      DueDate: dayjs().add(30, 'day'),
      Notes: '',
    },
    mode: 'onTouched',
  });

  // Prefill the full uncommitted amount when it loads.
  useEffect(() => {
    if (purchase) {
      const n = Number(uncommitted.toFixed(4));
      reset({
        ChequeNumber: '',
        BankName: '',
        Amount: n > 0 ? n : (undefined as unknown as number),
        IssueDate: dayjs(),
        DueDate: dayjs().add(30, 'day'),
        Notes: '',
      });
    }
  }, [purchase, uncommitted, reset]);

  const submitting = isSubmitting || createMutation.isPending;

  const onSubmit = async (values: Form) => {
    if (!purchase) return;
    if (uncommitted.lte(0)) {
      message.error(
        'Nothing left to commit on this purchase — it is already fully paid or covered by pending cheques.',
      );
      return;
    }
    try {
      await createMutation.mutateAsync({
        PurchaseId: purchase.Id,
        ChequeNumber: values.ChequeNumber,
        BankName: values.BankName || undefined,
        Amount: values.Amount,
        IssueDate: values.IssueDate.toISOString(),
        DueDate: values.DueDate.toISOString(),
        Notes: values.Notes || undefined,
      });
      message.success('Cheque issued');
      onSuccess?.();
      onClose();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  return (
    <Drawer
      title="Issue supplier cheque"
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
            Issue cheque
          </Button>
        </Flex>
      }
    >
      {isLoading || !purchase ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Purchase summary with headroom */}
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
              <Divider style={{ margin: '8px 0' }} />
              <Flex justify="space-between">
                <Typography.Text style={{ fontSize: 12 }}>Total</Typography.Text>
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
              {pendingSum.gt(0) && (
                <Flex justify="space-between">
                  <Typography.Text style={{ fontSize: 12 }}>
                    Pending cheques
                  </Typography.Text>
                  <Typography.Text style={{ fontSize: 12 }}>
                    {formatMoney(pendingSum.toFixed(4))}
                  </Typography.Text>
                </Flex>
              )}
              <Flex justify="space-between">
                <Typography.Text strong>Uncommitted</Typography.Text>
                <Typography.Text
                  strong
                  style={{
                    color: uncommitted.gt(0) ? '#0d9488' : '#dc2626',
                  }}
                >
                  {formatMoney(uncommitted.toFixed(4))}
                </Typography.Text>
              </Flex>
            </Flex>
          </Card>

          {uncommitted.lte(0) && (
            <Alert
              type="warning"
              showIcon
              message="Nothing left to commit"
              description="This purchase is fully paid or covered by pending cheques."
              style={{ marginBottom: 12 }}
            />
          )}

          {/* Cheque fields */}
          <Flex gap={12} wrap="wrap">
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={LABEL_STYLE}>Cheque number *</label>
              <Controller
                name="ChequeNumber"
                control={control}
                render={({ field, fieldState }) => (
                  <>
                    <Input
                      {...field}
                      maxLength={32}
                      placeholder="000123"
                      status={fieldState.error ? 'error' : undefined}
                    />
                    <div style={ERR_STYLE}>
                      {fieldState.error?.message ?? ''}
                    </div>
                  </>
                )}
              />
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
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
                      max={uncommitted.toNumber()}
                      precision={4}
                      step={100}
                      style={{ width: '100%' }}
                      status={fieldState.error ? 'error' : undefined}
                    />
                    <div style={ERR_STYLE}>
                      {fieldState.error?.message ?? ''}
                    </div>
                  </>
                )}
              />
            </div>
          </Flex>

          <div style={{ marginTop: 12 }}>
            <label style={LABEL_STYLE}>Our bank</label>
            <Controller
              name="BankName"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ''}
                  maxLength={100}
                  placeholder="e.g. Commercial Bank"
                />
              )}
            />
          </div>

          <Flex gap={12} wrap="wrap" style={{ marginTop: 12 }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={LABEL_STYLE}>Issue date *</label>
              <Controller
                name="IssueDate"
                control={control}
                render={({ field, fieldState }) => (
                  <>
                    <DatePicker
                      value={field.value ?? null}
                      onChange={(d) => field.onChange(d ?? null)}
                      style={{ width: '100%' }}
                      status={fieldState.error ? 'error' : undefined}
                    />
                    <div style={ERR_STYLE}>
                      {fieldState.error?.message ?? ''}
                    </div>
                  </>
                )}
              />
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={LABEL_STYLE}>Due date *</label>
              <Controller
                name="DueDate"
                control={control}
                render={({ field, fieldState }) => (
                  <>
                    <DatePicker
                      value={field.value ?? null}
                      onChange={(d) => field.onChange(d ?? null)}
                      style={{ width: '100%' }}
                      status={fieldState.error ? 'error' : undefined}
                    />
                    <div style={ERR_STYLE}>
                      {fieldState.error?.message ?? ''}
                    </div>
                  </>
                )}
              />
            </div>
          </Flex>

          <div style={{ marginTop: 12 }}>
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

          <Alert
            type="info"
            showIcon
            message="Issuing commits the amount"
            description="The cheque reserves this portion of the purchase until it clears, bounces, or is voided. Clearing the cheque auto-creates a payment and rolls it into PaidAmount."
            style={{ marginTop: 16 }}
          />
        </form>
      )}
    </Drawer>
  );
}