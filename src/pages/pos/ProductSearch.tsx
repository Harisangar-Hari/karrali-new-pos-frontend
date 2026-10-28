import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Card,
  Flex,
  Input,
  Tag,
  Typography,
  Empty,
  Spin,
  Button,
  Tooltip,
  Switch,
  Grid,
} from 'antd';
import {
  Search as SearchIcon,
  Plus,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { useProducts } from '@/hooks/queries/useProducts';
import {
  useProductStocks,
  pickWarehouseQty,
} from '@/hooks/queries/useProductStocks';
import { formatMoney } from '@/lib/format';
import { usePosCartStore } from '@/stores/posCartStore';
import type { ProductListRow } from '@/types/product';

const { useBreakpoint } = Grid;

interface Props {
  warehouseId: string | undefined;
  warehouseName?: string;
}

export function ProductSearch({ warehouseId, warehouseName }: Props) {
  const screens = useBreakpoint();

  // Card scroll behavior mirrors PosPage's layout decision (drawer < 992).
  // Drawer layout: card grows naturally (page scrolls).
  // 2-column: card scrolls internally.
  const isFlowLayout = !screens.lg;

  // Row density: compact row below 1600px. Only xxl gets the wide 4-stat
  // layout — that's the only width where the name column has room.
  const isCompactRow = !screens.xxl;

  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [inStockOnly, setInStockOnly] = useState(true);
  const inputRef = useRef<React.ComponentRef<typeof Input>>(null);
  const addLine = usePosCartStore((s) => s.addLine);

  useEffect(() => {
    const t = setTimeout(() => setSearch(input.trim()), 250);
    return () => clearTimeout(t);
  }, [input]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const { data, isLoading, isFetching } = useProducts({
    search: search || undefined,
    limit: 15,
    IsActive: true,
    sortBy: 'Name',
    sortOrder: 'asc',
  });

  const allResults = data?.data ?? [];
  const productIds = allResults.map((p) => p.Id);
  const stockQueries = useProductStocks(productIds);

  const stockByProduct = useMemo(() => {
    const map = new Map<string, number | null>();
    allResults.forEach((p, idx) => {
      const summary = stockQueries[idx]?.data;
      const qty = warehouseId ? pickWarehouseQty(summary, warehouseId) : null;
      map.set(p.Id, qty);
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allResults, stockQueries, warehouseId]);

  const visibleResults = useMemo(() => {
    if (!inStockOnly || !warehouseId) return allResults;
    return allResults.filter((p) => {
      const q = stockByProduct.get(p.Id);
      return q !== null && q !== undefined && q > 0;
    });
  }, [allResults, stockByProduct, inStockOnly, warehouseId]);

  const hiddenCount = allResults.length - visibleResults.length;

  const handleAdd = (p: ProductListRow) => {
    addLine({
      ProductId: p.Id,
      Name: p.Name,
      SKU: p.SKU,
      UnitPrice: p.Price,
      CostPrice: p.CostPrice,
      TaxRate: p.TaxRate !== null ? Number(p.TaxRate) : null,
      Discount: Number(p.Discount ?? 0),
    });
    setInput('');
    setSearch('');
    inputRef.current?.focus();
  };

  const handleEnter = () => {
    const top = visibleResults[0];
    if (top) handleAdd(top);
  };

  const showEmpty =
    !isLoading && !isFetching && search && visibleResults.length === 0;
  const showNoStockMatch =
    !isLoading &&
    !isFetching &&
    search &&
    allResults.length > 0 &&
    visibleResults.length === 0;

  return (
    <Flex vertical gap={isFlowLayout ? 8 : 12} style={{ minHeight: 0 }}>
      <Input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onPressEnter={handleEnter}
        placeholder={
          isFlowLayout
            ? 'Scan or search — Enter adds top result'
            : 'Scan barcode or search name / SKU — press Enter to add top result'
        }
        prefix={<SearchIcon size={16} />}
        size="large"
        allowClear
      />

      <Flex align="center" justify="space-between" wrap="wrap" gap={8}>
        <Flex align="center" gap={6}>
          <Switch
            size="small"
            checked={inStockOnly}
            onChange={setInStockOnly}
          />
          <Typography.Text style={{ fontSize: 12 }}>
            In-stock only
            {warehouseName ? ` — ${warehouseName}` : ''}
          </Typography.Text>
        </Flex>
        {inStockOnly && hiddenCount > 0 && (
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {hiddenCount} product{hiddenCount === 1 ? '' : 's'} hidden
          </Typography.Text>
        )}
      </Flex>

      <Card
        styles={{ body: { padding: visibleResults.length === 0 ? 24 : 0 } }}
        style={{
          flex: isFlowLayout ? 'none' : 1,
          minHeight: isFlowLayout ? 'auto' : 240,
          overflow: isFlowLayout ? 'visible' : 'auto',
        }}
      >
        {isLoading || (isFetching && allResults.length === 0) ? (
          <Flex justify="center" style={{ padding: 32 }}>
            <Spin />
          </Flex>
        ) : showNoStockMatch ? (
          <Empty
            description={
              <Flex vertical gap={4}>
                <span>No products with stock here</span>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {allResults.length} match "{search}" but none are stocked here.
                </Typography.Text>
              </Flex>
            }
          />
        ) : showEmpty ? (
          <Empty description={`No products match "${search}"`} />
        ) : visibleResults.length === 0 ? (
          <Empty
            image={
              <Package
                size={48}
                strokeWidth={1}
                color="#94a3b8"
                style={{ margin: '0 auto' }}
              />
            }
            imageStyle={{ height: 56 }}
            description="Start typing or scan a barcode"
          />
        ) : (
          <Flex vertical>
            {visibleResults.map((p, idx) => (
              <ProductResultRow
                key={p.Id}
                product={p}
                isFirst={idx === 0}
                qty={stockByProduct.get(p.Id) ?? null}
                stockLoading={
                  stockQueries[allResults.indexOf(p)]?.isLoading ?? false
                }
                isCompact={isCompactRow}
                onAdd={handleAdd}
              />
            ))}
          </Flex>
        )}
      </Card>
    </Flex>
  );
}

function ProductResultRow({
  product,
  isFirst,
  qty,
  stockLoading,
  isCompact,
  onAdd,
}: {
  product: ProductListRow;
  isFirst: boolean;
  qty: number | null;
  stockLoading: boolean;
  isCompact: boolean;
  onAdd: (p: ProductListRow) => void;
}) {
  const lowStock = qty !== null && qty <= product.ReorderLevel;
  const outOfStock = qty !== null && qty <= 0;
  const stockColor = outOfStock ? '#dc2626' : lowStock ? '#f59e0b' : '#16a34a';
  const discountPct = Number(product.Discount ?? 0);

  return (
    <Flex
      align="center"
      gap={isCompact ? 8 : 12}
      style={{
        padding: isCompact ? '10px 12px' : '10px 14px',
        borderBottom: '1px solid #f0f0f0',
        cursor: 'pointer',
        opacity: outOfStock ? 0.55 : 1,
      }}
      onClick={() => onAdd(product)}
      className="pos-product-row"
    >
      {/* Left: name + meta line */}
      <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
        <Flex align="center" gap={6}>
          <Typography.Text strong ellipsis style={{ fontSize: 13 }}>
            {product.Name}
          </Typography.Text>
          {isFirst && (
            <Tag color="cyan" style={{ marginInlineEnd: 0, fontSize: 10 }}>
              Enter
            </Tag>
          )}
          {outOfStock && (
            <Tooltip title="No stock in this terminal's warehouse">
              <AlertTriangle size={12} color="#dc2626" />
            </Tooltip>
          )}
        </Flex>
        <Flex gap={6} wrap="wrap">
          {product.SKU && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              SKU {product.SKU}
            </Typography.Text>
          )}
          {product.Barcode && !isCompact && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              · {product.Barcode}
            </Typography.Text>
          )}
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            · {product.Category.Name}
          </Typography.Text>
          {isCompact && (
            <>
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                · Cost {formatMoney(product.CostPrice)}
              </Typography.Text>
              {discountPct > 0 && (
                <Tag
                  color="green"
                  style={{
                    marginInlineEnd: 0,
                    fontSize: 10,
                    padding: '0 4px',
                    lineHeight: '16px',
                  }}
                >
                  −{discountPct.toFixed(0)}%
                </Tag>
              )}
            </>
          )}
        </Flex>
      </Flex>

      {/* Right: stats + add */}
      {isCompact ? (
        <Flex align="center" gap={6} style={{ flexShrink: 0 }}>
          <Flex vertical align="flex-end" gap={2}>
            <Typography.Text strong style={{ fontSize: 13 }}>
              {formatMoney(product.Price)}
            </Typography.Text>
            {stockLoading ? (
              <Typography.Text type="secondary" style={{ fontSize: 10 }}>
                …
              </Typography.Text>
            ) : (
              <Typography.Text
                style={{ fontSize: 10, color: stockColor, fontWeight: 600 }}
              >
                Stock {qty === null ? '—' : qty}
              </Typography.Text>
            )}
          </Flex>
          <Button
            type="primary"
            size="small"
            icon={<Plus size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              onAdd(product);
            }}
          >
            Add
          </Button>
        </Flex>
      ) : (
        <Flex
          gap={16}
          align="center"
          style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          <Stat label="Cost" value={formatMoney(product.CostPrice)} subtle />
          <Stat label="Price" value={formatMoney(product.Price)} />
          <Stat
            label="Disc"
            value={discountPct > 0 ? `${discountPct.toFixed(2)}%` : '—'}
            subtle
          />
          <Stat
            label="Stock"
            value={
              stockLoading ? '…' : qty === null ? '—' : qty.toLocaleString()
            }
            valueColor={stockColor}
          />
          <Button
            type="primary"
            size="small"
            icon={<Plus size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              onAdd(product);
            }}
          >
            Add
          </Button>
        </Flex>
      )}
    </Flex>
  );
}

function Stat({
  label,
  value,
  valueColor,
  subtle,
}: {
  label: string;
  value: string;
  valueColor?: string;
  subtle?: boolean;
}) {
  return (
    <Flex vertical align="flex-end" gap={0} style={{ minWidth: 60 }}>
      <Typography.Text
        type="secondary"
        style={{ fontSize: 10, lineHeight: 1.2 }}
      >
        {label}
      </Typography.Text>
      <Typography.Text
        style={{
          fontSize: subtle ? 12 : 13,
          fontWeight: subtle ? 400 : 600,
          color: valueColor,
          lineHeight: 1.3,
        }}
      >
        {value}
      </Typography.Text>
    </Flex>
  );
}