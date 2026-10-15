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
  Button,
} from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import { Undo2 } from 'lucide-react';
import { useCreditPayments } from '@/hooks/queries/useCreditPayments';
import { usePermission } from '@/hooks/usePermission';
import { ReverseCreditPaymentModal } from '@/pages/credit-payments/ReverseCreditPaymentModal';
import { formatMoney, formatDateTime } from '@/lib/format';
import type { CreditPaymentRow } from '@/types/creditPayment';

const { useBreakpoint } = Grid;

interface Props {
  customerId: string;
}

export function CustomerPaymentsTab({ customerId }: Props) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const canReverse = usePermission('credit_payments.reverse');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [reverseTarget, setReverseTarget] = useState<CreditPaymentRow | null>(
    null,
  );

  const { data, isLoading, isFetching } = useCreditPayments({
    CustomerId: customerId,
    page,
    limit,
    sortBy: 'PaidAt',
    sortOrder: 'desc',
  });

  const columns: ColumnsType<CreditPaymentRow> = [
    {
      title: 'Code',
      dataIndex: 'Code',
      key: 'Code',
      render: (_: unknown, row) => (
        <Flex vertical gap={2}>
          <Flex align="center" gap={4}>
            <Typography.Text strong>{row.Code}</Typography.Text>
            {row.ReversedAt && <Tag color="red">Reversed</Tag>}
          </Flex>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {formatDateTime(row.PaidAt)}
          </Typography.Text>
        </Flex>
      ),
    },
    {
      title: 'Method',
      dataIndex: 'Method',
      key: 'Method',
      render: (m: string, row) => (
        <Flex vertical gap={2}>
          <Tag color={m === 'CASH' ? 'green' : 'blue'}>{m}</Tag>
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
        <Typography.Text
          strong
          delete={!!row.ReversedAt}
          style={{ color: row.ReversedAt ? undefined : '#16a34a' }}
        >
          + {formatMoney(v)}
        </Typography.Text>
      ),
    },
    {
      title: 'Notes',
      dataIndex: 'Notes',
      key: 'Notes',
      render: (v: string | null) =>
        v ?? <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_: unknown, row) =>
        canReverse && !row.ReversedAt && row.Method === 'CASH' ? (
          <Button
            type="text"
            size="small"
            danger
            icon={<Undo2 size={14} />}
            onClick={() => setReverseTarget(row)}
          />
        ) : null,
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
    return (
      <Empty
        description="No credit payments recorded yet"
        style={{ padding: 32 }}
      />
    );
  }

  if (isMobile) {
    return (
      <Flex vertical gap={8}>
        {data.data.map((row) => (
          <Card key={row.Id} size="small" styles={{ body: { padding: 12 } }}>
            <Flex justify="space-between" gap={8} align="flex-start">
              <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                <Flex align="center" gap={6}>
                  <Typography.Text strong>{row.Code}</Typography.Text>
                  {row.ReversedAt && <Tag color="red">Reversed</Tag>}
                </Flex>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  {formatDateTime(row.PaidAt)}
                </Typography.Text>
                <Flex gap={6} wrap="wrap" style={{ marginTop: 4 }}>
                  <Tag color={row.Method === 'CASH' ? 'green' : 'blue'}>
                    {row.Method}
                  </Tag>
                  {row.Cheque && (
                    <Tag>
                      {row.Cheque.ChequeNumber} · {row.Cheque.Status}
                    </Tag>
                  )}
                </Flex>
              </Flex>
              <Flex vertical gap={4} align="flex-end">
                <Typography.Text
                  strong
                  delete={!!row.ReversedAt}
                  style={{ color: row.ReversedAt ? undefined : '#16a34a' }}
                >
                  + {formatMoney(row.Amount)}
                </Typography.Text>
                {canReverse && !row.ReversedAt && row.Method === 'CASH' && (
                  <Button
                    size="small"
                    danger
                    icon={<Undo2 size={12} />}
                    onClick={() => setReverseTarget(row)}
                  >
                    Reverse
                  </Button>
                )}
              </Flex>
            </Flex>
          </Card>
        ))}
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
        <ReverseCreditPaymentModal
          open={!!reverseTarget}
          payment={reverseTarget}
          onClose={() => setReverseTarget(null)}
        />
      </Flex>
    );
  }

  const handleTableChange: NonNullable<
    TableProps<CreditPaymentRow>['onChange']
  > = (pagination) => {
    if (pagination.current && pagination.current !== page) {
      setPage(pagination.current);
    }
    if (pagination.pageSize && pagination.pageSize !== limit) {
      setLimit(pagination.pageSize);
      setPage(1);
    }
  };

  return (
    <>
      <Table<CreditPaymentRow>
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
      <ReverseCreditPaymentModal
        open={!!reverseTarget}
        payment={reverseTarget}
        onClose={() => setReverseTarget(null)}
      />
    </>
  );
}