import { useEffect, useMemo, useState } from 'react';
import {
  Drawer,
  Input,
  InputNumber,
  Button,
  Flex,
  Grid,
  Typography,
  App,
  Segmented,
  Alert,
  Select,
  Skeleton,
  Card,
  Divider,
} from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAdjustStock, useProductStock } from '@/hooks/queries/useStock';
import { useProducts } from '@/hooks/queries/useProducts';
import { useWarehousesLookup } from '@/hooks/queries/useLookups';
import { getErrorMessage } from '@/lib/api';
import { formatQty,  } from '@/lib/format';

const { useBreakpoint } = Grid;

const schema = z.object({
  ProductId: z.string().uuid('Pick a product'),
  WarehouseId: z.string().uuid('Pick a warehouse'),
  Direction: z.enum(['in', 'out']),
  Amount: z.number({ required_error: 'Required' }).positive('Must be > 0'),
  Type: z.enum(['OPENING', 'ADJUSTMENT']),
  UnitCost: z.number().min(0).nullable().optional(),
  Notes: z.string().max(500).optional().or(z.literal('')),
});

type Form = z.infer<typeof schema>;

interface Props {
  open: boolean;
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

export function AdjustStockDrawer({ open, onClose }: Props) {
  const { message } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const { data: warehouses = [], isLoading: whLoading } = useWarehousesLookup();
  const adjustMutation = useAdjustStock();

  const [productSearch, setProductSearch] = useState('');
  const [productSearchDebounced, setProductSearchDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(
      () => setProductSearchDebounced(productSearch.trim()),
      300,
    );
    return () => clearTimeout(t);
  }, [productSearch]);

  const { data: productsPage, isFetching: productsFetching } = useProducts({
    search: productSearchDebounced || undefined,
    limit: 20,
    IsActive: true,
    sortBy: 'Name',
    sortOrder: 'asc',
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      ProductId: '',
      WarehouseId: '',
      Direction: 'in',
      Amount: undefined as unknown as number,
      Type: 'ADJUSTMENT',
      UnitCost: null,
      Notes: '',
    },
    mode: 'onTouched',
  });

  useEffect(() => {
    if (open) {
      reset({
        ProductId: '',
        WarehouseId: '',
        Direction: 'in',
        Amount: undefined as unknown as number,
        Type: 'ADJUSTMENT',
        UnitCost: null,
        Notes: '',
      });
      setProductSearch('');
    }
  }, [open, reset]);

  // Current stock for the selected product + warehouse (live preview of
  // what the resulting qty will be)
  const productId = watch('ProductId');
  const warehouseId = watch('WarehouseId');
  const direction = watch('Direction');
  const amount = watch('Amount');
  const { data: stock, isLoading: stockLoading } = useProductStock(
    productId || null,
  );

  const currentQty = useMemo(() => {
    if (!stock || !warehouseId) return 0;
    const row = stock.Warehouses.find((w) => w.WarehouseId === warehouseId);
    return row?.Qty ?? 0;
  }, [stock, warehouseId]);

  const resultingQty = useMemo(() => {
    if (!amount || amount <= 0) return null;
    return direction === 'in' ? currentQty + amount : currentQty - amount;
  }, [currentQty, amount, direction]);

  const wouldGoNegative = resultingQty !== null && resultingQty < 0;

  const submitting = isSubmitting || adjustMutation.isPending;

  const onSubmit = async (values: Form) => {
    if (wouldGoNegative) {
      message.error(
        `Insufficient stock — current ${currentQty}, attempted out ${values.Amount}`,
      );
      return;
    }
    try {
      const signedQty =
        values.Direction === 'in' ? values.Amount : -values.Amount;
      await adjustMutation.mutateAsync({
        ProductId: values.ProductId,
        WarehouseId: values.WarehouseId,
        Quantity: signedQty,
        Type: values.Type,
        UnitCost: values.UnitCost ?? undefined,
        Notes: values.Notes || undefined,
      });
      message.success('Stock adjusted');
      onClose();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  const productOptions = (productsPage?.data ?? []).map((p) => ({
    label: `${p.Name}${p.SKU ? ` (${p.SKU})` : ''}`,
    value: p.Id,
  }));

  return (
    <Drawer
      title="Adjust stock"
      open={open}
      onClose={submitting ? undefined : onClose}
      width={isMobile ? '100%' : 480}
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
            disabled={wouldGoNegative}
            onClick={handleSubmit(onSubmit)}
          >
            Apply adjustment
          </Button>
        </Flex>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Alert
          type="info"
          showIcon
          message="Manual adjustments only"
          description="Only OPENING and ADJUSTMENT movement types are accepted here. Sales, purchases, and returns write their own movements automatically."
          style={{ marginBottom: 16 }}
        />

        {/* Product */}
        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Product *</label>
          <Controller
            name="ProductId"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Select
                  value={field.value || undefined}
                  onChange={(v) => field.onChange(v ?? '')}
                  placeholder="Search products…"
                  showSearch
                  filterOption={false}
                  onSearch={setProductSearch}
                  loading={productsFetching}
                  options={productOptions}
                  notFoundContent={
                    productSearchDebounced ? 'No matches' : 'Type to search'
                  }
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

        {/* Warehouse */}
        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Warehouse *</label>
          <Controller
            name="WarehouseId"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Select
                  value={field.value || undefined}
                  onChange={(v) => field.onChange(v ?? '')}
                  loading={whLoading}
                  placeholder="Pick a warehouse"
                  options={warehouses.map((w) => ({
                    label: w.Name,
                    value: w.Id,
                  }))}
                  showSearch
                  optionFilterProp="label"
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

        {/* Current stock preview */}
        {productId && warehouseId && (
          <Card
            size="small"
            styles={{ body: { padding: 10 } }}
            style={{ marginBottom: 12, background: '#fafafa' }}
          >
            {stockLoading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <Flex vertical gap={2}>
                <Flex justify="space-between">
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Current in this warehouse
                  </Typography.Text>
                  <Typography.Text strong>
                    {formatQty(currentQty, 0)}
                  </Typography.Text>
                </Flex>
                {resultingQty !== null && (
                  <>
                    <Divider style={{ margin: '6px 0' }} />
                    <Flex justify="space-between">
                      <Typography.Text strong style={{ fontSize: 12 }}>
                        After adjustment
                      </Typography.Text>
                      <Typography.Text
                        strong
                        style={{
                          color: wouldGoNegative ? '#dc2626' : '#16a34a',
                        }}
                      >
                        {formatQty(resultingQty, 0)}
                      </Typography.Text>
                    </Flex>
                  </>
                )}
              </Flex>
            )}
          </Card>
        )}

        {/* Direction */}
        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Direction *</label>
          <Controller
            name="Direction"
            control={control}
            render={({ field }) => (
              <Segmented
                value={field.value}
                onChange={(v) => field.onChange(v)}
                block
                options={[
                  { label: 'Stock In (+)', value: 'in' },
                  { label: 'Stock Out (−)', value: 'out' },
                ]}
              />
            )}
          />
        </div>

        {/* Amount */}
        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Quantity *</label>
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
                  min={1}
                  precision={0}
                  size="large"
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

        {wouldGoNegative && (
          <Alert
            type="error"
            showIcon
            message={`Insufficient stock — current is ${currentQty}, attempted out is ${amount}`}
            style={{ marginBottom: 12 }}
          />
        )}

        {/* Type */}
        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Movement type *</label>
          <Controller
            name="Type"
            control={control}
            render={({ field }) => (
              <Segmented
                value={field.value}
                onChange={(v) => field.onChange(v)}
                block
                options={[
                  { label: 'Adjustment', value: 'ADJUSTMENT' },
                  { label: 'Opening', value: 'OPENING' },
                ]}
              />
            )}
          />
          <Typography.Text
            type="secondary"
            style={{ fontSize: 11, display: 'block', marginTop: 4 }}
          >
            Use <strong>Opening</strong> for first-time stock counts,{' '}
            <strong>Adjustment</strong> for corrections (shrinkage, damage,
            recounts).
          </Typography.Text>
        </div>

        {/* Unit cost */}
        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Unit cost (optional)</label>
          <Controller
            name="UnitCost"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value ?? null}
                onChange={(v) => field.onChange(v === null ? null : Number(v))}
                min={0}
                precision={4}
                step={0.01}
                style={{ width: '100%' }}
                placeholder="Used as COGS baseline for this movement"
              />
            )}
          />
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Notes</label>
          <Controller
            name="Notes"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                value={field.value ?? ''}
                rows={2}
                maxLength={500}
                showCount
                placeholder="e.g. Physical count reconciliation"
              />
            )}
          />
        </div>
      </form>
    </Drawer>
  );
}