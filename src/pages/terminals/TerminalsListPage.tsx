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
  Monitor,
} from 'lucide-react';
import {
  useTerminals,
  useDeleteTerminal,
} from '@/hooks/queries/useTerminals';
import { useWarehousesLookup } from '@/hooks/queries/useLookups';
import { usePermission } from '@/hooks/usePermission';
import { TerminalFormDrawer } from './TerminalFormDrawer';
import { formatDate } from '@/lib/format';
import { getErrorMessage } from '@/lib/api';
import type {
  QueryTerminalParams,
  TerminalRow,
  TerminalSortField,
} from '@/types/terminal';

const { useBreakpoint } = Grid;
const DEFAULT_PAGE_SIZE = 20;

export function TerminalsListPage() {
  const { message, modal } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const canManage = usePermission('terminals.manage');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [warehouseId, setWarehouseId] = useState<string | undefined>();
  const [isActive, setIsActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<TerminalSortField>('CreatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query: QueryTerminalParams = useMemo(
    () => ({
      page,
      limit,
      search: search || undefined,
      WarehouseId: warehouseId,
      IsActive:
        isActive === 'all' ? undefined : isActive === 'active' ? true : false,
      sortBy,
      sortOrder,
    }),
    [page, limit, search, warehouseId, isActive, sortBy, sortOrder],
  );

  const { data, isLoading, isFetching } = useTerminals(query);
  const { data: warehouses = [] } = useWarehousesLookup();
  const deleteMutation = useDeleteTerminal();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TerminalRow | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (row: TerminalRow) => {
    setEditing(row);
    setFormOpen(true);
  };

  const confirmDelete = (row: TerminalRow) => {
    modal.confirm({
      title: 'Delete terminal?',
      content: (
        <div>
          <p>
            <strong>{row.Name}</strong> ({row.Code}) will be soft-deleted.
          </p>
          <p style={{ color: '#888', marginBottom: 0 }}>
            Historic invoices keep their terminal reference — the code stays
            reserved for audit purposes.
          </p>
        </div>
      ),
      okText: 'Delete',
      okButtonProps: { danger: true },
      async onOk() {
        try {
          await deleteMutation.mutateAsync(row.Id);
          message.success('Terminal deleted');
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
    setWarehouseId(undefined);
    setIsActive('all');
    setPage(1);
  };

  const columns: ColumnsType<TerminalRow> = useMemo(
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
            <Flex align="center" gap={6}>
              <Monitor size={14} color="#0d9488" />
              <Typography.Text strong>{row.Name}</Typography.Text>
            </Flex>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              Code: {row.Code}
            </Typography.Text>
          </Flex>
        ),
      },
      {
        title: 'Warehouse',
        dataIndex: ['Warehouse', 'Name'],
        key: 'Warehouse',
        render: (_: unknown, row) => (
          <Flex vertical gap={2}>
            <Typography.Text>{row.Warehouse.Name}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {row.Warehouse.Code}
            </Typography.Text>
          </Flex>
        ),
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
      return <Empty description="No terminals" style={{ padding: 32 }} />;
    }
    return (
      <Flex vertical gap={8}>
        {data.data.map((row) => (
          <Card key={row.Id} size="small" styles={{ body: { padding: 12 } }}>
            <Flex justify="space-between" gap={8} align="flex-start">
              <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                <Flex align="center" gap={6}>
                  <Monitor size={14} color="#0d9488" />
                  <Typography.Text strong ellipsis>
                    {row.Name}
                  </Typography.Text>
                </Flex>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  Code: {row.Code}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  {row.Warehouse.Name} ({row.Warehouse.Code})
                </Typography.Text>
                <Flex gap={6} wrap="wrap" style={{ marginTop: 4 }}>
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

  const handleTableChange: NonNullable<TableProps<TerminalRow>['onChange']> = (
    pagination,
    _filters,
    sorter,
  ) => {
    if (Array.isArray(sorter)) return;
    if (sorter.field && sorter.order) {
      setSortBy(sorter.field as TerminalSortField);
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
          Terminals
        </Typography.Title>
        {canManage && (
          <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>
            {isMobile ? 'New' : 'New terminal'}
          </Button>
        )}
      </Flex>

      <Card size="small" styles={{ body: { padding: isMobile ? 12 : 16 } }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={10}>
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name or code"
              prefix={<SearchIcon size={14} />}
              allowClear
            />
          </Col>
          <Col xs={24} md={6}>
            <Select
              value={warehouseId}
              onChange={(v) => {
                setWarehouseId(v);
                setPage(1);
              }}
              placeholder="Warehouse"
              allowClear
              showSearch
              optionFilterProp="label"
              options={warehouses.map((w) => ({
                label: w.Code ? `${w.Name} (${w.Code})` : w.Name,
                value: w.Id,
              }))}
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
                { label: 'All', value: 'all' },
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
              ]}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} md={4}>
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
          <Table<TerminalRow>
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

      <TerminalFormDrawer
        open={formOpen}
        terminal={editing}
        onClose={() => setFormOpen(false)}
      />
    </Flex>
  );
}