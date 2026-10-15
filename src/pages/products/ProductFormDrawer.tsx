import { useEffect, useMemo } from 'react';
import {
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Button,
  Flex,
  Divider,
  Typography,
  Grid,
  App,
  Skeleton,
  Table,
  Empty,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCreateProduct,
  useProduct,
  useUpdateProduct,
} from '@/hooks/queries/useProducts';
import {
  useBrandsLookup,
  useCategoriesLookup,
  useWarehousesLookup,
} from '@/hooks/queries/useLookups';
import { getErrorMessage } from '@/lib/api';
import { formatQty } from '@/lib/format';
import type {
  ProductDetail,
  ProductListRow,
  WarehouseStockRow,
} from '@/types/product';

const { useBreakpoint } = Grid;

const productSchema = z.object({
  Name: z.string().min(1, 'Required').max(200),
  SKU: z.string().max(64).optional().or(z.literal('')),
  Barcode: z.string().max(64).optional().or(z.literal('')),
  Description: z.string().max(2000).optional().or(z.literal('')),
  Unit: z.string().max(20).optional().or(z.literal('')),
  Price: z.number({ required_error: 'Required' }).min(0),
  CostPrice: z.number({ required_error: 'Required' }).min(0),
  Discount: z.number().min(0).max(100).optional(),
  TaxRate: z.number().min(0).max(100).nullable().optional(),
  ReorderLevel: z.number().int().min(0).optional(),
  WarrantyMonths: z.number().int().min(0).optional(),
  ImageUrl: z
    .string()
    .url('Must be a valid URL')
    .max(500)
    .optional()
    .or(z.literal('')),
  IsActive: z.boolean(),
  CategoryId: z.string().uuid('Pick a category'),
  BrandId: z.string().uuid().nullable().optional().or(z.literal('')),
  InitialQty: z.number().int().min(0).optional(),
  InitialWarehouseId: z.string().uuid().optional().or(z.literal('')),
});

type ProductForm = z.infer<typeof productSchema>;

interface Props {
  open: boolean;
  product?: ProductListRow | ProductDetail | null;
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

function buildDefaults(
  product: ProductListRow | ProductDetail | null | undefined,
): ProductForm {
  if (!product) {
    return {
      Name: '',
      SKU: '',
      Barcode: '',
      Description: '',
      Unit: 'pcs',
      Price: 0,
      CostPrice: 0,
      Discount: 0,
      TaxRate: null,
      ReorderLevel: 0,
      WarrantyMonths: 0,
      ImageUrl: '',
      IsActive: true,
      CategoryId: '',
      BrandId: '',
      InitialQty: 0,
      InitialWarehouseId: '',
    };
  }
  return {
    Name: product.Name,
    SKU: product.SKU ?? '',
    Barcode: product.Barcode ?? '',
    Description: product.Description ?? '',
    Unit: product.Unit,
    Price: Number(product.Price),
    CostPrice: Number(product.CostPrice),
    Discount: Number(product.Discount),
    TaxRate: product.TaxRate === null ? null : Number(product.TaxRate),
    ReorderLevel: product.ReorderLevel,
    WarrantyMonths: product.WarrantyMonths,
    ImageUrl: product.ImageUrl ?? '',
    IsActive: product.IsActive,
    CategoryId: product.CategoryId,
    BrandId: product.BrandId ?? '',
    InitialQty: 0,
    InitialWarehouseId: '',
  };
}

export function ProductFormDrawer({ open, product, onClose }: Props) {
  const { message } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isEdit = !!product;

  const { data: categories = [], isLoading: catLoading } = useCategoriesLookup();
  const { data: brands = [], isLoading: brandLoading } = useBrandsLookup();
  const { data: warehouses = [], isLoading: whLoading } = useWarehousesLookup();

  // Fetch the full detail (with per-warehouse stock) only when editing
  // and the drawer is open. Detail drives the read-only "Current stock"
  // section below the form.
  const { data: detail, isLoading: detailLoading } = useProduct(
    isEdit && open && product ? product.Id : null,
  );

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct(product?.Id ?? '');

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: buildDefaults(product),
    mode: 'onTouched',
  });

  useEffect(() => {
    if (open) reset(buildDefaults(product));
  }, [open, product, reset]);

  const submitting =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  const onSubmit = async (values: ProductForm) => {
    const payload = {
      ...values,
      SKU: values.SKU ?? '',
      Barcode: values.Barcode ?? '',
      Description: values.Description || undefined,
      Unit: values.Unit || undefined,
      ImageUrl: values.ImageUrl || undefined,
      BrandId: values.BrandId || null,
      TaxRate: values.TaxRate ?? null,
    };

    try {
      if (isEdit && product) {
        const { InitialQty: _q, InitialWarehouseId: _w, ...rest } = payload;
        await updateMutation.mutateAsync(rest);
        message.success('Product updated');
      } else {
        const createPayload = { ...payload };
        if (!createPayload.InitialQty || createPayload.InitialQty <= 0) {
          createPayload.InitialQty = 0;
          createPayload.InitialWarehouseId = undefined;
        }
        await createMutation.mutateAsync(createPayload);
        message.success('Product created');
      }
      onClose();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ label: c.Name, value: c.Id })),
    [categories],
  );
  const brandOptions = useMemo(
    () => brands.map((b) => ({ label: b.Name, value: b.Id })),
    [brands],
  );
  const warehouseOptions = useMemo(
    () => warehouses.map((w) => ({ label: w.Name, value: w.Id })),
    [warehouses],
  );

  const stockColumns: ColumnsType<WarehouseStockRow> = [
    {
      title: 'Warehouse',
      dataIndex: ['Warehouse', 'Name'],
      key: 'warehouse',
      render: (_: unknown, row: WarehouseStockRow) => (
        <Flex vertical gap={0}>
          <Typography.Text style={{ fontSize: 13 }}>
            {row.Warehouse.Name}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {row.Warehouse.Code}
          </Typography.Text>
        </Flex>
      ),
    },
    {
      title: 'Qty',
      dataIndex: 'Qty',
      key: 'qty',
      align: 'right',
      render: (v: number) => (
        <Typography.Text strong>{formatQty(v, 0)}</Typography.Text>
      ),
    },
  ];

  return (
    <Drawer
      title={isEdit ? 'Edit product' : 'New product'}
      open={open}
      onClose={submitting ? undefined : onClose}
      width={isMobile ? '100%' : 520}
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
            onClick={handleSubmit(onSubmit)}
          >
            {isEdit ? 'Save changes' : 'Create product'}
          </Button>
        </Flex>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Fields marked with * are required.
        </Typography.Text>

        <Divider orientation="left" plain>
          Basics
        </Divider>

        <Field label="Name *">
          <Controller
            name="Name"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Input
                  {...field}
                  placeholder="e.g. Coca-Cola 500ml"
                  status={fieldState.error ? 'error' : undefined}
                />
                <div style={ERR_STYLE}>{fieldState.error?.message ?? ''}</div>
              </>
            )}
          />
        </Field>

        <Flex gap={12} wrap="wrap">
          <div style={{ flex: 1, minWidth: 200 }}>
            <Field label="SKU">
              <Controller
                name="SKU"
                control={control}
                render={({ field, fieldState }) => (
                  <>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Optional"
                      status={fieldState.error ? 'error' : undefined}
                    />
                    <div style={ERR_STYLE}>
                      {fieldState.error?.message ?? ''}
                    </div>
                  </>
                )}
              />
            </Field>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Field label="Barcode">
              <Controller
                name="Barcode"
                control={control}
                render={({ field, fieldState }) => (
                  <>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Optional"
                      status={fieldState.error ? 'error' : undefined}
                    />
                    <div style={ERR_STYLE}>
                      {fieldState.error?.message ?? ''}
                    </div>
                  </>
                )}
              />
            </Field>
          </div>
        </Flex>

        <Field label="Description">
          <Controller
            name="Description"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                value={field.value ?? ''}
                rows={2}
                maxLength={2000}
              />
            )}
          />
        </Field>

        <Divider orientation="left" plain>
          Classification
        </Divider>

        <Field label="Category *">
          <Controller
            name="CategoryId"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Select
                  {...field}
                  value={field.value || undefined}
                  loading={catLoading}
                  placeholder="Pick a category"
                  options={categoryOptions}
                  showSearch
                  optionFilterProp="label"
                  status={fieldState.error ? 'error' : undefined}
                />
                <div style={ERR_STYLE}>{fieldState.error?.message ?? ''}</div>
              </>
            )}
          />
        </Field>

        <Field label="Brand">
          <Controller
            name="BrandId"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || undefined}
                onChange={(v) => field.onChange(v ?? '')}
                loading={brandLoading}
                placeholder="Optional"
                options={brandOptions}
                allowClear
                showSearch
                optionFilterProp="label"
              />
            )}
          />
        </Field>

        <Field label="Unit">
          <Controller
            name="Unit"
            control={control}
            render={({ field }) => (
              <Input {...field} value={field.value ?? ''} placeholder="pcs" />
            )}
          />
        </Field>

        <Divider orientation="left" plain>
          Pricing
        </Divider>

        <Flex gap={12} wrap="wrap">
          <div style={{ flex: 1, minWidth: 140 }}>
            <Field label="Selling price *">
              <Controller
                name="Price"
                control={control}
                render={({ field, fieldState }) => (
                  <>
                    <InputNumber
                      value={field.value}
                      onChange={(v) => field.onChange(v ?? 0)}
                      min={0}
                      precision={4}
                      step={0.01}
                      style={{ width: '100%' }}
                      status={fieldState.error ? 'error' : undefined}
                    />
                    <div style={ERR_STYLE}>
                      {fieldState.error?.message ?? ''}
                    </div>
                  </>
                )}
              />
            </Field>
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <Field label="Cost price *">
              <Controller
                name="CostPrice"
                control={control}
                render={({ field, fieldState }) => (
                  <>
                    <InputNumber
                      value={field.value}
                      onChange={(v) => field.onChange(v ?? 0)}
                      min={0}
                      precision={4}
                      step={0.01}
                      style={{ width: '100%' }}
                      status={fieldState.error ? 'error' : undefined}
                    />
                    <div style={ERR_STYLE}>
                      {fieldState.error?.message ?? ''}
                    </div>
                  </>
                )}
              />
            </Field>
          </div>
        </Flex>

        <Flex gap={12} wrap="wrap">
          <div style={{ flex: 1, minWidth: 140 }}>
            <Field label="Discount %">
              <Controller
                name="Discount"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    value={field.value ?? 0}
                    onChange={(v) => field.onChange(v ?? 0)}
                    min={0}
                    max={100}
                    precision={2}
                    step={0.5}
                    style={{ width: '100%' }}
                  />
                )}
              />
            </Field>
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <Field label="Tax rate %">
              <Controller
                name="TaxRate"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    value={field.value ?? null}
                    onChange={(v) => field.onChange(v ?? null)}
                    min={0}
                    max={100}
                    precision={2}
                    step={0.5}
                    style={{ width: '100%' }}
                    placeholder="No tax"
                  />
                )}
              />
            </Field>
          </div>
        </Flex>

        <Divider orientation="left" plain>
          Stock & Warranty
        </Divider>

        <Flex gap={12} wrap="wrap">
          <div style={{ flex: 1, minWidth: 140 }}>
            <Field label="Reorder level">
              <Controller
                name="ReorderLevel"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    value={field.value ?? 0}
                    onChange={(v) => field.onChange(v ?? 0)}
                    min={0}
                    precision={0}
                    style={{ width: '100%' }}
                  />
                )}
              />
            </Field>
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <Field label="Warranty (months)">
              <Controller
                name="WarrantyMonths"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    value={field.value ?? 0}
                    onChange={(v) => field.onChange(v ?? 0)}
                    min={0}
                    precision={0}
                    style={{ width: '100%' }}
                  />
                )}
              />
            </Field>
          </div>
        </Flex>

        {!isEdit && (
          <>
            <Divider orientation="left" plain>
              Opening stock (optional)
            </Divider>
            <Typography.Paragraph
              type="secondary"
              style={{ fontSize: 12, marginTop: -4 }}
            >
              If you enter a quantity, pick a warehouse. Writes an OPENING
              stock movement.
            </Typography.Paragraph>

            <Flex gap={12} wrap="wrap">
              <div style={{ flex: 1, minWidth: 140 }}>
                <Field label="Initial qty">
                  <Controller
                    name="InitialQty"
                    control={control}
                    render={({ field }) => (
                      <InputNumber
                        value={field.value ?? 0}
                        onChange={(v) => field.onChange(v ?? 0)}
                        min={0}
                        precision={0}
                        style={{ width: '100%' }}
                      />
                    )}
                  />
                </Field>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <Field label="Warehouse">
                  <Controller
                    name="InitialWarehouseId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || undefined}
                        onChange={(v) => field.onChange(v ?? '')}
                        loading={whLoading}
                        placeholder="Pick a warehouse"
                        options={warehouseOptions}
                        allowClear
                        showSearch
                        optionFilterProp="label"
                      />
                    )}
                  />
                </Field>
              </div>
            </Flex>
          </>
        )}

        {/* Read-only current stock — only when editing an existing product */}
        {isEdit && (
          <>
            <Divider orientation="left" plain>
              Current stock
            </Divider>

            {detailLoading || !detail ? (
              <Skeleton active paragraph={{ rows: 3 }} />
            ) : detail.WarehouseStocks.length === 0 ? (
              <Empty
                description="No stock in any warehouse"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ margin: '12px 0' }}
              />
            ) : (
              <>
                <Table<WarehouseStockRow>
                  dataSource={detail.WarehouseStocks}
                  rowKey="Id"
                  columns={stockColumns}
                  size="small"
                  pagination={false}
                />
                <Flex
                  justify="space-between"
                  style={{ marginTop: 8, padding: '6px 0' }}
                >
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Total
                  </Typography.Text>
                  <Typography.Text strong>
                    {formatQty(
                      detail.WarehouseStocks.reduce(
                        (s, ws) => s + ws.Qty,
                        0,
                      ),
                      0,
                    )}
                  </Typography.Text>
                </Flex>
              </>
            )}

            <Typography.Paragraph
              type="secondary"
              style={{ fontSize: 11, marginTop: 8 }}
            >
              Stock changes go through the Stock module — this is a read-only
              view.
            </Typography.Paragraph>
          </>
        )}

        <Divider orientation="left" plain>
          Media & status
        </Divider>

        <Field label="Image URL">
          <Controller
            name="ImageUrl"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  placeholder="https://…"
                  status={fieldState.error ? 'error' : undefined}
                />
                <div style={ERR_STYLE}>{fieldState.error?.message ?? ''}</div>
              </>
            )}
          />
        </Field>

        <Field label="Active">
          <Controller
            name="IsActive"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onChange={field.onChange} />
            )}
          />
        </Field>

        <div style={{ height: 24 }} />
      </form>
    </Drawer>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={LABEL_STYLE}>{label}</label>
      {children}
    </div>
  );
}