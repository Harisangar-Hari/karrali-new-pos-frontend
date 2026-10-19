import { useState } from 'react';
import {
    Card,
    Descriptions,
    Flex,
    Grid,
    Statistic,
    Tabs,
    Tag,
    Typography,
    Button,
    Skeleton,
    Progress,
    Space,
} from 'antd';
import {
    ArrowLeft,
    Pencil,
    Wallet,
    Mail,
    Phone,
    MapPin,
    FileText,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    useCustomer,
    useCustomerCreditStatus,
} from '@/hooks/queries/useCustomers';
import { CustomerLedgerTable } from './CustomerLedgerTable';
import { CustomerFormDrawer } from './CustomerFormDrawer';
import { AdjustBalanceModal } from './AdjustBalanceModal';
import { usePermission } from '@/hooks/usePermission';
import { formatMoney, formatDate } from '@/lib/format';
import { DollarSign } from 'lucide-react';
import { CreateCreditPaymentDrawer } from '@/pages/credit-payments/CreateCreditPaymentDrawer';
import { CustomerPaymentsTab } from './CustomerPaymentsTab';
import { CustomerChequesTab } from './CustomerChequesTab';
import { CustomerLoyaltyTab } from './CustomerLoyaltyTab';

const { useBreakpoint } = Grid;

export function CustomerDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const canUpdate = usePermission('customers.update');

    const { data: customer, isLoading } = useCustomer(id ?? null);
    const { data: credit } = useCustomerCreditStatus(id ?? null);

    const [editOpen, setEditOpen] = useState(false);
    const [adjustOpen, setAdjustOpen] = useState(false);
    const [paymentOpen, setPaymentOpen] = useState(false);

    if (isLoading || !customer) {
        return <Skeleton active paragraph={{ rows: 10 }} />;
    }

    const balance = Number(customer.Balance);
    const limit = Number(customer.CreditLimit);
    const pct = limit > 0 ? Math.min(100, (balance / limit) * 100) : 0;
    const overLimit = credit?.OverLimit ?? false;

    return (
        <Flex vertical gap={16}>
            <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
                <Flex align="center" gap={8} style={{ flex: 1, minWidth: 0 }}>
                    <Button
                        type="text"
                        icon={<ArrowLeft size={16} />}
                        onClick={() => navigate('/customers')}
                    />
                    <Flex vertical gap={2} style={{ minWidth: 0 }}>
                        <Typography.Title
                            level={3}
                            style={{ margin: 0, fontSize: 'clamp(1.1rem, 3vw, 1.5rem)' }}
                            ellipsis
                        >
                            {customer.Name}
                        </Typography.Title>
                        <Flex align="center" gap={6}>
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                {customer.Code}
                            </Typography.Text>
                            <Tag color="cyan">{customer.Type}</Tag>
                            {!customer.IsActive && <Tag>Inactive</Tag>}
                        </Flex>
                    </Flex>
                </Flex>
                {canUpdate && (
                    <Space wrap>
                        <Button
                            icon={<DollarSign size={14} />}
                            onClick={() => setPaymentOpen(true)}
                        >
                            Record payment
                        </Button>
                        <Button
                            icon={<Wallet size={14} />}
                            onClick={() => setAdjustOpen(true)}
                        >
                            Adjust balance
                        </Button>

                    </Space>
                )}
                {canUpdate && (
                    <Space>
                        <Button
                            icon={<Wallet size={14} />}
                            onClick={() => setAdjustOpen(true)}
                        >
                            Adjust balance
                        </Button>
                        <Button
                            type="primary"
                            icon={<Pencil size={14} />}
                            onClick={() => setEditOpen(true)}
                        >
                            Edit
                        </Button>
                    </Space>
                )}
            </Flex>

            {/* Credit summary cards */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                    gap: 16,
                }}
            >
                <Card>
                    <Statistic
                        title="Current balance"
                        value={formatMoney(customer.Balance)}
                        valueStyle={{ color: balance > 0 ? '#dc2626' : undefined }}
                    />
                </Card>
                <Card>
                    <Statistic
                        title="Credit limit"
                        value={formatMoney(customer.CreditLimit)}
                    />
                </Card>
                <Card>
                    <Statistic
                        title="Available credit"
                        value={formatMoney(credit?.Available ?? '0')}
                        valueStyle={{ color: overLimit ? '#dc2626' : '#16a34a' }}
                    />
                    {limit > 0 && (
                        <Progress
                            percent={Math.round(pct)}
                            showInfo={false}
                            strokeColor={overLimit ? '#dc2626' : '#0d9488'}
                            style={{ marginTop: 8 }}
                        />
                    )}
                    {overLimit && (
                        <Typography.Text type="danger" style={{ fontSize: 11 }}>
                            Over credit limit
                        </Typography.Text>
                    )}
                </Card>
            </div>

            <Card>
                <Tabs
                    defaultActiveKey="overview"
                    items={[
                        {
                            key: 'overview',
                            label: 'Overview',
                            children: <OverviewTab customer={customer} isMobile={isMobile} />,
                        },
                        {
                            key: 'ledger',
                            label: 'Ledger',
                            children: id ? <CustomerLedgerTable customerId={id} /> : null,
                        },
                        {
                            key: 'payments',
                            label: 'Credit payments',
                            children: id ? <CustomerPaymentsTab customerId={id} /> : null,
                        },
                        {
                            key: 'cheques',
                            label: 'Cheques',
                            children: id ? <CustomerChequesTab customerId={id} /> : null,
                        },
                        {
                            key: 'loyalty',
                            label: 'Loyalty',
                            children: id ? <CustomerLoyaltyTab customerId={id} /> : null,
                        },
                    ]}
                />
            </Card>

            <CustomerFormDrawer
                open={editOpen}
                customer={customer}
                onClose={() => setEditOpen(false)}
            />
            <AdjustBalanceModal
                open={adjustOpen}
                customer={customer}
                onClose={() => setAdjustOpen(false)}
            />
            <CreateCreditPaymentDrawer
                open={paymentOpen}
                customerId={id ?? null}
                onClose={() => setPaymentOpen(false)}
            />
        </Flex>
    );
}

function OverviewTab({
    customer,
    isMobile,
}: {
    customer: NonNullable<ReturnType<typeof useCustomer>['data']>;
    isMobile: boolean;
}) {
    type DescriptionItem = NonNullable<
        React.ComponentProps<typeof Descriptions>['items']
    >[number];
    const items: DescriptionItem[] = [
        { key: 'code', label: 'Code', children: customer.Code },
        { key: 'type', label: 'Type', children: customer.Type },
    ];

    if (customer.Phone) {
        items.push({
            key: 'phone',
            label: 'Phone',
            children: (
                <Flex align="center" gap={4}>
                    <Phone size={12} color="#94a3b8" />
                    {customer.Phone}
                </Flex>
            ),
        });
    }
    if (customer.Email) {
        items.push({
            key: 'email',
            label: 'Email',
            children: (
                <Flex align="center" gap={4}>
                    <Mail size={12} color="#94a3b8" />
                    {customer.Email}
                </Flex>
            ),
        });
    }
    if (customer.Address) {
        items.push({
            key: 'address',
            label: 'Address',
            span: isMobile ? 1 : 2,
            children: (
                <Flex align="flex-start" gap={4}>
                    <MapPin size={12} color="#94a3b8" style={{ marginTop: 4 }} />
                    <span style={{ whiteSpace: 'pre-wrap' }}>{customer.Address}</span>
                </Flex>
            ),
        });
    }
    if (customer.TaxNumber) {
        items.push({
            key: 'tax',
            label: 'Tax number',
            children: (
                <Flex align="center" gap={4}>
                    <FileText size={12} color="#94a3b8" />
                    {customer.TaxNumber}
                </Flex>
            ),
        });
    }
    if (customer.PaymentTerms) {
        items.push({
            key: 'terms',
            label: 'Payment terms',
            children: customer.PaymentTerms,
        });
    }
    items.push({
        key: 'created',
        label: 'Created',
        children: formatDate(customer.CreatedAt),
    });
    items.push({
        key: 'updated',
        label: 'Last updated',
        children: formatDate(customer.UpdatedAt),
    });

    return (
        <Flex vertical gap={16}>
            <Descriptions
                bordered
                size="small"
                column={isMobile ? 1 : 2}
                items={items}
            />
            {customer.Notes && (
                <div>
                    <Typography.Text strong>Notes</Typography.Text>
                    <Typography.Paragraph
                        style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}
                        type="secondary"
                    >
                        {customer.Notes}
                    </Typography.Paragraph>
                </div>
            )}
        </Flex>
    );
}