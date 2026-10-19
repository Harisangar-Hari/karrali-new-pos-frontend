import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Grid,
  Pagination,
  Row,
  Select,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import { Plus, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { useStockMovements } from '@/hooks/queries/useStock';
import { useProducts } from '@/hooks/queries/useProducts';
import { useWarehousesLookup } from '@/hooks/queries/useLookups';
import { usePermission } from '@/hooks/usePermission';
import { AdjustStockDrawer } from './AdjustStockDrawer';
import { formatQty, formatMoney, formatDateTime } from '@/lib/format';
import type {
  QueryStockMovementParams,
  StockMovementRow,
  StockMovementType,
} from '@/types/stock';

const { useBreakpoint } = Grid;
const DEFAULT_PAGE_SIZE = 50;

const TYPE_COLOR: Record<StockMovementType, string> = {
  OPENING: 'blue',
  PURCHASE: 'cyan',
  SALE: 'green',
  SALE_RETURN: 'orange',
  PURCHASE_RETURN: 'volcano',
  TRANSFER_IN: 'geekblue',
  TRANSFER_OUT: 'purple',
  ADJUSTMENT: 'magenta',
};

export function StockLedgerPage() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const canAdjust = usePermission('stock.adjust');

  const [productId, setProductId] = useState<string | undefined>();
  const [warehouseId, setWarehouseId] = useState<string | undefined>();
  const [type, setType] = useState<StockMovementType | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);

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

  const { data: warehouses = [] } = useWarehousesLookup();

  const query: QueryStockMovementParams = useMemo(
    () => ({
      page,
      limit,
      ProductId: productId,
      WarehouseId: warehouseId,
      Type: type,
    }),
    [page, limit, productId, warehouseId, type],
  );

  const { data, isLoading, isFetching } = useStockMovements(query);

  const [adjustOpen, setAdjustOpen] = useState(false);

  const productOptions = (productsPage?.data ?? []).map((p) => ({
    label: `${p.Name}${p.SKU ? ` (${p.SKU})` : ''}`,
    value: p.Id,
  }));

  const resetFilters = () => {
    setProductId(undefined);
    setWarehouseId(undefined);
    setType(undefined);
    setPage(1);
  };

  const columns: ColumnsType<StockMovementRow> = useMemo(
    () => [
      {
        title: 'When',
        dataIndex: 'CreatedAt',
        key: 'CreatedAt',
        width: 170,
        render: (v: string) => (
          <Typography.Text style={{ fontSize: 12 }}>
            {formatDateTime(v)}
          </Typography.Text>
        ),
      },
      {
        title: 'Product',
        key: 'product',
        render: (_: unknown, row) => (
          <Flex vertical gap={2}>
            <Typography.Text>{row.Product.Name}</Typography.Text>
            {row.Product.SKU && (
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                {row.Product.SKU}
              </Typography.Text>
            )}
          </Flex>
        ),
      },
      {
        title: 'Warehouse',
        key: 'warehouse',
        render: (_: unknown, row) => (
          <Flex vertical gap={2}>
            <Typography.Text style={{ fontSize: 12 }}>
              {row.Warehouse.Name}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {row.Warehouse.Code}
            </Typography.Text>
          </Flex>
        ),
      },
      {
        title: 'Type',
        dataIndex: 'Type',
        key: 'Type',
        width: 140,
        render: (t: StockMovementType) => (
          <Tag color={TYPE_COLOR[t]} style={{ marginInlineEnd: 0 }}>
            {t}
          </Tag>
        ),
      },
      {
        title: 'Qty',
        dataIndex: 'Quantity',
        key: 'Quantity',
        align: 'right',
        width: 100,
        render: (v: number) => (
          <Flex align="center" justify="flex-end" gap={4}>
            {v < 0 ? (
              <ArrowUpFromLine size={11} color="#dc2626" />
            ) : (
              <ArrowDownToLine size={11} color="#16a34a" />
            )}
            <Typography.Text
              strong
              style={{ color: v < 0 ? '#dc2626' : '#16a34a' }}
            >
              {v > 0 ? '+' : ''}
              {formatQty(v, 0)}
            </Typography.Text>
          </Flex>
        ),
      },
      {
        title: 'Unit cost',
        dataIndex: 'UnitCost',
        key: 'UnitCost',
        align: 'right',
        width: 120,
        render: (v: string | null) =>
          v ? (
            formatMoney(v)
          ) : (
            <Typography.Text type="secondary">—</Typography.Text>
          ),
      },
      {
        title: 'Notes',
        dataIndex: 'Notes',
        key: 'Notes',
        render: (v: string | null) =>
          v ? (
            <Typography.Text ellipsis style={{ fontSize: 12 }}>
              {v}
            </Typography.Text>
          ) : (
            <Typography.Text type="secondary">—</Typography.Text>
          ),
      },
    ],
    [],
  );

  const renderMobileList = () => {
    if (isLoading) {
      return (
        <Flex justify="center" style={{ padding: 48 }}>
          <Spin />
        </Flex>
      );
    }
    if (!data || data.data.length === 0) {
      return (
        <Empty description="No stock movements yet" style={{ padding: 32 }} />
      );
    }
    return (
      <Flex vertical gap={8}>
        {data.data.map((row) => (
          <Card key={row.Id} size="small" styles={{ body: { padding: 10 } }}>
            <Flex justify="space-between" gap={8} align="flex-start">
              <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                <Flex align="center" gap={6}>
                  <Tag
                    color={TYPE_COLOR[row.Type]}
                    style={{ marginInlineEnd: 0 }}
                  >
                    {row.Type}
                  </Tag>
                  <Typography.Text
                    type="secondary"
                    style={{ fontSize: 11 }}
                  >
                    {formatDateTime(row.CreatedAt)}
                  </Typography.Text>
                </Flex>
                <Typography.Text strong ellipsis>
                  {row.Product.Name}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  {row.Warehouse.Name}
                </Typography.Text>
                {row.Notes && (
                  <Typography.Text
                    type="secondary"
                    style={{ fontSize: 11 }}
                    ellipsis
                  >
                    {row.Notes}
                  </Typography.Text>
                )}
              </Flex>
              <Typography.Text
                strong
                style={{
                  color: row.Quantity < 0 ? '#dc2626' : '#16a34a',
                  whiteSpace: 'nowrap',
                }}
              >
                {row.Quantity > 0 ? '+' : ''}
                {row.Quantity}
              </Typography.Text>
            </Flex>
          </Card>
        ))}
      </Flex>
    );
  };

  const handleTableChange: NonNullable<
    TableProps<StockMovementRow>['onChange']
  > = (pagination) => {
    if (pagination.current && pagination.current !== page) {
      setPage(pagination.current);
    }
    if (pagination.pageSize && pagination.pageSize !== limit) {
      setLimit(pagination.pageSize);
      setPage(1);
    }
  };

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
        <Flex vertical gap={2}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Stock ledger
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Every stock movement across the business
          </Typography.Text>
        </Flex>
        {canAdjust && (
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => setAdjustOpen(true)}
          >
            {isMobile ? 'Adjust' : 'Adjust stock'}
          </Button>
        )}
      </Flex>

      <Card size="small" styles={{ body: { padding: isMobile ? 12 : 16 } }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={9}>
            <Select
              value={productId}
              onChange={(v) => {
                setProductId(v);
                setPage(1);
              }}
              placeholder="All products"
              allowClear
              showSearch
              filterOption={false}
              onSearch={setProductSearch}
              loading={productsFetching}
              options={productOptions}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} md={5}>
            <Select
              value={warehouseId}
              onChange={(v) => {
                setWarehouseId(v);
                setPage(1);
              }}
              placeholder="All warehouses"
              allowClear
              showSearch
              optionFilterProp="label"
              options={warehouses.map((w) => ({
                label: w.Name,
                value: w.Id,
              }))}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} md={5}>
            <Select
              value={type}
              onChange={(v) => {
                setType(v);
                setPage(1);
              }}
              placeholder="All types"
              allowClear
              options={[
                { label: 'Opening', value: 'OPENING' },
                { label: 'Purchase', value: 'PURCHASE' },
                { label: 'Sale', value: 'SALE' },
                { label: 'Sale return', value: 'SALE_RETURN' },
                { label: 'Purchase return', value: 'PURCHASE_RETURN' },
                { label: 'Transfer in', value: 'TRANSFER_IN' },
                { label: 'Transfer out', value: 'TRANSFER_OUT' },
                { label: 'Adjustment', value: 'ADJUSTMENT' },
              ]}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={5}>
            <Flex justify="flex-end">
              <Button type="link" size="small" onClick={resetFilters}>
                Reset
              </Button>
            </Flex>
          </Col>
        </Row>
      </Card>

      <Card styles={{ body: { padding: isMobile ? 8 : 0 } }}>
        {isMobile ? (
          renderMobileList()
        ) : (
          <Table<StockMovementRow>
            rowKey="Id"
            columns={columns}
            dataSource={data?.data ?? []}
            loading={isLoading || isFetching}
            onChange={handleTableChange}
            pagination={{
              current: page,
              pageSize: limit,
              total: data?.meta.total ?? 0,
              showSizeChanger: true,
              showTotal: (t, r) => `${r[0]}–${r[1]} of ${t}`,
            }}
            scroll={{ x: 'max-content' }}
            size="middle"
          />
        )}

        {isMobile && data && (
          <Flex justify="center" style={{ padding: 12 }}>
            <Pagination
              current={page}
              pageSize={limit}
              total={data.meta.total}
              onChange={(p, ps) => {
                setPage(p);
                if (ps !== limit) setLimit(ps);
              }}
              simple
            />
          </Flex>
        )}
      </Card>

      <AdjustStockDrawer
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
      />
    </Flex>
  );
}