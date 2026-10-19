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
  Select,
  Table,
  Tag,
  Typography,
  
  Empty,
  Spin,
  Dropdown,
  Segmented,
} from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import {
  Plus,
  Search as SearchIcon,
  CheckCircle2,
  XCircle,
  Ban,
  ChevronDown,
  Layers,
} from 'lucide-react';
import dayjs, { type Dayjs } from 'dayjs';
import {
  useCustomerCheques,
} from '@/hooks/queries/useCustomerCheques';
import { useCustomersLookup } from '@/hooks/queries/useCustomersLookup';
import { usePermission } from '@/hooks/usePermission';
import { SingleChequeDrawer } from './SingleChequeDrawer';
import { BulkChequeDrawer } from './BulkChequeDrawer';
import {
  ChequeActionModal,
  type ChequeActionMode,
} from './ChequeActionModal';
import { formatMoney, formatDate } from '@/lib/format';
import type {
  CustomerChequeRow,
  CustomerChequeSortField,
  CustomerChequeStatus,
  QueryCustomerChequeParams,
} from '@/types/customerCheque';

const { useBreakpoint } = Grid;
const { RangePicker } = DatePicker;
const DEFAULT_PAGE_SIZE = 20;

const STATUS_COLOR: Record<CustomerChequeStatus, string> = {
  PENDING: 'gold',
  CLEARED: 'green',
  BOUNCED: 'red',
  VOIDED: 'default',
};

export function CustomerChequesListPage() {
  
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const canCreate = usePermission('customer_cheques.create');
  const canClear = usePermission('customer_cheques.clear');
  const canBounce = usePermission('customer_cheques.bounce');
  const canVoid = usePermission('customer_cheques.void');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [status, setStatus] = useState<CustomerChequeStatus | undefined>();
  const [bucket, setBucket] = useState<'all' | 'due-soon' | 'overdue'>('all');
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<CustomerChequeSortField>('DueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Bucket → date range mapping
  const bucketRange = useMemo<{ from?: string; to?: string }>(() => {
    if (bucket === 'overdue') {
      return { to: dayjs().endOf('day').toISOString() };
    }
    if (bucket === 'due-soon') {
      return {
        from: dayjs().startOf('day').toISOString(),
        to: dayjs().add(7, 'day').endOf('day').toISOString(),
      };
    }
    return {};
  }, [bucket]);

  const query: QueryCustomerChequeParams = useMemo(
    () => ({
      page,
      limit,
      search: search || undefined,
      CustomerId: customerId,
      Status: status,
      dueAfter: range?.[0]?.startOf('day').toISOString() ?? bucketRange.from,
      dueBefore: range?.[1]?.endOf('day').toISOString() ?? bucketRange.to,
      sortBy,
      sortOrder,
    }),
    [
      page,
      limit,
      search,
      customerId,
      status,
      range,
      bucketRange,
      sortBy,
      sortOrder,
    ],
  );

  const { data, isLoading, isFetching } = useCustomerCheques(query);
  const { data: customers = [] } = useCustomersLookup();

  const [singleOpen, setSingleOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState<{
    cheque: CustomerChequeRow;
    mode: ChequeActionMode;
  } | null>(null);

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setCustomerId(undefined);
    setStatus(undefined);
    setBucket('all');
    setRange(null);
    setPage(1);
  };

  const openAction = (cheque: CustomerChequeRow, mode: ChequeActionMode) => {
    setActionTarget({ cheque, mode });
  };

  const columns: ColumnsType<CustomerChequeRow> = useMemo(
    () => [
      {
        title: 'Cheque',
        dataIndex: 'ChequeNumber',
        key: 'ChequeNumber',
        render: (_: unknown, row) => {
          const overdue =
            row.Status === 'PENDING' && dayjs(row.DueDate).isBefore(dayjs(), 'day');
          return (
            <Flex vertical gap={2}>
              <Typography.Text strong>{row.ChequeNumber}</Typography.Text>
              <Typography.Text
                type="secondary"
                style={{ fontSize: 11 }}
              >
                {row.Code}
              </Typography.Text>
              <Typography.Text
                type="secondary"
                style={{
                  fontSize: 11,
                  color: overdue ? '#dc2626' : undefined,
                }}
              >
                Due {formatDate(row.DueDate)}
                {overdue ? ' · overdue' : ''}
              </Typography.Text>
            </Flex>
          );
        },
      },
      {
        title: 'Customer',
        dataIndex: ['Customer', 'Name'],
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
        title: 'Bank',
        key: 'bank',
        render: (_: unknown, row) =>
          row.BankName ? (
            <Flex vertical gap={2}>
              <Typography.Text style={{ fontSize: 12 }}>
                {row.BankName}
              </Typography.Text>
              {row.BankBranch && (
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  {row.BankBranch}
                </Typography.Text>
              )}
            </Flex>
          ) : (
            <Typography.Text type="secondary">—</Typography.Text>
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
        render: (v: string) => <Typography.Text strong>{formatMoney(v)}</Typography.Text>,
      },
      {
        title: 'Source',
        key: 'source',
        render: (_: unknown, row) => {
          if (row.Sale) {
            return (
              <Flex vertical gap={2}>
                <Typography.Text style={{ fontSize: 12 }}>
                  Sale {row.Sale.InvoiceNumber}
                </Typography.Text>
              </Flex>
            );
          }
          if (row.CreditPayment) {
            return (
              <Flex vertical gap={2}>
                <Typography.Text style={{ fontSize: 12 }}>
                  Credit payment {row.CreditPayment.Code}
                </Typography.Text>
              </Flex>
            );
          }
          return (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Standalone
            </Typography.Text>
          );
        },
      },
      {
        title: 'Status',
        dataIndex: 'Status',
        key: 'Status',
        render: (s: CustomerChequeStatus) => (
          <Tag color={STATUS_COLOR[s]}>{s}</Tag>
        ),
      },
      {
        title: 'Actions',
        key: 'actions',
        align: 'right',
        render: (_: unknown, row) => {
          if (row.Status !== 'PENDING') {
            return null;
          }
          const items = [];
          if (canClear) {
            items.push({
              key: 'clear',
              icon: <CheckCircle2 size={14} />,
              label: 'Mark cleared',
              onClick: () => openAction(row, 'clear'),
            });
          }
          if (canBounce) {
            items.push({
              key: 'bounce',
              icon: <XCircle size={14} />,
              label: 'Mark bounced',
              danger: true,
              onClick: () => openAction(row, 'bounce'),
            });
          }
          if (canVoid) {
            items.push({
              key: 'void',
              icon: <Ban size={14} />,
              label: 'Void',
              danger: true,
              onClick: () => openAction(row, 'void'),
            });
          }
          if (items.length === 0) return null;
          return (
            <Dropdown menu={{ items }} trigger={['click']}>
              <Button size="small">
                Actions <ChevronDown size={12} />
              </Button>
            </Dropdown>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sortBy, sortOrder, canClear, canBounce, canVoid],
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
      return <Empty description="No cheques" style={{ padding: 32 }} />;
    }
    return (
      <Flex vertical gap={8}>
        {data.data.map((row) => {
          const overdue =
            row.Status === 'PENDING' && dayjs(row.DueDate).isBefore(dayjs(), 'day');
          return (
            <Card key={row.Id} size="small" styles={{ body: { padding: 12 } }}>
              <Flex justify="space-between" gap={8} align="flex-start">
                <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                  <Flex align="center" gap={6}>
                    <Typography.Text strong>{row.ChequeNumber}</Typography.Text>
                    <Tag color={STATUS_COLOR[row.Status]}>{row.Status}</Tag>
                  </Flex>
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    {row.Code}
                  </Typography.Text>
                  <Typography.Text style={{ fontSize: 12 }}>
                    {row.Customer.Name}
                  </Typography.Text>
                  <Typography.Text
                    type="secondary"
                    style={{
                      fontSize: 11,
                      color: overdue ? '#dc2626' : undefined,
                    }}
                  >
                    Due {formatDate(row.DueDate)}
                    {overdue ? ' · overdue' : ''}
                  </Typography.Text>
                  {row.BankName && (
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      {row.BankName}
                    </Typography.Text>
                  )}
                </Flex>
                <Flex vertical gap={6} align="flex-end">
                  <Typography.Text strong>
                    {formatMoney(row.Amount)}
                  </Typography.Text>
                  {row.Status === 'PENDING' &&
                    (canClear || canBounce || canVoid) && (
                      <Dropdown
                        menu={{
                          items: [
                            ...(canClear
                              ? [
                                  {
                                    key: 'clear',
                                    icon: <CheckCircle2 size={14} />,
                                    label: 'Mark cleared',
                                    onClick: () => openAction(row, 'clear'),
                                  },
                                ]
                              : []),
                            ...(canBounce
                              ? [
                                  {
                                    key: 'bounce',
                                    icon: <XCircle size={14} />,
                                    label: 'Mark bounced',
                                    danger: true,
                                    onClick: () => openAction(row, 'bounce'),
                                  },
                                ]
                              : []),
                            ...(canVoid
                              ? [
                                  {
                                    key: 'void',
                                    icon: <Ban size={14} />,
                                    label: 'Void',
                                    danger: true,
                                    onClick: () => openAction(row, 'void'),
                                  },
                                ]
                              : []),
                          ],
                        }}
                        trigger={['click']}
                      >
                        <Button size="small">Actions</Button>
                      </Dropdown>
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
    TableProps<CustomerChequeRow>['onChange']
  > = (pagination, _filters, sorter) => {
    if (Array.isArray(sorter)) return;
    if (sorter.field && sorter.order) {
      setSortBy(sorter.field as CustomerChequeSortField);
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
          Customer cheques
        </Typography.Title>
        {canCreate && (
          <Dropdown
            menu={{
              items: [
                {
                  key: 'single',
                  label: 'Single cheque',
                  onClick: () => setSingleOpen(true),
                },
                {
                  key: 'bulk',
                  icon: <Layers size={14} />,
                  label: 'Bulk (batch of cheques)',
                  onClick: () => setBulkOpen(true),
                },
              ],
            }}
          >
            <Button type="primary" icon={<Plus size={16} />}>
              {isMobile ? 'New' : 'Record cheque'} <ChevronDown size={12} />
            </Button>
          </Dropdown>
        )}
      </Flex>

      <Card size="small" styles={{ body: { padding: isMobile ? 12 : 16 } }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={8}>
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cheque no, code, or bank"
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
                { label: 'Pending', value: 'PENDING' },
                { label: 'Cleared', value: 'CLEARED' },
                { label: 'Bounced', value: 'BOUNCED' },
                { label: 'Voided', value: 'VOIDED' },
              ]}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={7}>
            <RangePicker
              value={range}
              onChange={(v) => setRange(v && v[0] && v[1] ? [v[0], v[1]] : null)}
              style={{ width: '100%' }}
              placeholder={['Due from', 'Due to']}
            />
          </Col>
          <Col xs={24} md={24}>
            <Flex align="center" justify="space-between" wrap="wrap" gap={8}>
              <Segmented
                value={bucket}
                onChange={(v) => {
                  setBucket(v as typeof bucket);
                  setRange(null);
                  setPage(1);
                }}
                options={[
                  { label: 'All', value: 'all' },
                  { label: 'Overdue', value: 'overdue' },
                  { label: 'Due this week', value: 'due-soon' },
                ]}
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
          <Table<CustomerChequeRow>
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

      <SingleChequeDrawer
        open={singleOpen}
        onClose={() => setSingleOpen(false)}
      />
      <BulkChequeDrawer open={bulkOpen} onClose={() => setBulkOpen(false)} />
      <ChequeActionModal
        open={!!actionTarget}
        mode={actionTarget?.mode ?? 'clear'}
        cheque={actionTarget?.cheque ?? null}
        onClose={() => setActionTarget(null)}
      />
    </Flex>
  );
}