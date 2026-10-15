import { useState } from 'react';
import {
  Table,
  Tag,
  Flex,
  Typography,
  Grid,
  Pagination,
  Empty,
  Spin,
  Card,
} from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import { useCustomerLedger } from '@/hooks/queries/useCustomers';
import { formatMoney, formatDateTime } from '@/lib/format';
import type { CustomerLedgerRow, CustomerLedgerType } from '@/types/customer';

const { useBreakpoint } = Grid;

interface Props {
  customerId: string;
}

const TYPE_COLOR: Record<CustomerLedgerType, string> = {
  OPENING: 'blue',
  SALE: 'red',
  PAYMENT: 'green',
  RETURN: 'orange',
  ADJUSTMENT: 'purple',
};

export function CustomerLedgerTable({ customerId }: Props) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data, isLoading, isFetching } = useCustomerLedger(customerId, {
    page,
    limit,
  });

  const columns: ColumnsType<CustomerLedgerRow> = [
    {
      title: 'When',
      dataIndex: 'CreatedAt',
      key: 'CreatedAt',
      render: (v: string) => formatDateTime(v),
    },
    {
      title: 'Type',
      dataIndex: 'Type',
      key: 'Type',
      render: (t: CustomerLedgerType) => (
        <Tag color={TYPE_COLOR[t] ?? 'default'}>{t}</Tag>
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
          <Typography.Text style={{ color: isNeg ? '#16a34a' : '#dc2626' }}>
            {formatMoney(v)}
          </Typography.Text>
        );
      },
    },
    {
      title: 'Balance after',
      dataIndex: 'BalanceAfter',
      key: 'BalanceAfter',
      align: 'right',
      render: (v: string) => formatMoney(v),
    },
    {
      title: 'Notes',
      dataIndex: 'Notes',
      key: 'Notes',
      render: (v: string | null) => v ?? <Typography.Text type="secondary">—</Typography.Text>,
    },
  ];

  if (isLoading) {
    return (
      <Flex justify="center" style={{ padding: 48 }}>
        <Spin />
      </Flex>
    );
  }

  if (!data || data.data.length === 0) {
    return <Empty description="No ledger entries yet" style={{ padding: 32 }} />;
  }

  if (isMobile) {
    return (
      <Flex vertical gap={8}>
        {data.data.map((row) => {
          const isNeg = row.Amount.startsWith('-');
          return (
            <Card key={row.Id} size="small" styles={{ body: { padding: 12 } }}>
              <Flex justify="space-between" gap={8} align="flex-start">
                <Flex vertical gap={4} style={{ flex: 1, minWidth: 0 }}>
                  <Flex align="center" gap={6}>
                    <Tag color={TYPE_COLOR[row.Type] ?? 'default'}>
                      {row.Type}
                    </Tag>
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
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
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    Balance after: {formatMoney(row.BalanceAfter)}
                  </Typography.Text>
                </Flex>
                <Typography.Text
                  strong
                  style={{ color: isNeg ? '#16a34a' : '#dc2626', whiteSpace: 'nowrap' }}
                >
                  {formatMoney(row.Amount)}
                </Typography.Text>
              </Flex>
            </Card>
          );
        })}
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
      </Flex>
    );
  }

  const handleTableChange: NonNullable<TableProps<CustomerLedgerRow>['onChange']> = (
    pagination,
  ) => {
    if (pagination.current && pagination.current !== page) {
      setPage(pagination.current);
    }
    if (pagination.pageSize && pagination.pageSize !== limit) {
      setLimit(pagination.pageSize);
      setPage(1);
    }
  };

  return (
    <Table<CustomerLedgerRow>
      rowKey="Id"
      columns={columns}
      dataSource={data.data}
      loading={isFetching}
      onChange={handleTableChange}
      pagination={{
        current: page,
        pageSize: limit,
        total: data.meta.total,
        showSizeChanger: true,
        showTotal: (t, r) => `${r[0]}–${r[1]} of ${t}`,
      }}
      scroll={{ x: 'max-content' }}
    />
  );
}