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
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import { Search as SearchIcon } from 'lucide-react';
import dayjs, { type Dayjs } from 'dayjs';
import { useLoyaltyTransactions } from '@/hooks/queries/useLoyalty';
import { useCustomersLookup } from '@/hooks/queries/useCustomersLookup';
import { formatDateTime } from '@/lib/format';
import type {
  LoyaltyTransactionRow,
  LoyaltyTransactionType,
  QueryLoyaltyTransactionParams,
} from '@/types/loyalty';

const { useBreakpoint } = Grid;
const { RangePicker } = DatePicker;
const DEFAULT_PAGE_SIZE = 20;

const TYPE_COLOR: Record<LoyaltyTransactionType, string> = {
  EARN: 'green',
  REDEEM: 'orange',
  ADJUST: 'blue',
  REVERSAL: 'red',
};

export function LoyaltyTransactionsTab() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [customerId, setCustomerId] = useState<string | undefined>();
  const [type, setType] = useState<LoyaltyTransactionType | undefined>();
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);

  const { data: customers = [] } = useCustomersLookup();

  const query: QueryLoyaltyTransactionParams = useMemo(
    () => ({
      page,
      limit,
      CustomerId: customerId,
      Type: type,
      From: range?.[0]?.startOf('day').toISOString(),
      To: range?.[1]?.endOf('day').toISOString(),
      sortBy: 'CreatedAt',
      sortOrder: 'desc',
    }),
    [page, limit, customerId, type, range],
  );

  const { data, isLoading, isFetching } = useLoyaltyTransactions(query);

  useEffect(() => {
    setPage(1);
  }, [customerId, type, range]);

  const resetFilters = () => {
    setCustomerId(undefined);
    setType(undefined);
    setRange(null);
    setPage(1);
  };

  const columns: ColumnsType<LoyaltyTransactionRow> = [
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
      title: 'Customer',
      key: 'customer',
      render: (_: unknown, row) => (
        <Flex vertical gap={2}>
          <Typography.Text>{row.Customer.Name}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {row.Customer.Code}
          </Typography.Text>
        </Flex>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'Type',
      key: 'Type',
      render: (t: LoyaltyTransactionType) => (
        <Tag color={TYPE_COLOR[t]} style={{ marginInlineEnd: 0 }}>
          {t}
        </Tag>
      ),
    },
    {
      title: 'Points',
      dataIndex: 'Points',
      key: 'Points',
      align: 'right',
      render: (v: number) => (
        <Typography.Text
          strong
          style={{ color: v > 0 ? '#16a34a' : '#dc2626' }}
        >
          {v > 0 ? '+' : ''}
          {v}
        </Typography.Text>
      ),
    },
    {
      title: 'Balance after',
      dataIndex: 'PointsAfter',
      key: 'PointsAfter',
      align: 'right',
      render: (v: number) => v.toLocaleString(),
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
  ];

  const handleTableChange: NonNullable<
    TableProps<LoyaltyTransactionRow>['onChange']
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
      <Card size="small" styles={{ body: { padding: isMobile ? 12 : 16 } }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={10}>
            <Select
              value={customerId}
              onChange={setCustomerId}
              placeholder="All customers"
              allowClear
              showSearch
              optionFilterProp="label"
              options={customers.map((c) => ({
                label: `${c.Name} (${c.Code})`,
                value: c.Id,
              }))}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} md={5}>
            <Select
              value={type}
              onChange={setType}
              placeholder="Type"
              allowClear
              options={[
                { label: 'Earn', value: 'EARN' },
                { label: 'Redeem', value: 'REDEEM' },
                { label: 'Adjust', value: 'ADJUST' },
                { label: 'Reversal', value: 'REVERSAL' },
              ]}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} md={9}>
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
        {isLoading ? (
          <Flex justify="center" style={{ padding: 48 }}>
            <Spin />
          </Flex>
        ) : !data?.data?.length ? (
          <Empty description="No loyalty transactions" style={{ padding: 32 }} />
        ) : isMobile ? (
          <>
            <Flex vertical gap={8} style={{ padding: 8 }}>
              {data.data.map((row) => (
                <Card
                  key={row.Id}
                  size="small"
                  styles={{ body: { padding: 10 } }}
                >
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
                      <Typography.Text ellipsis>
                        {row.Customer.Name}
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
                    <Flex vertical gap={2} align="flex-end">
                      <Typography.Text
                        strong
                        style={{
                          color: row.Points > 0 ? '#16a34a' : '#dc2626',
                        }}
                      >
                        {row.Points > 0 ? '+' : ''}
                        {row.Points}
                      </Typography.Text>
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 11 }}
                      >
                        bal {row.PointsAfter}
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
                total={data.meta.total}
                onChange={(p, ps) => {
                  setPage(p);
                  if (ps !== limit) setLimit(ps);
                }}
                simple
              />
            </Flex>
          </>
        ) : (
          <Table<LoyaltyTransactionRow>
            rowKey="Id"
            columns={columns}
            dataSource={data.data}
            loading={isFetching}
            onChange={handleTableChange}
            pagination={{
              current: page,
              pageSize: limit,
              total: data.meta.total,
              showSizeChanger: true,
              showTotal: (t, r) => `${r[0]}–${r[1]} of ${t}`,
            }}
            scroll={{ x: 'max-content' }}
          />
        )}
      </Card>
    </Flex>
  );
}