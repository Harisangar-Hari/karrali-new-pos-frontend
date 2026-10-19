import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Col,
  DatePicker,
  Empty,
  Flex,
  Grid,
 
  Pagination,
  Row,
  Select,
  Skeleton,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';

import  { type Dayjs } from 'dayjs';
import { ReportShell } from '@/components/reports/ReportShell';
import { KpiCard } from '@/components/reports/KpiCard';
import { useInventoryMovement } from '@/hooks/queries/useReports';
import { useProducts } from '@/hooks/queries/useProducts';
import { useWarehousesLookup } from '@/hooks/queries/useLookups';
import { formatMoney, formatDateTime } from '@/lib/format';
import type {
  InventoryMovementRow,
  StockMovementType,
} from '@/types/reports';

const { useBreakpoint } = Grid;
const { RangePicker } = DatePicker;

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

export function InventoryMovementPage() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [productInput, setProductInput] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productId, setProductId] = useState<string | undefined>();
  const [warehouseId, setWarehouseId] = useState<string | undefined>();
  const [type, setType] = useState<StockMovementType | undefined>();
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    const t = setTimeout(() => setProductSearch(productInput.trim()), 300);
    return () => clearTimeout(t);
  }, [productInput]);

  const { data: warehouses = [] } = useWarehousesLookup();
  const { data: productsPage } = useProducts({
    search: productSearch || undefined,
    limit: 20,
    IsActive: true,
  });

  const productOptions = (productsPage?.data ?? []).map((p) => ({
    label: `${p.Name}${p.SKU ? ` (${p.SKU})` : ''}`,
    value: p.Id,
  }));

  const params = useMemo(
    () => ({
      ProductId: productId,
      WarehouseId: warehouseId,
      Type: type,
      From: range?.[0]?.startOf('day').toISOString(),
      To: range?.[1]?.endOf('day').toISOString(),
      page,
      limit,
    }),
    [productId, warehouseId, type, range, page, limit],
  );

  const { data, isLoading, isFetching } = useInventoryMovement(params);

  const columns: ColumnsType<InventoryMovementRow> = [
    {
      title: 'When',
      dataIndex: 'CreatedAt',
      key: 'CreatedAt',
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
          <Typography.Text strong>{row.Product.Name}</Typography.Text>
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
      render: (t: StockMovementType) => (
        <Tag color={TYPE_COLOR[t] ?? 'default'}>{t}</Tag>
      ),
    },
    {
      title: 'Qty',
      dataIndex: 'Quantity',
      key: 'Quantity',
      align: 'right',
      render: (v: number) => (
        <Typography.Text
          strong
          style={{ color: v < 0 ? '#dc2626' : '#16a34a' }}
        >
          {v > 0 ? '+' : ''}
          {v.toLocaleString()}
        </Typography.Text>
      ),
    },
    {
      title: 'Unit cost',
      dataIndex: 'UnitCost',
      key: 'UnitCost',
      align: 'right',
      render: (v: string | null) =>
        v ? formatMoney(v) : <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Notes',
      dataIndex: 'Notes',
      key: 'Notes',
      render: (v: string | null) =>
        v ?? <Typography.Text type="secondary">—</Typography.Text>,
    },
  ];

  const handleTableChange: NonNullable<
    TableProps<InventoryMovementRow>['onChange']
  > = (pagination) => {
    if (pagination.current && pagination.current !== page) {
      setPage(pagination.current);
    }
    if (pagination.pageSize && pagination.pageSize !== limit) {
      setLimit(pagination.pageSize);
      setPage(1);
    }
  };

  const netChange = Number(data?.NetChange ?? 0);

  return (
    <ReportShell
      title="Inventory movement"
      subtitle="Every stock in/out event with full filters"
      printable
      filters={
        <Row gutter={[12, 12]}>
          <Col xs={24} md={8}>
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
              onSearch={setProductInput}
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
          <Col xs={24} md={6}>
            <RangePicker
              value={range}
              onChange={(v) =>
                setRange(v && v[0] && v[1] ? [v[0], v[1]] : null)
              }
              style={{ width: '100%' }}
            />
          </Col>
        </Row>
      }
    >
      {data && (
        <Row gutter={[12, 12]}>
          <Col xs={12} md={12}>
            <KpiCard
              label="Net quantity change"
              value={`${netChange > 0 ? '+' : ''}${netChange.toLocaleString()}`}
              valueColor={netChange < 0 ? '#dc2626' : '#16a34a'}
              strong
              hint="Across the full filtered set, not just this page"
            />
          </Col>
          <Col xs={12} md={12}>
            <KpiCard
              label="Total movements"
              value={data.Meta.total.toLocaleString()}
            />
          </Col>
        </Row>
      )}

      <Card styles={{ body: { padding: isMobile ? 8 : 0 } }}>
        {isLoading ? (
          <Flex justify="center" style={{ padding: 48 }}>
            <Skeleton active paragraph={{ rows: 6 }} />
          </Flex>
        ) : !data?.Rows?.length ? (
          <Empty description="No movements match these filters" style={{ padding: 32 }} />
        ) : isMobile ? (
          <>
            <Flex vertical gap={8} style={{ padding: 8 }}>
              {data.Rows.map((row) => (
                <Card
                  key={row.Id}
                  size="small"
                  styles={{ body: { padding: 10 } }}
                >
                  <Flex justify="space-between" gap={8} align="flex-start">
                    <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                      <Flex align="center" gap={6}>
                        <Tag
                          color={TYPE_COLOR[row.Type] ?? 'default'}
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
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 11 }}
                      >
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
            <Flex justify="center" style={{ padding: 12 }}>
              <Pagination
                current={page}
                pageSize={limit}
                total={data.Meta.total}
                onChange={(p, ps) => {
                  setPage(p);
                  if (ps !== limit) setLimit(ps);
                }}
                simple
              />
            </Flex>
          </>
        ) : (
          <Table<InventoryMovementRow>
            rowKey="Id"
            columns={columns}
            dataSource={data.Rows}
            loading={isFetching}
            onChange={handleTableChange}
            pagination={{
              current: page,
              pageSize: limit,
              total: data.Meta.total,
              showSizeChanger: true,
              showTotal: (t, r) => `${r[0]}–${r[1]} of ${t}`,
            }}
            scroll={{ x: 'max-content' }}
            size="middle"
          />
        )}
      </Card>
    </ReportShell>
  );
}