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
  Dropdown,
} from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import {
  CheckCircle2,
  XCircle,
  Ban,
  ChevronDown,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useCustomerCheques } from '@/hooks/queries/useCustomerCheques';
import { usePermission } from '@/hooks/usePermission';
import {
  ChequeActionModal,
  type ChequeActionMode,
} from '@/pages/customer-cheques/ChequeActionModal';
import { formatMoney, formatDate } from '@/lib/format';
import type {
  CustomerChequeRow,
  CustomerChequeStatus,
} from '@/types/customerCheque';

const { useBreakpoint } = Grid;

const STATUS_COLOR: Record<CustomerChequeStatus, string> = {
  PENDING: 'gold',
  CLEARED: 'green',
  BOUNCED: 'red',
  VOIDED: 'default',
};

interface Props {
  customerId: string;
}

export function CustomerChequesTab({ customerId }: Props) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const canClear = usePermission('customer_cheques.clear');
  const canBounce = usePermission('customer_cheques.bounce');
  const canVoid = usePermission('customer_cheques.void');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [actionTarget, setActionTarget] = useState<{
    cheque: CustomerChequeRow;
    mode: ChequeActionMode;
  } | null>(null);

  const { data, isLoading, isFetching } = useCustomerCheques({
    CustomerId: customerId,
    page,
    limit,
    sortBy: 'DueDate',
    sortOrder: 'asc',
  });

  const buildActions = (row: CustomerChequeRow) => {
    const items = [];
    if (canClear) {
      items.push({
        key: 'clear',
        icon: <CheckCircle2 size={14} />,
        label: 'Mark cleared',
        onClick: () => setActionTarget({ cheque: row, mode: 'clear' }),
      });
    }
    if (canBounce) {
      items.push({
        key: 'bounce',
        icon: <XCircle size={14} />,
        label: 'Mark bounced',
        danger: true,
        onClick: () => setActionTarget({ cheque: row, mode: 'bounce' }),
      });
    }
    if (canVoid) {
      items.push({
        key: 'void',
        icon: <Ban size={14} />,
        label: 'Void',
        danger: true,
        onClick: () => setActionTarget({ cheque: row, mode: 'void' }),
      });
    }
    return items;
  };

  const columns: ColumnsType<CustomerChequeRow> = [
    {
      title: 'Cheque',
      dataIndex: 'ChequeNumber',
      key: 'ChequeNumber',
      render: (_: unknown, row) => {
        const overdue =
          row.Status === 'PENDING' && dayjs(row.DueDate).isBefore(dayjs(), 'day');
        return (
          <Flex vertical gap={2}>
            <Typography.Text strong>{row.ChequeNumber}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {row.Code}
            </Typography.Text>
            <Typography.Text
              type="secondary"
              style={{
                fontSize: 11,
                color: overdue ? '#dc2626' : undefined,
              }}
            >
              Due {formatDate(row.DueDate)}
              {overdue ? ' · overdue' : ''}
            </Typography.Text>
          </Flex>
        );
      },
    },
    {
      title: 'Bank',
      key: 'bank',
      render: (_: unknown, row) =>
        row.BankName ?? <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Amount',
      dataIndex: 'Amount',
      key: 'Amount',
      align: 'right',
      render: (v: string) => <Typography.Text strong>{formatMoney(v)}</Typography.Text>,
    },
    {
      title: 'Status',
      dataIndex: 'Status',
      key: 'Status',
      render: (s: CustomerChequeStatus) => (
        <Tag color={STATUS_COLOR[s]}>{s}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_: unknown, row) => {
        if (row.Status !== 'PENDING') return null;
        const items = buildActions(row);
        if (items.length === 0) return null;
        return (
          <Dropdown menu={{ items }} trigger={['click']}>
            <Button size="small">
              Actions <ChevronDown size={12} />
            </Button>
          </Dropdown>
        );
      },
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
    return <Empty description="No cheques recorded for this customer" style={{ padding: 32 }} />;
  }

  if (isMobile) {
    return (
      <Flex vertical gap={8}>
        {data.data.map((row) => {
          const overdue =
            row.Status === 'PENDING' && dayjs(row.DueDate).isBefore(dayjs(), 'day');
          return (
            <Card key={row.Id} size="small" styles={{ body: { padding: 12 } }}>
              <Flex justify="space-between" gap={8} align="flex-start">
                <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                  <Flex align="center" gap={6}>
                    <Typography.Text strong>{row.ChequeNumber}</Typography.Text>
                    <Tag color={STATUS_COLOR[row.Status]}>{row.Status}</Tag>
                  </Flex>
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    {row.Code}
                  </Typography.Text>
                  <Typography.Text
                    type="secondary"
                    style={{
                      fontSize: 11,
                      color: overdue ? '#dc2626' : undefined,
                    }}
                  >
                    Due {formatDate(row.DueDate)}
                    {overdue ? ' · overdue' : ''}
                  </Typography.Text>
                  {row.BankName && (
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      {row.BankName}
                    </Typography.Text>
                  )}
                </Flex>
                <Flex vertical gap={6} align="flex-end">
                  <Typography.Text strong>{formatMoney(row.Amount)}</Typography.Text>
                  {row.Status === 'PENDING' &&
                    (canClear || canBounce || canVoid) && (
                      <Dropdown
                        menu={{ items: buildActions(row) }}
                        trigger={['click']}
                      >
                        <Button size="small">Actions</Button>
                      </Dropdown>
                    )}
                </Flex>
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
        <ChequeActionModal
          open={!!actionTarget}
          mode={actionTarget?.mode ?? 'clear'}
          cheque={actionTarget?.cheque ?? null}
          onClose={() => setActionTarget(null)}
        />
      </Flex>
    );
  }

  const handleTableChange: NonNullable<
    TableProps<CustomerChequeRow>['onChange']
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
      <Table<CustomerChequeRow>
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
      <ChequeActionModal
        open={!!actionTarget}
        mode={actionTarget?.mode ?? 'clear'}
        cheque={actionTarget?.cheque ?? null}
        onClose={() => setActionTarget(null)}
      />
    </>
  );
}