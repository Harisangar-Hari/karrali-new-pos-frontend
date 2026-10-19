import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Empty,
  Flex,
  Grid,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Typography,
  App,
} from 'antd';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search as SearchIcon,
  Package,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs, { type Dayjs } from 'dayjs';
import Decimal from 'decimal.js';
import { useCreatePurchase } from '@/hooks/queries/usePurchases';
import { useSuppliersLookup } from '@/hooks/queries/useSuppliersLookup';
import { useWarehousesLookup } from '@/hooks/queries/useLookups';
import { useProducts } from '@/hooks/queries/useProducts';
import { getErrorMessage } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import type { ProductListRow } from '@/types/product';

const { useBreakpoint } = Grid;

interface DraftLine {
  key: string;
  ProductId: string;
  Name: string;
  SKU: string | null;
  Qty: number;
  UnitCost: number;
  TaxRate: number | null;
  Notes?: string;
}

const schema = z
  .object({
    SupplierId: z.string().uuid('Pick a supplier'),
    SupplierInvoiceNo: z.string().max(100).optional().or(z.literal('')),
    InvoiceDate: z.custom<Dayjs>((v) => dayjs.isDayjs(v), 'Required'),
    DueDate: z.custom<Dayjs>().nullable().optional(),
    WarehouseId: z.string().uuid('Pick a warehouse'),
    Notes: z.string().max(2000).optional().or(z.literal('')),
  })
  .superRefine((values, ctx) => {
    if (
      values.DueDate &&
      values.InvoiceDate &&
      values.DueDate.isBefore(values.InvoiceDate, 'day')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Due date must be on or after invoice date',
        path: ['DueDate'],
      });
    }
  });

type Form = z.infer<typeof schema>;

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

let lineCounter = 0;
function newKey() {
  lineCounter += 1;
  return `l-${lineCounter}`;
}

export function NewPurchasePage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const { data: suppliers = [] } = useSuppliersLookup();
  const { data: warehouses = [] } = useWarehousesLookup();
  const createMutation = useCreatePurchase();

  const [lines, setLines] = useState<DraftLine[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: productsPage, isFetching: productsFetching } = useProducts({
    search: search || undefined,
    limit: 15,
    IsActive: true,
    sortBy: 'Name',
    sortOrder: 'asc',
  });

  const productResults = productsPage?.data ?? [];
  const showResults = search.length > 0;

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      SupplierId: '',
      SupplierInvoiceNo: '',
      InvoiceDate: dayjs(),
      DueDate: dayjs().add(30, 'day'),
      WarehouseId: '',
      Notes: '',
    },
    mode: 'onTouched',
  });

  const addLine = (p: ProductListRow) => {
    const existing = lines.find((l) => l.ProductId === p.Id);
    if (existing) {
      message.info(`${p.Name} is already on this invoice`);
      setSearchInput('');
      setSearch('');
      return;
    }
    setLines((prev) => [
      ...prev,
      {
        key: newKey(),
        ProductId: p.Id,
        Name: p.Name,
        SKU: p.SKU,
        Qty: 1,
        UnitCost: Number(p.CostPrice),
        TaxRate: p.TaxRate !== null ? Number(p.TaxRate) : null,
      },
    ]);
    setSearchInput('');
    setSearch('');
  };

  const updateLine = (key: string, patch: Partial<DraftLine>) => {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...patch } : l)),
    );
  };

  const removeLine = (key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  };

  const totals = useMemo(() => {
    const ZERO = new Decimal(0);
    let subtotal = ZERO;
    let tax = ZERO;
    for (const l of lines) {
      const lineSub = new Decimal(l.Qty).mul(l.UnitCost).toDecimalPlaces(4);
      subtotal = subtotal.add(lineSub);
      if (l.TaxRate !== null) {
        tax = tax.add(
          lineSub.mul(new Decimal(l.TaxRate)).div(100).toDecimalPlaces(4),
        );
      }
    }
    return {
      subtotal: subtotal.toFixed(4),
      tax: tax.toFixed(4),
      total: subtotal.add(tax).toFixed(4),
    };
  }, [lines]);

  const submitting = isSubmitting || createMutation.isPending;
  const canSubmit = lines.length > 0 && !submitting;

  const onSubmit = async (values: Form) => {
    if (lines.length === 0) {
      message.error('Add at least one item');
      return;
    }
    try {
      const payload = {
        SupplierId: values.SupplierId,
        SupplierInvoiceNo: values.SupplierInvoiceNo || undefined,
        InvoiceDate: values.InvoiceDate.toISOString(),
        DueDate: values.DueDate ? values.DueDate.toISOString() : undefined,
        WarehouseId: values.WarehouseId,
        Notes: values.Notes || undefined,
        Items: lines.map((l) => ({
          ProductId: l.ProductId,
          Qty: l.Qty,
          UnitCost: l.UnitCost,
          TaxRate: l.TaxRate ?? undefined,
          Notes: l.Notes || undefined,
        })),
      };
      const created = await createMutation.mutateAsync(payload);
      message.success(`Purchase ${created.Code} posted`);
      navigate('/purchases');
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
        <Flex align="center" gap={8}>
          <Button
            type="text"
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate('/purchases')}
          />
          <Typography.Title level={3} style={{ margin: 0 }}>
            New purchase
          </Typography.Title>
        </Flex>
        <Button
          type="primary"
          loading={submitting}
          disabled={!canSubmit}
          onClick={handleSubmit(onSubmit)}
        >
          Post purchase
        </Button>
      </Flex>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 340px',
          gap: 16,
        }}
      >
        <Flex vertical gap={16}>
          {/* Header fields */}
          <Card title="Invoice details" size="small">
            <form>
              <Row gutter={[12, 12]}>
                <Col xs={24} md={12}>
                  <label style={LABEL_STYLE}>Supplier *</label>
                  <Controller
                    name="SupplierId"
                    control={control}
                    render={({ field, fieldState }) => (
                      <>
                        <Select
                          value={field.value || undefined}
                          onChange={(v) => field.onChange(v ?? '')}
                          placeholder="Pick a supplier"
                          options={suppliers.map((s) => ({
                            label: `${s.Name} (${s.Code})`,
                            value: s.Id,
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
                </Col>
                <Col xs={24} md={12}>
                  <label style={LABEL_STYLE}>Supplier invoice #</label>
                  <Controller
                    name="SupplierInvoiceNo"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        maxLength={100}
                        placeholder="Optional"
                      />
                    )}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <label style={LABEL_STYLE}>Invoice date *</label>
                  <Controller
                    name="InvoiceDate"
                    control={control}
                    render={({ field, fieldState }) => (
                      <>
                        <DatePicker
                          value={field.value ?? null}
                          onChange={(d) => field.onChange(d ?? null)}
                          style={{ width: '100%' }}
                          allowClear={false}
                          status={fieldState.error ? 'error' : undefined}
                        />
                        <div style={ERR_STYLE}>
                          {fieldState.error?.message ?? ''}
                        </div>
                      </>
                    )}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <label style={LABEL_STYLE}>Due date</label>
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
                </Col>
                <Col xs={24} md={8}>
                  <label style={LABEL_STYLE}>Warehouse *</label>
                  <Controller
                    name="WarehouseId"
                    control={control}
                    render={({ field, fieldState }) => (
                      <>
                        <Select
                          value={field.value || undefined}
                          onChange={(v) => field.onChange(v ?? '')}
                          placeholder="Receiving warehouse"
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
                </Col>
                <Col span={24}>
                  <label style={LABEL_STYLE}>Notes</label>
                  <Controller
                    name="Notes"
                    control={control}
                    render={({ field }) => (
                      <Input.TextArea
                        {...field}
                        value={field.value ?? ''}
                        rows={2}
                        maxLength={2000}
                        placeholder="Optional"
                      />
                    )}
                  />
                </Col>
              </Row>
            </form>
          </Card>

          {/* Items */}
          <Card
            title={`Items (${lines.length})`}
            size="small"
            styles={{ body: { padding: isMobile ? 12 : 16 } }}
          >
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products to add…"
              prefix={<SearchIcon size={14} />}
              size="large"
              allowClear
            />

            {showResults && (
              <div
                style={{
                  marginTop: 8,
                  border: '1px solid #f0f0f0',
                  borderRadius: 6,
                  maxHeight: 260,
                  overflowY: 'auto',
                }}
              >
                {productsFetching && productResults.length === 0 ? (
                  <Flex justify="center" style={{ padding: 16 }}>
                    <Typography.Text type="secondary">Searching…</Typography.Text>
                  </Flex>
                ) : productResults.length === 0 ? (
                  <Empty
                    description="No products match"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    style={{ padding: 16 }}
                  />
                ) : (
                  productResults.map((p) => (
                    <Flex
                      key={p.Id}
                      align="center"
                      gap={8}
                      style={{
                        padding: '8px 10px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f0f0f0',
                      }}
                      className="pos-product-row"
                      onClick={() => addLine(p)}
                    >
                      <Package size={14} color="#0d9488" />
                      <Flex vertical gap={0} style={{ flex: 1, minWidth: 0 }}>
                        <Typography.Text strong ellipsis>
                          {p.Name}
                        </Typography.Text>
                        <Typography.Text
                          type="secondary"
                          style={{ fontSize: 11 }}
                        >
                          {p.SKU ? `SKU ${p.SKU} · ` : ''}
                          Cost {formatMoney(p.CostPrice)}
                        </Typography.Text>
                      </Flex>
                      <Button
                        type="primary"
                        size="small"
                        icon={<Plus size={12} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          addLine(p);
                        }}
                      >
                        Add
                      </Button>
                    </Flex>
                  ))
                )}
              </div>
            )}

            <Divider style={{ margin: '16px 0 12px' }} />

            {lines.length === 0 ? (
              <Empty
                description="Search above to add items"
                style={{ margin: '16px 0' }}
              />
            ) : isMobile ? (
              <Flex vertical gap={8}>
                {lines.map((l) => (
                  <LineEditorMobile
                    key={l.key}
                    line={l}
                    onChange={(patch) => updateLine(l.key, patch)}
                    onRemove={() => removeLine(l.key)}
                  />
                ))}
              </Flex>
            ) : (
              <Flex vertical gap={8}>
                {lines.map((l) => (
                  <LineEditor
                    key={l.key}
                    line={l}
                    onChange={(patch) => updateLine(l.key, patch)}
                    onRemove={() => removeLine(l.key)}
                  />
                ))}
              </Flex>
            )}
          </Card>
        </Flex>

        {/* Summary sidebar */}
        <Flex vertical gap={16} style={{ position: isMobile ? 'static' : 'sticky', top: 16, height: 'fit-content' }}>
          <Card title="Summary" size="small">
            <Flex vertical gap={6}>
              <SummaryRow label="Items" value={String(lines.length)} />
              <Divider style={{ margin: '6px 0' }} />
              <SummaryRow label="Subtotal" value={formatMoney(totals.subtotal)} />
              <SummaryRow label="Tax" value={formatMoney(totals.tax)} />
              <Divider style={{ margin: '6px 0' }} />
              <Flex justify="space-between">
                <Typography.Text strong>Total</Typography.Text>
                <Typography.Text strong style={{ color: '#0d9488', fontSize: 18 }}>
                  {formatMoney(totals.total)}
                </Typography.Text>
              </Flex>
            </Flex>
          </Card>

          {errors.root && (
            <Alert type="error" showIcon message={errors.root.message} />
          )}

          <Button
            type="primary"
            block
            size="large"
            loading={submitting}
            disabled={!canSubmit}
            onClick={handleSubmit(onSubmit)}
          >
            Post purchase
          </Button>

          <Typography.Paragraph
            type="secondary"
            style={{ fontSize: 11, margin: 0 }}
          >
            Posting creates the invoice, adds stock to the chosen warehouse, and
            writes an audit entry — all in one transaction.
          </Typography.Paragraph>
        </Flex>
      </div>
    </Flex>
  );
}

// ─── Line editors ──────────────────────────────────────────────

function LineEditor({
  line,
  onChange,
  onRemove,
}: {
  line: DraftLine;
  onChange: (patch: Partial<DraftLine>) => void;
  onRemove: () => void;
}) {
  const lineSubtotal = new Decimal(line.Qty)
    .mul(line.UnitCost)
    .toDecimalPlaces(4);
  const lineTax =
    line.TaxRate !== null
      ? lineSubtotal.mul(new Decimal(line.TaxRate)).div(100).toDecimalPlaces(4)
      : new Decimal(0);
  const lineTotal = lineSubtotal.add(lineTax);

  return (
    <Flex
      gap={8}
      align="center"
      style={{
        padding: 10,
        border: '1px solid #f0f0f0',
        borderRadius: 6,
        background: '#fafafa',
      }}
      wrap="wrap"
    >
      <Flex vertical gap={2} style={{ flex: 1, minWidth: 200 }}>
        <Typography.Text strong ellipsis>
          {line.Name}
        </Typography.Text>
        {line.SKU && (
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {line.SKU}
          </Typography.Text>
        )}
      </Flex>

      <Space size={4} wrap>
        <Flex vertical gap={0}>
          <Typography.Text type="secondary" style={{ fontSize: 10 }}>
            Qty
          </Typography.Text>
          <InputNumber
            value={line.Qty}
            onChange={(v) => onChange({ Qty: Number(v ?? 1) })}
            min={1}
            precision={0}
            size="small"
            style={{ width: 80 }}
          />
        </Flex>
        <Flex vertical gap={0}>
          <Typography.Text type="secondary" style={{ fontSize: 10 }}>
            Unit cost
          </Typography.Text>
          <InputNumber
            value={line.UnitCost}
            onChange={(v) => onChange({ UnitCost: Number(v ?? 0) })}
            min={0}
            precision={4}
            step={0.01}
            size="small"
            style={{ width: 110 }}
          />
        </Flex>
        <Flex vertical gap={0}>
          <Typography.Text type="secondary" style={{ fontSize: 10 }}>
            Tax %
          </Typography.Text>
          <InputNumber
            value={line.TaxRate ?? undefined}
            onChange={(v) =>
              onChange({ TaxRate: v === null ? null : Number(v) })
            }
            min={0}
            max={100}
            precision={2}
            size="small"
            style={{ width: 80 }}
            placeholder="—"
          />
        </Flex>
        <Flex vertical gap={0} style={{ minWidth: 100 }}>
          <Typography.Text type="secondary" style={{ fontSize: 10 }}>
            Line total
          </Typography.Text>
          <Typography.Text strong>{formatMoney(lineTotal.toFixed(4))}</Typography.Text>
        </Flex>
      </Space>

      <Button
        type="text"
        danger
        size="small"
        icon={<Trash2 size={14} />}
        onClick={onRemove}
      />
    </Flex>
  );
}

function LineEditorMobile({
  line,
  onChange,
  onRemove,
}: {
  line: DraftLine;
  onChange: (patch: Partial<DraftLine>) => void;
  onRemove: () => void;
}) {
  const lineSubtotal = new Decimal(line.Qty)
    .mul(line.UnitCost)
    .toDecimalPlaces(4);
  const lineTax =
    line.TaxRate !== null
      ? lineSubtotal.mul(new Decimal(line.TaxRate)).div(100).toDecimalPlaces(4)
      : new Decimal(0);
  const lineTotal = lineSubtotal.add(lineTax);

  return (
    <div
      style={{
        padding: 10,
        border: '1px solid #f0f0f0',
        borderRadius: 6,
        background: '#fafafa',
      }}
    >
      <Flex justify="space-between" align="flex-start" gap={8}>
        <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Typography.Text strong ellipsis>
            {line.Name}
          </Typography.Text>
          {line.SKU && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {line.SKU}
            </Typography.Text>
          )}
        </Flex>
        <Button
          type="text"
          danger
          size="small"
          icon={<Trash2 size={14} />}
          onClick={onRemove}
        />
      </Flex>

      <Flex gap={8} wrap="wrap" style={{ marginTop: 8 }}>
        <Flex vertical gap={2} style={{ flex: 1, minWidth: 90 }}>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            Qty
          </Typography.Text>
          <InputNumber
            value={line.Qty}
            onChange={(v) => onChange({ Qty: Number(v ?? 1) })}
            min={1}
            precision={0}
            size="small"
            style={{ width: '100%' }}
          />
        </Flex>
        <Flex vertical gap={2} style={{ flex: 1, minWidth: 100 }}>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            Unit cost
          </Typography.Text>
          <InputNumber
            value={line.UnitCost}
            onChange={(v) => onChange({ UnitCost: Number(v ?? 0) })}
            min={0}
            precision={4}
            size="small"
            style={{ width: '100%' }}
          />
        </Flex>
      </Flex>

      <Flex gap={8} wrap="wrap" style={{ marginTop: 8 }} align="flex-end">
        <Flex vertical gap={2} style={{ flex: 1, minWidth: 90 }}>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            Tax %
          </Typography.Text>
          <InputNumber
            value={line.TaxRate ?? undefined}
            onChange={(v) =>
              onChange({ TaxRate: v === null ? null : Number(v) })
            }
            min={0}
            max={100}
            precision={2}
            size="small"
            style={{ width: '100%' }}
            placeholder="—"
          />
        </Flex>
        <Flex vertical gap={2} style={{ flex: 1, minWidth: 100 }} align="flex-end">
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            Line total
          </Typography.Text>
          <Typography.Text strong>
            {formatMoney(lineTotal.toFixed(4))}
          </Typography.Text>
        </Flex>
      </Flex>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <Flex justify="space-between">
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {label}
      </Typography.Text>
      <Typography.Text style={{ fontSize: 12 }}>{value}</Typography.Text>
    </Flex>
  );
}