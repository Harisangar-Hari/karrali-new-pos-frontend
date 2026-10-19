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
  App,
} from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import {
  Plus,
  Search as SearchIcon,
  Undo2,
  Wallet,
  Landmark,
} from 'lucide-react';
import  { type Dayjs } from 'dayjs';
import {
  useSupplierPayments,
} from '@/hooks/queries/useSupplierPayments';
import { useSuppliersLookup } from '@/hooks/queries/useSuppliersLookup';
import { usePermission } from '@/hooks/usePermission';
import { CreateSupplierPaymentDrawer } from './CreateSupplierPaymentDrawer';
import { ReversePaymentModal } from './ReversePaymentModal';
import { formatMoney, formatDateTime } from '@/lib/format';
import type {
  QuerySupplierPaymentParams,
  SupplierPaymentMethod,
  SupplierPaymentRow,
  SupplierPaymentSortField,
} from '@/types/supplierPayment';

const { useBreakpoint } = Grid;
const { RangePicker } = DatePicker;
const DEFAULT_PAGE_SIZE = 20;

const METHOD_COLOR: Record<SupplierPaymentMethod, string> = {
  CASH: 'green',
  BANK_TRANSFER: 'blue',
  CHEQUE: 'purple',
};

const METHOD_ICON: Record<SupplierPaymentMethod, React.ReactNode> = {
  CASH: <Wallet size={11} />,
  BANK_TRANSFER: <Landmark size={11} />,
  CHEQUE: <Wallet size={11} />,
};

export function SupplierPaymentsListPage() {
  const { modal } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const canCreate = usePermission('supplier_payments.create');
  const canReverse = usePermission('supplier_payments.reverse');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [supplierId, setSupplierId] = useState<string | undefined>();
  const [method, setMethod] = useState<SupplierPaymentMethod | undefined>();
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<SupplierPaymentSortField>('PaidAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query: QuerySupplierPaymentParams = useMemo(
    () => ({
      page,
      limit,
      search: search || undefined,
      SupplierId: supplierId,
      Method: method,
      From: range?.[0]?.startOf('day').toISOString(),
      To: range?.[1]?.endOf('day').toISOString(),
      sortBy,
      sortOrder,
    }),
    [page, limit, search, supplierId, method, range, sortBy, sortOrder],
  );

  const { data, isLoading, isFetching } = useSupplierPayments(query);
  const { data: suppliers = [] } = useSuppliersLookup();

  const [createOpen, setCreateOpen] = useState(false);
  const [reverseTarget, setReverseTarget] = useState<SupplierPaymentRow | null>(
    null,
  );

  const confirmReverse = (row: SupplierPaymentRow) => {
    if (row.Method === 'CHEQUE') {
      modal.warning({
        title: 'Cannot reverse cheque payments',
        content:
          'Cheque-method payments are managed by the supplier cheques module — bounce or void the cheque instead.',
      });
      return;
    }
    setReverseTarget(row);
  };

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setSupplierId(undefined);
    setMethod(undefined);
    setRange(null);
    setPage(1);
  };

  const columns: ColumnsType<SupplierPaymentRow> = useMemo(
    () => [
      {
        title: 'Code',
        dataIndex: 'Code',
        key: 'Code',
        render: (_: unknown, row) => (
          <Flex vertical gap={2}>
            <Typography.Text strong>{row.Code}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {formatDateTime(row.PaidAt)}
            </Typography.Text>
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
        title: 'Purchase',
        key: 'purchase',
        render: (_: unknown, row) => (
          <Flex vertical gap={2}>
            <Typography.Text style={{ fontSize: 12 }}>
              {row.Purchase.Code}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              Total {formatMoney(row.Purchase.TotalAmount)}
            </Typography.Text>
          </Flex>
        ),
      },
      {
        title: 'Method',
        dataIndex: 'Method',
        key: 'Method',
        render: (m: SupplierPaymentMethod) => (
          <Tag
            color={METHOD_COLOR[m]}
            icon={METHOD_ICON[m]}
            style={{ marginInlineEnd: 0 }}
          >
            {m}
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
        render: (v: string) => (
          <Typography.Text strong style={{ color: '#dc2626' }}>
            − {formatMoney(v)}
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
          canReverse && row.Method !== 'CHEQUE' ? (
            <Button
              type="text"
              size="small"
              danger
              icon={<Undo2 size={14} />}
              onClick={() => confirmReverse(row)}
            />
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
      return (
        <Empty description="No supplier payments yet" style={{ padding: 32 }} />
      );
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
                    color={METHOD_COLOR[row.Method]}
                    style={{ marginInlineEnd: 0 }}
                  >
                    {row.Method}
                  </Tag>
                </Flex>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  {formatDateTime(row.PaidAt)}
                </Typography.Text>
                <Typography.Text style={{ fontSize: 12 }}>
                  {row.Supplier.Name}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  Purchase {row.Purchase.Code}
                </Typography.Text>
              </Flex>
              <Flex vertical gap={6} align="flex-end">
                <Typography.Text strong style={{ color: '#dc2626' }}>
                  − {formatMoney(row.Amount)}
                </Typography.Text>
                {canReverse && row.Method !== 'CHEQUE' && (
                  <Button
                    size="small"
                    danger
                    icon={<Undo2 size={12} />}
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
    TableProps<SupplierPaymentRow>['onChange']
  > = (pagination, _filters, sorter) => {
    if (Array.isArray(sorter)) return;
    if (sorter.field && sorter.order) {
      setSortBy(sorter.field as SupplierPaymentSortField);
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
          Supplier payments
        </Typography.Title>
        {canCreate && (
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => setCreateOpen(true)}
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
              value={method}
              onChange={(v) => {
                setMethod(v);
                setPage(1);
              }}
              placeholder="Method"
              allowClear
              options={[
                { label: 'Cash', value: 'CASH' },
                { label: 'Bank transfer', value: 'BANK_TRANSFER' },
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
          <Table<SupplierPaymentRow>
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

      <CreateSupplierPaymentDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      <ReversePaymentModal
        open={!!reverseTarget}
        payment={reverseTarget}
        onClose={() => setReverseTarget(null)}
      />
    </Flex>
  );
}