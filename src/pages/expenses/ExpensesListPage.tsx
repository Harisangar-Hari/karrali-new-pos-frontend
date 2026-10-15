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
  Table,
  Tag,
  Typography,
  App,
  Empty,
  Spin,
} from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import {
  Plus,
  Search as SearchIcon,
  Pencil,
  Trash2,
  Landmark,
  Wallet,
} from 'lucide-react';
import dayjs, { type Dayjs } from 'dayjs';
import {
  useDeleteExpense,
  useExpenses,
} from '@/hooks/queries/useExpenses';
import { useExpenseCategoriesLookup } from '@/hooks/queries/useExpenseLookups';
import { usePermission } from '@/hooks/usePermission';
import { ExpenseFormDrawer } from './ExpenseFormDrawer';
import { formatMoney, formatDateTime } from '@/lib/format';
import { getErrorMessage } from '@/lib/api';
import type {
  ExpensePaymentMethod,
  ExpenseRow,
  ExpenseSortField,
  QueryExpenseParams,
} from '@/types/expense';

const { useBreakpoint } = Grid;
const { RangePicker } = DatePicker;
const DEFAULT_PAGE_SIZE = 20;

export function ExpensesListPage() {
  const { message, modal } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const canCreate = usePermission('expenses.create');
  const canUpdate = usePermission('expenses.update');
  const canDelete = usePermission('expenses.delete');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [method, setMethod] = useState<ExpensePaymentMethod | undefined>();
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<ExpenseSortField>('PaidAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query: QueryExpenseParams = useMemo(
    () => ({
      page,
      limit,
      search: search || undefined,
      CategoryId: categoryId,
      Method: method,
      From: range?.[0]?.startOf('day').toISOString(),
      To: range?.[1]?.endOf('day').toISOString(),
      sortBy,
      sortOrder,
    }),
    [page, limit, search, categoryId, method, range, sortBy, sortOrder],
  );

  const { data, isLoading, isFetching } = useExpenses(query);
  const { data: categories = [] } = useExpenseCategoriesLookup();
  const deleteMutation = useDeleteExpense();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseRow | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (row: ExpenseRow) => {
    setEditing(row);
    setFormOpen(true);
  };

  const confirmDelete = (row: ExpenseRow) => {
    const isCash = row.Method === 'CASH';
    modal.confirm({
      title: 'Delete expense?',
      content: (
        <div>
          <p>
            <strong>{row.Code}</strong> — {row.Description}
          </p>
          {isCash && (
            <p style={{ color: '#16a34a' }}>
              This was a cash expense. Deleting it returns{' '}
              <strong>{formatMoney(row.Amount)}</strong> to the drawer (writes a
              positive CashLedger entry).
            </p>
          )}
          {!isCash && (
            <p style={{ color: '#888' }}>Bank expense — no cash effect.</p>
          )}
        </div>
      ),
      okText: 'Delete',
      okButtonProps: { danger: true },
      async onOk() {
        try {
          await deleteMutation.mutateAsync(row.Id);
          message.success('Expense deleted');
        } catch (err) {
          message.error(getErrorMessage(err));
          throw err;
        }
      },
    });
  };

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setCategoryId(undefined);
    setMethod(undefined);
    setRange(null);
    setPage(1);
  };

  const columns: ColumnsType<ExpenseRow> = useMemo(
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
        title: 'Description',
        dataIndex: 'Description',
        key: 'Description',
        render: (_: unknown, row) => (
          <Flex vertical gap={2}>
            <Typography.Text>{row.Description}</Typography.Text>
            {row.Payee && (
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                {row.Payee}
              </Typography.Text>
            )}
          </Flex>
        ),
      },
      {
        title: 'Category',
        dataIndex: ['Category', 'Name'],
        key: 'category',
        render: (_: unknown, row) => <Tag color="cyan">{row.Category.Name}</Tag>,
      },
      {
        title: 'Method',
        key: 'method',
        render: (_: unknown, row) =>
          row.Method === 'CASH' ? (
            <Flex vertical gap={2}>
              <Tag color="green" style={{ marginInlineEnd: 0 }}>
                <Wallet size={11} style={{ display: 'inline', marginRight: 3 }} />
                CASH
              </Tag>
            </Flex>
          ) : (
            <Flex vertical gap={2}>
              <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                <Landmark
                  size={11}
                  style={{ display: 'inline', marginRight: 3 }}
                />
                BANK
              </Tag>
              {row.BankAccount && (
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  {row.BankAccount.Name}
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
            {canUpdate && (
              <Button
                type="text"
                size="small"
                icon={<Pencil size={14} />}
                onClick={() => openEdit(row)}
              />
            )}
            {canDelete && (
              <Button
                type="text"
                size="small"
                danger
                icon={<Trash2 size={14} />}
                onClick={() => confirmDelete(row)}
              />
            )}
          </Space>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sortBy, sortOrder, canUpdate, canDelete],
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
      return <Empty description="No expenses" style={{ padding: 32 }} />;
    }
    return (
      <Flex vertical gap={8}>
        {data.data.map((row) => (
          <Card key={row.Id} size="small" styles={{ body: { padding: 12 } }}>
            <Flex justify="space-between" gap={8} align="flex-start">
              <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                <Typography.Text strong>{row.Code}</Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  {formatDateTime(row.PaidAt)}
                </Typography.Text>
                <Typography.Text>{row.Description}</Typography.Text>
                {row.Payee && (
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    {row.Payee}
                  </Typography.Text>
                )}
                <Flex gap={6} wrap="wrap" style={{ marginTop: 4 }}>
                  <Tag color="cyan">{row.Category.Name}</Tag>
                  <Tag color={row.Method === 'CASH' ? 'green' : 'blue'}>
                    {row.Method}
                  </Tag>
                </Flex>
              </Flex>
              <Flex vertical gap={4} align="flex-end">
                <Typography.Text strong style={{ color: '#dc2626' }}>
                  − {formatMoney(row.Amount)}
                </Typography.Text>
                <Space size={0} direction="vertical">
                  {canUpdate && (
                    <Button
                      type="text"
                      size="small"
                      icon={<Pencil size={14} />}
                      onClick={() => openEdit(row)}
                    />
                  )}
                  {canDelete && (
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<Trash2 size={14} />}
                      onClick={() => confirmDelete(row)}
                    />
                  )}
                </Space>
              </Flex>
            </Flex>
          </Card>
        ))}
      </Flex>
    );
  };

  const handleTableChange: NonNullable<TableProps<ExpenseRow>['onChange']> = (
    pagination,
    _filters,
    sorter,
  ) => {
    if (Array.isArray(sorter)) return;
    if (sorter.field && sorter.order) {
      setSortBy(sorter.field as ExpenseSortField);
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
          Expenses
        </Typography.Title>
        {canCreate && (
          <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>
            {isMobile ? 'New' : 'Record expense'}
          </Button>
        )}
      </Flex>

      <Card size="small" styles={{ body: { padding: isMobile ? 12 : 16 } }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={8}>
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search code, description, payee"
              prefix={<SearchIcon size={14} />}
              allowClear
            />
          </Col>
          <Col xs={12} md={5}>
            <Select
              value={categoryId}
              onChange={(v) => {
                setCategoryId(v);
                setPage(1);
              }}
              placeholder="Category"
              allowClear
              showSearch
              optionFilterProp="label"
              options={categories.map((c) => ({
                label: c.Name,
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
                { label: 'Bank', value: 'BANK' },
              ]}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={7}>
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
          <Table<ExpenseRow>
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

      <ExpenseFormDrawer
        open={formOpen}
        expense={editing}
        onClose={() => setFormOpen(false)}
      />
    </Flex>
  );
}