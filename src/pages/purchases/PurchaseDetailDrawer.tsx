import { useState } from 'react';
import { FileText } from 'lucide-react';
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
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DollarSign } from 'lucide-react';
import { usePurchase } from '@/hooks/queries/usePurchases';
import { usePermission } from '@/hooks/usePermission';
import { CreateSupplierPaymentDrawer } from '@/pages/supplier-payments/CreateSupplierPaymentDrawer';
import { formatMoney, formatDate, formatDateTime } from '@/lib/format';
import type {
    PurchaseItemRow,
    PurchasePaymentRef,
    PurchaseChequeRef,
} from '@/types/purchase';
import { CreateSupplierChequeDrawer } from '../supplier-cheques/CreateSupplierChequeDrawer';

const { useBreakpoint } = Grid;

interface Props {
    purchaseId: string | null;
    onClose: () => void;
}

export function PurchaseDetailDrawer({ purchaseId, onClose }: Props) {
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const { data, isLoading } = usePurchase(purchaseId);

    const canIssueCheque = usePermission('supplier_cheques.create');
    const [chequeOpen, setChequeOpen] = useState(false);

    const canPay = usePermission('supplier_payments.create');
    const [paymentOpen, setPaymentOpen] = useState(false);

    const itemColumns: ColumnsType<PurchaseItemRow> = [
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
        },
        {
            title: 'Unit cost',
            dataIndex: 'UnitCost',
            key: 'UnitCost',
            align: 'right',
            render: (v: string) => formatMoney(v),
        },
        {
            title: 'Tax',
            dataIndex: 'LineTax',
            key: 'LineTax',
            align: 'right',
            render: (v: string) => formatMoney(v),
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

    const paymentColumns: ColumnsType<PurchasePaymentRef> = [
        {
            title: 'Date',
            dataIndex: 'PaidAt',
            key: 'PaidAt',
            render: (v: string) => (
                <Typography.Text style={{ fontSize: 12 }}>
                    {formatDateTime(v)}
                </Typography.Text>
            ),
        },
        {
            title: 'Method',
            dataIndex: 'Method',
            key: 'Method',
            render: (v: string) => <Tag>{v}</Tag>,
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
    ];

    const chequeColumns: ColumnsType<PurchaseChequeRef> = [
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

    const hasOutstanding =
        !!data && Number(data.TotalAmount) > Number(data.PaidAmount);

    return (
        <>
            <Drawer
                title={data ? `Purchase ${data.Code}` : 'Purchase'}
                open={!!purchaseId}
                onClose={onClose}
                width={isMobile ? '100%' : 720}
                destroyOnClose
                extra={
                    data && data.Status === 'POSTED' && hasOutstanding ? (
                        <Flex gap={8}>
                            {canPay && (
                                <Button
                                    icon={<DollarSign size={14} />}
                                    onClick={() => setPaymentOpen(true)}
                                >
                                    Record payment
                                </Button>
                            )}
                            {canIssueCheque && (
                                <Button
                                    type="primary"
                                    icon={<FileText size={14} />}
                                    onClick={() => setChequeOpen(true)}
                                >
                                    Issue cheque
                                </Button>
                            )}
                        </Flex>
                    ) : null
                }
            >
                {isLoading || !data ? (
                    <Skeleton active paragraph={{ rows: 10 }} />
                ) : (
                    <Flex vertical gap={16}>
                        <Descriptions
                            bordered
                            size="small"
                            column={isMobile ? 1 : 2}
                            items={[
                                {
                                    key: 'status',
                                    label: 'Status',
                                    children: (
                                        <Tag color={data.Status === 'POSTED' ? 'green' : 'default'}>
                                            {data.Status}
                                        </Tag>
                                    ),
                                },
                                {
                                    key: 'supplier',
                                    label: 'Supplier',
                                    children: `${data.Supplier.Name} (${data.Supplier.Code})`,
                                },
                                {
                                    key: 'supplier-inv',
                                    label: 'Supplier invoice',
                                    children: data.SupplierInvoiceNo ?? '—',
                                },
                                {
                                    key: 'warehouse',
                                    label: 'Warehouse',
                                    children: `${data.Warehouse.Name} (${data.Warehouse.Code})`,
                                },
                                {
                                    key: 'inv-date',
                                    label: 'Invoice date',
                                    children: formatDate(data.InvoiceDate),
                                },
                                {
                                    key: 'due-date',
                                    label: 'Due date',
                                    children: data.DueDate ? formatDate(data.DueDate) : '—',
                                },
                                {
                                    key: 'subtotal',
                                    label: 'Subtotal',
                                    children: formatMoney(data.Subtotal),
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
                                    key: 'paid',
                                    label: 'Paid',
                                    children: formatMoney(data.PaidAmount),
                                },
                                {
                                    key: 'balance',
                                    label: 'Balance owed',
                                    children: (
                                        <Typography.Text
                                            strong
                                            style={{
                                                color: hasOutstanding ? '#dc2626' : '#16a34a',
                                            }}
                                        >
                                            {formatMoney(
                                                (
                                                    Number(data.TotalAmount) - Number(data.PaidAmount)
                                                ).toFixed(4),
                                            )}
                                        </Typography.Text>
                                    ),
                                    span: isMobile ? 1 : 2,
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
                                Items ({data.Items.length})
                            </Typography.Title>
                            <Table<PurchaseItemRow>
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
                                <Table<PurchasePaymentRef>
                                    rowKey="Id"
                                    columns={paymentColumns}
                                    dataSource={data.Payments}
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
                                <Table<PurchaseChequeRef>
                                    rowKey="Id"
                                    columns={chequeColumns}
                                    dataSource={data.Cheques}
                                    pagination={false}
                                    size="small"
                                />
                            </div>
                        )}

                        {data.Payments.length === 0 && data.Cheques.length === 0 && (
                            <>
                                <Divider style={{ margin: 0 }} />
                                <Empty
                                    description="No payments or cheques yet"
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                />
                            </>
                        )}
                    </Flex>
                )}
            </Drawer>

            {/* Payment drawer — mounted always, opens via state. */}
            <CreateSupplierPaymentDrawer
                open={paymentOpen}
                presetPurchaseId={purchaseId}
                onClose={() => setPaymentOpen(false)}
            />
            <CreateSupplierChequeDrawer
                open={chequeOpen}
                presetPurchaseId={purchaseId}
                onClose={() => setChequeOpen(false)}
            />
        </>
    );
}