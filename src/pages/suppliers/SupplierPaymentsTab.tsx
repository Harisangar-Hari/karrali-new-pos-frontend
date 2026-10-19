import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Empty,
  Flex,
  Grid,
  Pagination,
  Spin,
  Table,
  Tag,
  Typography,
  App,
} from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import { Undo2, Wallet, Landmark } from 'lucide-react';
import { useSupplierPayments } from '@/hooks/queries/useSupplierPayments';
import { usePermission } from '@/hooks/usePermission';
import { ReversePaymentModal } from '@/pages/supplier-payments/ReversePaymentModal';
import { formatMoney, formatDateTime } from '@/lib/format';
import type {
  QuerySupplierPaymentParams,
  SupplierPaymentMethod,
  SupplierPaymentRow,
} from '@/types/supplierPayment';

const { useBreakpoint } = Grid;

const METHOD_COLOR: Record<SupplierPaymentMethod, string> = {
  CASH: 'green',
  BANK_TRANSFER: 'blue',
  CHEQUE: 'purple',
};

const METHOD_ICON: Record<SupplierPaymentMethod, React.ReactNode> = {
  CASH: <Wallet size={11} />,
  BANK_TRANSFER: <Landmark size={11} />,
  CHEQUE: <Wallet size={11} />,
};

interface Props {
  supplierId: string;
}

export function SupplierPaymentsTab({ supplierId }: Props) {
  const { modal } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const canReverse = usePermission('supplier_payments.reverse');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [reverseTarget, setReverseTarget] =
    useState<SupplierPaymentRow | null>(null);

  const query: QuerySupplierPaymentParams = useMemo(
    () => ({
      SupplierId: supplierId,
      page,
      limit,
      sortBy: 'PaidAt',
      sortOrder: 'desc',
    }),
    [supplierId, page, limit],
  );

  const { data, isLoading, isFetching } = useSupplierPayments(query);

  const confirmReverse = (row: SupplierPaymentRow) => {
    if (row.Method === 'CHEQUE') {
      modal.warning({
        title: 'Cannot reverse cheque payments',
        content:
          'Cheque-sourced payments are managed by the supplier cheques module — bounce or void the cheque instead.',
      });
      return;
    }
    setReverseTarget(row);
  };

  const columns: ColumnsType<SupplierPaymentRow> = [
    {
      title: 'Code',
      dataIndex: 'Code',
      key: 'Code',
      render: (_: unknown, row) => (
        <Flex vertical gap={2}>
          <Typography.Text strong>{row.Code}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {formatDateTime(row.PaidAt)}
          </Typography.Text>
        </Flex>
      ),
    },
    {
      title: 'Purchase',
      key: 'purchase',
      render: (_: unknown, row) => (
        <Typography.Text style={{ fontSize: 12 }}>
          {row.Purchase.Code}
        </Typography.Text>
      ),
    },
    {
      title: 'Method',
      dataIndex: 'Method',
      key: 'Method',
      render: (m: SupplierPaymentMethod) => (
        <Tag
          color={METHOD_COLOR[m]}
          icon={METHOD_ICON[m]}
          style={{ marginInlineEnd: 0 }}
        >
          {m}
        </Tag>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'Amount',
      key: 'Amount',
      align: 'right',
      render: (v: string) => (
        <Typography.Text strong style={{ color: '#dc2626' }}>
          − {formatMoney(v)}
        </Typography.Text>
      ),
    },
    {
      title: 'Notes',
      dataIndex: 'Notes',
      key: 'Notes',
      render: (v: string | null) =>
        v ? (
          <Typography.Text ellipsis style={{ fontSize: 12 }}>
            {v}
          </Typography.Text>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      width: 50,
      render: (_: unknown, row) =>
        canReverse && row.Method !== 'CHEQUE' ? (
          <Button
            type="text"
            size="small"
            danger
            icon={<Undo2 size={14} />}
            onClick={() => confirmReverse(row)}
            title="Reverse payment"
          />
        ) : null,
    },
  ];

  const handleTableChange: NonNullable<
    TableProps<SupplierPaymentRow>['onChange']
  > = (pagination) => {
    if (pagination.current && pagination.current !== page) {
      setPage(pagination.current);
    }
    if (pagination.pageSize && pagination.pageSize !== limit) {
      setLimit(pagination.pageSize);
      setPage(1);
    }
  };

  if (isLoading) {
    return (
      <Flex justify="center" style={{ padding: 48 }}>
        <Spin />
      </Flex>
    );
  }

  if (!data?.data?.length) {
    return <Empty description="No payments recorded" style={{ padding: 32 }} />;
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
                  <Tag
                    color={METHOD_COLOR[row.Method]}
                    style={{ marginInlineEnd: 0 }}
                  >
                    {row.Method}
                  </Tag>
                </Flex>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  {formatDateTime(row.PaidAt)}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  Purchase {row.Purchase.Code}
                </Typography.Text>
              </Flex>
              <Flex vertical gap={6} align="flex-end">
                <Typography.Text strong style={{ color: '#dc2626' }}>
                  − {formatMoney(row.Amount)}
                </Typography.Text>
                {canReverse && row.Method !== 'CHEQUE' && (
                  <Button
                    size="small"
                    danger
                    icon={<Undo2 size={12} />}
                    onClick={() => confirmReverse(row)}
                  >
                    Reverse
                  </Button>
                )}
              </Flex>
            </Flex>
          </Card>
        ))}
        <Flex justify="center" style={{ padding: 8 }}>
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
        <ReversePaymentModal
          open={!!reverseTarget}
          payment={reverseTarget}
          onClose={() => setReverseTarget(null)}
        />
      </Flex>
    );
  }

  return (
    <>
      <Table<SupplierPaymentRow>
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
        size="small"
      />
      <ReversePaymentModal
        open={!!reverseTarget}
        payment={reverseTarget}
        onClose={() => setReverseTarget(null)}
      />
    </>
  );
}