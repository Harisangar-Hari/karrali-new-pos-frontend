import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Flex,
  Grid,
  Input,
  Pagination,
  Row,
  Space,
  Table,
  Tag,
  Typography,
  App,
  Empty,
  Spin,
} from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import { Plus, Search as SearchIcon, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import dayjs, { type Dayjs } from 'dayjs';
import { useSaleReturns } from '@/hooks/queries/useSaleReturns';
import { usePermission } from '@/hooks/usePermission';
import { SaleReturnDetailDrawer } from './SaleReturnDetailDrawer';
import { formatMoney, formatDateTime } from '@/lib/format';
import type {
  QuerySaleReturnParams,
  SaleReturnListRow,
  SaleReturnRefundMethod,
  SaleReturnSortField,
} from '@/types/saleReturn';

const { useBreakpoint } = Grid;
const { RangePicker } = DatePicker;
const DEFAULT_PAGE_SIZE = 20;

const METHOD_COLOR: Record<SaleReturnRefundMethod, string> = {
  CASH: 'green',
  CREDIT: 'blue',
};

export function SaleReturnsListPage() {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const canCreate = usePermission('sale_returns.create');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<SaleReturnSortField>('CreatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query: QuerySaleReturnParams = useMemo(
    () => ({
      page,
      limit,
      search: search || undefined,
      From: range?.[0]?.startOf('day').toISOString(),
      To: range?.[1]?.endOf('day').toISOString(),
      sortBy,
      sortOrder,
    }),
    [page, limit, search, range, sortBy, sortOrder],
  );

  const { data, isLoading, isFetching } = useSaleReturns(query);

  const [detailId, setDetailId] = useState<string | null>(null);

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setRange(null);
    setPage(1);
  };

  const columns: ColumnsType<SaleReturnListRow> = useMemo(
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
        title: 'Original sale',
        dataIndex: ['Sale', 'InvoiceNumber'],
        key: 'sale',
        render: (_: unknown, row) => (
          <Flex vertical gap={2}>
            <Typography.Text>{row.Sale.InvoiceNumber}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              Total {formatMoney(row.Sale.TotalAmount)}
            </Typography.Text>
          </Flex>
        ),
      },
      {
        title: 'Customer',
        dataIndex: ['Customer', 'Name'],
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
        title: 'Refund to',
        dataIndex: 'RefundMethod',
        key: 'RefundMethod',
        render: (m: SaleReturnRefundMethod) => (
          <Tag color={METHOD_COLOR[m]}>{m}</Tag>
        ),
      },
      {
        title: 'Refund',
        dataIndex: 'RefundAmount',
        key: 'RefundAmount',
        align: 'right',
        sorter: true,
        sortOrder:
          sortBy === 'RefundAmount'
            ? sortOrder === 'asc'
              ? 'ascend'
              : 'descend'
            : null,
        render: (v: string) => (
          <Typography.Text strong style={{ color: '#dc2626' }}>
            − {formatMoney(v)}
          </Typography.Text>
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
      return <Empty description="No sale returns yet" style={{ padding: 32 }} />;
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
                <Typography.Text strong>{row.Code}</Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  {formatDateTime(row.CreatedAt)}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  Sale {row.Sale.InvoiceNumber}
                </Typography.Text>
                {row.Customer && (
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    {row.Customer.Name}
                  </Typography.Text>
                )}
                <Tag
                  color={METHOD_COLOR[row.RefundMethod]}
                  style={{ marginTop: 4, width: 'fit-content' }}
                >
                  {row.RefundMethod}
                </Tag>
              </Flex>
              <Typography.Text strong style={{ color: '#dc2626' }}>
                − {formatMoney(row.RefundAmount)}
              </Typography.Text>
            </Flex>
          </Card>
        ))}
      </Flex>
    );
  };

  const handleTableChange: NonNullable<TableProps<SaleReturnListRow>['onChange']> = (
    pagination,
    _filters,
    sorter,
  ) => {
    if (Array.isArray(sorter)) return;
    if (sorter.field && sorter.order) {
      setSortBy(sorter.field as SaleReturnSortField);
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
          Sale returns
        </Typography.Title>
        {canCreate && (
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => navigate('/sale-returns/new')}
          >
            {isMobile ? 'New' : 'New return'}
          </Button>
        )}
      </Flex>

      <Card size="small" styles={{ body: { padding: isMobile ? 12 : 16 } }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={10}>
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search return code or notes"
              prefix={<SearchIcon size={14} />}
              allowClear
            />
          </Col>
          <Col xs={24} md={10}>
            <RangePicker
              value={range}
              onChange={(v) =>
                setRange(v && v[0] && v[1] ? [v[0], v[1]] : null)
              }
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={4}>
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
          <Table<SaleReturnListRow>
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

      <SaleReturnDetailDrawer
        returnId={detailId}
        onClose={() => setDetailId(null)}
      />
    </Flex>
  );
}