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
import { Plus, Search as SearchIcon, Eye } from 'lucide-react';
import dayjs, { type Dayjs } from 'dayjs';
import { Link } from 'react-router-dom';
import { useQuotations } from '@/hooks/queries/useQuotations';
import { useCustomersLookup } from '@/hooks/queries/useCustomersLookup';
import { usePermission } from '@/hooks/usePermission';
import { QuotationDetailDrawer } from './QuotationDetailDrawer';
import { formatMoney, formatDate, formatDateTime } from '@/lib/format';
import type {
  QuotationEffectiveStatus,
  QuotationListRow,
  QuotationSortField,
  QuotationStatus,
  QueryQuotationParams,
} from '@/types/quotation';

const { useBreakpoint } = Grid;
const { RangePicker } = DatePicker;
const DEFAULT_PAGE_SIZE = 20;

const STATUS_COLOR: Record<QuotationEffectiveStatus, string> = {
  DRAFT: 'default',
  SENT: 'blue',
  ACCEPTED: 'green',
  REJECTED: 'red',
  CANCELLED: 'default',
  CONVERTED: 'purple',
  EXPIRED: 'orange',
};

export function QuotationsListPage() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const canCreate = usePermission('quotations.create');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [status, setStatus] = useState<QuotationStatus | undefined>();
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<QuotationSortField>('CreatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query: QueryQuotationParams = useMemo(
    () => ({
      page,
      limit,
      search: search || undefined,
      CustomerId: customerId,
      Status: status,
      From: range?.[0]?.startOf('day').toISOString(),
      To: range?.[1]?.endOf('day').toISOString(),
      sortBy,
      sortOrder,
    }),
    [page, limit, search, customerId, status, range, sortBy, sortOrder],
  );

  const { data, isLoading, isFetching } = useQuotations(query);
  const { data: customers = [] } = useCustomersLookup();

  const [detailId, setDetailId] = useState<string | null>(null);

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setCustomerId(undefined);
    setStatus(undefined);
    setRange(null);
    setPage(1);
  };

  const columns: ColumnsType<QuotationListRow> = useMemo(
    () => [
      {
        title: 'Code',
        dataIndex: 'Code',
        key: 'Code',
        render: (_: unknown, row) => (
          <Flex vertical gap={2}>
            <Typography.Text strong>{row.Code}</Typography.Text>
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
        title: 'Valid until',
        dataIndex: 'ValidUntil',
        key: 'ValidUntil',
        sorter: true,
        sortOrder:
          sortBy === 'ValidUntil'
            ? sortOrder === 'asc'
              ? 'ascend'
              : 'descend'
            : null,
        render: (v: string | null) =>
          v ? (
            <Typography.Text style={{ fontSize: 12 }}>
              {formatDate(v)}
            </Typography.Text>
          ) : (
            <Typography.Text type="secondary">—</Typography.Text>
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
        dataIndex: 'EffectiveStatus',
        key: 'EffectiveStatus',
        render: (s: QuotationEffectiveStatus) => (
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
      return <Empty description="No quotations yet" style={{ padding: 32 }} />;
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
                  <Typography.Text strong>{row.Code}</Typography.Text>
                  <Tag
                    color={STATUS_COLOR[row.EffectiveStatus]}
                    style={{ marginInlineEnd: 0 }}
                  >
                    {row.EffectiveStatus}
                  </Tag>
                </Flex>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  {formatDateTime(row.CreatedAt)}
                </Typography.Text>
                <Typography.Text style={{ fontSize: 12 }}>
                  {row.Customer ? row.Customer.Name : 'Walk-in'}
                </Typography.Text>
                {row.ValidUntil && (
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    Valid until {formatDate(row.ValidUntil)}
                  </Typography.Text>
                )}
              </Flex>
              <Typography.Text strong>
                {formatMoney(row.TotalAmount)}
              </Typography.Text>
            </Flex>
          </Card>
        ))}
      </Flex>
    );
  };

  const handleTableChange: NonNullable<
    TableProps<QuotationListRow>['onChange']
  > = (pagination, _filters, sorter) => {
    if (Array.isArray(sorter)) return;
    if (sorter.field && sorter.order) {
      setSortBy(sorter.field as QuotationSortField);
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
          Quotations
        </Typography.Title>
        {canCreate && (
          <Link to="/quotations/new">
            <Button type="primary" icon={<Plus size={16} />}>
              {isMobile ? 'New' : 'New quotation'}
            </Button>
          </Link>
        )}
      </Flex>

      <Card size="small" styles={{ body: { padding: isMobile ? 12 : 16 } }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={8}>
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search code or notes"
              prefix={<SearchIcon size={14} />}
              allowClear
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
          <Col xs={12} md={4}>
            <Select
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
              placeholder="Status"
              allowClear
              options={[
                { label: 'Draft', value: 'DRAFT' },
                { label: 'Sent', value: 'SENT' },
                { label: 'Accepted', value: 'ACCEPTED' },
                { label: 'Rejected', value: 'REJECTED' },
                { label: 'Cancelled', value: 'CANCELLED' },
                { label: 'Converted', value: 'CONVERTED' },
              ]}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={7}>
            <RangePicker
              value={range}
              onChange={(v) =>
                setRange(v && v[0] && v[1] ? [v[0], v[1]] : null)
              }
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={24}>
            <Flex justify="flex-end">
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
          <Table<QuotationListRow>
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

      <QuotationDetailDrawer
        quotationId={detailId}
        onClose={() => setDetailId(null)}
      />
    </Flex>
  );
}