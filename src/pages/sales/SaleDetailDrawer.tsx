import { useState } from 'react';
import {
  Drawer,
  Descriptions,
  Flex,
  Grid,
  Skeleton,
  Table,
  Tag,
  Typography,
  Divider,
  Empty,
  Button,
  Alert,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { XCircle, Gift } from 'lucide-react';
import { useSale } from '@/hooks/queries/useSales';
import { usePermission } from '@/hooks/usePermission';
import { CancelSaleModal } from './CancelSaleModal';
import { formatMoney, formatDate, formatDateTime } from '@/lib/format';
import type {
  SaleItemRow,
  SalePaymentRow,
  SaleReturnRef,
  SaleChequeRef,
  SaleStatus,
  SalePaymentMethod,
} from '@/types/sale';

const { useBreakpoint } = Grid;

interface Props {
  saleId: string | null;
  onClose: () => void;
}

const STATUS_COLOR: Record<SaleStatus, string> = {
  COMPLETED: 'green',
  PARTIALLY_RETURNED: 'orange',
  FULLY_RETURNED: 'purple',
  CANCELLED: 'default',
};

const METHOD_COLOR: Record<SalePaymentMethod, string> = {
  CASH: 'green',
  CARD: 'blue',
  CREDIT: 'red',
  CHEQUE: 'purple',
};

export function SaleDetailDrawer({ saleId, onClose }: Props) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const { data, isLoading } = useSale(saleId);

  const canVoid = usePermission('sales.void');
  const [cancelOpen, setCancelOpen] = useState(false);

  const itemColumns: ColumnsType<SaleItemRow> = [
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
      key: 'Qty',
      align: 'right',
      render: (v: number, row) => (
        <Flex vertical gap={0} align="flex-end">
          <Typography.Text>{v}</Typography.Text>
          {row.ReturnedQty > 0 && (
            <Typography.Text
              style={{ fontSize: 10, color: '#f59e0b' }}
            >
              {row.ReturnedQty} returned
            </Typography.Text>
          )}
        </Flex>
      ),
    },
    {
      title: 'Unit price',
      dataIndex: 'UnitPrice',
      key: 'UnitPrice',
      align: 'right',
      render: (v: string) => formatMoney(v),
    },
    {
      title: 'Disc',
      dataIndex: 'Discount',
      key: 'Discount',
      align: 'right',
      render: (v: string) =>
        Number(v) > 0 ? (
          <Typography.Text style={{ color: '#16a34a' }}>
            −{Number(v).toFixed(2)}%
          </Typography.Text>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
    {
      title: 'Line total',
      dataIndex: 'LineTotal',
      key: 'LineTotal',
      align: 'right',
      render: (v: string) => (
        <Typography.Text strong>{formatMoney(v)}</Typography.Text>
      ),
    },
  ];

  const paymentColumns: ColumnsType<SalePaymentRow> = [
    {
      title: 'Method',
      dataIndex: 'Method',
      key: 'Method',
      render: (m: SalePaymentMethod, row) => (
        <Flex vertical gap={2}>
          <Tag color={METHOD_COLOR[m]} style={{ marginInlineEnd: 0 }}>
            {m}
          </Tag>
          {row.Cheque && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {row.Cheque.ChequeNumber} · {row.Cheque.Status}
            </Typography.Text>
          )}
        </Flex>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'Amount',
      key: 'Amount',
      align: 'right',
      render: (v: string, row) => (
        <Typography.Text delete={!!row.ReversedAt}>
          {formatMoney(v)}
        </Typography.Text>
      ),
    },
    {
      title: 'When',
      dataIndex: 'CreatedAt',
      key: 'CreatedAt',
      render: (v: string) => (
        <Typography.Text style={{ fontSize: 12 }}>
          {formatDateTime(v)}
        </Typography.Text>
      ),
    },
  ];

  const returnColumns: ColumnsType<SaleReturnRef> = [
    {
      title: 'Code',
      dataIndex: 'Code',
      key: 'Code',
      render: (v: string) => <Typography.Text strong>{v}</Typography.Text>,
    },
    {
      title: 'Refund',
      dataIndex: 'RefundMethod',
      key: 'RefundMethod',
      render: (m: 'CASH' | 'CREDIT') => (
        <Tag color={m === 'CASH' ? 'green' : 'blue'}>{m}</Tag>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'RefundAmount',
      key: 'RefundAmount',
      align: 'right',
      render: (v: string) => (
        <Typography.Text style={{ color: '#dc2626' }}>
          − {formatMoney(v)}
        </Typography.Text>
      ),
    },
    {
      title: 'When',
      dataIndex: 'CreatedAt',
      key: 'CreatedAt',
      render: (v: string) => (
        <Typography.Text style={{ fontSize: 12 }}>
          {formatDateTime(v)}
        </Typography.Text>
      ),
    },
  ];

  const chequeColumns: ColumnsType<SaleChequeRef> = [
    {
      title: 'Cheque #',
      dataIndex: 'ChequeNumber',
      key: 'ChequeNumber',
      render: (v: string) => (
        <Typography.Text style={{ fontFamily: 'monospace', fontSize: 12 }}>
          {v}
        </Typography.Text>
      ),
    },
    {
      title: 'Due',
      dataIndex: 'DueDate',
      key: 'DueDate',
      render: (v: string) => formatDate(v),
    },
    {
      title: 'Status',
      dataIndex: 'Status',
      key: 'Status',
      render: (v: string) => (
        <Tag
          color={
            v === 'PENDING'
              ? 'gold'
              : v === 'CLEARED'
                ? 'green'
                : v === 'BOUNCED'
                  ? 'red'
                  : 'default'
          }
        >
          {v}
        </Tag>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'Amount',
      key: 'Amount',
      align: 'right',
      render: (v: string) => formatMoney(v),
    },
  ];

  const canCancel = !!data && data.Status === 'COMPLETED';

  return (
    <>
      <Drawer
        title={data ? `Sale ${data.InvoiceNumber}` : 'Sale'}
        open={!!saleId}
        onClose={onClose}
        width={isMobile ? '100%' : 720}
        destroyOnClose
        extra={
          data && canVoid && canCancel ? (
            <Button
              danger
              icon={<XCircle size={14} />}
              onClick={() => setCancelOpen(true)}
            >
              Cancel sale
            </Button>
          ) : null
        }
      >
        {isLoading || !data ? (
          <Skeleton active paragraph={{ rows: 12 }} />
        ) : (
          <Flex vertical gap={16}>
            {data.Status === 'CANCELLED' && data.CancelReason && (
              <Alert
                type="error"
                showIcon
                message="Sale cancelled"
                description={
                  <>
                    {data.CancelReason}
                    {data.CancelledAt && (
                      <Typography.Text
                        type="secondary"
                        style={{ display: 'block', fontSize: 11, marginTop: 4 }}
                      >
                        on {formatDateTime(data.CancelledAt)}
                      </Typography.Text>
                    )}
                  </>
                }
              />
            )}

            <Descriptions
              bordered
              size="small"
              column={isMobile ? 1 : 2}
              items={[
                {
                  key: 'status',
                  label: 'Status',
                  children: (
                    <Tag color={STATUS_COLOR[data.Status]}>{data.Status}</Tag>
                  ),
                },
                {
                  key: 'date',
                  label: 'Date',
                  children: formatDateTime(data.CreatedAt),
                },
                {
                  key: 'terminal',
                  label: 'Terminal',
                  children: `${data.Terminal.Name} (${data.Terminal.Code})`,
                },
                {
                  key: 'cashier',
                  label: 'Cashier',
                  children:
                    data.Cashier.FullName ?? data.Cashier.Username,
                },
                {
                  key: 'warehouse',
                  label: 'Warehouse',
                  children: `${data.Warehouse.Name} (${data.Warehouse.Code})`,
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
                  label: 'Subtotal',
                  children: formatMoney(data.Subtotal),
                },
                {
                  key: 'discount',
                  label: 'Discount',
                  children:
                    Number(data.DiscountAmount) > 0 ? (
                      <Typography.Text style={{ color: '#16a34a' }}>
                        − {formatMoney(data.DiscountAmount)}
                      </Typography.Text>
                    ) : (
                      '—'
                    ),
                },
                {
                  key: 'tax',
                  label: 'Tax',
                  children: formatMoney(data.TaxAmount),
                },
                {
                  key: 'total',
                  label: 'Total',
                  children: (
                    <Typography.Text strong style={{ color: '#0d9488' }}>
                      {formatMoney(data.TotalAmount)}
                    </Typography.Text>
                  ),
                },
                {
                  key: 'refunded',
                  label: 'Refunded',
                  children:
                    Number(data.RefundedAmount) > 0 ? (
                      <Typography.Text style={{ color: '#dc2626' }}>
                        − {formatMoney(data.RefundedAmount)}
                      </Typography.Text>
                    ) : (
                      '—'
                    ),
                },
                {
                  key: 'paid',
                  label: 'Paid',
                  children: formatMoney(data.PaidAmount),
                },
              ]}
            />

            {/* Payment split chips */}
            <Flex gap={8} wrap="wrap">
              {Number(data.CashAmount) > 0 && (
                <Tag color="green">
                  Cash {formatMoney(data.CashAmount)}
                </Tag>
              )}
              {Number(data.CardAmount) > 0 && (
                <Tag color="blue">
                  Card {formatMoney(data.CardAmount)}
                </Tag>
              )}
              {Number(data.CreditAmount) > 0 && (
                <Tag color="red">
                  Credit {formatMoney(data.CreditAmount)}
                </Tag>
              )}
              {Number(data.ChequeAmount) > 0 && (
                <Tag color="purple">
                  Cheque {formatMoney(data.ChequeAmount)}
                </Tag>
              )}
              {Number(data.LoyaltyDiscountAmount) > 0 && (
                <Tag icon={<Gift size={11} />} color="gold">
                  Loyalty −{formatMoney(data.LoyaltyDiscountAmount)}
                </Tag>
              )}
            </Flex>

            {/* Loyalty block */}
            {(data.LoyaltyEarnedPoints > 0 ||
              data.LoyaltyRedeemedPoints > 0 ||
              data.LoyaltyReversedPoints > 0) && (
              <Flex gap={12} wrap="wrap">
                {data.LoyaltyEarnedPoints > 0 && (
                  <Typography.Text style={{ fontSize: 12 }}>
                    Earned{' '}
                    <strong style={{ color: '#16a34a' }}>
                      +{data.LoyaltyEarnedPoints} pts
                    </strong>
                  </Typography.Text>
                )}
                {data.LoyaltyRedeemedPoints > 0 && (
                  <Typography.Text style={{ fontSize: 12 }}>
                    Redeemed{' '}
                    <strong style={{ color: '#f59e0b' }}>
                      −{data.LoyaltyRedeemedPoints} pts
                    </strong>
                  </Typography.Text>
                )}
                {data.LoyaltyReversedPoints > 0 && (
                  <Typography.Text style={{ fontSize: 12 }}>
                    Reversed{' '}
                    <strong style={{ color: '#dc2626' }}>
                      −{data.LoyaltyReversedPoints} pts
                    </strong>
                  </Typography.Text>
                )}
              </Flex>
            )}

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
                Items ({data.Items.length})
              </Typography.Title>
              <Table<SaleItemRow>
                rowKey="Id"
                columns={itemColumns}
                dataSource={data.Items}
                pagination={false}
                size="small"
              />
            </div>

            {data.Payments.length > 0 && (
              <div>
                <Typography.Title level={5} style={{ marginBottom: 8 }}>
                  Payments ({data.Payments.length})
                </Typography.Title>
                <Table<SalePaymentRow>
                  rowKey="Id"
                  columns={paymentColumns}
                  dataSource={data.Payments}
                  pagination={false}
                  size="small"
                />
              </div>
            )}

            {data.Returns.length > 0 && (
              <div>
                <Typography.Title level={5} style={{ marginBottom: 8 }}>
                  Returns ({data.Returns.length})
                </Typography.Title>
                <Table<SaleReturnRef>
                  rowKey="Id"
                  columns={returnColumns}
                  dataSource={data.Returns}
                  pagination={false}
                  size="small"
                />
              </div>
            )}

            {data.Cheques.length > 0 && (
              <div>
                <Typography.Title level={5} style={{ marginBottom: 8 }}>
                  Cheques ({data.Cheques.length})
                </Typography.Title>
                <Table<SaleChequeRef>
                  rowKey="Id"
                  columns={chequeColumns}
                  dataSource={data.Cheques}
                  pagination={false}
                  size="small"
                />
              </div>
            )}

            {data.Payments.length === 0 &&
              data.Returns.length === 0 &&
              data.Cheques.length === 0 && (
                <>
                  <Divider style={{ margin: 0 }} />
                  <Empty
                    description="No payments or returns yet"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                </>
              )}
          </Flex>
        )}
      </Drawer>

      <CancelSaleModal
        open={cancelOpen}
        sale={data ?? null}
        onClose={() => setCancelOpen(false)}
      />
    </>
  );
}