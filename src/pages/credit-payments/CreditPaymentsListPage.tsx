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
  Space,
  Switch,
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
  RotateCcw,
  Undo2,
} from 'lucide-react';
import dayjs, { type Dayjs } from 'dayjs';
import {
  useCreditPayments,
  useReverseCreditPayment, // not used here, but the reverse modal handles it
} from '@/hooks/queries/useCreditPayments';
import { useCustomersLookup } from '@/hooks/queries/useCustomersLookup';
import { usePermission } from '@/hooks/usePermission';
import { ReverseCreditPaymentModal } from './ReverseCreditPaymentModal';
import { CustomerPaymentPickerDrawer } from './CustomerPaymentPickerDrawer';
import { formatMoney, formatDateTime } from '@/lib/format';
import type {
  CreditPaymentMethod,
  CreditPaymentRow,
  CreditPaymentSortField,
  QueryCreditPaymentParams,
} from '@/types/creditPayment';

const { useBreakpoint } = Grid;
const { RangePicker } = DatePicker;
const DEFAULT_PAGE_SIZE = 20;

const METHOD_COLOR: Record<CreditPaymentMethod, string> = {
  CASH: 'green',
  CHEQUE: 'blue',
};

export function CreditPaymentsListPage() {
  const { modal } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const canCreate = usePermission('credit_payments.create');
  const canReverse = usePermission('credit_payments.reverse');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [method, setMethod] = useState<CreditPaymentMethod | undefined>();
  const [excludeReversed, setExcludeReversed] = useState(false);
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<CreditPaymentSortField>('PaidAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query: QueryCreditPaymentParams = useMemo(
    () => ({
      page,
      limit,
      search: search || undefined,
      CustomerId: customerId,
      Method: method,
      excludeReversed: excludeReversed || undefined,
      From: range?.[0]?.startOf('day').toISOString(),
      To: range?.[1]?.endOf('day').toISOString(),
      sortBy,
      sortOrder,
    }),
    [page, limit, search, customerId, method, excludeReversed, range, sortBy, sortOrder],
  );

  const { data, isLoading, isFetching } = useCreditPayments(query);
  const { data: customers = [] } = useCustomersLookup();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [reverseTarget, setReverseTarget] = useState<CreditPaymentRow | null>(
    null,
  );

  const confirmReverse = (row: CreditPaymentRow) => {
    if (row.Method !== 'CASH') {
      modal.warning({
        title: 'Cannot reverse cheque payments',
        content:
          'Cheque-sourced payments must be handled via the cheque itself — bounce or void it from Customer Cheques.',
      });
      return;
    }
    setReverseTarget(row);
  };

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setCustomerId(undefined);
    setMethod(undefined);
    setExcludeReversed(false);
    setRange(null);
    setPage(1);
  };

  const columns: ColumnsType<CreditPaymentRow> = useMemo(
    () => [
      {
        title: 'Code',
        dataIndex: 'Code',
        key: 'Code',
        render: (_: unknown, row) => (
          <Flex vertical gap={2}>
            <Flex align="center" gap={4}>
              <Typography.Text strong>{row.Code}</Typography.Text>
              {row.ReversedAt && <Tag color="red">Reversed</Tag>}
            </Flex>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {formatDateTime(row.PaidAt)}
            </Typography.Text>
          </Flex>
        ),
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
        title: 'Method',
        dataIndex: 'Method',
        key: 'Method',
        render: (m: CreditPaymentMethod, row) => (
          <Flex vertical gap={2}>
            <Tag color={METHOD_COLOR[m]}>{m}</Tag>
            {row.Cheque && (
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                {row.Cheque.ChequeNumber} · {row.Cheque.Status}
              </Typography.Text>
            )}
          </Flex>
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
            delete={!!row.ReversedAt}
            style={{ color: row.ReversedAt ? undefined : '#16a34a' }}
          >
            + {formatMoney(v)}
          </Typography.Text>
        ),
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
      {
        title: 'Actions',
        key: 'actions',
        align: 'right',
        render: (_: unknown, row) =>
          canReverse && !row.ReversedAt ? (
            <Tooltip
              title={
                row.Method !== 'CASH'
                  ? 'Bounce or void the cheque instead'
                  : 'Reverse this payment'
              }
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<Undo2 size={14} />}
                disabled={row.Method !== 'CASH'}
                onClick={() => confirmReverse(row)}
              />
            </Tooltip>
          ) : null,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sortBy, sortOrder, canReverse],
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
      return <Empty description="No credit payments yet" style={{ padding: 32 }} />;
    }
    return (
      <Flex vertical gap={8}>
        {data.data.map((row) => (
          <Card key={row.Id} size="small" styles={{ body: { padding: 12 } }}>
            <Flex justify="space-between" gap={8} align="flex-start">
              <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                <Flex align="center" gap={6}>
                  <Typography.Text strong>{row.Code}</Typography.Text>
                  {row.ReversedAt && <Tag color="red">Reversed</Tag>}
                </Flex>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  {formatDateTime(row.PaidAt)}
                </Typography.Text>
                <Typography.Text style={{ fontSize: 12 }}>
                  {row.Customer.Name} ({row.Customer.Code})
                </Typography.Text>
                <Flex gap={6} wrap="wrap" style={{ marginTop: 4 }}>
                  <Tag color={METHOD_COLOR[row.Method]}>{row.Method}</Tag>
                  {row.Cheque && (
                    <Tag>
                      {row.Cheque.ChequeNumber} · {row.Cheque.Status}
                    </Tag>
                  )}
                </Flex>
              </Flex>
              <Flex vertical gap={4} align="flex-end">
                <Typography.Text
                  strong
                  delete={!!row.ReversedAt}
                  style={{ color: row.ReversedAt ? undefined : '#16a34a' }}
                >
                  + {formatMoney(row.Amount)}
                </Typography.Text>
                {canReverse && !row.ReversedAt && row.Method === 'CASH' && (
                  <Button
                    size="small"
                    danger
                    icon={<RotateCcw size={12} />}
                    onClick={() => confirmReverse(row)}
                  >
                    Reverse
                  </Button>
                )}
              </Flex>
            </Flex>
          </Card>
        ))}
      </Flex>
    );
  };

  const handleTableChange: NonNullable<
    TableProps<CreditPaymentRow>['onChange']
  > = (pagination, _filters, sorter) => {
    if (Array.isArray(sorter)) return;
    if (sorter.field && sorter.order) {
      setSortBy(sorter.field as CreditPaymentSortField);
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
          Credit payments
        </Typography.Title>
        {canCreate && (
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => setPickerOpen(true)}
          >
            {isMobile ? 'New' : 'Record payment'}
          </Button>
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
              value={method}
              onChange={(v) => {
                setMethod(v);
                setPage(1);
              }}
              placeholder="Method"
              allowClear
              options={[
                { label: 'Cash', value: 'CASH' },
                { label: 'Cheque', value: 'CHEQUE' },
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
            <Flex align="center" gap={16} wrap="wrap">
              <Flex align="center" gap={6}>
                <Switch
                  size="small"
                  checked={excludeReversed}
                  onChange={(v) => {
                    setExcludeReversed(v);
                    setPage(1);
                  }}
                />
                <Typography.Text style={{ fontSize: 12 }}>
                  Hide reversed
                </Typography.Text>
              </Flex>
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
          <Table<CreditPaymentRow>
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

      <CustomerPaymentPickerDrawer
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
      />

      <ReverseCreditPaymentModal
        open={!!reverseTarget}
        payment={reverseTarget}
        onClose={() => setReverseTarget(null)}
      />
    </Flex>
  );
}