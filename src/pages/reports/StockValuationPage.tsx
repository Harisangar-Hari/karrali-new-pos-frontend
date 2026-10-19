import { useMemo, useState } from 'react';
import {
  Card,
  Col,
  Empty,
  Flex,
  Grid,
  Pagination,
  Row,
  Select,
  Skeleton,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import { AlertTriangle } from 'lucide-react';
import { ReportShell } from '@/components/reports/ReportShell';
import { KpiCard } from '@/components/reports/KpiCard';
import { useStockValuation } from '@/hooks/queries/useReports';
import {
  useCategoriesLookup,
  useWarehousesLookup,
} from '@/hooks/queries/useLookups';
import { formatMoney } from '@/lib/format';
import type { StockValuationRow } from '@/types/reports';

const { useBreakpoint } = Grid;

type SortField = 'Name' | 'Qty' | 'Value';

export function StockValuationPage() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [warehouseId, setWarehouseId] = useState<string | undefined>();
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [inStockOnly, setInStockOnly] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [sortBy, setSortBy] = useState<SortField>('Value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: warehouses = [] } = useWarehousesLookup();
  const { data: categories = [] } = useCategoriesLookup();

  const params = useMemo(
    () => ({
      WarehouseId: warehouseId,
      CategoryId: categoryId,
      InStockOnly: inStockOnly || undefined,
      page,
      limit,
      sortBy,
      sortOrder,
    }),
    [warehouseId, categoryId, inStockOnly, page, limit, sortBy, sortOrder],
  );

  const { data, isLoading, isFetching } = useStockValuation(params);

  const columns: ColumnsType<StockValuationRow> = [
    {
      title: 'Product',
      key: 'name',
      render: (_: unknown, row) => (
        <Flex vertical gap={2}>
          <Typography.Text strong>{row.Name}</Typography.Text>
          {row.SKU && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              SKU {row.SKU}
            </Typography.Text>
          )}
          {row.Barcode && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {row.Barcode}
            </Typography.Text>
          )}
        </Flex>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'CategoryName',
      key: 'CategoryName',
      render: (v: string) => (
        <Typography.Text style={{ fontSize: 12 }}>{v}</Typography.Text>
      ),
    },
    {
      title: 'Qty',
      dataIndex: 'Qty',
      key: 'Qty',
      align: 'right',
      sorter: true,
      sortOrder:
        sortBy === 'Qty' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : null,
      render: (v: number, row) => {
        const low = v <= row.ReorderLevel && v > 0;
        const zero = v === 0;
        return (
          <Flex align="center" justify="flex-end" gap={4}>
            {low && <AlertTriangle size={11} color="#f59e0b" />}
            <Typography.Text
              strong
              style={{
                color: zero ? '#dc2626' : low ? '#f59e0b' : undefined,
              }}
            >
              {v.toLocaleString()}
            </Typography.Text>
          </Flex>
        );
      },
    },
    {
      title: 'Cost',
      dataIndex: 'CostPrice',
      key: 'CostPrice',
      align: 'right',
      render: (v: string) => formatMoney(v),
    },
    {
      title: 'Sell price',
      dataIndex: 'SellingPrice',
      key: 'SellingPrice',
      align: 'right',
      render: (v: string) => formatMoney(v),
    },
    {
      title: 'Cost value',
      dataIndex: 'CostValue',
      key: 'CostValue',
      align: 'right',
      sorter: true,
      sortOrder:
        sortBy === 'Value'
          ? sortOrder === 'asc'
            ? 'ascend'
            : 'descend'
          : null,
      render: (v: string) => (
        <Typography.Text strong>{formatMoney(v)}</Typography.Text>
      ),
    },
    {
      title: 'Retail value',
      dataIndex: 'RetailValue',
      key: 'RetailValue',
      align: 'right',
      render: (v: string) => formatMoney(v),
    },
  ];

  const handleTableChange: NonNullable<
    TableProps<StockValuationRow>['onChange']
  > = (pagination, _filters, sorter) => {
    if (Array.isArray(sorter)) return;
    if (sorter.field && sorter.order) {
      setSortBy(sorter.field as SortField);
      setSortOrder(sorter.order === 'ascend' ? 'asc' : 'desc');
    }
    if (pagination.current && pagination.current !== page) {
      setPage(pagination.current);
    }
    if (pagination.pageSize && pagination.pageSize !== limit) {
      setLimit(pagination.pageSize);
      setPage(1);
    }
  };

  const potentialMargin = data
    ? (Number(data.TotalRetail) - Number(data.TotalCost)).toFixed(4)
    : '0';

  return (
    <ReportShell
      title="Stock valuation"
      subtitle="Qty on hand × current cost and retail price, per product"
      printable
      filters={
        <Row gutter={[12, 12]}>
          <Col xs={12} md={8}>
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
          <Col xs={12} md={8}>
            <Select
              value={categoryId}
              onChange={(v) => {
                setCategoryId(v);
                setPage(1);
              }}
              placeholder="All categories"
              allowClear
              showSearch
              optionFilterProp="label"
              options={categories.map((c) => ({
                label: c.Name,
                value: c.Id,
              }))}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={8}>
            <Flex align="center" gap={8}>
              <Switch
                size="small"
                checked={inStockOnly}
                onChange={(v) => {
                  setInStockOnly(v);
                  setPage(1);
                }}
              />
              <Typography.Text style={{ fontSize: 12 }}>
                In-stock only
              </Typography.Text>
            </Flex>
          </Col>
        </Row>
      }
    >
      {data && (
        <Row gutter={[12, 12]}>
          <Col xs={12} md={8}>
            <KpiCard
              label="Total cost value"
              value={formatMoney(data.TotalCost)}
              strong
              valueColor="#0d9488"
              hint={`${data.Meta.total} product${data.Meta.total === 1 ? '' : 's'}`}
            />
          </Col>
          <Col xs={12} md={8}>
            <KpiCard
              label="Total retail value"
              value={formatMoney(data.TotalRetail)}
            />
          </Col>
          <Col xs={24} md={8}>
            <KpiCard
              label="Potential margin"
              value={formatMoney(potentialMargin)}
              valueColor={
                Number(potentialMargin) < 0 ? '#dc2626' : '#16a34a'
              }
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
          <Empty description="No stock matches these filters" style={{ padding: 32 }} />
        ) : isMobile ? (
          <>
            <Flex vertical gap={8} style={{ padding: 8 }}>
              {data.Rows.map((row) => (
                <Card
                  key={row.ProductId}
                  size="small"
                  styles={{ body: { padding: 10 } }}
                >
                  <Flex justify="space-between" gap={8} align="flex-start">
                    <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                      <Typography.Text strong ellipsis>
                        {row.Name}
                      </Typography.Text>
                      {row.SKU && (
                        <Typography.Text
                          type="secondary"
                          style={{ fontSize: 11 }}
                        >
                          {row.SKU}
                        </Typography.Text>
                      )}
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 11 }}
                      >
                        {row.CategoryName}
                      </Typography.Text>
                      <Flex gap={6} wrap="wrap" style={{ marginTop: 4 }}>
                        <Tag color={row.Qty === 0 ? 'red' : 'cyan'}>
                          Qty {row.Qty}
                        </Tag>
                        <Tag>{formatMoney(row.CostPrice)} cost</Tag>
                        <Tag>{formatMoney(row.SellingPrice)} sell</Tag>
                      </Flex>
                    </Flex>
                    <Flex vertical gap={2} align="flex-end">
                      <Typography.Text strong style={{ color: '#0d9488' }}>
                        {formatMoney(row.CostValue)}
                      </Typography.Text>
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 11 }}
                      >
                        retail {formatMoney(row.RetailValue)}
                      </Typography.Text>
                    </Flex>
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
          <Table<StockValuationRow>
            rowKey="ProductId"
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