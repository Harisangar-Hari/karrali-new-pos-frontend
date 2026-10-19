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
  App,
} from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import {
  Search as SearchIcon,
  Eye,
  XCircle,
  Gift,
} from 'lucide-react';
import dayjs, { type Dayjs } from 'dayjs';
import { useSales } from '@/hooks/queries/useSales';
import { useCustomersLookup } from '@/hooks/queries/useCustomersLookup';
import { useTerminalsLookup } from '@/hooks/queries/useTerminalsLookup';
import { usePermission } from '@/hooks/usePermission';
import { SaleDetailDrawer } from './SaleDetailDrawer';
import { formatMoney, formatDateTime } from '@/lib/format';
import type {
  QuerySaleParams,
  SaleListRow,
  SaleStatus,
} from '@/types/sale';

const { useBreakpoint } = Grid;
const { RangePicker } = DatePicker;
const DEFAULT_PAGE_SIZE = 20;

const STATUS_COLOR: Record<SaleStatus, string> = {
  COMPLETED: 'green',
  PARTIALLY_RETURNED: 'orange',
  FULLY_RETURNED: 'purple',
  CANCELLED: 'default',
};

export function SalesListPage() {
  const { message } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const canVoid = usePermission('sales.void');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [terminalId, setTerminalId] = useState<string | undefined>();
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [status, setStatus] = useState<SaleStatus | undefined>();
  const [hasCredit, setHasCredit] = useState(false);
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<'CreatedAt' | 'TotalAmount'>(
    'CreatedAt',
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query: QuerySaleParams = useMemo(
    () => ({
      page,
      limit,
      search: search || undefined,
      TerminalId: terminalId,
      CustomerId: customerId,
      Status: status,
      hasCredit: hasCredit || undefined,
      From: range?.[0]?.startOf('day').toISOString(),
      To: range?.[1]?.endOf('day').toISOString(),
      sortBy,
      sortOrder,
    }),
    [
      page,
      limit,
      search,
      terminalId,
      customerId,
      status,
      hasCredit,
      range,
      sortBy,
      sortOrder,
    ],
  );

  const { data, isLoading, isFetching } = useSales(query);
  const { data: terminals = [] } = useTerminalsLookup();
  const { data: customers = [] } = useCustomersLookup();

  const [detailId, setDetailId] = useState<string | null>(null);

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setTerminalId(undefined);
    setCustomerId(undefined);
    setStatus(undefined);
    setHasCredit(false);
    setRange(null);
    setPage(1);
  };

  const columns: ColumnsType<SaleListRow> = useMemo(
    () => [
      {
        title: 'Invoice',
        dataIndex: 'InvoiceNumber',
        key: 'InvoiceNumber',
        render: (_: unknown, row) => (
          <Flex vertical gap={2}>
            <Typography.Text strong>{row.InvoiceNumber}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {formatDateTime(row.CreatedAt)}
            </Typography.Text>
          </Flex>
        ),
      },
      {
        title: 'Customer',
        key: 'customer',
        render: (_: unknown, row) =>
          row.Customer ? (
            <Flex vertical gap={2}>
              <Typography.Text>{row.Customer.Name}</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                {row.Customer.Code}
              </Typography.Text>
            </Flex>
          ) : (
            <Typography.Text type="secondary">Walk-in</Typography.Text>
          ),
      },
      {
        title: 'Terminal',
        key: 'terminal',
        render: (_: unknown, row) => (
          <Typography.Text style={{ fontSize: 12 }}>
            {row.Terminal.Code}
          </Typography.Text>
        ),
      },
      {
        title: 'Payment split',
        key: 'payments',
        render: (_: unknown, row) => (
          <Flex gap={4} wrap="wrap">
            {Number(row.CashAmount) > 0 && (
              <Tag color="green" style={{ marginInlineEnd: 0, fontSize: 10 }}>
                Cash {formatMoney(row.CashAmount)}
              </Tag>
            )}
            {Number(row.CardAmount) > 0 && (
              <Tag color="blue" style={{ marginInlineEnd: 0, fontSize: 10 }}>
                Card {formatMoney(row.CardAmount)}
              </Tag>
            )}
            {Number(row.CreditAmount) > 0 && (
              <Tag color="red" style={{ marginInlineEnd: 0, fontSize: 10 }}>
                Credit {formatMoney(row.CreditAmount)}
              </Tag>
            )}
            {Number(row.ChequeAmount) > 0 && (
              <Tag color="purple" style={{ marginInlineEnd: 0, fontSize: 10 }}>
                Cheque {formatMoney(row.ChequeAmount)}
              </Tag>
            )}
            {Number(row.LoyaltyDiscountAmount) > 0 && (
              <Tag
                icon={<Gift size={10} />}
                color="gold"
                style={{ marginInlineEnd: 0, fontSize: 10 }}
              >
                −{formatMoney(row.LoyaltyDiscountAmount)}
              </Tag>
            )}
          </Flex>
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
        title: 'Status',
        dataIndex: 'Status',
        key: 'Status',
        render: (s: SaleStatus) => (
          <Tag color={STATUS_COLOR[s]}>{s}</Tag>
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
          </Space>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sortBy, sortOrder],
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
      return <Empty description="No sales yet" style={{ padding: 32 }} />;
    }
    return (
      <Flex vertical gap={8}>
        {data.data.map((row) => (
          <Card
            key={row.Id}
            size="small"
            styles={{ body: { padding: 12 } }}
            onClick={() => setDetailId(row.Id)}
            style={{ cursor: 'pointer' }}
          >
            <Flex justify="space-between" gap={8} align="flex-start">
              <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                <Flex align="center" gap={6}>
                  <Typography.Text strong>
                    {row.InvoiceNumber}
                  </Typography.Text>
                  <Tag
                    color={STATUS_COLOR[row.Status]}
                    style={{ marginInlineEnd: 0 }}
                  >
                    {row.Status}
                  </Tag>
                </Flex>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  {formatDateTime(row.CreatedAt)}
                </Typography.Text>
                <Typography.Text style={{ fontSize: 12 }}>
                  {row.Customer ? row.Customer.Name : 'Walk-in customer'}
                </Typography.Text>
                <Flex gap={4} wrap="wrap" style={{ marginTop: 4 }}>
                  {Number(row.CashAmount) > 0 && (
                    <Tag
                      color="green"
                      style={{ marginInlineEnd: 0, fontSize: 10 }}
                    >
                      Cash
                    </Tag>
                  )}
                  {Number(row.CardAmount) > 0 && (
                    <Tag
                      color="blue"
                      style={{ marginInlineEnd: 0, fontSize: 10 }}
                    >
                      Card
                    </Tag>
                  )}
                  {Number(row.CreditAmount) > 0 && (
                    <Tag
                      color="red"
                      style={{ marginInlineEnd: 0, fontSize: 10 }}
                    >
                      Credit
                    </Tag>
                  )}
                  {Number(row.ChequeAmount) > 0 && (
                    <Tag
                      color="purple"
                      style={{ marginInlineEnd: 0, fontSize: 10 }}
                    >
                      Cheque
                    </Tag>
                  )}
                </Flex>
              </Flex>
              <Flex vertical gap={4} align="flex-end">
                <Typography.Text strong>
                  {formatMoney(row.TotalAmount)}
                </Typography.Text>
                {Number(row.RefundedAmount) > 0 && (
                  <Typography.Text style={{ fontSize: 11, color: '#dc2626' }}>
                    − {formatMoney(row.RefundedAmount)}
                  </Typography.Text>
                )}
              </Flex>
            </Flex>
          </Card>
        ))}
      </Flex>
    );
  };

  const handleTableChange: NonNullable<
    TableProps<SaleListRow>['onChange']
  > = (pagination, _filters, sorter) => {
    if (Array.isArray(sorter)) return;
    if (sorter.field && sorter.order) {
      setSortBy(sorter.field as 'CreatedAt' | 'TotalAmount');
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
          Sales
        </Typography.Title>
      </Flex>

      <Card size="small" styles={{ body: { padding: isMobile ? 12 : 16 } }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={8}>
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search invoice number or notes"
              prefix={<SearchIcon size={14} />}
              allowClear
            />
          </Col>
          <Col xs={12} md={5}>
            <Select
              value={terminalId}
              onChange={(v) => {
                setTerminalId(v);
                setPage(1);
              }}
              placeholder="Terminal"
              allowClear
              showSearch
              optionFilterProp="label"
              options={terminals.map((t) => ({
                label: t.Name,
                value: t.Id,
              }))}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} md={5}>
            <Select
              value={customerId}
              onChange={(v) => {
                setCustomerId(v);
                setPage(1);
              }}
              placeholder="Customer"
              allowClear
              showSearch
              optionFilterProp="label"
              options={customers.map((c) => ({
                label: `${c.Name} (${c.Code ?? ''})`.trim(),
                value: c.Id,
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
                { label: 'Completed', value: 'COMPLETED' },
                { label: 'Partly returned', value: 'PARTIALLY_RETURNED' },
                { label: 'Fully returned', value: 'FULLY_RETURNED' },
                { label: 'Cancelled', value: 'CANCELLED' },
              ]}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} md={3}>
            <Select
              value={hasCredit ? 'yes' : 'no'}
              onChange={(v) => {
                setHasCredit(v === 'yes');
                setPage(1);
              }}
              options={[
                { label: 'All sales', value: 'no' },
                { label: 'Credit only', value: 'yes' },
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
                style={{ minWidth: 280 }}
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
          <Table<SaleListRow>
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

      <SaleDetailDrawer
        saleId={detailId}
        onClose={() => setDetailId(null)}
      />
    </Flex>
  );
}