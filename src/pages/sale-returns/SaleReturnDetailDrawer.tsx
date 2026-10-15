import {
  Drawer,
  Descriptions,
  Table,
  Typography,
  Flex,
  Skeleton,
  Grid,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useSaleReturn } from '@/hooks/queries/useSaleReturns';
import { formatMoney, formatDateTime } from '@/lib/format';
import type { SaleReturnItemRow } from '@/types/saleReturn';

const { useBreakpoint } = Grid;

interface Props {
  returnId: string | null;
  onClose: () => void;
}

export function SaleReturnDetailDrawer({ returnId, onClose }: Props) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const { data, isLoading } = useSaleReturn(returnId);

  const columns: ColumnsType<SaleReturnItemRow> = [
    {
      title: 'Product',
      key: 'product',
      render: (_: unknown, row) => (
        <Flex vertical gap={2}>
          <Typography.Text>{row.Product.Name}</Typography.Text>
          {row.Product.SKU && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {row.Product.SKU}
            </Typography.Text>
          )}
        </Flex>
      ),
    },
    {
      title: 'Qty',
      dataIndex: 'Qty',
      key: 'qty',
      align: 'right',
    },
    {
      title: 'Unit price',
      dataIndex: 'UnitPrice',
      key: 'unitPrice',
      align: 'right',
      render: (v: string) => formatMoney(v),
    },
    {
      title: 'Refund',
      dataIndex: 'RefundAmount',
      key: 'refund',
      align: 'right',
      render: (v: string) => formatMoney(v),
    },
  ];

  return (
    <Drawer
      title={data ? `Return ${data.Code}` : 'Sale return'}
      open={!!returnId}
      onClose={onClose}
      width={isMobile ? '100%' : 640}
      destroyOnClose
    >
      {isLoading || !data ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        <Flex vertical gap={16}>
          <Descriptions
            bordered
            size="small"
            column={isMobile ? 1 : 2}
            items={[
              {
                key: 'date',
                label: 'Date',
                children: formatDateTime(data.CreatedAt),
              },
              {
                key: 'method',
                label: 'Refund to',
                children: (
                  <Tag color={data.RefundMethod === 'CASH' ? 'green' : 'blue'}>
                    {data.RefundMethod}
                  </Tag>
                ),
              },
              {
                key: 'sale',
                label: 'Original sale',
                children: data.Sale.InvoiceNumber,
              },
              {
                key: 'customer',
                label: 'Customer',
                children: data.Customer
                  ? `${data.Customer.Name} (${data.Customer.Code})`
                  : 'Walk-in',
              },
               {
                key: 'subtotal',
                label: 'Subtotal (after discount)',
                children: formatMoney(data.Subtotal),
              },
              {
                key: 'tax',
                label: 'Tax',
                children: formatMoney(data.TaxAmount),
              },
              {
                key: 'refund',
                label: 'Refund total',
                span: isMobile ? 1 : 2,
                children: (
                  <Typography.Text strong style={{ color: '#dc2626' }}>
                    − {formatMoney(data.RefundAmount)}
                  </Typography.Text>
                ),
              },
            ]}
          />

          {data.Notes && (
            <div>
              <Typography.Text strong>Notes</Typography.Text>
              <Typography.Paragraph
                type="secondary"
                style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}
              >
                {data.Notes}
              </Typography.Paragraph>
            </div>
          )}

          <div>
            <Typography.Title level={5} style={{ marginBottom: 8 }}>
              Returned items
            </Typography.Title>
            <Table<SaleReturnItemRow>
              rowKey="Id"
              dataSource={data.Items}
              columns={columns}
              size="small"
              pagination={false}
            />
          </div>
        </Flex>
      )}
    </Drawer>
  );
}