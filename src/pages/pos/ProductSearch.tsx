import { useEffect, useRef, useState } from 'react';
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
} from 'antd';
import { Search as SearchIcon, Plus, Package, AlertTriangle } from 'lucide-react';
import { useProducts } from '@/hooks/queries/useProducts';
import { useProductStocks, pickWarehouseQty } from '@/hooks/queries/useProductStocks';
import { formatMoney } from '@/lib/format';
import { usePosCartStore } from '@/stores/posCartStore';
import type { ProductListRow } from '@/types/product';


interface Props {
  warehouseId: string | undefined;
}

export function ProductSearch({ warehouseId }: Props) {
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
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

  const results = data?.data ?? [];
  const productIds = results.map((p) => p.Id);
  const stockQueries = useProductStocks(productIds);

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
  }

  const handleEnter = () => {
    const top = results[0];
    if (top) handleAdd(top);
  };

  const showEmpty = !isLoading && !isFetching && search && results.length === 0;

  return (
    <Flex vertical gap={12} style={{ minHeight: 0 }}>
      <Input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onPressEnter={handleEnter}
        placeholder="Scan barcode or search name / SKU — press Enter to add top result"
        prefix={<SearchIcon size={16} />}
        size="large"
        allowClear
      />

      <Card
        styles={{ body: { padding: results.length === 0 ? 24 : 0 } }}
        style={{ flex: 1, minHeight: 240, overflow: 'auto' }}
      >
        {isLoading || (isFetching && results.length === 0) ? (
          <Flex justify="center" style={{ padding: 32 }}>
            <Spin />
          </Flex>
        ) : showEmpty ? (
          <Empty description={`No products match "${search}"`} />
        ) : results.length === 0 ? (
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
            {results.map((p, idx) => (
              <ProductResultRow
                key={p.Id}
                product={p}
                isFirst={idx === 0}
                stock={stockQueries[idx]?.data}
                stockLoading={stockQueries[idx]?.isLoading ?? false}
                warehouseId={warehouseId}
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
  stock,
  stockLoading,
  warehouseId,
  onAdd,
}: {
  product: ProductListRow;
  isFirst: boolean;
  stock: import('@/types/stock').ProductStockSummary | undefined;
  stockLoading: boolean;
  warehouseId: string | undefined;
  onAdd: (p: ProductListRow) => void;
}) {
  const qty = pickWarehouseQty(stock, warehouseId);
  const lowStock = qty !== null && qty <= product.ReorderLevel;
  const outOfStock = qty !== null && qty <= 0;

  const stockColor = outOfStock ? '#dc2626' : lowStock ? '#f59e0b' : '#16a34a';

  const discountPct = Number(product.Discount ?? 0);

  return (
    <Flex
      align="center"
      gap={12}
      style={{
        padding: '10px 14px',
        borderBottom: '1px solid #f0f0f0',
        cursor: 'pointer',
      }}
      onClick={() => onAdd(product)}
      className="pos-product-row"
    >
      {/* Left: name + identifiers */}
      <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
        <Flex align="center" gap={6}>
          <Typography.Text strong ellipsis>
            {product.Name}
          </Typography.Text>
          {isFirst && (
            <Tag color="cyan" style={{ marginInlineEnd: 0 }}>
              Enter
            </Tag>
          )}
          {outOfStock && (
            <Tooltip title="Out of stock in this terminal's warehouse">
              <AlertTriangle size={14} color="#dc2626" />
            </Tooltip>
          )}
        </Flex>
        <Flex gap={8} wrap="wrap">
          {product.SKU && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              SKU {product.SKU}
            </Typography.Text>
          )}
          {product.Barcode && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              · {product.Barcode}
            </Typography.Text>
          )}
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            · {product.Category.Name}
          </Typography.Text>
        </Flex>
      </Flex>

      {/* Right: numbers */}
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
            stockLoading
              ? '…'
              : qty === null
                ? '—'
                : qty.toLocaleString()
          }
          valueColor={stockColor}
        />
        <Stat
          label="Warranty"
          value={
            product.WarrantyMonths > 0
              ? `${product.WarrantyMonths} mo`
              : '—'
          }
          subtle
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