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
import { useNavigate, useParams } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs, { type Dayjs } from 'dayjs';
import Decimal from 'decimal.js';
import {
  useCreateQuotation,
  useQuotation,
  useUpdateQuotation,
} from '@/hooks/queries/useQuotations';
import { useCustomersLookup } from '@/hooks/queries/useCustomersLookup';
import { useProducts } from '@/hooks/queries/useProducts';
import { usePermission } from '@/hooks/usePermission';
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
  UnitPrice: number;
  Discount: number;
  TaxRate: number | null;
  Notes?: string;
}

const schema = z.object({
  CustomerId: z.string().uuid().nullable().optional().or(z.literal('')),
  ValidUntil: z.custom<Dayjs>().nullable().optional(),
  Notes: z.string().max(2000).optional().or(z.literal('')),
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
  return `ql-${lineCounter}`;
}

export function QuotationFormPage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { message } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const canDiscount = usePermission('sales.discount');

  const { data: quotation, isLoading: loadingQuote } = useQuotation(
    id ?? null,
  );
  const { data: customers = [] } = useCustomersLookup();
  const createMutation = useCreateQuotation();
  const updateMutation = useUpdateQuotation(id ?? '');

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
    reset,
    formState: { isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      CustomerId: '',
      ValidUntil: dayjs().add(30, 'day'),
      Notes: '',
    },
    mode: 'onTouched',
  });

  // Load quotation into the form when editing
  useEffect(() => {
    if (isEdit && quotation) {
      reset({
        CustomerId: quotation.CustomerId ?? '',
        ValidUntil: quotation.ValidUntil
          ? dayjs(quotation.ValidUntil)
          : null,
        Notes: quotation.Notes ?? '',
      });
      setLines(
        quotation.Items.map((item) => ({
          key: newKey(),
          ProductId: item.ProductId,
          Name: item.Product.Name,
          SKU: item.Product.SKU,
          Qty: item.Qty,
          UnitPrice: Number(item.UnitPrice),
          Discount: Number(item.Discount),
          TaxRate: item.TaxRate !== null ? Number(item.TaxRate) : null,
          Notes: item.Notes ?? undefined,
        })),
      );
    }
  }, [isEdit, quotation, reset]);

  const addLine = (p: ProductListRow) => {
    const existing = lines.find((l) => l.ProductId === p.Id);
    if (existing) {
      message.info(`${p.Name} is already on this quotation`);
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
        UnitPrice: Number(p.Price),
        Discount: Number(p.Discount ?? 0),
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
    let discount = ZERO;
    let tax = ZERO;
    for (const l of lines) {
      const lineSub = new Decimal(l.Qty).mul(l.UnitPrice).toDecimalPlaces(4);
      const lineDisc = lineSub
        .mul(new Decimal(l.Discount ?? 0))
        .div(100)
        .toDecimalPlaces(4);
      const afterDisc = lineSub.sub(lineDisc);
      const lineTax =
        l.TaxRate !== null
          ? afterDisc.mul(new Decimal(l.TaxRate)).div(100).toDecimalPlaces(4)
          : ZERO;

      subtotal = subtotal.add(lineSub);
      discount = discount.add(lineDisc);
      tax = tax.add(lineTax);
    }
    return {
      subtotal: subtotal.toFixed(4),
      discount: discount.toFixed(4),
      tax: tax.toFixed(4),
      total: subtotal.sub(discount).add(tax).toFixed(4),
    };
  }, [lines]);

  const submitting =
    isSubmitting || createMutation.isPending || updateMutation.isPending;
  const canSubmit = lines.length > 0 && !submitting;

  const onSubmit = async (values: Form) => {
    if (lines.length === 0) {
      message.error('Add at least one item');
      return;
    }
    try {
      const payload = {
        CustomerId: values.CustomerId || undefined,
        ValidUntil: values.ValidUntil
          ? values.ValidUntil.toISOString()
          : undefined,
        Notes: values.Notes || undefined,
        Items: lines.map((l) => ({
          ProductId: l.ProductId,
          Qty: l.Qty,
          UnitPrice: l.UnitPrice,
          Discount: l.Discount > 0 ? l.Discount : undefined,
          TaxRate: l.TaxRate ?? undefined,
          Notes: l.Notes || undefined,
        })),
      };
      if (isEdit && quotation) {
        await updateMutation.mutateAsync(payload);
        message.success('Quotation updated');
      } else {
        const created = await createMutation.mutateAsync(payload);
        message.success(`Quotation ${created.Code} created`);
      }
      navigate('/quotations');
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  if (isEdit && loadingQuote) {
    return <div style={{ padding: 24 }}>Loading…</div>;
  }

  // Block editing if the quotation isn't editable
  const editLocked =
    isEdit &&
    quotation &&
    quotation.Status !== 'DRAFT' &&
    quotation.Status !== 'SENT';

  if (editLocked) {
    return (
      <Alert
        type="warning"
        showIcon
        message="This quotation cannot be edited"
        description={`Status is ${quotation.Status}. Only DRAFT and SENT quotations are editable.`}
        style={{ margin: 24 }}
      />
    );
  }

  // For SENT, only ValidUntil + Notes are editable
  const sentMode = isEdit && quotation?.Status === 'SENT';

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
        <Flex align="center" gap={8}>
          <Button
            type="text"
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate('/quotations')}
          />
          <Typography.Title level={3} style={{ margin: 0 }}>
            {isEdit ? `Edit ${quotation?.Code}` : 'New quotation'}
          </Typography.Title>
        </Flex>
        <Button
          type="primary"
          loading={submitting}
          disabled={!canSubmit}
          onClick={handleSubmit(onSubmit)}
        >
          {isEdit ? 'Save changes' : 'Create quotation'}
        </Button>
      </Flex>

      {sentMode && (
        <Alert
          type="info"
          showIcon
          message="This quotation is SENT"
          description="Only the valid-until date and notes can be changed. To modify items, cancel and create a new quotation."
        />
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 340px',
          gap: 16,
        }}
      >
        <Flex vertical gap={16}>
          {/* Header fields */}
          <Card title="Quotation details" size="small">
            <form>
              <Row gutter={[12, 12]}>
                <Col xs={24} md={12}>
                  <label style={LABEL_STYLE}>Customer</label>
                  <Controller
                    name="CustomerId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || undefined}
                        onChange={(v) => field.onChange(v ?? '')}
                        placeholder="Walk-in (no customer)"
                        options={customers.map((c) => ({
                          label: `${c.Name} (${c.Code})`,
                          value: c.Id,
                        }))}
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        style={{ width: '100%' }}
                        disabled={sentMode}
                      />
                    )}
                  />
                  <Typography.Text
                    type="secondary"
                    style={{ fontSize: 11 }}
                  >
                    Optional. Required for credit or cheque conversion.
                  </Typography.Text>
                </Col>
                <Col xs={24} md={12}>
                  <label style={LABEL_STYLE}>Valid until</label>
                  <Controller
                    name="ValidUntil"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        value={field.value ?? null}
                        onChange={(d) => field.onChange(d ?? null)}
                        style={{ width: '100%' }}
                        allowClear
                      />
                    )}
                  />
                  <Typography.Text
                    type="secondary"
                    style={{ fontSize: 11 }}
                  >
                    Informational — the quotation shows as EXPIRED past this
                    date.
                  </Typography.Text>
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
              disabled={sentMode}
            />

            {!sentMode && showResults && (
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
                    <Typography.Text type="secondary">
                      Searching…
                    </Typography.Text>
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
                          {formatMoney(p.Price)}
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
                description={
                  sentMode
                    ? 'Items are locked'
                    : 'Search above to add items'
                }
                style={{ margin: '16px 0' }}
              />
            ) : (
              <Flex vertical gap={8}>
                {lines.map((l) => (
                  <LineEditor
                    key={l.key}
                    line={l}
                    locked={sentMode}
                    canDiscount={canDiscount}
                    onChange={(patch) => updateLine(l.key, patch)}
                    onRemove={() => removeLine(l.key)}
                  />
                ))}
              </Flex>
            )}
          </Card>
        </Flex>

        {/* Summary sidebar */}
        <Flex
          vertical
          gap={16}
          style={{
            position: isMobile ? 'static' : 'sticky',
            top: 16,
            height: 'fit-content',
          }}
        >
          <Card title="Summary" size="small">
            <Flex vertical gap={6}>
              <SummaryRow label="Items" value={String(lines.length)} />
              <Divider style={{ margin: '6px 0' }} />
              <SummaryRow
                label="Subtotal"
                value={formatMoney(totals.subtotal)}
              />
              {Number(totals.discount) > 0 && (
                <SummaryRow
                  label="Discount"
                  value={`− ${formatMoney(totals.discount)}`}
                />
              )}
              {Number(totals.tax) > 0 && (
                <SummaryRow label="Tax" value={formatMoney(totals.tax)} />
              )}
              <Divider style={{ margin: '6px 0' }} />
              <Flex justify="space-between">
                <Typography.Text strong>Total</Typography.Text>
                <Typography.Text
                  strong
                  style={{ color: '#0d9488', fontSize: 18 }}
                >
                  {formatMoney(totals.total)}
                </Typography.Text>
              </Flex>
            </Flex>
          </Card>

          <Button
            type="primary"
            block
            size="large"
            loading={submitting}
            disabled={!canSubmit}
            onClick={handleSubmit(onSubmit)}
          >
            {isEdit ? 'Save changes' : 'Create quotation'}
          </Button>

          {!canDiscount && (
            <Alert
              type="info"
              showIcon
              message="Discount permission required"
              description="You need sales.discount to apply line discounts."
            />
          )}
        </Flex>
      </div>
    </Flex>
  );
}

function LineEditor({
  line,
  locked,
  canDiscount,
  onChange,
  onRemove,
}: {
  line: DraftLine;
  locked: boolean;
  canDiscount: boolean;
  onChange: (patch: Partial<DraftLine>) => void;
  onRemove: () => void;
}) {
  const lineSub = new Decimal(line.Qty).mul(line.UnitPrice).toDecimalPlaces(4);
  const lineDisc = lineSub
    .mul(new Decimal(line.Discount ?? 0))
    .div(100)
    .toDecimalPlaces(4);
  const afterDisc = lineSub.sub(lineDisc);
  const lineTax =
    line.TaxRate !== null
      ? afterDisc.mul(new Decimal(line.TaxRate)).div(100).toDecimalPlaces(4)
      : new Decimal(0);
  const lineTotal = afterDisc.add(lineTax);

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
      <Flex vertical gap={2} style={{ flex: 1, minWidth: 180 }}>
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
            style={{ width: 70 }}
            disabled={locked}
          />
        </Flex>
        <Flex vertical gap={0}>
          <Typography.Text type="secondary" style={{ fontSize: 10 }}>
            Unit price
          </Typography.Text>
          <InputNumber
            value={line.UnitPrice}
            onChange={(v) => onChange({ UnitPrice: Number(v ?? 0) })}
            min={0}
            precision={4}
            step={0.01}
            size="small"
            style={{ width: 110 }}
            disabled={locked}
          />
        </Flex>
        {canDiscount && (
          <Flex vertical gap={0}>
            <Typography.Text type="secondary" style={{ fontSize: 10 }}>
              Disc %
            </Typography.Text>
            <InputNumber
              value={line.Discount}
              onChange={(v) => onChange({ Discount: Number(v ?? 0) })}
              min={0}
              max={100}
              precision={2}
              size="small"
              style={{ width: 70 }}
              disabled={locked}
            />
          </Flex>
        )}
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
            style={{ width: 70 }}
            placeholder="—"
            disabled={locked}
          />
        </Flex>
        <Flex vertical gap={0} style={{ minWidth: 100 }}>
          <Typography.Text type="secondary" style={{ fontSize: 10 }}>
            Line total
          </Typography.Text>
          <Typography.Text strong>
            {formatMoney(lineTotal.toFixed(4))}
          </Typography.Text>
        </Flex>
      </Space>

      {!locked && (
        <Button
          type="text"
          danger
          size="small"
          icon={<Trash2 size={14} />}
          onClick={onRemove}
        />
      )}
    </Flex>
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