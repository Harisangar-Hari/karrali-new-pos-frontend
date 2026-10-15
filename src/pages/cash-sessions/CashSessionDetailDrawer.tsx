import { useState } from 'react';
import {
    Drawer,
    Descriptions,
    Flex,
    Grid,
    Skeleton,
    Statistic,
    Card,
    Divider,
    Table,
    Tag,
    Typography,
    Pagination,
    Empty,
    Spin,
    Tooltip,
} from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import { AlertTriangle } from 'lucide-react';
import {
    useCashSessionDetail,
    useExpectedCash,
    useCashLedger,
} from '@/hooks/queries/useCashSession';
import { formatMoney, formatDateTime } from '@/lib/format';
import type {
    CashLedgerRow,
    CashLedgerType,
    ExpectedCashResult,
} from '@/types/cashSession';

const { useBreakpoint } = Grid;

interface Props {
    sessionId: string | null;
    onClose: () => void;
}

const LEDGER_COLOR: Record<CashLedgerType, string> = {
    SALE: 'green',
    SALE_REFUND: 'red',
    CREDIT_PAYMENT: 'blue',
    CREDIT_PAYMENT_REVERSED: 'orange',
    CASH_IN: 'cyan',
    CASH_OUT: 'volcano',
    EXPENSE: 'magenta',
    EXPENSE_REVERSED: 'lime',
    BANK_DEPOSIT: 'purple',
};

interface BreakdownItem {
    key: string;
    label: string;
    /** Ledger types that roll up into this bucket. */
    types: CashLedgerType[];
    /** Positive = inflow to the drawer; negative = outflow. */
    inflow: boolean;
}

/**
 * Semantic grouping for the breakdown strip. Sales / refunds / etc. each
 * correspond to one or more CashLedger.Type values. Order matters — it
 * dictates display order in the strip.
 */
const BREAKDOWN: BreakdownItem[] = [
    {
        key: 'cash-sales',
        label: 'Cash sales',
        types: ['SALE'],
        inflow: true,
    },
    {
        key: 'refunds',
        label: 'Refunds',
        types: ['SALE_REFUND'],
        inflow: false,
    },
    {
        key: 'credit-received',
        label: 'Credit payments',
        types: ['CREDIT_PAYMENT'],
        inflow: true,
    },
    {
        key: 'credit-reversed',
        label: 'Credit reversed',
        types: ['CREDIT_PAYMENT_REVERSED'],
        inflow: false,
    },
    {
        key: 'expenses',
        label: 'Expenses',
        types: ['EXPENSE'],
        inflow: false,
    },
    {
        key: 'expenses-reversed',
        label: 'Expenses reversed',
        types: ['EXPENSE_REVERSED'],
        inflow: true,
    },
    {
        key: 'cash-in',
        label: 'Cash in',
        types: ['CASH_IN'],
        inflow: true,
    },
    {
        key: 'cash-out',
        label: 'Cash out',
        types: ['CASH_OUT'],
        inflow: false,
    },
    {
        key: 'bank-deposit',
        label: 'Bank deposit',
        types: ['BANK_DEPOSIT'],
        inflow: false,
    },
];

interface BreakdownBucket {
    key: string;
    label: string;
    total: string;
    count: number;
    inflow: boolean;
}

/**
 * Sum a bucket's ledger types from the ExpectedCashResult.ByType map.
 * Returns an entry for every bucket, even with 0 entries — the strip
 * stays stable while numbers change during a live shift.
 */
function buildBuckets(expected: ExpectedCashResult | undefined): BreakdownBucket[] {
    if (!expected) return [];

    // Build a fast lookup from LedgerType -> { total: Decimal, count }
    const byType = new Map<string, { total: string; count: number }>();
    for (const [k, v] of Object.entries(expected.ByType)) {
        byType.set(k, v);
    }

    return BREAKDOWN.map((item) => {
        let total = 0;
        let count = 0;
        for (const t of item.types) {
            const row = byType.get(t);
            if (!row) continue;
            total += Number(row.total);
            count += row.count;
        }
        return {
            key: item.key,
            label: item.label,
            total: total.toFixed(4),
            count,
            inflow: item.inflow,
        };
    });
}

export function CashSessionDetailDrawer({ sessionId, onClose }: Props) {
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const { data: session, isLoading: sessionLoading } =
        useCashSessionDetail(sessionId);

    const { data: expected, isLoading: expectedLoading } = useExpectedCash(
        sessionId,
        !!sessionId,
    );

    const [ledgerPage, setLedgerPage] = useState(1);
    const [ledgerLimit, setLedgerLimit] = useState(20);

    const {
        data: ledger,
        isLoading: ledgerLoading,
        isFetching: ledgerFetching,
    } = useCashLedger(
        { CashSessionId: sessionId ?? '', page: ledgerPage, limit: ledgerLimit },
        !!sessionId,
    );

    const buckets = buildBuckets(expected);

    const ledgerColumns: ColumnsType<CashLedgerRow> = [
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
        {
            title: 'Type',
            dataIndex: 'Type',
            key: 'Type',
            render: (t: CashLedgerType) => (
                <Tag color={LEDGER_COLOR[t] ?? 'default'} style={{ marginInlineEnd: 0 }}>
                    {t}
                </Tag>
            ),
        },
        {
            title: 'Amount',
            dataIndex: 'Amount',
            key: 'Amount',
            align: 'right',
            render: (v: string) => {
                const isNeg = v.startsWith('-');
                return (
                    <Typography.Text
                        strong
                        style={{ color: isNeg ? '#dc2626' : '#16a34a' }}
                    >
                        {isNeg ? '−' : '+'} {formatMoney(isNeg ? v.slice(1) : v)}
                    </Typography.Text>
                );
            },
        },
        {
            title: 'Notes',
            dataIndex: 'Notes',
            key: 'Notes',
            render: (v: string | null) =>
                v ?? <Typography.Text type="secondary">—</Typography.Text>,
        },
    ];

    const handleTableChange: NonNullable<
        TableProps<CashLedgerRow>['onChange']
    > = (pagination) => {
        if (pagination.current && pagination.current !== ledgerPage) {
            setLedgerPage(pagination.current);
        }
        if (pagination.pageSize && pagination.pageSize !== ledgerLimit) {
            setLedgerLimit(pagination.pageSize);
            setLedgerPage(1);
        }
    };

    return (
        <Drawer
            title={session ? `Session ${session.Terminal.Code}` : 'Cash session'}
            open={!!sessionId}
            onClose={onClose}
            width={isMobile ? '100%' : 720}
            destroyOnClose
        >
            {sessionLoading || !session ? (
                <Skeleton active paragraph={{ rows: 10 }} />
            ) : (
                <Flex vertical gap={16}>
                    {/* Session header */}
                    <Descriptions
                        bordered
                        size="small"
                        column={isMobile ? 1 : 2}
                        items={[
                            {
                                key: 'status',
                                label: 'Status',
                                children: (
                                    <Tag color={session.Status === 'OPEN' ? 'gold' : 'default'}>
                                        {session.Status}
                                    </Tag>
                                ),
                            },
                            {
                                key: 'cashier',
                                label: 'Cashier',
                                children:
                                    session.Cashier.FullName ?? session.Cashier.Username,
                            },
                            {
                                key: 'terminal',
                                label: 'Terminal',
                                children: `${session.Terminal.Name} (${session.Terminal.Code})`,
                            },
                            {
                                key: 'opened',
                                label: 'Opened',
                                children: formatDateTime(session.OpenedAt),
                            },
                            {
                                key: 'closed',
                                label: 'Closed',
                                children: session.ClosedAt
                                    ? formatDateTime(session.ClosedAt)
                                    : '—',
                            },
                        ]}
                    />

                    {/* 4 headline KPIs */}
                    {expectedLoading || !expected ? (
                        <Skeleton active paragraph={{ rows: 2 }} />
                    ) : (
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
                                gap: 12,
                            }}
                        >
                            <Card size="small">
                                <Statistic
                                    title="Starting cash"
                                    value={formatMoney(expected.StartingCash)}
                                    valueStyle={{ fontSize: 16 }}
                                />
                            </Card>
                            <Card size="small">
                                <Statistic
                                    title={`Net movement (${expected.EntryCount})`}
                                    value={formatMoney(expected.LedgerTotal)}
                                    valueStyle={{
                                        fontSize: 16,
                                        color:
                                            Number(expected.LedgerTotal) < 0 ? '#dc2626' : '#16a34a',
                                    }}
                                />
                            </Card>
                            <Card size="small">
                                <Statistic
                                    title="Expected in drawer"
                                    value={formatMoney(expected.ExpectedCash)}
                                    valueStyle={{ fontSize: 16, color: '#0d9488' }}
                                />
                            </Card>
                            <Card size="small">
                                {session.Status === 'CLOSED' && session.CountedCash !== null ? (
                                    <>
                                        <Statistic
                                            title="Counted"
                                            value={formatMoney(session.CountedCash)}
                                            valueStyle={{ fontSize: 16 }}
                                        />
                                        {session.Difference !== null &&
                                            Math.abs(Number(session.Difference)) > 0.0001 && (
                                                <Flex
                                                    align="center"
                                                    gap={4}
                                                    style={{ marginTop: 4 }}
                                                >
                                                    <AlertTriangle size={11} color="#dc2626" />
                                                    <Typography.Text
                                                        style={{ fontSize: 11, color: '#dc2626' }}
                                                    >
                                                        {Number(session.Difference) < 0
                                                            ? 'Short by '
                                                            : 'Over by '}
                                                        {formatMoney(
                                                            Math.abs(Number(session.Difference)).toFixed(4),
                                                        )}
                                                    </Typography.Text>
                                                </Flex>
                                            )}
                                    </>
                                ) : (
                                    <>
                                        <Statistic
                                            title="Counted"
                                            value="—"
                                            valueStyle={{ fontSize: 16, color: '#94a3b8' }}
                                        />
                                        <Typography.Text
                                            type="secondary"
                                            style={{ fontSize: 11 }}
                                        >
                                            Session still open
                                        </Typography.Text>
                                    </>
                                )}
                            </Card>
                        </div>
                    )}

                    {/* Breakdown by source */}
                    {!expectedLoading && expected && (
                        <>
                            <Divider orientation="left" plain style={{ margin: '0' }}>
                                Breakdown by source
                            </Divider>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: isMobile
                                        ? '1fr 1fr'
                                        : 'repeat(4, 1fr)',
                                    gap: 8,
                                }}
                            >
                                {buckets.map((b) => {
                                    const n = Number(b.total);
                                    const active = b.count > 0;
                                    const sign = n > 0.0001 ? '+' : n < -0.0001 ? '−' : '';
                                    const display = formatMoney(Math.abs(n).toFixed(4));
                                    const color = !active
                                        ? '#94a3b8'
                                        : n > 0
                                            ? '#16a34a'
                                            : n < 0
                                                ? '#dc2626'
                                                : '#94a3b8';
                                    return (
                                        <Tooltip
                                            key={b.key}
                                            title={
                                                active
                                                    ? `${b.count} entr${b.count === 1 ? 'y' : 'ies'}`
                                                    : 'No entries'
                                            }
                                        >
                                            <Card
                                                size="small"
                                                styles={{ body: { padding: '8px 10px' } }}
                                                style={{
                                                    opacity: active ? 1 : 0.55,
                                                    cursor: active ? 'default' : 'help',
                                                }}
                                            >
                                                <Flex vertical gap={2}>
                                                    <Typography.Text
                                                        type="secondary"
                                                        style={{ fontSize: 11 }}
                                                        ellipsis
                                                    >
                                                        {b.label}
                                                    </Typography.Text>
                                                    <Flex align="baseline" justify="space-between">
                                                        <Typography.Text
                                                            strong
                                                            style={{ fontSize: 13, color }}
                                                        >
                                                            {sign} {display}
                                                        </Typography.Text>
                                                        {active && (
                                                            <Typography.Text
                                                                type="secondary"
                                                                style={{ fontSize: 10 }}
                                                            >
                                                                {b.count}
                                                            </Typography.Text>
                                                        )}
                                                    </Flex>
                                                </Flex>
                                            </Card>
                                        </Tooltip>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {session.Notes && (
                        <div>
                            <Typography.Text strong>Notes</Typography.Text>
                            <Typography.Paragraph
                                type="secondary"
                                style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}
                            >
                                {session.Notes}
                            </Typography.Paragraph>
                        </div>
                    )}

                    <Divider orientation="left" plain style={{ margin: '8px 0' }}>
                        Drawer movements
                    </Divider>

                    {ledgerLoading ? (
                        <Flex justify="center" style={{ padding: 32 }}>
                            <Spin />
                        </Flex>
                    ) : !ledger || ledger.data.length === 0 ? (
                        <Empty
                            description="No ledger entries for this session"
                            style={{ padding: 24 }}
                        />
                    ) : isMobile ? (
                        <Flex vertical gap={8}>
                            {ledger.data.map((row) => {
                                const isNeg = row.Amount.startsWith('-');
                                return (
                                    <Card
                                        key={row.Id}
                                        size="small"
                                        styles={{ body: { padding: 10 } }}
                                    >
                                        <Flex justify="space-between" gap={8} align="flex-start">
                                            <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                                                <Flex align="center" gap={6}>
                                                    <Tag
                                                        color={LEDGER_COLOR[row.Type] ?? 'default'}
                                                        style={{ marginInlineEnd: 0 }}
                                                    >
                                                        {row.Type}
                                                    </Tag>
                                                    <Typography.Text
                                                        type="secondary"
                                                        style={{ fontSize: 11 }}
                                                    >
                                                        {formatDateTime(row.CreatedAt)}
                                                    </Typography.Text>
                                                </Flex>
                                                {row.Notes && (
                                                    <Typography.Text
                                                        type="secondary"
                                                        style={{ fontSize: 11 }}
                                                        ellipsis
                                                    >
                                                        {row.Notes}
                                                    </Typography.Text>
                                                )}
                                            </Flex>
                                            <Typography.Text
                                                strong
                                                style={{
                                                    color: isNeg ? '#dc2626' : '#16a34a',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {isNeg ? '−' : '+'}{' '}
                                                {formatMoney(isNeg ? row.Amount.slice(1) : row.Amount)}
                                            </Typography.Text>
                                        </Flex>
                                    </Card>
                                );
                            })}
                            <Flex justify="center" style={{ padding: 8 }}>
                                <Pagination
                                    current={ledgerPage}
                                    pageSize={ledgerLimit}
                                    total={ledger.meta.total}
                                    onChange={(p, ps) => {
                                        setLedgerPage(p);
                                        if (ps !== ledgerLimit) setLedgerLimit(ps);
                                    }}
                                    simple
                                />
                            </Flex>
                        </Flex>
                    ) : (
                        <Table<CashLedgerRow>
                            rowKey="Id"
                            columns={ledgerColumns}
                            dataSource={ledger.data}
                            loading={ledgerFetching}
                            onChange={handleTableChange}
                            pagination={{
                                current: ledgerPage,
                                pageSize: ledgerLimit,
                                total: ledger.meta.total,
                                showSizeChanger: true,
                                showTotal: (t, r) => `${r[0]}–${r[1]} of ${t}`,
                            }}
                            scroll={{ x: 'max-content' }}
                        />
                    )}
                </Flex>
            )}
        </Drawer>
    );
}