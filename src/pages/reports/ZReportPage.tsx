import { useState } from 'react';
import {
  Alert,
  Card,
  Col,
  DatePicker,
 
  Empty,
  Flex,
  Grid,
  Row,
  Select,
  Skeleton,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { ReportShell } from '@/components/reports/ReportShell';
import { KpiCard } from '@/components/reports/KpiCard';
import { useZReport } from '@/hooks/queries/useReports';
import { useTerminalsLookup } from '@/hooks/queries/useTerminalsLookup';
import { formatMoney, formatDateTime } from '@/lib/format';
import type { ZReport } from '@/types/reports';

const { useBreakpoint } = Grid;

export function ZReportPage() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [date, setDate] = useState<Dayjs>(dayjs());
  const [terminalId, setTerminalId] = useState<string | undefined>();

  const { data: terminals = [] } = useTerminalsLookup();

  const { data, isLoading } = useZReport({
    Date: date.format('YYYY-MM-DD'),
    TerminalId: terminalId,
  });

  const topColumns: ColumnsType<ZReport['TopProducts'][number]> = [
    {
      title: 'Product',
      key: 'product',
      render: (_: unknown, row) => (
        <Flex vertical gap={2}>
          <Typography.Text strong>{row.Name}</Typography.Text>
          {row.SKU && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {row.SKU}
            </Typography.Text>
          )}
        </Flex>
      ),
    },
    {
      title: 'Qty',
      dataIndex: 'QtySold',
      key: 'QtySold',
      align: 'right',
    },
    {
      title: 'Revenue',
      dataIndex: 'Revenue',
      key: 'Revenue',
      align: 'right',
      render: (v: string) => formatMoney(v),
    },
  ];

  return (
    <ReportShell
      title="Z-Report"
      subtitle="Day-close summary — sales, payments, drawer, top products"
      printable
      filters={
        <Row gutter={[12, 12]}>
          <Col xs={24} md={12}>
            <DatePicker
              value={date}
              onChange={(d) => d && setDate(d)}
              style={{ width: '100%' }}
              allowClear={false}
            />
          </Col>
          <Col xs={24} md={12}>
            <Select
              value={terminalId}
              onChange={setTerminalId}
              placeholder="All terminals (store-wide)"
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
      {isLoading || !data ? (
        <Skeleton active paragraph={{ rows: 12 }} />
      ) : (
        <Flex vertical gap={16}>
          {/* Header block */}
          <Card size="small">
            <Flex justify="space-between" wrap="wrap" gap={12}>
              <Flex vertical gap={2}>
                <Typography.Text strong>
                  {data.Terminal
                    ? `${data.Terminal.Name} (${data.Terminal.Code})`
                    : 'Store-wide'}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {data.Date} · {formatDateTime(data.Window.From)} –{' '}
                  {formatDateTime(data.Window.To)}
                </Typography.Text>
              </Flex>
              {data.Session && (
                <Flex vertical gap={2}>
                  <Flex gap={6} align="center">
                    <Tag color={data.Session.Status === 'OPEN' ? 'gold' : 'default'}>
                      SESSION {data.Session.Status}
                    </Tag>
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      opened {formatDateTime(data.Session.OpenedAt)}
                      {data.Session.ClosedAt &&
                        ` · closed ${formatDateTime(data.Session.ClosedAt)}`}
                    </Typography.Text>
                  </Flex>
                </Flex>
              )}
            </Flex>
          </Card>

          {/* Sales KPIs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
              gap: 12,
            }}
          >
            <KpiCard
              label="Sales count"
              value={data.Sales.Count.toLocaleString()}
            />
            <KpiCard label="Gross sales" value={formatMoney(data.Sales.GrossSales)} />
            <KpiCard
              label="Net sales"
              value={formatMoney(data.Sales.NetSales)}
              strong
              valueColor="#0d9488"
            />
            <KpiCard
              label="Paid amount"
              value={formatMoney(data.Sales.PaidAmount)}
            />
            <KpiCard label="Cash" value={formatMoney(data.Payments.Cash)} valueColor="#16a34a" />
            <KpiCard label="Card" value={formatMoney(data.Payments.Card)} />
            <KpiCard
              label="Credit (added to customer debt)"
              value={formatMoney(data.Payments.Credit)}
              valueColor="#dc2626"
            />
            <KpiCard label="Cheque" value={formatMoney(data.Payments.Cheque)} />
            <KpiCard
              label="Tax collected"
              value={formatMoney(data.Sales.TaxCollected)}
            />
            <KpiCard
              label="Discounts"
              value={`− ${formatMoney(data.Sales.Discounts)}`}
            />
            <KpiCard
              label={`Returns (${data.Returns.Count})`}
              value={`− ${formatMoney(data.Returns.Total)}`}
              valueColor="#dc2626"
            />
            <KpiCard
              label={`Cancels (${data.Cancels.Count})`}
              value={formatMoney(data.Cancels.Value)}
            />
          </div>

          {/* Cash flow */}
          <Card
            title="Cash drawer movement"
            size="small"
            styles={{ body: { padding: isMobile ? 12 : 16 } }}
          >
            <Row gutter={[12, 12]}>
              <Col xs={12} md={6}>
                <KpiCard
                  label="Starting cash"
                  value={
                    data.CashFlow.StartingCash !== null
                      ? formatMoney(data.CashFlow.StartingCash)
                      : '—'
                  }
                />
              </Col>
              <Col xs={12} md={6}>
                <KpiCard
                  label="Cash sales"
                  value={`+ ${formatMoney(data.CashFlow.CashSales)}`}
                  valueColor="#16a34a"
                />
              </Col>
              <Col xs={12} md={6}>
                <KpiCard
                  label="Credit payments"
                  value={`+ ${formatMoney(data.CashFlow.CashCreditPayments)}`}
                  valueColor="#16a34a"
                />
              </Col>
              <Col xs={12} md={6}>
                <KpiCard
                  label="Cash in"
                  value={`+ ${formatMoney(data.CashFlow.CashIn)}`}
                  valueColor="#16a34a"
                />
              </Col>
              <Col xs={12} md={6}>
                <KpiCard
                  label="Cash out"
                  value={`− ${formatMoney(data.CashFlow.CashOut.replace('-', ''))}`}
                  valueColor="#dc2626"
                />
              </Col>
              <Col xs={12} md={6}>
                <KpiCard
                  label="Refunds (cash)"
                  value={`− ${formatMoney(data.CashFlow.CashRefunds.replace('-', ''))}`}
                  valueColor="#dc2626"
                />
              </Col>
              <Col xs={12} md={6}>
                <KpiCard
                  label="Expenses (cash)"
                  value={`− ${formatMoney(data.CashFlow.CashExpenses.replace('-', ''))}`}
                  valueColor="#dc2626"
                />
              </Col>
              <Col xs={12} md={6}>
                <KpiCard
                  label="Expected drawer"
                  value={formatMoney(data.CashFlow.ExpectedDrawer)}
                  strong
                  valueColor="#0d9488"
                />
              </Col>
            </Row>
          </Card>

          {/* Session close reconciliation */}
          {data.Session &&
            data.Session.Status === 'CLOSED' &&
            data.Session.CountedCash !== null && (
              <Alert
                type={
                  data.Session.Difference &&
                  Math.abs(Number(data.Session.Difference)) > 0.0001
                    ? 'warning'
                    : 'success'
                }
                showIcon
                message={
                  data.Session.Difference &&
                  Math.abs(Number(data.Session.Difference)) > 0.0001
                    ? `Drawer was ${
                        Number(data.Session.Difference) < 0 ? 'short' : 'over'
                      } by ${formatMoney(
                        Math.abs(Number(data.Session.Difference)).toFixed(4),
                      )}`
                    : 'Drawer balanced'
                }
                description={
                  <>
                    Starting {formatMoney(data.Session.StartingCash)} · Expected{' '}
                    {data.Session.ExpectedCash
                      ? formatMoney(data.Session.ExpectedCash)
                      : '—'}{' '}
                    · Counted {formatMoney(data.Session.CountedCash)}
                  </>
                }
              />
            )}

          {/* Top products */}
          <Card
            title="Top products"
            size="small"
            styles={{ body: { padding: 0 } }}
          >
            {data.TopProducts.length === 0 ? (
              <Empty description="No products sold" style={{ padding: 32 }} />
            ) : isMobile ? (
              <Flex vertical gap={6} style={{ padding: 8 }}>
                {data.TopProducts.map((p) => (
                  <Flex
                    key={p.ProductId}
                    justify="space-between"
                    gap={8}
                    style={{
                      padding: 8,
                      border: '1px solid #f0f0f0',
                      borderRadius: 6,
                    }}
                  >
                    <Flex vertical gap={0} style={{ flex: 1, minWidth: 0 }}>
                      <Typography.Text strong ellipsis>
                        {p.Name}
                      </Typography.Text>
                      {p.SKU && (
                        <Typography.Text
                          type="secondary"
                          style={{ fontSize: 11 }}
                        >
                          {p.SKU}
                        </Typography.Text>
                      )}
                    </Flex>
                    <Flex vertical gap={0} align="flex-end">
                      <Typography.Text strong>
                        {formatMoney(p.Revenue)}
                      </Typography.Text>
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 11 }}
                      >
                        {p.QtySold} sold
                      </Typography.Text>
                    </Flex>
                  </Flex>
                ))}
              </Flex>
            ) : (
              <Table
                rowKey="ProductId"
                columns={topColumns}
                dataSource={data.TopProducts}
                pagination={false}
                size="small"
              />
            )}
          </Card>
        </Flex>
      )}
    </ReportShell>
  );
}