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
import { Plus, Search as SearchIcon, Pencil, Trash2 } from 'lucide-react';
import { useBrands, useDeleteBrand } from '@/hooks/queries/useBrands';
import { usePermission } from '@/hooks/usePermission';
import { BrandFormDrawer } from './BrandFormDrawer';
import { formatDate } from '@/lib/format';
import { getErrorMessage } from '@/lib/api';
import type {
  BrandRow,
  BrandSortField,
  QueryBrandParams,
} from '@/types/brand';

const { useBreakpoint } = Grid;
const DEFAULT_PAGE_SIZE = 20;

export function BrandsListPage() {
  const { message, modal } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const canManage = usePermission('brands.manage');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<BrandSortField>('Name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query: QueryBrandParams = useMemo(
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

  const { data, isLoading, isFetching } = useBrands(query);
  const deleteMutation = useDeleteBrand();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BrandRow | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (row: BrandRow) => {
    setEditing(row);
    setFormOpen(true);
  };

  const confirmDelete = (row: BrandRow) => {
    modal.confirm({
      title: 'Delete brand?',
      content: (
        <div>
          <p>
            <strong>{row.Name}</strong> will be soft-deleted.
          </p>
          {row._count.Products > 0 && (
            <p style={{ color: '#faad14' }}>
              This brand still has {row._count.Products} product
              {row._count.Products === 1 ? '' : 's'} — the backend will refuse
              until those are reassigned.
            </p>
          )}
        </div>
      ),
      okText: 'Delete',
      okButtonProps: { danger: true },
      async onOk() {
        try {
          await deleteMutation.mutateAsync(row.Id);
          message.success('Brand deleted');
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

  const columns: ColumnsType<BrandRow> = useMemo(
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
            <Typography.Text strong>{row.Name}</Typography.Text>
            {row.Description && (
              <Typography.Text
                type="secondary"
                style={{ fontSize: 11 }}
                ellipsis
              >
                {row.Description}
              </Typography.Text>
            )}
          </Flex>
        ),
      },
      {
        title: 'Products',
        dataIndex: ['_count', 'Products'],
        key: 'Products',
        align: 'right',
        render: (v: number) => (v > 0 ? <Tag color="blue">{v}</Tag> : '—'),
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
      return <Empty description="No brands" style={{ padding: 32 }} />;
    }
    return (
      <Flex vertical gap={8}>
        {data.data.map((row) => (
          <Card key={row.Id} size="small" styles={{ body: { padding: 12 } }}>
            <Flex justify="space-between" gap={8} align="flex-start">
              <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                <Typography.Text strong ellipsis>
                  {row.Name}
                </Typography.Text>
                {row.Description && (
                  <Typography.Text
                    type="secondary"
                    style={{ fontSize: 11 }}
                    ellipsis
                  >
                    {row.Description}
                  </Typography.Text>
                )}
                <Flex gap={6} wrap="wrap" style={{ marginTop: 4 }}>
                  {row._count.Products > 0 && (
                    <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                      {row._count.Products} products
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
                  />
                </Space>
              )}
            </Flex>
          </Card>
        ))}
      </Flex>
    );
  };

  const handleTableChange: NonNullable<TableProps<BrandRow>['onChange']> = (
    pagination,
    _filters,
    sorter,
  ) => {
    if (Array.isArray(sorter)) return;
    if (sorter.field && sorter.order) {
      setSortBy(sorter.field as BrandSortField);
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
          Brands
        </Typography.Title>
        {canManage && (
          <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>
            {isMobile ? 'New' : 'New brand'}
          </Button>
        )}
      </Flex>

      <Card size="small" styles={{ body: { padding: isMobile ? 12 : 16 } }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={12}>
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name or description"
              prefix={<SearchIcon size={14} />}
              allowClear
            />
          </Col>
          <Col xs={12} md={6}>
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
          <Col xs={12} md={6}>
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
          <Table<BrandRow>
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

      <BrandFormDrawer
        open={formOpen}
        brand={editing}
        onClose={() => setFormOpen(false)}
      />
    </Flex>
  );
}