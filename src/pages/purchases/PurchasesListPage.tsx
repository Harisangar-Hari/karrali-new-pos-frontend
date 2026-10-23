import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Flex,
  Grid,
  Input,
  Pagination,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,

} from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import {
  Plus,
  Search as SearchIcon,
  Eye,
  XCircle,
} from 'lucide-react';
import { type Dayjs } from 'dayjs';
import { Link } from 'react-router-dom';
import { usePurchases } from '@/hooks/queries/usePurchases';
import { useSuppliersLookup } from '@/hooks/queries/useSuppliersLookup';
import { useWarehousesLookup } from '@/hooks/queries/useLookups';
import { usePermission } from '@/hooks/usePermission';
import { PurchaseDetailDrawer } from './PurchaseDetailDrawer';
import { CancelPurchaseModal } from './CancelPurchaseModal';
import { formatMoney, formatDate } from '@/lib/format';
import type {
  PurchaseListRow,
  PurchaseSortField,
  PurchaseStatus,
  QueryPurchaseParams,
} from '@/types/purchase';

const { useBreakpoint } = Grid;
const { RangePicker } = DatePicker;
const DEFAULT_PAGE_SIZE = 20;

type PaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID';

/**
 * Derive the payment state from the cached columns. Anything within
 * 0.0001 of TotalAmount counts as fully paid — matches the backend's
 * Decimal(18,4) precision and avoids "0.0001 outstanding" noise.
 */
function paymentStatus(total: string, paid: string): PaymentStatus {
  const t = Number(total);
  const p = Number(paid);
  if (t <= 0) return 'PAID'; // free / zero-invoice — treat as settled
  if (p <= 0) return 'UNPAID';
  if (p >= t - 0.0001) return 'PAID';
  return 'PARTIAL';
}

const PAYMENT_COLOR: Record<PaymentStatus, string> = {
  PAID: 'green',
  PARTIAL: 'orange',
  UNPAID: 'red',
};

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  PAID: 'Paid',
  PARTIAL: 'Partial',
  UNPAID: 'Unpaid',
};

export function PurchasesListPage() {

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const canCreate = usePermission('purchases.create');
  const canCancel = usePermission('purchases.cancel');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [supplierId, setSupplierId] = useState<string | undefined>();
  const [warehouseId, setWarehouseId] = useState<string | undefined>();
  const [status, setStatus] = useState<PurchaseStatus | undefined>();
  const [paymentFilter, setPaymentFilter] = useState<
    'paid' | 'partial' | 'unpaid' | undefined
  >();
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<PurchaseSortField>('InvoiceDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query: QueryPurchaseParams = useMemo(
    () => ({
      page,
      limit,
      search: search || undefined,
      SupplierId: supplierId,
      WarehouseId: warehouseId,
      Status: status,
      paymentStatus: paymentFilter,
      From: range?.[0]?.startOf('day').toISOString(),
      To: range?.[1]?.endOf('day').toISOString(),
      sortBy,
      sortOrder,
    }),
    [
      page,
      limit,
      search,
      supplierId,
      warehouseId,
      status,
      paymentFilter,
      range,
      sortBy,
      sortOrder,
    ],
  );

  const { data, isLoading, isFetching } = usePurchases(query);
  const { data: suppliers = [] } = useSuppliersLookup();
  const { data: warehouses = [] } = useWarehousesLookup();

  const [detailId, setDetailId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<PurchaseListRow | null>(null);

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setSupplierId(undefined);
    setWarehouseId(undefined);
    setStatus(undefined);
    setPaymentFilter(undefined);
    setRange(null);
    setPage(1);
  };

  const columns: ColumnsType<PurchaseListRow> = useMemo(
    () => [
      {
        title: 'Code',
        dataIndex: 'Code',
        key: 'Code',
        render: (_: unknown, row) => (
          <Flex vertical gap={2}>
            <Typography.Text strong>{row.Code}</Typography.Text>
            {row.SupplierInvoiceNo && (
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                Inv {row.SupplierInvoiceNo}
              </Typography.Text>
            )}
          </Flex>
        ),
      },
      {
        title: 'Supplier',
        key: 'supplier',
        render: (_: unknown, row) => (
          <Flex vertical gap={2}>
            <Typography.Text>{row.Supplier.Name}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {row.Supplier.Code}
            </Typography.Text>
          </Flex>
        ),
      },
      {
        title: 'Invoice date',
        dataIndex: 'InvoiceDate',
        key: 'InvoiceDate',
        sorter: true,
        sortOrder:
          sortBy === 'InvoiceDate'
            ? sortOrder === 'asc'
              ? 'ascend'
              : 'descend'
            : null,
        render: (_: unknown, row) => (
          <Flex vertical gap={2}>
            <Typography.Text style={{ fontSize: 12 }}>
              {formatDate(row.InvoiceDate)}
            </Typography.Text>
            {row.DueDate && (
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                Due {formatDate(row.DueDate)}
              </Typography.Text>
            )}
          </Flex>
        ),
      },
      {
        title: 'Warehouse',
        key: 'warehouse',
        render: (_: unknown, row) => (
          <Typography.Text style={{ fontSize: 12 }}>
            {row.Warehouse.Name}
          </Typography.Text>
        ),
      },
      {
        title: 'Total',
        dataIndex: 'TotalAmount',
        key: 'TotalAmount',
        align: 'right',
        sorter: true,
        sortOrder:
          sortBy === 'TotalAmount'
            ? sortOrder === 'asc'
              ? 'ascend'
              : 'descend'
            : null,
        render: (v: string) => (
          <Typography.Text strong>{formatMoney(v)}</Typography.Text>
        ),
      },
      {
        title: 'Paid',
        key: 'paid',
        align: 'right',
        render: (_: unknown, row) => {
          const balance = Number(row.TotalAmount) - Number(row.PaidAmount);
          return (
            <Flex vertical gap={0} align="flex-end">
              <Typography.Text style={{ fontSize: 12 }}>
                {formatMoney(row.PaidAmount)}
              </Typography.Text>
              {balance > 0.0001 && (
                <Typography.Text style={{ fontSize: 10, color: '#dc2626' }}>
                  bal {formatMoney(balance.toFixed(4))}
                </Typography.Text>
              )}
            </Flex>
          );
        },
      },
      {
        title: 'Payment',
        key: 'payment',
        align: 'center',
        width: 90,
        render: (_: unknown, row) => {
          // Cancelled purchases don't have a "payment to chase" — show
          // the payment status greyed out so the row can't be mistaken
          // for an outstanding invoice.
          if (row.Status === 'CANCELLED') {
            return (
              <Tag color="default" style={{ marginInlineEnd: 0 }}>
                —
              </Tag>
            );
          }
          const status = paymentStatus(row.TotalAmount, row.PaidAmount);
          return (
            <Tag
              color={PAYMENT_COLOR[status]}
              style={{ marginInlineEnd: 0 }}
            >
              {PAYMENT_LABEL[status]}
            </Tag>
          );
        },
      },
      {
        title: 'Status',
        dataIndex: 'Status',
        key: 'Status',
        render: (s: PurchaseStatus) =>
          s === 'POSTED' ? (
            <Tag color="green">POSTED</Tag>
          ) : (
            <Tag>CANCELLED</Tag>
          ),
      },
      {
        title: 'Actions',
        key: 'actions',
        align: 'right',
        render: (_: unknown, row) => (
          <Space size={4}>
            <Button
              type="text"
              size="small"
              icon={<Eye size={14} />}
              onClick={() => setDetailId(row.Id)}
            />
            {canCancel && row.Status === 'POSTED' && (
              <Button
                type="text"
                size="small"
                danger
                icon={<XCircle size={14} />}
                onClick={() => setCancelTarget(row)}
              />
            )}
          </Space>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sortBy, sortOrder, canCancel],
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
      return <Empty description="No purchases yet" style={{ padding: 32 }} />;
    }
    return (
      <Flex vertical gap={8}>
        {data.data.map((row) => {
          const balance = Number(row.TotalAmount) - Number(row.PaidAmount);
          const payStatus = paymentStatus(row.TotalAmount, row.PaidAmount);
          const isCancelled = row.Status === 'CANCELLED';
          return (
            <Card
              key={row.Id}
              size="small"
              styles={{ body: { padding: 12 } }}
              onClick={() => setDetailId(row.Id)}
              style={{ cursor: 'pointer' }}
            >
              <Flex justify="space-between" gap={8} align="flex-start">
                <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                  <Flex align="center" gap={6} wrap="wrap">
                    <Typography.Text strong>{row.Code}</Typography.Text>
                    {isCancelled ? (
                      <Tag style={{ marginInlineEnd: 0 }}>CANCELLED</Tag>
                    ) : (
                      <Tag
                        color={PAYMENT_COLOR[payStatus]}
                        style={{ marginInlineEnd: 0 }}
                      >
                        {PAYMENT_LABEL[payStatus]}
                      </Tag>
                    )}
                  </Flex>
                  <Typography.Text style={{ fontSize: 12 }}>
                    {row.Supplier.Name}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    {formatDate(row.InvoiceDate)} · {row.Warehouse.Name}
                  </Typography.Text>
                  {balance > 0.0001 && !isCancelled && (
                    <Typography.Text
                      style={{ fontSize: 11, color: '#dc2626' }}
                    >
                      Balance {formatMoney(balance.toFixed(4))}
                    </Typography.Text>
                  )}
                  {isCancelled && (
                    <Typography.Text
                      type="secondary"
                      style={{ fontSize: 11 }}
                    >
                      Cancelled — no balance
                    </Typography.Text>
                  )}
                </Flex>
                <Flex vertical gap={6} align="flex-end">
                  <Typography.Text strong>
                    {formatMoney(row.TotalAmount)}
                  </Typography.Text>
                  {canCancel && row.Status === 'POSTED' && (
                    <Button
                      size="small"
                      danger
                      onClick={(e) => {
                        e.stopPropagation();
                        setCancelTarget(row);
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </Flex>
              </Flex>
            </Card>
          );
        })}
      </Flex>
    );
  };

  const handleTableChange: NonNullable<
    TableProps<PurchaseListRow>['onChange']
  > = (pagination, _filters, sorter) => {
    if (Array.isArray(sorter)) return;
    if (sorter.field && sorter.order) {
      setSortBy(sorter.field as PurchaseSortField);
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

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Purchases
        </Typography.Title>
        {canCreate && (
          <Link to="/purchases/new">
            <Button type="primary" icon={<Plus size={16} />}>
              {isMobile ? 'New' : 'New purchase'}
            </Button>
          </Link>
        )}
      </Flex>

      <Card size="small" styles={{ body: { padding: isMobile ? 12 : 16 } }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={7}>
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search code or supplier invoice"
              prefix={<SearchIcon size={14} />}
              allowClear
            />
          </Col>
          <Col xs={12} md={5}>
            <Select
              value={supplierId}
              onChange={(v) => {
                setSupplierId(v);
                setPage(1);
              }}
              placeholder="Supplier"
              allowClear
              showSearch
              optionFilterProp="label"
              options={suppliers.map((s) => ({
                label: `${s.Name} (${s.Code})`,
                value: s.Id,
              }))}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              value={warehouseId}
              onChange={(v) => {
                setWarehouseId(v);
                setPage(1);
              }}
              placeholder="Warehouse"
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
          <Col xs={12} md={3}>
            <Select
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
              placeholder="Status"
              allowClear
              options={[
                { label: 'Posted', value: 'POSTED' },
                { label: 'Cancelled', value: 'CANCELLED' },
              ]}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} md={5}>
            <Select
              value={paymentFilter}
              onChange={(v) => {
                setPaymentFilter(v);
                setPage(1);
              }}
              placeholder="Payment"
              allowClear
              options={[
                { label: 'Unpaid', value: 'unpaid' },
                { label: 'Partial', value: 'partial' },
                { label: 'Paid', value: 'paid' },
              ]}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={24}>
            <Flex align="center" justify="space-between" wrap="wrap" gap={8}>
              <RangePicker
                value={range}
                onChange={(v) =>
                  setRange(v && v[0] && v[1] ? [v[0], v[1]] : null)
                }
                style={{ minWidth: 260 }}
              />
              <Button type="link" size="small" onClick={resetFilters}>
                Reset filters
              </Button>
            </Flex>
          </Col>
        </Row>
      </Card>

      <Card styles={{ body: { padding: isMobile ? 8 : 0 } }}>
        {isMobile ? (
          renderMobileList()
        ) : (
          <Table<PurchaseListRow>
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

      <PurchaseDetailDrawer
        purchaseId={detailId}
        onClose={() => setDetailId(null)}
      />
      <CancelPurchaseModal
        open={!!cancelTarget}
        purchase={cancelTarget}
        onClose={() => setCancelTarget(null)}
      />
    </Flex>
  );
}