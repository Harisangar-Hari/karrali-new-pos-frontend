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
  Tooltip,
} from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import {
  Plus,
  Search as SearchIcon,
  Eye,
  Pencil,
  Trash2,
  AlertTriangle,
  Printer,
  Warehouse as WarehouseIcon,
  Upload as UploadIcon,
} from 'lucide-react';
import { useDeleteProduct, useProducts } from '@/hooks/queries/useProducts';
import {
  useBrandsLookup,
  useCategoriesLookup,
  useWarehousesLookup,
} from '@/hooks/queries/useLookups';
import { usePermission } from '@/hooks/usePermission';
import { ProductFormDrawer } from './ProductFormDrawer';
import { ProductDetailDrawer } from './ProductDetailDrawer';
import { ImportProductsModal } from './ImportProductsModal';
import {
  PrintBarcodeModal,
  type PrintBarcodeTarget,
} from '@/components/PrintBarcodeModal';
import { formatMoney } from '@/lib/format';
import { getErrorMessage } from '@/lib/api';
import { printBarcodeLabels } from '@/utils/printBarcode';
import type {
  ProductListRow,
  ProductSortField,
  QueryProductParams,
} from '@/types/product';

const { useBreakpoint } = Grid;

const DEFAULT_PAGE_SIZE = 20;

/**
 * Sum of `WarehouseStocks` on the row. When a warehouse filter is active,
 * the API returns only that warehouse's qty — so this becomes
 * "qty in that warehouse". When no filter is active, it sums across all
 * warehouses (grand total on hand).
 */
function stockSum(row: ProductListRow): number | null {
  if (!row.WarehouseStocks) return null;
  return row.WarehouseStocks.reduce((s, ws) => s + ws.Qty, 0);
}

export function ProductsListPage() {
  const { message, modal } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const canCreate = usePermission('products.create');
  const canUpdate = usePermission('products.update');
  const canDelete = usePermission('products.delete');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [brandId, setBrandId] = useState<string | undefined>();
  const [warehouseId, setWarehouseId] = useState<string | undefined>();
  const [inStock, setInStock] = useState(false);
  const [lowStock, setLowStock] = useState(false);
  const [isActive, setIsActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<ProductSortField>('CreatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

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
      WarehouseId: warehouseId,
      inStock: inStock || undefined,
      lowStock: lowStock || undefined,
      IsActive:
        isActive === 'all' ? undefined : isActive === 'active' ? true : false,
      sortBy,
      sortOrder,
    }),
    [
      page,
      limit,
      search,
      categoryId,
      brandId,
      warehouseId,
      inStock,
      lowStock,
      isActive,
      sortBy,
      sortOrder,
    ],
  );

  const { data, isLoading, isFetching } = useProducts(query);
  const { data: categories = [] } = useCategoriesLookup();
  const { data: brands = [] } = useBrandsLookup();
  const { data: warehouses = [] } = useWarehousesLookup();
  const deleteMutation = useDeleteProduct();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProductListRow | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [printTarget, setPrintTarget] = useState<{
    rows: ProductListRow[];
    mode: 'single' | 'bulk';
  } | null>(null);

  const selectedWarehouse = warehouses.find((w) => w.Id === warehouseId);

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
    setWarehouseId(undefined);
    setInStock(false);
    setLowStock(false);
    setIsActive('all');
    setPage(1);
  };

  const requestPrintOne = (row: ProductListRow) => {
    if (!row.Barcode) {
      message.warning('This product has no barcode — add one first.');
      return;
    }
    setPrintTarget({ rows: [row], mode: 'single' });
  };

  const requestPrintSelected = () => {
    if (!data) return;
    const rows = data.data.filter((r) => selectedRowKeys.includes(r.Id));
    const withBarcode = rows.filter((r) => r.Barcode);
    if (withBarcode.length === 0) {
      message.warning('None of the selected products have a barcode.');
      return;
    }
    if (withBarcode.length < rows.length) {
      message.info(
        `${rows.length - withBarcode.length} product(s) skipped — no barcode.`,
      );
    }
    setPrintTarget({ rows: withBarcode, mode: 'bulk' });
  };

  const handlePrintConfirm = (copies: number) => {
    if (!printTarget) return;
    printBarcodeLabels(
      printTarget.rows.map((r) => ({
        productName: r.Name,
        barcode: r.Barcode!,
        price: Number(r.Price),
        copies,
      })),
    );
    setPrintTarget(null);
  };

  const modalTarget: PrintBarcodeTarget | null = printTarget?.rows[0]
    ? {
      productName: printTarget.rows[0].Name,
      barcode: printTarget.rows[0].Barcode ?? '',
      price: Number(printTarget.rows[0].Price),
    }
    : null;

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
            <Flex gap={6} wrap="wrap">
              {row.SKU && (
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  SKU: {row.SKU}
                </Typography.Text>
              )}
              {row.Barcode && (
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  · {row.Barcode}
                </Typography.Text>
              )}
            </Flex>
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
        title: selectedWarehouse ? `Stock · ${selectedWarehouse.Name}` : 'Stock',
        key: 'stock',
        align: 'right',
        width: selectedWarehouse ? 160 : 100,
        render: (_: unknown, row) => {
          const qty = stockSum(row);
          if (qty === null) {
            return <Typography.Text type="secondary">—</Typography.Text>;
          }
          const low = qty > 0 && qty <= row.ReorderLevel;
          const zero = qty <= 0;
          const content = (
            <Flex align="center" justify="flex-end" gap={4}>
              {low && <AlertTriangle size={11} color="#f59e0b" />}
              <Typography.Text
                strong
                style={{
                  color: zero ? '#dc2626' : low ? '#f59e0b' : undefined,
                }}
              >
                {qty.toLocaleString()}
              </Typography.Text>
            </Flex>
          );
          return selectedWarehouse ? (
            <Tooltip title={`Qty in ${selectedWarehouse.Name}`}>
              {content}
            </Tooltip>
          ) : (
            content
          );
        },
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
              title="View detail"
            />
            <Tooltip title={row.Barcode ? 'Print barcode' : 'No barcode set'}>
              <Button
                type="text"
                size="small"
                icon={<Printer size={14} />}
                disabled={!row.Barcode}
                onClick={() => requestPrintOne(row)}
              />
            </Tooltip>
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
    [sortBy, sortOrder, canUpdate, canDelete, selectedWarehouse],
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
      return <Empty description="No products" style={{ padding: 32 }} />;
    }
    return (
      <Flex vertical gap={8}>
        {data.data.map((row) => {
          const qty = stockSum(row);
          const low = qty !== null && qty > 0 && qty <= row.ReorderLevel;
          const zero = qty !== null && qty <= 0;
          return (
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
                    {qty !== null && (
                      <Tag
                        color={zero ? 'red' : low ? 'orange' : 'cyan'}
                        style={{ marginInlineEnd: 0 }}
                      >
                        {selectedWarehouse
                          ? `${selectedWarehouse.Name}: ${qty}`
                          : `Stock ${qty}`}
                      </Tag>
                    )}
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
                  <Button
                    type="text"
                    size="small"
                    icon={<Printer size={14} />}
                    disabled={!row.Barcode}
                    onClick={() => requestPrintOne(row)}
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
          );
        })}
      </Flex>
    );
  };

  const handleTableChange: NonNullable<
    TableProps<ProductListRow>['onChange']
  > = (pagination, _filters, sorter) => {
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
        <Flex gap={8} wrap="wrap">
          {selectedRowKeys.length > 0 && (
            <Button
              icon={<Printer size={16} />}
              onClick={requestPrintSelected}
            >
              Print {selectedRowKeys.length} barcode
              {selectedRowKeys.length === 1 ? '' : 's'}
            </Button>
          )}
          {canCreate && (
            <Button
              icon={<UploadIcon size={16} />}
              onClick={() => setImportOpen(true)}
            >
              {isMobile ? 'Import' : 'Import from Excel'}
            </Button>
          )}
          {canCreate && (
            <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>
              {isMobile ? 'New' : 'New product'}
            </Button>
          )}
        </Flex>
      </Flex>

      <Card size="small" styles={{ body: { padding: isMobile ? 12 : 16 } }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={7}>
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, SKU, barcode"
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
              options={categories.map((c) => ({ label: c.Name, value: c.Id }))}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} md={4}>
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
          <Col xs={24} md={5}>
            <Select
              value={warehouseId}
              onChange={(v) => {
                setWarehouseId(v);
                setPage(1);
              }}
              placeholder="All warehouses"
              allowClear
              showSearch
              optionFilterProp="label"
              options={warehouses.map((w) => ({
                label: w.Name,
                value: w.Id,
              }))}
              suffixIcon={<WarehouseIcon size={12} color="#94a3b8" />}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} md={3}>
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
          <Col xs={24} md={24}>
            <Flex align="center" gap={16} wrap="wrap">
              <Flex align="center" gap={6}>
                <Switch
                  size="small"
                  checked={inStock}
                  onChange={(v) => {
                    setInStock(v);
                    setPage(1);
                  }}
                />
                <Typography.Text style={{ fontSize: 12 }}>
                  In stock only
                  {selectedWarehouse
                    ? ` in ${selectedWarehouse.Name}`
                    : ' (any warehouse)'}
                </Typography.Text>
              </Flex>
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
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
              getCheckboxProps: (row) => ({
                disabled: !row.Barcode,
              }),
            }}
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

      <ProductFormDrawer
        open={formOpen}
        product={editing}
        onClose={() => setFormOpen(false)}
      />
      <ProductDetailDrawer
        productId={detailId}
        onClose={() => setDetailId(null)}
      />
      <PrintBarcodeModal
        open={!!printTarget}
        target={modalTarget}
        totalProducts={printTarget?.rows.length ?? 1}
        onConfirm={handlePrintConfirm}
        onCancel={() => setPrintTarget(null)}
      />
      <ImportProductsModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />
    </Flex>
  );
}