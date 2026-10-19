import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Flex,
  Grid,
  Pagination,
  Row,
  Select,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import { Eye } from 'lucide-react';
import dayjs, { type Dayjs } from 'dayjs';
import { usePurchases } from '@/hooks/queries/usePurchases';
import { PurchaseDetailDrawer } from '@/pages/purchases/PurchaseDetailDrawer';
import { formatMoney, formatDate } from '@/lib/format';
import type {
  PurchaseListRow,
  PurchaseSortField,
  PurchaseStatus,
  QueryPurchaseParams,
} from '@/types/purchase';

const { useBreakpoint } = Grid;
const { RangePicker } = DatePicker;

interface Props {
  supplierId: string;
}

export function SupplierPurchasesTab({ supplierId }: Props) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [status, setStatus] = useState<PurchaseStatus | undefined>();
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState<PurchaseSortField>('InvoiceDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const query: QueryPurchaseParams = useMemo(
    () => ({
      SupplierId: supplierId,
      page,
      limit,
      Status: status,
      From: range?.[0]?.startOf('day').toISOString(),
      To: range?.[1]?.endOf('day').toISOString(),
      sortBy,
      sortOrder,
    }),
    [supplierId, page, limit, status, range, sortBy, sortOrder],
  );

  const { data, isLoading, isFetching } = usePurchases(query);

  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [status, range]);

  const columns: ColumnsType<PurchaseListRow> = [
    {
      title: 'Code',
      dataIndex: 'Code',
      key: 'Code',
      render: (_: unknown, row) => (
        <Flex vertical gap={2}>
          <Typography.Text strong>{row.Code}</Typography.Text>
          {row.SupplierInvoiceNo && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              Inv {row.SupplierInvoiceNo}
            </Typography.Text>
          )}
        </Flex>
      ),
    },
    {
      title: 'Invoice date',
      dataIndex: 'InvoiceDate',
      key: 'InvoiceDate',
      sorter: true,
      sortOrder:
        sortBy === 'InvoiceDate'
          ? sortOrder === 'asc'
            ? 'ascend'
            : 'descend'
          : null,
      render: (_: unknown, row) => (
        <Flex vertical gap={2}>
          <Typography.Text style={{ fontSize: 12 }}>
            {formatDate(row.InvoiceDate)}
          </Typography.Text>
          {row.DueDate && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              Due {formatDate(row.DueDate)}
            </Typography.Text>
          )}
        </Flex>
      ),
    },
    {
      title: 'Warehouse',
      key: 'warehouse',
      render: (_: unknown, row) => (
        <Typography.Text style={{ fontSize: 12 }}>
          {row.Warehouse.Name}
        </Typography.Text>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'TotalAmount',
      key: 'TotalAmount',
      align: 'right',
      sorter: true,
      sortOrder:
        sortBy === 'TotalAmount'
          ? sortOrder === 'asc'
            ? 'ascend'
            : 'descend'
          : null,
      render: (v: string) => (
        <Typography.Text strong>{formatMoney(v)}</Typography.Text>
      ),
    },
    {
      title: 'Paid',
      dataIndex: 'PaidAmount',
      key: 'PaidAmount',
      align: 'right',
      render: (v: string) => formatMoney(v),
    },
    {
      title: 'Balance',
      key: 'balance',
      align: 'right',
      render: (_: unknown, row) => {
        const bal = Number(row.TotalAmount) - Number(row.PaidAmount);
        return (
          <Typography.Text
            strong
            style={{ color: bal > 0 ? '#dc2626' : '#16a34a' }}
          >
            {formatMoney(bal.toFixed(4))}
          </Typography.Text>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'Status',
      key: 'Status',
      render: (s: PurchaseStatus) =>
        s === 'POSTED' ? (
          <Tag color="green">POSTED</Tag>
        ) : (
          <Tag>CANCELLED</Tag>
        ),
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      width: 40,
      render: (_: unknown, row) => (
        <Button
          type="text"
          size="small"
          icon={<Eye size={14} />}
          onClick={() => setDetailId(row.Id)}
        />
      ),
    },
  ];

  const handleTableChange: NonNullable<
    TableProps<PurchaseListRow>['onChange']
  > = (pagination, _filters, sorter) => {
    if (Array.isArray(sorter)) return;
    if (sorter.field && sorter.order) {
      setSortBy(sorter.field as PurchaseSortField);
      setSortOrder(sorter.order === 'ascend' ? 'asc' : 'desc');
    }
    if (pagination.current && pagination.current !== page) {
      setPage(pagination.current);
    }
    if (pagination.pageSize && pagination.pageSize !== limit) {
      setLimit(pagination.pageSize);
      setPage(1);
    }
  };

  return (
    <Flex vertical gap={12}>
      <Row gutter={[12, 12]}>
        <Col xs={12} md={6}>
          <Select
            value={status}
            onChange={setStatus}
            placeholder="All statuses"
            allowClear
            options={[
              { label: 'Posted', value: 'POSTED' },
              { label: 'Cancelled', value: 'CANCELLED' },
            ]}
            style={{ width: '100%' }}
          />
        </Col>
        <Col xs={24} md={10}>
          <RangePicker
            value={range}
            onChange={(v) =>
              setRange(v && v[0] && v[1] ? [v[0], v[1]] : null)
            }
            style={{ width: '100%' }}
          />
        </Col>
      </Row>

      {isLoading ? (
        <Flex justify="center" style={{ padding: 48 }}>
          <Spin />
        </Flex>
      ) : !data?.data?.length ? (
        <Empty description="No purchases yet" style={{ padding: 32 }} />
      ) : isMobile ? (
        <>
          <Flex vertical gap={8}>
            {data.data.map((row) => {
              const bal = Number(row.TotalAmount) - Number(row.PaidAmount);
              return (
                <Card
                  key={row.Id}
                  size="small"
                  styles={{ body: { padding: 10 } }}
                  onClick={() => setDetailId(row.Id)}
                  style={{ cursor: 'pointer' }}
                >
                  <Flex justify="space-between" gap={8} align="flex-start">
                    <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                      <Flex align="center" gap={6}>
                        <Typography.Text strong>{row.Code}</Typography.Text>
                        {row.Status === 'POSTED' ? (
                          <Tag color="green" style={{ marginInlineEnd: 0 }}>
                            POSTED
                          </Tag>
                        ) : (
                          <Tag style={{ marginInlineEnd: 0 }}>CANCELLED</Tag>
                        )}
                      </Flex>
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 11 }}
                      >
                        {formatDate(row.InvoiceDate)} · {row.Warehouse.Name}
                      </Typography.Text>
                      {row.SupplierInvoiceNo && (
                        <Typography.Text
                          type="secondary"
                          style={{ fontSize: 11 }}
                        >
                          Inv {row.SupplierInvoiceNo}
                        </Typography.Text>
                      )}
                    </Flex>
                    <Flex vertical gap={2} align="flex-end">
                      <Typography.Text strong>
                        {formatMoney(row.TotalAmount)}
                      </Typography.Text>
                      <Typography.Text
                        style={{
                          fontSize: 11,
                          color: bal > 0 ? '#dc2626' : '#16a34a',
                        }}
                      >
                        Bal {formatMoney(bal.toFixed(4))}
                      </Typography.Text>
                    </Flex>
                  </Flex>
                </Card>
              );
            })}
          </Flex>
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
        </>
      ) : (
        <Table<PurchaseListRow>
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
      )}

      <PurchaseDetailDrawer
        purchaseId={detailId}
        onClose={() => setDetailId(null)}
      />
    </Flex>
  );
}