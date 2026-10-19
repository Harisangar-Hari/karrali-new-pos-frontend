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
import { useSalesSummary } from '@/hooks/queries/useReports';
import { useTerminalsLookup } from '@/hooks/queries/useTerminalsLookup';
import { formatMoney } from '@/lib/format';
import type {
  SalesSummaryGroup,
  SalesSummaryRow,
} from '@/types/reports';

const { useBreakpoint } = Grid;
const { RangePicker } = DatePicker;

export function SalesSummaryPage() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [group, setGroup] = useState<SalesSummaryGroup>('day');
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

  const { data, isLoading } = useSalesSummary(params);

  const columns: ColumnsType<SalesSummaryRow> = [
    {
      title: group === 'none' ? 'Period' : 'Period',
      dataIndex: 'Period',
      key: 'Period',
      render: (v: string | null) => (
        <Typography.Text strong>{v ?? 'Total'}</Typography.Text>
      ),
    },
    {
      title: 'Sales',
      dataIndex: 'SaleCount',
      key: 'SaleCount',
      align: 'right',
    },
    {
      title: 'Gross',
      dataIndex: 'GrossSales',
      key: 'GrossSales',
      align: 'right',
      render: (v: string) => formatMoney(v),
    },
    {
      title: 'Discounts',
      dataIndex: 'Discounts',
      key: 'Discounts',
      align: 'right',
      render: (v: string) => (
        <Typography.Text style={{ color: '#16a34a' }}>
          − {formatMoney(v)}
        </Typography.Text>
      ),
    },
    {
      title: 'Tax',
      dataIndex: 'TaxCollected',
      key: 'TaxCollected',
      align: 'right',
      render: (v: string) => formatMoney(v),
    },
    {
      title: 'Net',
      dataIndex: 'NetSales',
      key: 'NetSales',
      align: 'right',
      render: (v: string) => (
        <Typography.Text strong style={{ color: '#0d9488' }}>
          {formatMoney(v)}
        </Typography.Text>
      ),
    },
    {
      title: 'Cash',
      dataIndex: 'CashTotal',
      key: 'CashTotal',
      align: 'right',
      render: (v: string) => formatMoney(v),
    },
    {
      title: 'Card',
      dataIndex: 'CardTotal',
      key: 'CardTotal',
      align: 'right',
      render: (v: string) => formatMoney(v),
    },
    {
      title: 'Credit',
      dataIndex: 'CreditTotal',
      key: 'CreditTotal',
      align: 'right',
      render: (v: string) => formatMoney(v),
    },
    {
      title: 'Cheque',
      dataIndex: 'ChequeTotal',
      key: 'ChequeTotal',
      align: 'right',
      render: (v: string) => formatMoney(v),
    },
    {
      title: 'Refunded',
      dataIndex: 'RefundTotal',
      key: 'RefundTotal',
      align: 'right',
      render: (v: string) => (
        <Typography.Text style={{ color: '#dc2626' }}>
          {formatMoney(v)}
        </Typography.Text>
      ),
    },
  ];

  // Aggregate totals across all rows for the KPI strip
  const totals = useMemo(() => {
    if (!data?.Rows?.length) return null;
    const sum = (k: keyof SalesSummaryRow) =>
      data.Rows.reduce((s, r) => s + Number(r[k] ?? 0), 0);
    return {
      SaleCount: sum('SaleCount'),
      GrossSales: sum('GrossSales').toFixed(4),
      NetSales: sum('NetSales').toFixed(4),
      TaxCollected: sum('TaxCollected').toFixed(4),
      CashTotal: sum('CashTotal').toFixed(4),
      CardTotal: sum('CardTotal').toFixed(4),
      CreditTotal: sum('CreditTotal').toFixed(4),
      ChequeTotal: sum('ChequeTotal').toFixed(4),
      RefundTotal: sum('RefundTotal').toFixed(4),
    };
  }, [data]);

  return (
    <ReportShell
      title="Sales summary"
      subtitle="Aggregated sales by period with payment-method breakdown"
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
              onChange={(v) => setGroup(v as SalesSummaryGroup)}
              block
              options={[
                { label: 'Total', value: 'none' },
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
      {totals && (
        <Row gutter={[12, 12]}>
          <Col xs={12} md={4}>
            <KpiCard label="Sales" value={totals.SaleCount.toLocaleString()} />
          </Col>
          <Col xs={12} md={4}>
            <KpiCard label="Net sales" value={formatMoney(totals.NetSales)} strong />
          </Col>
          <Col xs={12} md={4}>
            <KpiCard label="Cash" value={formatMoney(totals.CashTotal)} valueColor="#16a34a" />
          </Col>
          <Col xs={12} md={4}>
            <KpiCard label="Card" value={formatMoney(totals.CardTotal)} />
          </Col>
          <Col xs={12} md={4}>
            <KpiCard label="Credit" value={formatMoney(totals.CreditTotal)} valueColor="#dc2626" />
          </Col>
          <Col xs={12} md={4}>
            <KpiCard label="Cheque" value={formatMoney(totals.ChequeTotal)} />
          </Col>
        </Row>
      )}

      <Card styles={{ body: { padding: isMobile ? 8 : 0 } }}>
        {isLoading ? (
          <Flex justify="center" style={{ padding: 48 }}>
            <Skeleton active paragraph={{ rows: 6 }} />
          </Flex>
        ) : !data?.Rows?.length ? (
          <Empty description="No sales in this range" style={{ padding: 32 }} />
        ) : isMobile ? (
          <Flex vertical gap={8} style={{ padding: 8 }}>
            {data.Rows.map((row, idx) => (
              <Card
                key={row.Period ?? `row-${idx}`}
                size="small"
                styles={{ body: { padding: 10 } }}
              >
                <Flex justify="space-between" align="flex-start" gap={8}>
                  <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                    <Typography.Text strong>
                      {row.Period ?? 'Total'}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      {row.SaleCount} sale{row.SaleCount === 1 ? '' : 's'}
                    </Typography.Text>
                    <Flex gap={6} wrap="wrap" style={{ marginTop: 4 }}>
                      <Typography.Text style={{ fontSize: 11 }}>
                        Cash {formatMoney(row.CashTotal)}
                      </Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                        ·
                      </Typography.Text>
                      <Typography.Text style={{ fontSize: 11 }}>
                        Card {formatMoney(row.CardTotal)}
                      </Typography.Text>
                    </Flex>
                  </Flex>
                  <Flex vertical gap={2} align="flex-end">
                    <Typography.Text
                      strong
                      style={{ color: '#0d9488' }}
                    >
                      {formatMoney(row.NetSales)}
                    </Typography.Text>
                    {Number(row.RefundTotal) > 0 && (
                      <Typography.Text
                        style={{ fontSize: 11, color: '#dc2626' }}
                      >
                        Refunded {formatMoney(row.RefundTotal)}
                      </Typography.Text>
                    )}
                  </Flex>
                </Flex>
              </Card>
            ))}
          </Flex>
        ) : (
          <Table<SalesSummaryRow>
            rowKey={(r, idx) => r.Period ?? `row-${idx ?? 0}`}
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