import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
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
  Switch,
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
  Eye,
  Wallet,
  Phone,
} from 'lucide-react';
import { useCustomers, useDeleteCustomer } from '@/hooks/queries/useCustomers';
import { usePermission } from '@/hooks/usePermission';
import { CustomerFormDrawer } from './CustomerFormDrawer';
import { AdjustBalanceModal } from './AdjustBalanceModal';
import { formatMoney } from '@/lib/format';
import { getErrorMessage } from '@/lib/api';
import {
  CUSTOMER_TYPES,
  type CustomerRow,
  type CustomerSortField,
  type CustomerType,
  type QueryCustomerParams,
} from '@/types/customer';
import { Link } from 'react-router-dom';

const { useBreakpoint } = Grid;
const DEFAULT_PAGE_SIZE = 20;

export function CustomersListPage() {
  const { message, modal } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const canCreate = usePermission('customers.create');
  const canUpdate = usePermission('customers.update');
  const canDelete = usePermission('customers.delete');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState<CustomerType | undefined>();
  const [isActive, setIsActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [withBalance, setWithBalance] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<CustomerSortField>('Name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query: QueryCustomerParams = useMemo(
    () => ({
      page,
      limit,
      search: search || undefined,
      Type: type,
      IsActive:
        isActive === 'all' ? undefined : isActive === 'active' ? true : false,
      withBalance: withBalance || undefined,
      sortBy,
      sortOrder,
    }),
    [page, limit, search, type, isActive, withBalance, sortBy, sortOrder],
  );

  const { data, isLoading, isFetching } = useCustomers(query);
  const deleteMutation = useDeleteCustomer();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerRow | null>(null);
  const [adjusting, setAdjusting] = useState<CustomerRow | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (row: CustomerRow) => {
    setEditing(row);
    setFormOpen(true);
  };

  const confirmDelete = (row: CustomerRow) => {
    modal.confirm({
      title: 'Delete customer?',
      content: (
        <div>
          <p>
            <strong>{row.Name}</strong> will be soft-deleted.
          </p>
          {Number(row.Balance) !== 0 && (
            <p style={{ color: '#faad14' }}>
              This customer has an outstanding balance of{' '}
              {formatMoney(row.Balance)} — the backend will refuse until it's
              settled.
            </p>
          )}
        </div>
      ),
      okText: 'Delete',
      okButtonProps: { danger: true },
      async onOk() {
        try {
          await deleteMutation.mutateAsync(row.Id);
          message.success('Customer deleted');
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
    setType(undefined);
    setIsActive('all');
    setWithBalance(false);
    setPage(1);
  };

  const columns: ColumnsType<CustomerRow> = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'Name',
        key: 'Name',
        sorter: true,
        sortOrder:
          sortBy === 'Name' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : null,
        render: (_: unknown, row) => (
          <Flex vertical gap={2}>
            <Link to={`/customers/${row.Id}`}>
              <Typography.Text strong>{row.Name}</Typography.Text>
            </Link>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {row.Code}
            </Typography.Text>
          </Flex>
        ),
      },
      {
        title: 'Type',
        dataIndex: 'Type',
        key: 'Type',
        render: (t: CustomerType) => <Tag color="cyan">{t}</Tag>,
      },
      {
        title: 'Contact',
        key: 'contact',
        render: (_: unknown, row) => (
          <Flex vertical gap={2}>
            {row.Phone && (
              <Flex align="center" gap={4}>
                <Phone size={11} color="#94a3b8" />
                <Typography.Text style={{ fontSize: 12 }}>
                  {row.Phone}
                </Typography.Text>
              </Flex>
            )}
            {row.Email && (
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                {row.Email}
              </Typography.Text>
            )}
            {!row.Phone && !row.Email && (
              <Typography.Text type="secondary">—</Typography.Text>
            )}
          </Flex>
        ),
      },
      {
        title: 'Balance',
        dataIndex: 'Balance',
        key: 'Balance',
        align: 'right',
        sorter: true,
        sortOrder:
          sortBy === 'Balance'
            ? sortOrder === 'asc'
              ? 'ascend'
              : 'descend'
            : null,
        render: (v: string) => {
          const n = Number(v);
          return (
            <Typography.Text
              strong={n !== 0}
              style={{ color: n > 0 ? '#dc2626' : undefined }}
            >
              {formatMoney(v)}
            </Typography.Text>
          );
        },
      },
      {
        title: 'Credit limit',
        dataIndex: 'CreditLimit',
        key: 'CreditLimit',
        align: 'right',
        render: (v: string) => formatMoney(v),
      },
      {
        title: 'Status',
        dataIndex: 'IsActive',
        key: 'IsActive',
        render: (_: unknown, row) =>
          row.IsActive ? (
            <Tag color="green">Active</Tag>
          ) : (
            <Tag>Inactive</Tag>
          ),
      },
      {
        title: 'Actions',
        key: 'actions',
        align: 'right',
        render: (_: unknown, row) => (
          <Space size={4}>
            <Link to={`/customers/${row.Id}`}>
              <Button type="text" size="small" icon={<Eye size={14} />} />
            </Link>
            {canUpdate && (
              <>
                <Button
                  type="text"
                  size="small"
                  icon={<Wallet size={14} />}
                  onClick={() => setAdjusting(row)}
                  title="Adjust balance"
                />
                <Button
                  type="text"
                  size="small"
                  icon={<Pencil size={14} />}
                  onClick={() => openEdit(row)}
                />
              </>
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
      return <Empty description="No customers" style={{ padding: 32 }} />;
    }
    return (
      <Flex vertical gap={8}>
        {data.data.map((row) => {
          const balance = Number(row.Balance);
          return (
            <Card key={row.Id} size="small" styles={{ body: { padding: 12 } }}>
              <Flex justify="space-between" gap={8} align="flex-start">
                <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                  <Link to={`/customers/${row.Id}`}>
                    <Typography.Text strong ellipsis>
                      {row.Name}
                    </Typography.Text>
                  </Link>
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    {row.Code} · {row.Type}
                  </Typography.Text>
                  {row.Phone && (
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      {row.Phone}
                    </Typography.Text>
                  )}
                  <Flex gap={6} wrap="wrap" style={{ marginTop: 4 }}>
                    <Tag
                      color={balance > 0 ? 'red' : 'default'}
                      style={{ marginInlineEnd: 0 }}
                    >
                      Balance: {formatMoney(row.Balance)}
                    </Tag>
                    {!row.IsActive && (
                      <Tag style={{ marginInlineEnd: 0 }}>Inactive</Tag>
                    )}
                  </Flex>
                </Flex>
                <Space size={0} direction="vertical">
                  <Link to={`/customers/${row.Id}`}>
                    <Button type="text" size="small" icon={<Eye size={14} />} />
                  </Link>
                  {canUpdate && (
                    <>
                      <Button
                        type="text"
                        size="small"
                        icon={<Wallet size={14} />}
                        onClick={() => setAdjusting(row)}
                      />
                      <Button
                        type="text"
                        size="small"
                        icon={<Pencil size={14} />}
                        onClick={() => openEdit(row)}
                      />
                    </>
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
            </Card>
          );
        })}
      </Flex>
    );
  };

  const handleTableChange: NonNullable<TableProps<CustomerRow>['onChange']> = (
    pagination,
    _filters,
    sorter,
  ) => {
    if (Array.isArray(sorter)) return;
    if (sorter.field && sorter.order) {
      setSortBy(sorter.field as CustomerSortField);
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
          Customers
        </Typography.Title>
        {canCreate && (
          <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>
            {isMobile ? 'New' : 'New customer'}
          </Button>
        )}
      </Flex>

      <Card size="small" styles={{ body: { padding: isMobile ? 12 : 16 } }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={10}>
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, code, phone, email"
              prefix={<SearchIcon size={14} />}
              allowClear
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              value={type}
              onChange={(v) => {
                setType(v);
                setPage(1);
              }}
              placeholder="Type"
              allowClear
              options={CUSTOMER_TYPES.map((t) => ({ label: t, value: t }))}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              value={isActive}
              onChange={(v) => {
                setIsActive(v);
                setPage(1);
              }}
              options={[
                { label: 'All status', value: 'all' },
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
              ]}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={6}>
            <Flex align="center" justify="space-between" gap={8}>
              <Flex align="center" gap={6}>
                <Switch
                  size="small"
                  checked={withBalance}
                  onChange={(v) => {
                    setWithBalance(v);
                    setPage(1);
                  }}
                />
                <Typography.Text style={{ fontSize: 12 }}>
                  With balance only
                </Typography.Text>
              </Flex>
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
          <Table<CustomerRow>
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

      <CustomerFormDrawer
        open={formOpen}
        customer={editing}
        onClose={() => setFormOpen(false)}
      />
      <AdjustBalanceModal
        open={!!adjusting}
        customer={adjusting}
        onClose={() => setAdjusting(null)}
      />
    </Flex>
  );
}