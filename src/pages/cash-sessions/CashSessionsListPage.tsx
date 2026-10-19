import {  useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Flex,
  Grid,
  Pagination,
  Row,
  Segmented,
  Select,
  Table,
  Tag,
  Typography,
  Empty,
  Spin,
  Tooltip,
} from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import {
 
  Eye,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import  { type Dayjs } from 'dayjs';
import { useCashSessions } from '@/hooks/queries/useCashSession';
import { useTerminalsLookup } from '@/hooks/queries/useTerminalsLookup';
import { CashSessionDetailDrawer } from './CashSessionDetailDrawer';
import { formatMoney, formatDateTime } from '@/lib/format';
import type {
  CashSessionRow,
  CashSessionSortField,
  CashSessionStatus,
  QueryCashSessionParams,
} from '@/types/cashSession';

const { useBreakpoint } = Grid;
const { RangePicker } = DatePicker;
const DEFAULT_PAGE_SIZE = 20;

export function CashSessionsListPage() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [status, setStatus] = useState<CashSessionStatus | undefined>();
  const [terminalId, setTerminalId] = useState<string | undefined>();
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<CashSessionSortField>('OpenedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const query: QueryCashSessionParams = useMemo(
    () => ({
      page,
      limit,
      Status: status,
      TerminalId: terminalId,
      From: range?.[0]?.startOf('day').toISOString(),
      To: range?.[1]?.endOf('day').toISOString(),
      sortBy,
      sortOrder,
    }),
    [page, limit, status, terminalId, range, sortBy, sortOrder],
  );

  const { data, isLoading, isFetching } = useCashSessions(query);
  const { data: terminals = [] } = useTerminalsLookup();

  const [detailId, setDetailId] = useState<string | null>(null);

  const resetFilters = () => {
    setStatus(undefined);
    setTerminalId(undefined);
    setRange(null);
    setPage(1);
  };

  const columns: ColumnsType<CashSessionRow> = useMemo(
    () => [
      {
        title: 'Terminal',
        dataIndex: ['Terminal', 'Name'],
        key: 'terminal',
        render: (_: unknown, row) => (
          <Flex vertical gap={2}>
            <Typography.Text strong>{row.Terminal.Name}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {row.Terminal.Code}
            </Typography.Text>
          </Flex>
        ),
      },
      {
        title: 'Cashier',
        dataIndex: ['Cashier', 'Username'],
        key: 'cashier',
        render: (_: unknown, row) => (
          <Typography.Text style={{ fontSize: 12 }}>
            {row.Cashier.FullName ?? row.Cashier.Username}
          </Typography.Text>
        ),
      },
      {
        title: 'Shift',
        key: 'shift',
        render: (_: unknown, row) => (
          <Flex vertical gap={2}>
            <Typography.Text style={{ fontSize: 12 }}>
              Opened {formatDateTime(row.OpenedAt)}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {row.ClosedAt
                ? `Closed ${formatDateTime(row.ClosedAt)}`
                : 'Still open'}
            </Typography.Text>
          </Flex>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'Status',
        key: 'Status',
        render: (s: CashSessionStatus) =>
          s === 'OPEN' ? (
            <Tag color="gold">OPEN</Tag>
          ) : (
            <Tag>CLOSED</Tag>
          ),
      },
      {
        title: 'Starting',
        dataIndex: 'StartingCash',
        key: 'StartingCash',
        align: 'right',
        render: (v: string) => (
          <Typography.Text style={{ fontSize: 12 }}>
            {formatMoney(v)}
          </Typography.Text>
        ),
      },
      {
        title: 'Expected',
        dataIndex: 'ExpectedCash',
        key: 'ExpectedCash',
        align: 'right',
        render: (v: string | null, row) =>
          row.Status === 'OPEN' ? (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              in progress
            </Typography.Text>
          ) : (
            <Typography.Text style={{ fontSize: 12 }}>
              {formatMoney(v ?? '0')}
            </Typography.Text>
          ),
      },
      {
        title: 'Counted',
        dataIndex: 'CountedCash',
        key: 'CountedCash',
        align: 'right',
        render: (v: string | null, row) =>
          row.Status === 'OPEN' ? (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              —
            </Typography.Text>
          ) : (
            <Typography.Text style={{ fontSize: 12 }}>
              {formatMoney(v ?? '0')}
            </Typography.Text>
          ),
      },
      {
        title: 'Difference',
        dataIndex: 'Difference',
        key: 'Difference',
        align: 'right',
        render: (v: string | null, row) => {
          if (row.Status === 'OPEN') {
            return (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                —
              </Typography.Text>
            );
          }
          if (v === null) return null;
          const n = Number(v);
          if (Math.abs(n) < 0.0001) {
            return (
              <Flex align="center" justify="flex-end" gap={4}>
                <CheckCircle2 size={12} color="#16a34a" />
                <Typography.Text
                  style={{ fontSize: 12, color: '#16a34a' }}
                >
                  Balanced
                </Typography.Text>
              </Flex>
            );
          }
          return (
            <Tooltip title={n < 0 ? 'Short' : 'Over'}>
              <Flex align="center" justify="flex-end" gap={4}>
                <AlertTriangle size={12} color="#dc2626" />
                <Typography.Text
                  strong
                  style={{ fontSize: 12, color: '#dc2626' }}
                >
                  {n < 0 ? '−' : '+'} {formatMoney(Math.abs(n).toFixed(4))}
                </Typography.Text>
              </Flex>
            </Tooltip>
          );
        },
      },
      {
        title: '',
        key: 'actions',
        align: 'right',
        render: (_: unknown, row) => (
          <Button
            type="text"
            size="small"
            icon={<Eye size={14} />}
            onClick={() => setDetailId(row.Id)}
          />
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
      return <Empty description="No cash sessions" style={{ padding: 32 }} />;
    }
    return (
      <Flex vertical gap={8}>
        {data.data.map((row) => {
          const diff =
            row.Difference === null ? null : Number(row.Difference);
          const hasDiff = diff !== null && Math.abs(diff) > 0.0001;
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
                  <Flex align="center" gap={6}>
                    <Typography.Text strong>
                      {row.Terminal.Name}
                    </Typography.Text>
                    <Tag
                      color={row.Status === 'OPEN' ? 'gold' : 'default'}
                      style={{ marginInlineEnd: 0 }}
                    >
                      {row.Status}
                    </Tag>
                  </Flex>
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    {row.Cashier.FullName ?? row.Cashier.Username}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    Opened {formatDateTime(row.OpenedAt)}
                  </Typography.Text>
                  {row.ClosedAt && (
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      Closed {formatDateTime(row.ClosedAt)}
                    </Typography.Text>
                  )}
                  {hasDiff && (
                    <Flex align="center" gap={4} style={{ marginTop: 4 }}>
                      <AlertTriangle size={11} color="#dc2626" />
                      <Typography.Text
                        style={{ fontSize: 11, color: '#dc2626' }}
                      >
                        {diff! < 0 ? 'Short' : 'Over'} by{' '}
                        {formatMoney(Math.abs(diff!).toFixed(4))}
                      </Typography.Text>
                    </Flex>
                  )}
                </Flex>
                <Flex vertical gap={2} align="flex-end">
                  <Typography.Text type="secondary" style={{ fontSize: 10 }}>
                    Expected
                  </Typography.Text>
                  <Typography.Text strong style={{ fontSize: 12 }}>
                    {row.Status === 'OPEN'
                      ? '—'
                      : formatMoney(row.ExpectedCash ?? '0')}
                  </Typography.Text>
                  {row.Status === 'CLOSED' && (
                    <>
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 10, marginTop: 4 }}
                      >
                        Counted
                      </Typography.Text>
                      <Typography.Text style={{ fontSize: 12 }}>
                        {formatMoney(row.CountedCash ?? '0')}
                      </Typography.Text>
                    </>
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
    TableProps<CashSessionRow>['onChange']
  > = (pagination, _filters, sorter) => {
    if (Array.isArray(sorter)) return;
    if (sorter.field && sorter.order) {
      setSortBy(sorter.field as CashSessionSortField);
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
          Cash sessions
        </Typography.Title>
      </Flex>

      <Card size="small" styles={{ body: { padding: isMobile ? 12 : 16 } }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={8}>
            <Segmented
              value={status ?? 'ALL'}
              onChange={(v) => {
                setStatus(v === 'ALL' ? undefined : (v as CashSessionStatus));
                setPage(1);
              }}
              block
              options={[
                { label: 'All', value: 'ALL' },
                { label: 'Open', value: 'OPEN' },
                { label: 'Closed', value: 'CLOSED' },
              ]}
            />
          </Col>
          <Col xs={24} md={8}>
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
          <Col xs={24} md={8}>
            <RangePicker
              value={range}
              onChange={(v) => setRange(v && v[0] && v[1] ? [v[0], v[1]] : null)}
              style={{ width: '100%' }}
              placeholder={['Opened from', 'Opened to']}
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
          <Table<CashSessionRow>
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

      <CashSessionDetailDrawer
        sessionId={detailId}
        onClose={() => setDetailId(null)}
      />
    </Flex>
  );
}