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
  App,
  Empty,
  Spin,
  Tooltip,
} from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import {
  Plus,
  Search as SearchIcon,
  Pencil,
  Trash2,
  Star,
  Landmark,
} from 'lucide-react';
import {
  useBankAccounts,
  useDeleteBankAccount,
} from '@/hooks/queries/useBankAccounts';
import { usePermission } from '@/hooks/usePermission';
import { BankAccountFormDrawer } from './BankAccountFormDrawer';
import { formatDate } from '@/lib/format';
import { getErrorMessage } from '@/lib/api';
import type {
  BankAccountRow,
  BankAccountSortField,
  QueryBankAccountParams,
} from '@/types/bankAccount';

const { useBreakpoint } = Grid;
const DEFAULT_PAGE_SIZE = 20;

export function BankAccountsListPage() {
  const { message, modal } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const canManage = usePermission('bank_accounts.manage');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<BankAccountSortField>('Name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query: QueryBankAccountParams = useMemo(
    () => ({
      page,
      limit,
      search: search || undefined,
      IsActive:
        isActive === 'all' ? undefined : isActive === 'active' ? true : false,
      sortBy,
      sortOrder,
    }),
    [page, limit, search, isActive, sortBy, sortOrder],
  );

  const { data, isLoading, isFetching } = useBankAccounts(query);
  const deleteMutation = useDeleteBankAccount();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccountRow | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (row: BankAccountRow) => {
    setEditing(row);
    setFormOpen(true);
  };

  const confirmDelete = (row: BankAccountRow) => {
    modal.confirm({
      title: 'Delete bank account?',
      content: (
        <div>
          <p>
            <strong>{row.Name}</strong> — {row.BankName} · {row.AccountNumber}
          </p>
          <p style={{ marginBottom: 4, color: '#faad14' }}>
            The backend will refuse if any of these are true:
          </p>
          <ul style={{ margin: 0, paddingInlineStart: 20, color: '#8c8c8c' }}>
            <li>This is the default account</li>
            <li>Expenses reference it</li>
            <li>Cash movements reference it</li>
          </ul>
        </div>
      ),
      okText: 'Delete',
      okButtonProps: { danger: true },
      async onOk() {
        try {
          await deleteMutation.mutateAsync(row.Id);
          message.success('Bank account deleted');
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
    setIsActive('all');
    setPage(1);
  };

  const columns: ColumnsType<BankAccountRow> = useMemo(
    () => [
      {
        title: 'Account',
        key: 'account',
        render: (_: unknown, row) => (
          <Flex vertical gap={2}>
            <Flex align="center" gap={6}>
              <Typography.Text strong>{row.Name}</Typography.Text>
              {row.IsDefault && (
                <Tooltip title="Default account">
                  <Star size={13} color="#faad14" fill="#faad14" />
                </Tooltip>
              )}
            </Flex>
            <Flex align="center" gap={4}>
              <Landmark size={11} color="#94a3b8" />
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                {row.BankName}
              </Typography.Text>
            </Flex>
          </Flex>
        ),
      },
      {
        title: 'Account number',
        dataIndex: 'AccountNumber',
        key: 'AccountNumber',
        render: (v: string, row) => (
          <Flex vertical gap={2}>
            <Typography.Text style={{ fontFamily: 'monospace', fontSize: 12 }}>
              {v}
            </Typography.Text>
            {row.Branch && (
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                {row.Branch}
                {row.Swift ? ` · ${row.Swift}` : ''}
              </Typography.Text>
            )}
          </Flex>
        ),
      },
      {
        title: 'Status',
        key: 'status',
        render: (_: unknown, row) => (
          <Space size={4} wrap>
            {row.IsActive ? (
              <Tag color="green">Active</Tag>
            ) : (
              <Tag>Inactive</Tag>
            )}
            {row.IsDefault && <Tag color="gold">Default</Tag>}
          </Space>
        ),
      },
      {
        title: 'Created',
        dataIndex: 'CreatedAt',
        key: 'CreatedAt',
        sorter: true,
        sortOrder:
          sortBy === 'CreatedAt'
            ? sortOrder === 'asc'
              ? 'ascend'
              : 'descend'
            : null,
        render: (v: string) => formatDate(v),
      },
      {
        title: 'Actions',
        key: 'actions',
        align: 'right',
        render: (_: unknown, row) =>
          canManage ? (
            <Space size={4}>
              <Button
                type="text"
                size="small"
                icon={<Pencil size={14} />}
                onClick={() => openEdit(row)}
              />
              <Button
                type="text"
                size="small"
                danger
                icon={<Trash2 size={14} />}
                onClick={() => confirmDelete(row)}
                disabled={row.IsDefault}
              />
            </Space>
          ) : null,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sortBy, sortOrder, canManage],
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
      return <Empty description="No bank accounts" style={{ padding: 32 }} />;
    }
    return (
      <Flex vertical gap={8}>
        {data.data.map((row) => (
          <Card key={row.Id} size="small" styles={{ body: { padding: 12 } }}>
            <Flex justify="space-between" gap={8} align="flex-start">
              <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                <Flex align="center" gap={6}>
                  <Typography.Text strong ellipsis>
                    {row.Name}
                  </Typography.Text>
                  {row.IsDefault && (
                    <Star size={12} color="#faad14" fill="#faad14" />
                  )}
                </Flex>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  {row.BankName}
                </Typography.Text>
                <Typography.Text style={{ fontFamily: 'monospace', fontSize: 11 }}>
                  {row.AccountNumber}
                </Typography.Text>
                {row.Branch && (
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    {row.Branch}
                  </Typography.Text>
                )}
                <Flex gap={6} wrap="wrap" style={{ marginTop: 4 }}>
                  {row.IsDefault && (
                    <Tag color="gold" style={{ marginInlineEnd: 0 }}>
                      Default
                    </Tag>
                  )}
                  {!row.IsActive && (
                    <Tag style={{ marginInlineEnd: 0 }}>Inactive</Tag>
                  )}
                </Flex>
              </Flex>
              {canManage && (
                <Space size={0} direction="vertical">
                  <Button
                    type="text"
                    size="small"
                    icon={<Pencil size={14} />}
                    onClick={() => openEdit(row)}
                  />
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<Trash2 size={14} />}
                    onClick={() => confirmDelete(row)}
                    disabled={row.IsDefault}
                  />
                </Space>
              )}
            </Flex>
          </Card>
        ))}
      </Flex>
    );
  };

  const handleTableChange: NonNullable<
    TableProps<BankAccountRow>['onChange']
  > = (pagination, _filters, sorter) => {
    if (Array.isArray(sorter)) return;
    if (sorter.field && sorter.order) {
      setSortBy(sorter.field as BankAccountSortField);
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
          Bank accounts
        </Typography.Title>
        {canManage && (
          <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>
            {isMobile ? 'New' : 'New account'}
          </Button>
        )}
      </Flex>

      <Card size="small" styles={{ body: { padding: isMobile ? 12 : 16 } }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={14}>
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, bank, account number"
              prefix={<SearchIcon size={14} />}
              allowClear
            />
          </Col>
          <Col xs={12} md={5}>
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
          <Col xs={12} md={5}>
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
          <Table<BankAccountRow>
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

      <BankAccountFormDrawer
        open={formOpen}
        bankAccount={editing}
        onClose={() => setFormOpen(false)}
      />
    </Flex>
  );
}