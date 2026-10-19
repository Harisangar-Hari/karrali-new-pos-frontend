import { useState } from 'react';
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
  Button,
  Modal,
  InputNumber,
  App,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Printer } from 'lucide-react';
import { useProduct } from '@/hooks/queries/useProducts';
import { BarcodePreview } from '@/components/BarcodePreview';
import { printBarcodeLabels } from '@/utils/printBarcode';
import { formatMoney, formatQty, formatDateTime } from '@/lib/format';
import type { WarehouseStockRow } from '@/types/product';

const { useBreakpoint } = Grid;

interface Props {
  productId: string | null;
  onClose: () => void;
}

export function ProductDetailDrawer({ productId, onClose }: Props) {
  const { message } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const { data, isLoading } = useProduct(productId);

  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [copies, setCopies] = useState(1);

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

  const handlePrintBarcode = () => {
    if (!data) return;
    if (!data.Barcode) {
      message.warning('This product has no barcode.');
      return;
    }
    printBarcodeLabels([
      {
        productName: data.Name,
        barcode: data.Barcode,
        price: Number(data.Price),
        copies: Math.max(1, copies),
      },
    ]);
    setBarcodeModalOpen(false);
    setCopies(1);
  };

  return (
    <>
      <Drawer
        title={data?.Name ?? 'Product'}
        open={!!productId}
        onClose={onClose}
        width={isMobile ? '100%' : 640}
        destroyOnClose
        extra={
          data?.Barcode ? (
            <Button
              icon={<Printer size={14} />}
              onClick={() => setBarcodeModalOpen(true)}
            >
              Print barcode
            </Button>
          ) : null
        }
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

      <Modal
        title="Print barcode labels"
        open={barcodeModalOpen}
        onCancel={() => {
          setBarcodeModalOpen(false);
          setCopies(1);
        }}
        onOk={handlePrintBarcode}
        okText="Print"
        destroyOnClose
        width={420}
      >
        {data && data.Barcode && (
          <Flex vertical gap={16}>
            <BarcodePreview value={data.Barcode} />
            <Flex vertical gap={4}>
              <Typography.Text style={{ fontSize: 13 }}>
                Number of labels
              </Typography.Text>
              <InputNumber
                value={copies}
                onChange={(v) => setCopies(Math.max(1, Number(v ?? 1)))}
                min={1}
                max={100}
                precision={0}
                style={{ width: '100%' }}
              />
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                Each label prints on its own sticker (advances the paper).
              </Typography.Text>
            </Flex>
          </Flex>
        )}
      </Modal>
    </>
  );
}