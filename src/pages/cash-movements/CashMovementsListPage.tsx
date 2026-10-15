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
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  App,
  Empty,
  Spin,
  Tooltip,
} from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import {
  Plus,
  Search as SearchIcon,
  Trash2,
  ArrowDownToLine,
  ArrowUpFromLine,
  Landmark,
} from 'lucide-react';
import dayjs, { type Dayjs } from 'dayjs';
import {
  useCashMovements,
  useDeleteCashMovement,
} from '@/hooks/queries/useCashMovements';
import { useBankAccountsLookup } from '@/hooks/queries/useExpenseLookups';
import { usePermission } from '@/hooks/usePermission';
import { CreateCashMovementDrawer } from './CreateCashMovementDrawer';
import { DeleteCashMovementModal } from './DeleteCashMovementModal';
import { formatMoney, formatDateTime } from '@/lib/format';
import type {
  CashMovementRow,
  CashMovementSortField,
  CashMovementType,
  QueryCashMovementParams,
} from '@/types/cashMovement';

const { useBreakpoint } = Grid;
const { RangePicker } = DatePicker;
const DEFAULT_PAGE_SIZE = 20;

export function CashMovementsListPage() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const canCreate = usePermission('cash_movements.create');
  const canDelete = usePermission('cash_movements.delete');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState<CashMovementType | undefined>();
  const [bankAccountId, setBankAccountId] = useState<string | undefined>();
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<CashMovementSortField>('CreatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query: QueryCashMovementParams = useMemo(
    () => ({
      page,
      limit,
      search: search || undefined,
      Type: type,
      BankAccountId: bankAccountId,
      From: range?.[0]?.startOf('day').toISOString(),
      To: range?.[1]?.endOf('day').toISOString(),
      sortBy,
      sortOrder,
    }),
    [page, limit, search, type, bankAccountId, range, sortBy, sortOrder],
  );

  const { data, isLoading, isFetching } = useCashMovements(query);
  const { data: bankAccounts = [] } = useBankAccountsLookup();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CashMovementRow | null>(null);

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setType(undefined);
    setBankAccountId(undefined);
    setRange(null);
    setPage(1);
  };

  const columns: ColumnsType<CashMovementRow> = useMemo(
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
        title: 'Type',
        dataIndex: 'Type',
        key: 'Type',
        render: (t: CashMovementType) =>
          t === 'CASH_IN' ? (
            <Tag
              color="green"
              icon={<ArrowDownToLine size={11} />}
              style={{ marginInlineEnd: 0 }}
            >
              CASH IN
            </Tag>
          ) : (
            <Tag
              color="red"
              icon={<ArrowUpFromLine size={11} />}
              style={{ marginInlineEnd: 0 }}
            >
              CASH OUT
            </Tag>
          ),
      },
      {
        title: 'Amount',
        dataIndex: 'Amount',
        key: 'Amount',
        align: 'right',
        sorter: true,
        sortOrder:
          sortBy === 'Amount'
            ? sortOrder === 'asc'
              ? 'ascend'
              : 'descend'
            : null,
        render: (v: string, row) => (
          <Typography.Text
            strong
            style={{
              color: row.Type === 'CASH_IN' ? '#16a34a' : '#dc2626',
            }}
          >
            {row.Type === 'CASH_IN' ? '+' : '−'} {formatMoney(v)}
          </Typography.Text>
        ),
      },
      {
        title: 'Reason',
        dataIndex: 'Reason',
        key: 'Reason',
        render: (v: string, row) => (
          <Flex vertical gap={2}>
            <Typography.Text>{v}</Typography.Text>
            {row.Notes && (
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                {row.Notes}
              </Typography.Text>
            )}
          </Flex>
        ),
      },
      {
        title: 'Bank',
        key: 'bank',
        render: (_: unknown, row) =>
          row.BankAccount ? (
            <Flex vertical gap={2}>
              <Flex align="center" gap={4}>
                <Landmark size={11} color="#94a3b8" />
                <Typography.Text style={{ fontSize: 12 }}>
                  {row.BankAccount.Name}
                </Typography.Text>
              </Flex>
              {row.BankAccount.BankName && (
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  {row.BankAccount.BankName}
                </Typography.Text>
              )}
            </Flex>
          ) : (
            <Typography.Text type="secondary">—</Typography.Text>
          ),
      },
      {
        title: 'Session',
        key: 'session',
        render: (_: unknown, row) =>
          row.CashSession ? (
            <Tooltip title={`Opened ${formatDateTime(row.CashSession.OpenedAt)}`}>
              <Tag color={row.CashSession.Status === 'OPEN' ? 'gold' : 'default'}>
                {row.CashSession.Status}
              </Tag>
            </Tooltip>
          ) : (
            <Typography.Text type="secondary">—</Typography.Text>
          ),
      },
      {
        title: 'Actions',
        key: 'actions',
        align: 'right',
        render: (_: unknown, row) =>
          canDelete ? (
            <Button
              type="text"
              size="small"
              danger
              icon={<Trash2 size={14} />}
              onClick={() => setDeleteTarget(row)}
            />
          ) : null,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sortBy, sortOrder, canDelete],
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
      return <Empty description="No cash movements" style={{ padding: 32 }} />;
    }
    return (
      <Flex vertical gap={8}>
        {data.data.map((row) => (
          <Card key={row.Id} size="small" styles={{ body: { padding: 12 } }}>
            <Flex justify="space-between" gap={8} align="flex-start">
              <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                <Flex align="center" gap={6}>
                  <Typography.Text strong>{row.Code}</Typography.Text>
                  <Tag
                    color={row.Type === 'CASH_IN' ? 'green' : 'red'}
                    style={{ marginInlineEnd: 0 }}
                  >
                    {row.Type}
                  </Tag>
                </Flex>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  {formatDateTime(row.CreatedAt)}
                </Typography.Text>
                <Typography.Text>{row.Reason}</Typography.Text>
                {row.BankAccount && (
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    <Landmark
                      size={10}
                      style={{ display: 'inline', marginRight: 3 }}
                    />
                    {row.BankAccount.Name}
                  </Typography.Text>
                )}
              </Flex>
              <Flex vertical gap={4} align="flex-end">
                <Typography.Text
                  strong
                  style={{
                    color: row.Type === 'CASH_IN' ? '#16a34a' : '#dc2626',
                  }}
                >
                  {row.Type === 'CASH_IN' ? '+' : '−'} {formatMoney(row.Amount)}
                </Typography.Text>
                {canDelete && (
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<Trash2 size={14} />}
                    onClick={() => setDeleteTarget(row)}
                  />
                )}
              </Flex>
            </Flex>
          </Card>
        ))}
      </Flex>
    );
  };

  const handleTableChange: NonNullable<
    TableProps<CashMovementRow>['onChange']
  > = (pagination, _filters, sorter) => {
    if (Array.isArray(sorter)) return;
    if (sorter.field && sorter.order) {
      setSortBy(sorter.field as CashMovementSortField);
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
          Cash movements
        </Typography.Title>
        {canCreate && (
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => setCreateOpen(true)}
          >
            {isMobile ? 'New' : 'Record movement'}
          </Button>
        )}
      </Flex>

      <Card size="small" styles={{ body: { padding: isMobile ? 12 : 16 } }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={8}>
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search code, reason, notes"
              prefix={<SearchIcon size={14} />}
              allowClear
            />
          </Col>
          <Col xs={24} md={6}>
            <Segmented
              value={type ?? 'ALL'}
              onChange={(v) => {
                setType(v === 'ALL' ? undefined : (v as CashMovementType));
                setPage(1);
              }}
              block
              options={[
                { label: 'All', value: 'ALL' },
                { label: 'Cash In', value: 'CASH_IN' },
                { label: 'Cash Out', value: 'CASH_OUT' },
              ]}
            />
          </Col>
          <Col xs={24} md={5}>
            <Select
              value={bankAccountId}
              onChange={(v) => {
                setBankAccountId(v);
                setPage(1);
              }}
              placeholder="Bank account"
              allowClear
              showSearch
              optionFilterProp="label"
              options={bankAccounts.map((a) => ({
                label: a.Code ? `${a.Name} (${a.Code})` : a.Name,
                value: a.Id,
              }))}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={5}>
            <RangePicker
              value={range}
              onChange={(v) => setRange(v && v[0] && v[1] ? [v[0], v[1]] : null)}
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
          <Table<CashMovementRow>
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

      <CreateCashMovementDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      <DeleteCashMovementModal
        open={!!deleteTarget}
        movement={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </Flex>
  );
}