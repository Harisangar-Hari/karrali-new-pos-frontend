import { useEffect, useState } from 'react';
import { Flex, Input, Typography, Empty, Spin } from 'antd';
import { Search as SearchIcon, User, Phone } from 'lucide-react';
import { useCustomers } from '@/hooks/queries/useCustomers';
import { formatMoney } from '@/lib/format';

interface Props {
    onPick: (customerId: string) => void;
    onCancel: () => void;
}

export function CustomerPickerStep({ onPick }: Props) {
    const [input, setInput] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        const t = setTimeout(() => {
            setSearch(input.trim());
        }, 250);
        return () => clearTimeout(t);
    }, [input]);

    const { data, isLoading, isFetching } = useCustomers({
        search: search || undefined,
        limit: 30,
        IsActive: true,
        // Show only those with outstanding balances — usually what you want
        // when recording a payment. If empty search, show all.
        sortBy: 'Name',
        sortOrder: 'asc',
    });

    const results = data?.data ?? [];

    return (
        <Flex vertical gap={12}>
            <Input
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Search name, code, phone, email"
                prefix={<SearchIcon size={14} />}
                size="large"
                allowClear
            />

            <div style={{ maxHeight: 520, overflowY: 'auto' }}>
                {isLoading || (isFetching && results.length === 0) ? (
                    <Flex justify="center" style={{ padding: 24 }}>
                        <Spin />
                    </Flex>
                ) : results.length === 0 ? (
                    <Empty description="No customers found" style={{ padding: 24 }} />
                ) : (
                    <Flex vertical>
                        {results.map((c) => {
                            const balance = Number(c.Balance);
                            return (
                                <Flex
                                    key={c.Id}
                                    align="center"
                                    gap={8}
                                    style={{
                                        padding: '10px 4px',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid #f0f0f0',
                                    }}
                                    onClick={() => onPick(c.Id)}
                                    className="pos-product-row"
                                >
                                    <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                                        <Flex align="center" gap={6}>
                                            <User size={12} color="#94a3b8" />
                                            <Typography.Text strong ellipsis>
                                                {c.Name}
                                            </Typography.Text>
                                        </Flex>
                                        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                                            {c.Code}
                                            {c.Phone ? ` · ${c.Phone}` : ''}
                                        </Typography.Text>
                                    </Flex>
                                    <Flex vertical gap={2} align="flex-end">
                                        <Typography.Text type="secondary" style={{ fontSize: 10 }}>
                                            Owes
                                        </Typography.Text>
                                        <Typography.Text
                                            strong
                                            style={{
                                                fontSize: 12,
                                                color: balance > 0 ? '#dc2626' : '#16a34a',
                                            }}
                                        >
                                            {formatMoney(c.Balance)}
                                        </Typography.Text>
                                    </Flex>
                                </Flex>
                            );
                        })}
                    </Flex>
                )}
            </div>
        </Flex>
    );
}