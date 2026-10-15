import {
  Drawer,
  Descriptions,
  Table,
  Tag,
  Flex,
  Typography,
  Skeleton,
  Grid,
  Empty,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useProduct } from '@/hooks/queries/useProducts';
import {
  formatMoney,
  formatQty,
  formatDateTime,
} from '@/lib/format';
import type { WarehouseStockRow } from '@/types/product';

const { useBreakpoint } = Grid;

interface Props {
  productId: string | null;
  onClose: () => void;
}

export function ProductDetailDrawer({ productId, onClose }: Props) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const { data, isLoading } = useProduct(productId);

  const stockColumns: ColumnsType<WarehouseStockRow> = [
    {
      title: 'Warehouse',
      dataIndex: ['Warehouse', 'Name'],
      key: 'warehouse',
      render: (_: unknown, row) => (
        <Flex vertical>
          <Typography.Text>{row.Warehouse.Name}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {row.Warehouse.Code}
          </Typography.Text>
        </Flex>
      ),
    },
    {
      title: 'Qty',
      dataIndex: 'Qty',
      key: 'qty',
      align: 'right',
      render: (v: number) => formatQty(v, 0),
    },
  ];

  return (
    <Drawer
      title={data?.Name ?? 'Product'}
      open={!!productId}
      onClose={onClose}
      width={isMobile ? '100%' : 640}
      destroyOnClose
    >
      {isLoading || !data ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        <Flex vertical gap={16}>
          {data.ImageUrl && (
            <img
              src={data.ImageUrl}
              alt={data.Name}
              style={{
                width: '100%',
                maxHeight: 240,
                objectFit: 'contain',
                background: '#f5f5f5',
                borderRadius: 6,
              }}
            />
          )}

          <Descriptions
            bordered
            size="small"
            column={isMobile ? 1 : 2}
            items={[
              { key: 'sku', label: 'SKU', children: data.SKU ?? '—' },
              { key: 'barcode', label: 'Barcode', children: data.Barcode ?? '—' },
              { key: 'category', label: 'Category', children: data.Category.Name },
              { key: 'brand', label: 'Brand', children: data.Brand?.Name ?? '—' },
              { key: 'unit', label: 'Unit', children: data.Unit },
              { key: 'price', label: 'Price', children: formatMoney(data.Price) },
              { key: 'cost', label: 'Cost', children: formatMoney(data.CostPrice) },
              { key: 'discount', label: 'Discount %', children: `${data.Discount}%` },
              {
                key: 'tax',
                label: 'Tax rate',
                children: data.TaxRate ? `${data.TaxRate}%` : '—',
              },
              {
                key: 'reorder',
                label: 'Reorder level',
                children: data.ReorderLevel,
              },
              {
                key: 'warranty',
                label: 'Warranty',
                children: data.WarrantyMonths
                  ? `${data.WarrantyMonths} mo`
                  : '—',
              },
              {
                key: 'status',
                label: 'Status',
                children: data.IsActive ? (
                  <Tag color="green">Active</Tag>
                ) : (
                  <Tag>Inactive</Tag>
                ),
              },
              {
                key: 'created',
                label: 'Created',
                children: formatDateTime(data.CreatedAt),
                span: isMobile ? 1 : 2,
              },
            ]}
          />

          {data.Description && (
            <div>
              <Typography.Text strong>Description</Typography.Text>
              <Typography.Paragraph
                style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}
              >
                {data.Description}
              </Typography.Paragraph>
            </div>
          )}

          <div>
            <Typography.Title level={5} style={{ marginBottom: 8 }}>
              Stock by warehouse
            </Typography.Title>
            {data.WarehouseStocks.length === 0 ? (
              <Empty description="No stock records yet" />
            ) : (
              <Table
                dataSource={data.WarehouseStocks}
                columns={stockColumns}
                rowKey="Id"
                size="small"
                pagination={false}
              />
            )}
          </div>
        </Flex>
      )}
    </Drawer>
  );
}