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
    Eye,
    Pencil,
    Trash2,
    AlertTriangle,
} from 'lucide-react';
import { useDeleteProduct, useProducts } from '@/hooks/queries/useProducts';
import {
    useBrandsLookup,
    useCategoriesLookup,
} from '@/hooks/queries/useLookups';
import { usePermission } from '@/hooks/usePermission';
import { ProductFormDrawer } from './ProductFormDrawer';
import { ProductDetailDrawer } from './ProductDetailDrawer';
import { formatMoney, formatDate } from '@/lib/format';
import { getErrorMessage } from '@/lib/api';
import type {
    ProductListRow,
    ProductSortField,
    QueryProductParams,
} from '@/types/product';

const { useBreakpoint } = Grid;

const DEFAULT_PAGE_SIZE = 20;

export function ProductsListPage() {
    const { message, modal } = App.useApp();
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const canCreate = usePermission('products.create');
    const canUpdate = usePermission('products.update');
    const canDelete = usePermission('products.delete');

    // ─── Filters ─────────────────────────────────────────────
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [categoryId, setCategoryId] = useState<string | undefined>();
    const [brandId, setBrandId] = useState<string | undefined>();
    const [lowStock, setLowStock] = useState(false);
    const [isActive, setIsActive] = useState<'all' | 'active' | 'inactive'>('all');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
    const [sortBy, setSortBy] = useState<ProductSortField>('CreatedAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 300);
        return () => clearTimeout(t);
    }, [searchInput]);

    const query: QueryProductParams = useMemo(
        () => ({
            page,
            limit,
            search: search || undefined,
            CategoryId: categoryId,
            BrandId: brandId,
            lowStock: lowStock || undefined,
            IsActive:
                isActive === 'all' ? undefined : isActive === 'active' ? true : false,
            sortBy,
            sortOrder,
        }),
        [page, limit, search, categoryId, brandId, lowStock, isActive, sortBy, sortOrder],
    );

    const { data, isLoading, isFetching } = useProducts(query);
    const { data: categories = [] } = useCategoriesLookup();
    const { data: brands = [] } = useBrandsLookup();
    const deleteMutation = useDeleteProduct();

    // ─── Drawers ─────────────────────────────────────────────
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<ProductListRow | null>(null);
    const [detailId, setDetailId] = useState<string | null>(null);

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };
    const openEdit = (row: ProductListRow) => {
        setEditing(row);
        setFormOpen(true);
    };

    const confirmDelete = (row: ProductListRow) => {
        modal.confirm({
            title: 'Delete product?',
            content: (
                <div>
                    <p>
                        <strong>{row.Name}</strong> will be soft-deleted.
                    </p>
                    <p style={{ color: '#888', marginBottom: 0 }}>
                        Non-zero stock on any warehouse blocks deletion.
                    </p>
                </div>
            ),
            okText: 'Delete',
            okButtonProps: { danger: true },
            async onOk() {
                try {
                    await deleteMutation.mutateAsync(row.Id);
                    message.success('Product deleted');
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
        setBrandId(undefined);
        setLowStock(false);
        setIsActive('all');
        setPage(1);
    };

    // ─── Table columns (desktop) ─────────────────────────────
    const columns: ColumnsType<ProductListRow> = useMemo(
        () => [
            {
                title: 'Name',
                dataIndex: 'Name',
                key: 'Name',
                sorter: true,
                sortOrder:
                    sortBy === 'Name' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : null,
                render: (_: unknown, row) => (
                    <Flex vertical>
                        <Typography.Text strong>{row.Name}</Typography.Text>
                        {row.SKU && (
                            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                                SKU: {row.SKU}
                            </Typography.Text>
                        )}
                    </Flex>
                ),
            },
            {
                title: 'Category',
                dataIndex: ['Category', 'Name'],
                key: 'Category',
                render: (_: unknown, row) => row.Category.Name,
            },
            {
                title: 'Brand',
                dataIndex: ['Brand', 'Name'],
                key: 'Brand',
                render: (_: unknown, row) => row.Brand?.Name ?? '—',
            },
            {
                title: 'Price',
                dataIndex: 'Price',
                key: 'Price',
                align: 'right',
                sorter: true,
                sortOrder:
                    sortBy === 'Price' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : null,
                render: (_: unknown, row) => formatMoney(row.Price),
            },
            {
                title: 'Cost',
                dataIndex: 'CostPrice',
                key: 'CostPrice',
                align: 'right',
                render: (_: unknown, row) => formatMoney(row.CostPrice),
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
                        <Button
                            type="text"
                            size="small"
                            icon={<Eye size={14} />}
                            onClick={() => setDetailId(row.Id)}
                        />
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

    // ─── Card list (mobile) ──────────────────────────────────
    const renderMobileList = () => {
        if (isLoading) {
            return (
                <Flex justify="center" style={{ padding: 48 }}>
                    <Spin />
                </Flex>
            );
        }
        if (!data || data.data.length === 0) {
            return <Empty description="No products" style={{ padding: 32 }} />;
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
                                {row.SKU && (
                                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                                        SKU: {row.SKU}
                                    </Typography.Text>
                                )}
                                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                                    {row.Category.Name}
                                    {row.Brand ? ` · ${row.Brand.Name}` : ''}
                                </Typography.Text>
                                <Flex gap={6} align="center" style={{ marginTop: 4 }}>
                                    <Typography.Text strong>
                                        {formatMoney(row.Price)}
                                    </Typography.Text>
                                    {!row.IsActive && <Tag>Inactive</Tag>}
                                </Flex>
                            </Flex>
                            <Space size={0} direction="vertical">
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<Eye size={14} />}
                                    onClick={() => setDetailId(row.Id)}
                                />
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
                    </Card>
                ))}
            </Flex>
        );
    };

    const handleTableChange: NonNullable<TableProps<ProductListRow>['onChange']> = (
        pagination,
        _filters,
        sorter,
    ) => {
        if (Array.isArray(sorter)) return;
        if (sorter.field && sorter.order) {
            setSortBy(sorter.field as ProductSortField);
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
                    Products
                </Typography.Title>
                {canCreate && (
                    <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>
                        {isMobile ? 'New' : 'New product'}
                    </Button>
                )}
            </Flex>

            {/* Filters */}
            <Card size="small" styles={{ body: { padding: isMobile ? 12 : 16 } }}>
                <Row gutter={[12, 12]}>
                    <Col xs={24} md={8}>
                        <Input
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search name, SKU, barcode"
                            prefix={<SearchIcon size={14} />}
                            allowClear
                        />
                    </Col>
                    <Col xs={12} md={6}>
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
                            options={categories.map((c) => ({ label: c.Name, value: c.Id }))}
                            style={{ width: '100%' }}
                        />
                    </Col>
                    <Col xs={12} md={6}>
                        <Select
                            value={brandId}
                            onChange={(v) => {
                                setBrandId(v);
                                setPage(1);
                            }}
                            placeholder="Brand"
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            options={brands.map((b) => ({ label: b.Name, value: b.Id }))}
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
                    <Col xs={24} md={24}>
                        <Flex align="center" gap={16} wrap="wrap">
                            <Flex align="center" gap={6}>
                                <Switch
                                    size="small"
                                    checked={lowStock}
                                    onChange={(v) => {
                                        setLowStock(v);
                                        setPage(1);
                                    }}
                                />
                                <Flex align="center" gap={4}>
                                    <AlertTriangle size={12} color="#faad14" />
                                    <Typography.Text style={{ fontSize: 12 }}>
                                        Low stock only
                                    </Typography.Text>
                                </Flex>
                            </Flex>
                            <Button type="link" size="small" onClick={resetFilters}>
                                Reset filters
                            </Button>
                        </Flex>
                    </Col>
                </Row>
            </Card>

            {/* Content */}
            <Card styles={{ body: { padding: isMobile ? 8 : 0 } }}>
                {isMobile ? (
                    renderMobileList()
                ) : (
                    <Table<ProductListRow>
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

            {/* Drawers */}
            <ProductFormDrawer
                open={formOpen}
                product={editing}
                onClose={() => setFormOpen(false)}
            />
            <ProductDetailDrawer
                productId={detailId}
                onClose={() => setDetailId(null)}
            />
        </Flex>
    );
}