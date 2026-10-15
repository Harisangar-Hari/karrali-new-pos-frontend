import { useMemo, useState } from 'react';
import {
  Card,
  Col,
  DatePicker,
  Empty,
  Flex,
  Grid,
  Row,
  Segmented,
  Select,
  Skeleton,
  Table,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { ReportShell } from '@/components/reports/ReportShell';
import { KpiCard } from '@/components/reports/KpiCard';
import { useCashFlow } from '@/hooks/queries/useReports';
import { useTerminalsLookup } from '@/hooks/queries/useTerminalsLookup';
import { formatMoney } from '@/lib/format';
import type { CashFlowGroup, CashFlowRow } from '@/types/reports';

const { useBreakpoint } = Grid;
const { RangePicker } = DatePicker;

export function CashFlowPage() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [group, setGroup] = useState<CashFlowGroup>('day');
  const [range, setRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs(),
  ]);
  const [terminalId, setTerminalId] = useState<string | undefined>();

  const { data: terminals = [] } = useTerminalsLookup();

  const params = useMemo(
    () => ({
      From: range[0].startOf('day').toISOString(),
      To: range[1].endOf('day').toISOString(),
      GroupBy: group,
      TerminalId: terminalId,
    }),
    [range, group, terminalId],
  );

  const { data, isLoading } = useCashFlow(params);

  const columns: ColumnsType<CashFlowRow> = [
    {
      title: 'Period',
      dataIndex: 'Period',
      key: 'Period',
      fixed: 'left',
      render: (v: string) => <Typography.Text strong>{v}</Typography.Text>,
    },
    {
      title: 'Opening',
      dataIndex: 'Opening',
      key: 'Opening',
      align: 'right',
      render: (v: string) => formatMoney(v),
    },
    {
      title: 'Cash sales',
      key: 'sale',
      align: 'right',
      render: (_: unknown, row) => (
        <Typography.Text style={{ color: '#16a34a' }}>
          + {formatMoney(row.In.Sale)}
        </Typography.Text>
      ),
    },
    {
      title: 'Credit pmts',
      key: 'creditPayment',
      align: 'right',
      render: (_: unknown, row) => (
        <Typography.Text style={{ color: '#16a34a' }}>
          + {formatMoney(row.In.CreditPayment)}
        </Typography.Text>
      ),
    },
    {
      title: 'Cash in',
      key: 'cashIn',
      align: 'right',
      render: (_: unknown, row) => (
        <Typography.Text style={{ color: '#16a34a' }}>
          + {formatMoney(row.In.CashIn)}
        </Typography.Text>
      ),
    },
    {
      title: 'Refunds',
      key: 'saleRefund',
      align: 'right',
      render: (_: unknown, row) => {
        const n = Number(row.Out.SaleRefund);
        return (
          <Typography.Text
            style={{ color: n < 0 ? '#dc2626' : undefined }}
          >
            {formatMoney(row.Out.SaleRefund)}
          </Typography.Text>
        );
      },
    },
    {
      title: 'Cash out',
      key: 'cashOut',
      align: 'right',
      render: (_: unknown, row) => {
        const n = Number(row.Out.CashOut);
        return (
          <Typography.Text
            style={{ color: n < 0 ? '#dc2626' : undefined }}
          >
            {formatMoney(row.Out.CashOut)}
          </Typography.Text>
        );
      },
    },
    {
      title: 'Expenses',
      key: 'expense',
      align: 'right',
      render: (_: unknown, row) => {
        const n = Number(row.Out.Expense);
        return (
          <Typography.Text
            style={{ color: n < 0 ? '#dc2626' : undefined }}
          >
            {formatMoney(row.Out.Expense)}
          </Typography.Text>
        );
      },
    },
    {
      title: 'Net',
      dataIndex: 'NetChange',
      key: 'NetChange',
      align: 'right',
      render: (v: string) => {
        const n = Number(v);
        return (
          <Typography.Text
            strong
            style={{ color: n < 0 ? '#dc2626' : '#16a34a' }}
          >
            {n > 0 ? '+' : ''}
            {formatMoney(v)}
          </Typography.Text>
        );
      },
    },
    {
      title: 'Closing',
      dataIndex: 'Closing',
      key: 'Closing',
      align: 'right',
      render: (v: string) => (
        <Typography.Text strong style={{ color: '#0d9488' }}>
          {formatMoney(v)}
        </Typography.Text>
      ),
    },
    {
      title: 'Entries',
      dataIndex: 'EntryCount',
      key: 'EntryCount',
      align: 'right',
    },
  ];

  return (
    <ReportShell
      title="Cash flow"
      subtitle="Drawer movement over time — opening, in, out, closing"
      printable
      filters={
        <Row gutter={[12, 12]}>
          <Col xs={24} md={10}>
            <RangePicker
              value={range}
              onChange={(v) =>
                setRange(v && v[0] && v[1] ? [v[0], v[1]] : range)
              }
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={8}>
            <Segmented
              value={group}
              onChange={(v) => setGroup(v as CashFlowGroup)}
              block
              options={[
                { label: 'Day', value: 'day' },
                { label: 'Week', value: 'week' },
                { label: 'Month', value: 'month' },
              ]}
            />
          </Col>
          <Col xs={24} md={6}>
            <Select
              value={terminalId}
              onChange={setTerminalId}
              placeholder="All terminals"
              allowClear
              showSearch
              optionFilterProp="label"
              options={terminals.map((t) => ({ label: t.Name, value: t.Id }))}
              style={{ width: '100%' }}
            />
          </Col>
        </Row>
      }
    >
      {data && (
        <Row gutter={[12, 12]}>
          <Col xs={24} md={8}>
            <KpiCard
              label="Opening balance"
              value={formatMoney(data.OpeningBalance)}
            />
          </Col>
          <Col xs={24} md={8}>
            <KpiCard
              label="Closing balance"
              value={formatMoney(data.ClosingBalance)}
              strong
              valueColor="#0d9488"
            />
          </Col>
          <Col xs={24} md={8}>
            <KpiCard
              label="Net change"
              value={`${
                Number(data.ClosingBalance) - Number(data.OpeningBalance) >= 0
                  ? '+'
                  : ''
              }${formatMoney(
                (
                  Number(data.ClosingBalance) - Number(data.OpeningBalance)
                ).toFixed(4),
              )}`}
              valueColor={
                Number(data.ClosingBalance) - Number(data.OpeningBalance) >= 0
                  ? '#16a34a'
                  : '#dc2626'
              }
            />
          </Col>
        </Row>
      )}

      <Card styles={{ body: { padding: isMobile ? 8 : 0 } }}>
        {isLoading ? (
          <Flex justify="center" style={{ padding: 48 }}>
            <Skeleton active paragraph={{ rows: 6 }} />
          </Flex>
        ) : !data?.Rows?.length ? (
          <Empty description="No cash activity in this range" style={{ padding: 32 }} />
        ) : isMobile ? (
          <Flex vertical gap={8} style={{ padding: 8 }}>
            {data.Rows.map((row) => (
              <Card
                key={row.Period}
                size="small"
                styles={{ body: { padding: 12 } }}
              >
                <Flex justify="space-between" align="flex-start" gap={8}>
                  <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                    <Typography.Text strong>{row.Period}</Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      Opening {formatMoney(row.Opening)}
                    </Typography.Text>
                    <Flex gap={6} wrap="wrap" style={{ marginTop: 4 }}>
                      <Typography.Text
                        style={{ fontSize: 11, color: '#16a34a' }}
                      >
                        In +{formatMoney(row.In.Sale)}
                      </Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                        ·
                      </Typography.Text>
                      <Typography.Text
                        style={{ fontSize: 11, color: '#dc2626' }}
                      >
                        Out {formatMoney(row.Out.Expense)}
                      </Typography.Text>
                    </Flex>
                  </Flex>
                  <Flex vertical gap={2} align="flex-end">
                    <Typography.Text
                      strong
                      style={{
                        color:
                          Number(row.NetChange) >= 0 ? '#16a34a' : '#dc2626',
                      }}
                    >
                      {Number(row.NetChange) > 0 ? '+' : ''}
                      {formatMoney(row.NetChange)}
                    </Typography.Text>
                    <Typography.Text
                      strong
                      style={{ fontSize: 11, color: '#0d9488' }}
                    >
                      Close {formatMoney(row.Closing)}
                    </Typography.Text>
                  </Flex>
                </Flex>
              </Card>
            ))}
          </Flex>
        ) : (
          <Table<CashFlowRow>
            rowKey="Period"
            columns={columns}
            dataSource={data.Rows}
            pagination={false}
            scroll={{ x: 'max-content' }}
            size="middle"
          />
        )}
      </Card>
    </ReportShell>
  );
}