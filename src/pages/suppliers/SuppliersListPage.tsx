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
} from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import {
  Plus,
  Search as SearchIcon,
  Pencil,
  Trash2,
  Phone,
  Landmark,
  Eye,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSuppliers, useDeleteSupplier } from '@/hooks/queries/useSuppliers';
import { usePermission } from '@/hooks/usePermission';
import { SupplierFormDrawer } from './SupplierFormDrawer';
import { formatDate } from '@/lib/format';
import { getErrorMessage } from '@/lib/api';
import type {
  QuerySupplierParams,
  SupplierRow,
  SupplierSortField,
} from '@/types/supplier';

const { useBreakpoint } = Grid;
const DEFAULT_PAGE_SIZE = 20;

export function SuppliersListPage() {
  const { message, modal } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const canManage = usePermission('suppliers.manage');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<SupplierSortField>('Name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query: QuerySupplierParams = useMemo(
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

  const { data, isLoading, isFetching } = useSuppliers(query);
  const deleteMutation = useDeleteSupplier();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierRow | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (row: SupplierRow) => {
    setEditing(row);
    setFormOpen(true);
  };

  const confirmDelete = (row: SupplierRow) => {
    modal.confirm({
      title: 'Delete supplier?',
      content: (
        <div>
          <p>
            <strong>{row.Name}</strong> ({row.Code}) will be soft-deleted.
          </p>
          <p style={{ color: '#888', marginBottom: 0 }}>
            Historic purchases keep their reference — the code stays reserved.
          </p>
        </div>
      ),
      okText: 'Delete',
      okButtonProps: { danger: true },
      async onOk() {
        try {
          await deleteMutation.mutateAsync(row.Id);
          message.success('Supplier deleted');
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

  const columns: ColumnsType<SupplierRow> = useMemo(
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
            <Link to={`/suppliers/${row.Id}`}>
              <Typography.Text strong>{row.Name}</Typography.Text>
            </Link>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {row.Code}
            </Typography.Text>
          </Flex>
        ),
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
        title: 'Bank',
        key: 'bank',
        render: (_: unknown, row) =>
          row.BankName ? (
            <Flex vertical gap={2}>
              <Flex align="center" gap={4}>
                <Landmark size={11} color="#94a3b8" />
                <Typography.Text style={{ fontSize: 12 }}>
                  {row.BankName}
                </Typography.Text>
              </Flex>
              {row.BankAccountNo && (
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  {row.BankAccountNo}
                </Typography.Text>
              )}
            </Flex>
          ) : (
            <Typography.Text type="secondary">—</Typography.Text>
          ),
      },
      {
        title: 'Terms',
        dataIndex: 'PaymentTerms',
        key: 'PaymentTerms',
        render: (v: string | null) =>
          v ?? <Typography.Text type="secondary">—</Typography.Text>,
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
        render: (_: unknown, row) => (
          <Space size={4}>
            <Link to={`/suppliers/${row.Id}`}>
              <Button
                type="text"
                size="small"
                icon={<Eye size={14} />}
                title="View supplier"
              />
            </Link>
            {canManage && (
              <>
                <Button
                  type="text"
                  size="small"
                  icon={<Pencil size={14} />}
                  onClick={() => openEdit(row)}
                  title="Edit supplier"
                />
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<Trash2 size={14} />}
                  onClick={() => confirmDelete(row)}
                />
              </>
            )}
          </Space>
        ),
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
      return <Empty description="No suppliers" style={{ padding: 32 }} />;
    }
    return (
      <Flex vertical gap={8}>
        {data.data.map((row) => (
          <Card key={row.Id} size="small" styles={{ body: { padding: 12 } }}>
            <Flex justify="space-between" gap={8} align="flex-start">
              <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                <Link to={`/suppliers/${row.Id}`}>
                  <Typography.Text strong ellipsis>
                    {row.Name}
                  </Typography.Text>
                </Link>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  {row.Code}
                </Typography.Text>
                {row.Phone && (
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    {row.Phone}
                  </Typography.Text>
                )}
                {row.BankName && (
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    {row.BankName}
                    {row.BankAccountNo ? ` · ${row.BankAccountNo}` : ''}
                  </Typography.Text>
                )}
                <Flex gap={6} wrap="wrap" style={{ marginTop: 4 }}>
                  {row.PaymentTerms && (
                    <Tag style={{ marginInlineEnd: 0 }}>{row.PaymentTerms}</Tag>
                  )}
                  {!row.IsActive && (
                    <Tag style={{ marginInlineEnd: 0 }}>Inactive</Tag>
                  )}
                </Flex>
              </Flex>
              <Space size={0} direction="vertical">
                <Link to={`/suppliers/${row.Id}`}>
                  <Button
                    type="text"
                    size="small"
                    icon={<Eye size={14} />}
                  />
                </Link>
                {canManage && (
                  <>
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
                    />
                  </>
                )}
              </Space>
            </Flex>
          </Card>
        ))}
      </Flex>
    );
  };

  const handleTableChange: NonNullable<
    TableProps<SupplierRow>['onChange']
  > = (pagination, _filters, sorter) => {
    if (Array.isArray(sorter)) return;
    if (sorter.field && sorter.order) {
      setSortBy(sorter.field as SupplierSortField);
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
          Suppliers
        </Typography.Title>
        {canManage && (
          <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>
            {isMobile ? 'New' : 'New supplier'}
          </Button>
        )}
      </Flex>

      <Card size="small" styles={{ body: { padding: isMobile ? 12 : 16 } }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={14}>
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, code, phone, email"
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
          <Table<SupplierRow>
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

      <SupplierFormDrawer
        open={formOpen}
        supplier={editing}
        onClose={() => setFormOpen(false)}
      />
    </Flex>
  );
}