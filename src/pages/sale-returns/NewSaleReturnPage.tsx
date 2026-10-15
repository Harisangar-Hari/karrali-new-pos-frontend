import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Divider,
  Empty,
  Flex,
  Grid,
  Input,
  InputNumber,
  Radio,
  Skeleton,
  Space,
  Tag,
  Typography,
  App,
} from 'antd';
import {
  ArrowLeft,
  Search as SearchIcon,
  RotateCcw,
  Package,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Decimal from 'decimal.js';
import { useSales, useSale } from '@/hooks/queries/useSales';
import { useCreateSaleReturn } from '@/hooks/queries/useSaleReturns';
import { getErrorMessage } from '@/lib/api';
import { formatMoney, formatDateTime } from '@/lib/format';
import type { SaleItemRow, SaleListRow } from '@/types/sale';
import type { SaleReturnRefundMethod } from '@/types/saleReturn';

const { useBreakpoint } = Grid;

export function NewSaleReturnPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [saleId, setSaleId] = useState<string | null>(null);

  // ---- Step 1: pick a sale ----
  if (!saleId) {
    return (
      <SalePickerStep
        isMobile={isMobile}
        onPick={(id) => setSaleId(id)}
        onCancel={() => navigate('/sale-returns')}
      />
    );
  }

  // ---- Step 2: fill return form ----
  return (
    <ReturnFormStep
      saleId={saleId}
      isMobile={isMobile}
      onChangeSale={() => setSaleId(null)}
      onCancel={() => navigate('/sale-returns')}
      onSuccess={(code) => {
        message.success(`Return ${code} recorded`);
        navigate('/sale-returns');
      }}
    />
  );
}

// ============================================================
// Step 1 — sale picker
// ============================================================
function SalePickerStep({
  isMobile,
  onPick,
  onCancel,
}: {
  isMobile: boolean;
  onPick: (id: string) => void;
  onCancel: () => void;
}) {
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(input.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [input]);

  const { data, isLoading, isFetching } = useSales({
    search: search || undefined,
    limit: 20,
    sortBy: 'CreatedAt',
    sortOrder: 'desc',
  });

  // Hide non-returnable sales from the picker.
  const results = (data?.data ?? []).filter(
    (s) =>
      s.Status !== 'CANCELLED' &&
      s.Status !== 'FULLY_RETURNED',
  );

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
        <Flex align="center" gap={8}>
          <Button
            type="text"
            icon={<ArrowLeft size={16} />}
            onClick={onCancel}
          />
          <Typography.Title level={3} style={{ margin: 0 }}>
            New return — pick a sale
          </Typography.Title>
        </Flex>
      </Flex>

      <Card size="small" styles={{ body: { padding: isMobile ? 12 : 16 } }}>
        <Input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search by invoice number"
          prefix={<SearchIcon size={14} />}
          size="large"
          allowClear
        />
        <Typography.Text
          type="secondary"
          style={{ fontSize: 11, display: 'block', marginTop: 8 }}
        >
          Only completed or partially-returned sales are shown. Cancelled and
          fully-returned sales are hidden.
        </Typography.Text>
      </Card>

      <Card styles={{ body: { padding: results.length === 0 ? 24 : 0 } }}>
        {isLoading || (isFetching && results.length === 0) ? (
          <Flex justify="center" style={{ padding: 32 }}>
            <Skeleton active paragraph={{ rows: 4 }} />
          </Flex>
        ) : results.length === 0 ? (
          <Empty description="No returnable sales found" />
        ) : (
          <Flex vertical>
            {results.map((s) => (
              <SalePickerRow key={s.Id} sale={s} onPick={onPick} />
            ))}
          </Flex>
        )}
      </Card>
    </Flex>
  );
}

function SalePickerRow({
  sale,
  onPick,
}: {
  sale: SaleListRow;
  onPick: (id: string) => void;
}) {
  const remaining = new Decimal(sale.TotalAmount).sub(sale.RefundedAmount);

  return (
    <Flex
      align="center"
      gap={12}
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid #f0f0f0',
        cursor: 'pointer',
      }}
      onClick={() => onPick(sale.Id)}
      className="pos-product-row"
    >
      <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
        <Flex align="center" gap={6}>
          <Typography.Text strong>{sale.InvoiceNumber}</Typography.Text>
          {sale.Status === 'PARTIALLY_RETURNED' && (
            <Tag color="orange">Partly returned</Tag>
          )}
        </Flex>
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          {formatDateTime(sale.CreatedAt)} · {sale.Terminal.Code}
        </Typography.Text>
        {sale.Customer && (
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {sale.Customer.Name} ({sale.Customer.Code})
          </Typography.Text>
        )}
      </Flex>
      <Flex vertical gap={2} align="flex-end">
        <Typography.Text strong>{formatMoney(sale.TotalAmount)}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          Refundable: {formatMoney(remaining.toFixed(4))}
        </Typography.Text>
      </Flex>
    </Flex>
  );
}

// ============================================================
// Step 2 — return form
// ============================================================
function ReturnFormStep({
  saleId,
  isMobile,
  onChangeSale,
  onCancel,
  onSuccess,
}: {
  saleId: string;
  isMobile: boolean;
  onChangeSale: () => void;
  onCancel: () => void;
  onSuccess: (code: string) => void;
}) {
  const { message } = App.useApp();
  const { data: sale, isLoading } = useSale(saleId);
  const createMutation = useCreateSaleReturn();

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [refundMethod, setRefundMethod] =
    useState<SaleReturnRefundMethod>('CASH');
  const [notes, setNotes] = useState('');

  // Reset local state when the sale loads.
  useEffect(() => {
    setQuantities({});
    setRefundMethod('CASH');
    setNotes('');
  }, [saleId]);

  // Only lines with remaining returnable qty.
  const returnableItems = useMemo(() => {
    if (!sale) return [];
    return sale.Items.filter((i) => i.Qty - i.ReturnedQty > 0);
  }, [sale]);

  const hasCustomer = !!sale?.CustomerId;

  // Compute per-line and total refund, mirroring the backend formula:
  //   refund = (LineSubtotal + LineTax) × (returnQty / originalQty)
  const computed = useMemo(() => {
    if (!sale) {
      return { subtotal: '0', tax: '0', total: '0', lines: {} as Record<string, string> };
    }
    let subtotal = new Decimal(0);
    let tax = new Decimal(0);
    const lines: Record<string, string> = {};

    for (const item of sale.Items) {
      const qty = quantities[item.Id] ?? 0;
      if (qty <= 0) {
        lines[item.Id] = '0';
        continue;
      }
      const ratio = new Decimal(qty).div(item.Qty);

      // Use post-discount subtotal — the customer only ever paid the
      // amount AFTER the line discount was applied. Refund is proportional
      // to what they actually paid, not the list price.
      const lineSubAfterDiscount = new Decimal(item.LineSubtotal)
        .sub(item.LineDiscount)
        .mul(ratio)
        .toDecimalPlaces(4);
      const lineTax = new Decimal(item.LineTax)
        .mul(ratio)
        .toDecimalPlaces(4);
      const lineTotal = lineSubAfterDiscount.add(lineTax);

      lines[item.Id] = lineTotal.toFixed(4);
      subtotal = subtotal.add(lineSubAfterDiscount);
      tax = tax.add(lineTax);
    }

    return {
      subtotal: subtotal.toFixed(4),
      tax: tax.toFixed(4),
      total: subtotal.add(tax).toFixed(4),
      lines,
    };
  }, [sale, quantities]);

  const remainingRefundable = sale
    ? new Decimal(sale.TotalAmount).sub(sale.RefundedAmount)
    : new Decimal(0);
  const refundExceeds =
    new Decimal(computed.total).gt(remainingRefundable.add('0.0001'));

  const selectedCount = Object.values(quantities).filter((q) => q > 0).length;
  const canSubmit =
    !createMutation.isPending &&
    selectedCount > 0 &&
    !refundExceeds &&
    (refundMethod !== 'CREDIT' || hasCustomer);

  const handleSubmit = async () => {
    if (!sale) return;
    const items = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([saleItemId, qty]) => ({ SaleItemId: saleItemId, Qty: qty }));

    try {
      const result = await createMutation.mutateAsync({
        SaleId: sale.Id,
        RefundMethod: refundMethod,
        CustomerId:
          refundMethod === 'CREDIT' ? (sale.CustomerId ?? undefined) : undefined,
        Notes: notes || undefined,
        Items: items,
      });
      onSuccess(result.Code);
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  const setQty = (saleItemId: string, qty: number, max: number) => {
    const clamped = Math.max(0, Math.min(max, Math.floor(qty)));
    setQuantities((prev) => ({ ...prev, [saleItemId]: clamped }));
  };

  const setAllToMax = () => {
    if (!sale) return;
    const next: Record<string, number> = {};
    for (const item of returnableItems) {
      next[item.Id] = item.Qty - item.ReturnedQty;
    }
    setQuantities(next);
  };

  const clearAll = () => setQuantities({});

  if (isLoading || !sale) {
    return <Skeleton active paragraph={{ rows: 10 }} />;
  }

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
        <Flex align="center" gap={8}>
          <Button
            type="text"
            icon={<ArrowLeft size={16} />}
            onClick={onCancel}
          />
          <Flex vertical gap={0}>
            <Typography.Title
              level={3}
              style={{ margin: 0, fontSize: 'clamp(1.1rem, 3vw, 1.5rem)' }}
            >
              Return for {sale.InvoiceNumber}
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {formatDateTime(sale.CreatedAt)} · {sale.Terminal.Code}
              {sale.Customer ? ` · ${sale.Customer.Name}` : ' · Walk-in'}
            </Typography.Text>
          </Flex>
        </Flex>
        <Button size="small" onClick={onChangeSale}>
          Change sale
        </Button>
      </Flex>

      {/* Layout: items left, summary right */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 360px',
          gap: 16,
        }}
      >
        {/* Items */}
        <Card
          title={
            <Flex justify="space-between" align="center">
              <span>Items to return</span>
              <Space size={4}>
                <Button size="small" type="link" onClick={setAllToMax}>
                  All
                </Button>
                <Button size="small" type="link" onClick={clearAll}>
                  Clear
                </Button>
              </Space>
            </Flex>
          }
          styles={{ body: { padding: returnableItems.length === 0 ? 24 : 12 } }}
        >
          {returnableItems.length === 0 ? (
            <Empty
              image={
                <Package
                  size={40}
                  strokeWidth={1}
                  color="#94a3b8"
                  style={{ margin: '0 auto' }}
                />
              }
              imageStyle={{ height: 48 }}
              description="Nothing left to return on this sale"
            />
          ) : (
            <Flex vertical gap={8}>
              {sale.Items.map((item) => (
                <ReturnLine
                  key={item.Id}
                  item={item}
                  qty={quantities[item.Id] ?? 0}
                  lineRefund={computed.lines[item.Id] ?? '0'}
                  onChange={(q) =>
                    setQty(item.Id, q, item.Qty - item.ReturnedQty)
                  }
                />
              ))}
            </Flex>
          )}
        </Card>

        {/* Summary + refund method */}
        <Flex vertical gap={16}>
          <Card title="Refund method" styles={{ body: { padding: 16 } }}>
            <Radio.Group
              value={refundMethod}
              onChange={(e) => setRefundMethod(e.target.value)}
              style={{ width: '100%' }}
            >
              <Flex vertical gap={8}>
                <Radio value="CASH">
                  <Flex vertical gap={0}>
                    <span>Cash — from drawer</span>
                    <Typography.Text
                      type="secondary"
                      style={{ fontSize: 11 }}
                    >
                      Writes a negative cash ledger entry.
                    </Typography.Text>
                  </Flex>
                </Radio>
                <Radio value="CREDIT" disabled={!hasCustomer}>
                  <Flex vertical gap={0}>
                    <span>Store credit — reduce customer debt</span>
                    <Typography.Text
                      type="secondary"
                      style={{ fontSize: 11 }}
                    >
                      {hasCustomer
                        ? 'Customer balance is credited. May go negative (customer credit).'
                        : 'Requires a customer on the original sale.'}
                    </Typography.Text>
                  </Flex>
                </Radio>
              </Flex>
            </Radio.Group>
          </Card>

          <Card title="Refund summary" styles={{ body: { padding: 16 } }}>
            <Flex vertical gap={4}>
             <SummaryRow
                label="Subtotal (after discount)"
                value={formatMoney(computed.subtotal)}
              />
              <SummaryRow label="Tax" value={formatMoney(computed.tax)} />
              <Divider style={{ margin: '8px 0' }} />
              <Flex justify="space-between" align="center">
                <Typography.Text strong>Refund total</Typography.Text>
                <Typography.Text
                  strong
                  style={{ fontSize: 18, color: '#dc2626' }}
                >
                  − {formatMoney(computed.total)}
                </Typography.Text>
              </Flex>
              <Divider style={{ margin: '8px 0' }} />
              <SummaryRow
                label="Remaining refundable"
                value={formatMoney(remainingRefundable.toFixed(4))}
                subtle
              />
            </Flex>

            {refundExceeds && (
              <Alert
                type="error"
                showIcon
                message="Refund exceeds remaining refundable amount"
                style={{ marginTop: 12 }}
              />
            )}
            {refundMethod === 'CREDIT' && !hasCustomer && (
              <Alert
                type="warning"
                showIcon
                message="Credit refund requires a customer"
                style={{ marginTop: 12 }}
              />
            )}
          </Card>

          <Card styles={{ body: { padding: 16 } }}>
            <Typography.Text
              style={{ display: 'block', marginBottom: 4, fontSize: 13 }}
            >
              Notes
            </Typography.Text>
            <Input.TextArea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={1000}
              showCount
              placeholder="Optional"
            />
          </Card>

          <Flex gap={8} justify="flex-end">
            <Button onClick={onCancel} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button
              type="primary"
              icon={<RotateCcw size={14} />}
              disabled={!canSubmit}
              loading={createMutation.isPending}
              onClick={handleSubmit}
            >
              {isMobile ? 'Record return' : 'Record sale return'}
            </Button>
          </Flex>
        </Flex>
      </div>
    </Flex>
  );
}

function ReturnLine({
  item,
  qty,
  lineRefund,
  onChange,
}: {
  item: SaleItemRow;
  qty: number;
  lineRefund: string;
  onChange: (q: number) => void;
}) {
  const sold = item.Qty;
  const alreadyReturned = item.ReturnedQty;
  const remaining = sold - alreadyReturned;
  const hasSelection = qty > 0;

  return (
    <div
      style={{
        padding: 12,
        border: hasSelection ? '1px solid #99f6e4' : '1px solid #f0f0f0',
        borderRadius: 6,
        background: hasSelection ? '#f0fdfa' : '#fafafa',
      }}
    >
      <Flex justify="space-between" gap={8} align="flex-start">
        <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Typography.Text strong ellipsis>
            {item.Product.Name}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {item.Product.SKU ? `${item.Product.SKU} · ` : ''}
            Sold {sold} · Already returned {alreadyReturned} ·{' '}
            <span style={{ color: '#0d9488' }}>{remaining} remaining</span>
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            Unit price {formatMoney(item.UnitPrice)}
            {Number(item.Discount) > 0 ? ` · ${item.Discount}% off` : ''}
            {item.TaxRate ? ` · tax ${item.TaxRate}%` : ''}
          </Typography.Text>
        </Flex>
        <Flex vertical gap={4} align="flex-end" style={{ minWidth: 140 }}>
          <InputNumber
            value={qty}
            onChange={(v) => onChange(Number(v ?? 0))}
            min={0}
            max={remaining}
            precision={0}
            size="small"
            style={{ width: 90 }}
          />
          {hasSelection && (
            <Typography.Text style={{ fontSize: 11, color: '#dc2626' }}>
              − {formatMoney(lineRefund)}
            </Typography.Text>
          )}
        </Flex>
      </Flex>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  subtle,
}: {
  label: string;
  value: string;
  subtle?: boolean;
}) {
  return (
    <Flex justify="space-between">
      <Typography.Text
        type={subtle ? 'secondary' : undefined}
        style={{ fontSize: 12 }}
      >
        {label}
      </Typography.Text>
      <Typography.Text
        type={subtle ? 'secondary' : undefined}
        style={{ fontSize: 12 }}
      >
        {value}
      </Typography.Text>
    </Flex>
  );
}