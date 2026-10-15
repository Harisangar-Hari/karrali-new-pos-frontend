import {
  Button,
  Card,
  Empty,
  Flex,
  Input,
  InputNumber,
  Typography,
  Grid,
  Popconfirm,
  Divider,
  Tooltip,
  Alert,
} from 'antd';
import { Trash2, Minus, Plus, AlertTriangle } from 'lucide-react';
import {
  usePosCartStore,
  computeCartTotals,
  effectiveLineDiscount,
  maxDiscountGiven,
  maxInvoiceDiscount,
} from '@/stores/posCartStore';
import { useProductStocks, pickWarehouseQty } from '@/hooks/queries/useProductStocks';
import { formatMoney } from '@/lib/format';

const { useBreakpoint } = Grid;

interface Props {
  onCheckout: (total: string) => void;
  canDiscount: boolean;
  warehouseId: string | undefined;
  disabled?: boolean;
}

export function CartPanel({
  onCheckout,
  canDiscount,
  warehouseId,
  disabled,
}: Props) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const lines = usePosCartStore((s) => s.lines);
  const updateQty = usePosCartStore((s) => s.updateQty);
  const updateDiscount = usePosCartStore((s) => s.updateDiscount);
  const removeLine = usePosCartStore((s) => s.removeLine);
  const notes = usePosCartStore((s) => s.notes);
  const setNotes = usePosCartStore((s) => s.setNotes);
  const invoiceDiscount = usePosCartStore((s) => s.invoiceDiscount);
  const setInvoiceDiscount = usePosCartStore((s) => s.setInvoiceDiscount);

  const totals = computeCartTotals(lines, invoiceDiscount);

  // Live stock for every cart line's product.
  const productIds = lines.map((l) => l.ProductId);
  const stockQueries = useProductStocks(productIds);

  const availableByProduct = new Map<string, number | null>();
  lines.forEach((line, idx) => {
    const summary = stockQueries[idx]?.data;
    const qty = warehouseId ? pickWarehouseQty(summary, warehouseId) : null;
    availableByProduct.set(line.ProductId, qty);
  });

  // Cap on invoice discount so no line goes below cost.
  const invoiceCap = canDiscount ? maxInvoiceDiscount(lines) : 0;

  // Any line whose current qty exceeds available stock?
  const hasOverQty = lines.some((line) => {
    const avail = availableByProduct.get(line.ProductId);
    return avail !== null && avail !== undefined && line.Qty > avail;
  });

  return (
    <Card
      styles={{
        body: { padding: 0, display: 'flex', flexDirection: 'column' },
      }}
      style={{ height: '100%', overflow: 'hidden' }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography.Text strong>Cart</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {lines.length} item{lines.length === 1 ? '' : 's'}
        </Typography.Text>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {lines.length === 0 ? (
          <Empty
            description="Cart is empty"
            style={{ marginTop: 32 }}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Flex vertical gap={8}>
            {lines.map((line) => {
              const lineTotal = computeCartTotals(
                [line],
                invoiceDiscount,
              ).total;
              const available = availableByProduct.get(line.ProductId);
              const overQty =
                available !== null &&
                available !== undefined &&
                line.Qty > available;

              // Max line discount given current invoice discount and cost floor.
              const lineDiscCap = canDiscount
                ? maxDiscountGiven(line.UnitPrice, line.CostPrice, invoiceDiscount)
                : 0;
              const belowCost = canDiscount && line.Discount > lineDiscCap;

              const effectivePct = effectiveLineDiscount(
                line,
                invoiceDiscount,
              );

              return (
                <div
                  key={line.ProductId}
                  style={{
                    padding: 10,
                    border: overQty || belowCost
                      ? '1px solid #fecaca'
                      : '1px solid #f0f0f0',
                    borderRadius: 6,
                    background:
                      overQty || belowCost ? '#fef2f2' : '#fafafa',
                  }}
                >
                  <Flex justify="space-between" gap={8} align="flex-start">
                    <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                      <Typography.Text strong ellipsis>
                        {line.Name}
                      </Typography.Text>
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 11 }}
                      >
                        {formatMoney(line.UnitPrice)} each
                        {effectivePct > 0 ? ` · −${effectivePct}%` : ''}
                      </Typography.Text>
                    </Flex>
                    <Popconfirm
                      title="Remove from cart?"
                      okText="Remove"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => removeLine(line.ProductId)}
                    >
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<Trash2 size={14} />}
                      />
                    </Popconfirm>
                  </Flex>

                  <Flex
                    justify="space-between"
                    align="center"
                    gap={8}
                    style={{ marginTop: 8 }}
                  >
                    <Flex align="center" gap={4}>
                      <Button
                        size="small"
                        icon={<Minus size={12} />}
                        onClick={() => updateQty(line.ProductId, line.Qty - 1)}
                      />
                      <Tooltip
                        title={
                          available === null
                            ? 'Stock unknown'
                            : `Available: ${available}`
                        }
                      >
                        <InputNumber
                          value={line.Qty}
                          onChange={(v) =>
                            updateQty(line.ProductId, Number(v ?? 1))
                          }
                          min={1}
                          max={
                            available === null || available === undefined
                              ? undefined
                              : available
                          }
                          precision={0}
                          size="small"
                          style={{
                            width: 72,
                            borderColor: overQty ? '#dc2626' : undefined,
                          }}
                          status={overQty ? 'error' : undefined}
                        />
                      </Tooltip>
                      <Button
                        size="small"
                        icon={<Plus size={12} />}
                        disabled={
                          available !== null &&
                          available !== undefined &&
                          line.Qty >= available
                        }
                        onClick={() => updateQty(line.ProductId, line.Qty + 1)}
                      />
                      {available !== null && available !== undefined && (
                        <Typography.Text
                          type="secondary"
                          style={{
                            fontSize: 11,
                            color: overQty ? '#dc2626' : undefined,
                          }}
                        >
                          / {available} in stock
                        </Typography.Text>
                      )}
                    </Flex>
                    <Typography.Text strong>
                      {formatMoney(lineTotal)}
                    </Typography.Text>
                  </Flex>

                  {overQty && (
                    <Flex
                      align="center"
                      gap={6}
                      style={{ marginTop: 6, color: '#dc2626' }}
                    >
                      <AlertTriangle size={12} />
                      <Typography.Text style={{ fontSize: 11 }}>
                        Qty exceeds available stock ({available}). Reduce to
                        continue.
                      </Typography.Text>
                    </Flex>
                  )}

                  {canDiscount && (
                    <Flex align="center" gap={6} style={{ marginTop: 8 }}>
                      <Tooltip
                        title={
                          lineDiscCap > 0
                            ? `Max ${lineDiscCap}% — cannot go below cost price (${formatMoney(line.CostPrice)})`
                            : Number(line.UnitPrice) <= Number(line.CostPrice)
                              ? 'Price is already at or below cost — no discount allowed'
                              : 'No discount headroom with current invoice discount'
                        }
                      >
                        <Typography.Text
                          type="secondary"
                          style={{ fontSize: 11 }}
                        >
                          Line disc. %
                        </Typography.Text>
                      </Tooltip>
                      <InputNumber
                        value={line.Discount}
                        onChange={(v) => {
                          const next = Number(v ?? 0);
                          if (next > lineDiscCap) {
                            updateDiscount(line.ProductId, lineDiscCap);
                          } else {
                            updateDiscount(line.ProductId, next);
                          }
                        }}
                        min={0}
                        max={lineDiscCap}
                        precision={2}
                        size="small"
                        style={{
                          width: 80,
                          borderColor: belowCost ? '#dc2626' : undefined,
                        }}
                        status={belowCost ? 'error' : undefined}
                      />
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 10 }}
                      >
                        max {lineDiscCap}%
                      </Typography.Text>
                    </Flex>
                  )}
                </div>
              );
            })}
          </Flex>
        )}
      </div>

      <div style={{ borderTop: '1px solid #f0f0f0', padding: 12 }}>
        <Input.TextArea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Sale notes (optional)"
          rows={2}
          maxLength={500}
        />

        {canDiscount && (
          <Flex align="center" gap={8} style={{ marginTop: 8 }} wrap="wrap">
            <Typography.Text style={{ fontSize: 12 }}>
              Invoice discount
            </Typography.Text>
            <Tooltip
              title={
                invoiceCap > 0
                  ? `Max ${invoiceCap}% — cannot push any line below cost`
                  : 'No headroom — one or more lines are already at cost'
              }
            >
              <InputNumber
                value={invoiceDiscount}
                onChange={(v) => {
                  const next = Number(v ?? 0);
                  if (next > invoiceCap) {
                    setInvoiceDiscount(invoiceCap);
                  } else {
                    setInvoiceDiscount(next);
                  }
                }}
                min={0}
                max={invoiceCap}
                precision={2}
                size="small"
                style={{ width: 80 }}
                addonAfter="%"
              />
            </Tooltip>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              max {invoiceCap}% · applied to all lines
            </Typography.Text>
          </Flex>
        )}

        <Divider style={{ margin: '12px 0' }} />

        <Flex vertical gap={4}>
          <Row label="Subtotal" value={formatMoney(totals.subtotal)} />
          {Number(totals.lineDiscountAmount) > 0 && (
            <Row
              label="Line discounts"
              value={`− ${formatMoney(totals.lineDiscountAmount)}`}
              valueColor="#16a34a"
            />
          )}
          {Number(totals.invoiceDiscountAmount) > 0 && (
            <Row
              label={`Invoice discount (${invoiceDiscount}%)`}
              value={`− ${formatMoney(totals.invoiceDiscountAmount)}`}
              valueColor="#16a34a"
            />
          )}
          {Number(totals.taxAmount) > 0 && (
            <Row label="Tax" value={formatMoney(totals.taxAmount)} />
          )}
          <Divider style={{ margin: '8px 0' }} />
          <Flex justify="space-between" align="center">
            <Typography.Text strong style={{ fontSize: 15 }}>
              Total
            </Typography.Text>
            <Typography.Text
              strong
              style={{ fontSize: isMobile ? 20 : 22, color: '#0d9488' }}
            >
              {formatMoney(totals.total)}
            </Typography.Text>
          </Flex>
        </Flex>

        {hasOverQty && (
          <Alert
            type="error"
            showIcon
            message="One or more lines exceed available stock"
            description="Reduce those quantities before checkout."
            style={{ marginTop: 12 }}
          />
        )}

        <Button
          type="primary"
          block
          size="large"
          disabled={disabled || lines.length === 0 || hasOverQty}
          onClick={() => onCheckout(totals.total)}
          style={{ marginTop: 12 }}
        >
          Take payment
        </Button>
      </div>
    </Card>
  );
}

function Row({
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