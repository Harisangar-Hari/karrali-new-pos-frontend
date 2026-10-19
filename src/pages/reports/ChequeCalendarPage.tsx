import { useMemo, useState } from 'react';
import {
  Card,
  Col,
  DatePicker,
  Empty,
  Flex,
  Grid,
  Row,
  Skeleton,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ArrowDownLeft, ArrowUpRight, Landmark } from 'lucide-react';
import dayjs, { type Dayjs } from 'dayjs';
import { ReportShell } from '@/components/reports/ReportShell';
import { KpiCard } from '@/components/reports/KpiCard';
import { useChequeCalendar } from '@/hooks/queries/useReports';
import { formatMoney, formatDate } from '@/lib/format';
import type { ChequeCalendarEntry } from '@/types/reports';

const { useBreakpoint } = Grid;
const { RangePicker } = DatePicker;

export function ChequeCalendarPage() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [range, setRange] = useState<[Dayjs, Dayjs]>([
    dayjs(),
    dayjs().add(30, 'day'),
  ]);

  const params = useMemo(
    () => ({
      From: range[0].startOf('day').toISOString(),
      To: range[1].endOf('day').toISOString(),
    }),
    [range],
  );

  const { data, isLoading } = useChequeCalendar(params);

  const columns: ColumnsType<ChequeCalendarEntry> = [
    {
      title: 'Due',
      dataIndex: 'DueDate',
      key: 'DueDate',
      fixed: 'left',
      render: (v: string) => (
        <Typography.Text strong>{formatDate(v)}</Typography.Text>
      ),
    },
    {
      title: 'Side',
      dataIndex: 'Side',
      key: 'Side',
      render: (s: 'CUSTOMER' | 'SUPPLIER') =>
        s === 'CUSTOMER' ? (
          <Tag
            icon={<ArrowDownLeft size={11} />}
            color="green"
            style={{ marginInlineEnd: 0 }}
          >
            FROM CUSTOMER
          </Tag>
        ) : (
          <Tag
            icon={<ArrowUpRight size={11} />}
            color="red"
            style={{ marginInlineEnd: 0 }}
          >
            TO SUPPLIER
          </Tag>
        ),
    },
    {
      title: 'Counterparty',
      key: 'counterparty',
      render: (_: unknown, row) => (
        <Flex vertical gap={2}>
          <Typography.Text>{row.CounterpartyName}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {row.CounterpartyCode}
          </Typography.Text>
        </Flex>
      ),
    },
    {
      title: 'Cheque',
      key: 'cheque',
      render: (_: unknown, row) => (
        <Flex vertical gap={2}>
          <Typography.Text style={{ fontFamily: 'monospace', fontSize: 12 }}>
            {row.ChequeNumber}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {row.Code}
          </Typography.Text>
        </Flex>
      ),
    },
    {
      title: 'Bank',
      dataIndex: 'BankName',
      key: 'BankName',
      render: (v: string | null) =>
        v ? (
          <Flex align="center" gap={4}>
            <Landmark size={11} color="#94a3b8" />
            <Typography.Text style={{ fontSize: 12 }}>{v}</Typography.Text>
          </Flex>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
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
          style={{ color: row.Side === 'CUSTOMER' ? '#16a34a' : '#dc2626' }}
        >
          {row.Side === 'CUSTOMER' ? '+ ' : '− '}
          {formatMoney(v)}
        </Typography.Text>
      ),
    },
  ];

  const netExposure = data ? Number(data.NetExposure) : 0;

  return (
    <ReportShell
      title="Cheque calendar"
      subtitle="Pending customer and supplier cheques due in the range"
      printable
      filters={
        <Row gutter={[12, 12]}>
          <Col xs={24} md={16}>
            <RangePicker
              value={range}
              onChange={(v) =>
                setRange(v && v[0] && v[1] ? [v[0], v[1]] : range)
              }
              style={{ width: '100%' }}
              placeholder={['Due from', 'Due to']}
            />
          </Col>
        </Row>
      }
    >
      {data && (
        <Row gutter={[12, 12]}>
          <Col xs={12} md={8}>
            <KpiCard
              label="From customers (incoming)"
              value={formatMoney(data.CustomerTotal)}
              valueColor="#16a34a"
            />
          </Col>
          <Col xs={12} md={8}>
            <KpiCard
              label="To suppliers (outgoing)"
              value={formatMoney(data.SupplierTotal)}
              valueColor="#dc2626"
            />
          </Col>
          <Col xs={24} md={8}>
            <KpiCard
              label="Net exposure"
              value={`${netExposure > 0 ? '+' : ''}${formatMoney(
                data.NetExposure,
              )}`}
              strong
              valueColor={netExposure >= 0 ? '#16a34a' : '#dc2626'}
              hint="Customer pending − supplier pending"
            />
          </Col>
        </Row>
      )}

      {/* Daily summary strip */}
      {data && data.ByDay.length > 0 && !isMobile && (
        <Card
          title="Daily summary"
          size="small"
          styles={{ body: { padding: 0 } }}
        >
          <Table
            rowKey="Day"
            columns={[
              {
                title: 'Day',
                dataIndex: 'Day',
                key: 'Day',
                render: (v: string) => formatDate(v),
              },
              {
                title: 'Cheques',
                dataIndex: 'Count',
                key: 'Count',
                align: 'right',
              },
              {
                title: 'Incoming',
                dataIndex: 'CustomerAmount',
                key: 'CustomerAmount',
                align: 'right',
                render: (v: string) => (
                  <Typography.Text style={{ color: '#16a34a' }}>
                    {formatMoney(v)}
                  </Typography.Text>
                ),
              },
              {
                title: 'Outgoing',
                dataIndex: 'SupplierAmount',
                key: 'SupplierAmount',
                align: 'right',
                render: (v: string) => (
                  <Typography.Text style={{ color: '#dc2626' }}>
                    {formatMoney(v)}
                  </Typography.Text>
                ),
              },
              {
                title: 'Net',
                key: 'net',
                align: 'right',
                render: (_: unknown, row) => {
                  const net =
                    Number(row.CustomerAmount) - Number(row.SupplierAmount);
                  return (
                    <Typography.Text
                      strong
                      style={{ color: net >= 0 ? '#16a34a' : '#dc2626' }}
                    >
                      {net > 0 ? '+' : ''}
                      {formatMoney(net.toFixed(4))}
                    </Typography.Text>
                  );
                },
              },
            ]}
            dataSource={data.ByDay}
            pagination={false}
            size="small"
          />
        </Card>
      )}

      {/* Full entries */}
      <Card
        title={`All cheques (${data?.Entries.length ?? 0})`}
        size="small"
        styles={{ body: { padding: isMobile ? 8 : 0 } }}
      >
        {isLoading ? (
          <Flex justify="center" style={{ padding: 48 }}>
            <Skeleton active paragraph={{ rows: 6 }} />
          </Flex>
        ) : !data?.Entries?.length ? (
          <Empty
            description="No cheques due in this range"
            style={{ padding: 32 }}
          />
        ) : isMobile ? (
          <Flex vertical gap={8} style={{ padding: 8 }}>
            {data.Entries.map((row) => (
              <Card
                key={`${row.Side}-${row.ChequeId}`}
                size="small"
                styles={{ body: { padding: 10 } }}
              >
                <Flex justify="space-between" gap={8} align="flex-start">
                  <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                    <Flex align="center" gap={6}>
                      <Tag
                        color={row.Side === 'CUSTOMER' ? 'green' : 'red'}
                        style={{ marginInlineEnd: 0 }}
                      >
                        {row.Side === 'CUSTOMER' ? 'IN' : 'OUT'}
                      </Tag>
                      <Typography.Text strong>
                        {formatDate(row.DueDate)}
                      </Typography.Text>
                    </Flex>
                    <Typography.Text ellipsis>
                      {row.CounterpartyName}
                    </Typography.Text>
                    <Typography.Text
                      type="secondary"
                      style={{ fontSize: 11 }}
                    >
                      {row.ChequeNumber} · {row.Code}
                      {row.BankName ? ` · ${row.BankName}` : ''}
                    </Typography.Text>
                  </Flex>
                  <Typography.Text
                    strong
                    style={{
                      color: row.Side === 'CUSTOMER' ? '#16a34a' : '#dc2626',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {row.Side === 'CUSTOMER' ? '+' : '−'}{' '}
                    {formatMoney(row.Amount)}
                  </Typography.Text>
                </Flex>
              </Card>
            ))}
          </Flex>
        ) : (
          <Table<ChequeCalendarEntry>
            rowKey={(r) => `${r.Side}-${r.ChequeId}`}
            columns={columns}
            dataSource={data.Entries}
            pagination={{ pageSize: 50, showSizeChanger: false }}
            scroll={{ x: 'max-content' }}
            size="middle"
          />
        )}
      </Card>
    </ReportShell>
  );
}