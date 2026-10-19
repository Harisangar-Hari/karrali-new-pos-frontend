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
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { ReportShell } from '@/components/reports/ReportShell';
import { KpiCard } from '@/components/reports/KpiCard';
import { useProfitReport } from '@/hooks/queries/useReports';
import { useTerminalsLookup } from '@/hooks/queries/useTerminalsLookup';
import { useCategoriesLookup } from '@/hooks/queries/useLookups';
import { formatMoney } from '@/lib/format';
import type { ProfitGroup, ProfitReportRow } from '@/types/reports';

const { useBreakpoint } = Grid;
const { RangePicker } = DatePicker;

export function ProfitPage() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [group, setGroup] = useState<ProfitGroup>('none');
  const [range, setRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs(),
  ]);
  const [terminalId, setTerminalId] = useState<string | undefined>();
  const [categoryId, setCategoryId] = useState<string | undefined>();

  const { data: terminals = [] } = useTerminalsLookup();
  const { data: categories = [] } = useCategoriesLookup();

  const params = useMemo(
    () => ({
      From: range[0].startOf('day').toISOString(),
      To: range[1].endOf('day').toISOString(),
      GroupBy: group,
      TerminalId: terminalId,
      CategoryId: categoryId,
    }),
    [range, group, terminalId, categoryId],
  );

  const { data, isLoading } = useProfitReport(params);

  const columns: ColumnsType<ProfitReportRow> = [
    {
      title: group === 'none' ? 'Product' : 'Period',
      key: 'name',
      fixed: 'left',
      render: (_: unknown, row) => (
        <Flex vertical gap={2}>
          <Typography.Text strong>{row.Name}</Typography.Text>
          {row.SKU && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {row.SKU}
            </Typography.Text>
          )}
          {row.CategoryName && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {row.CategoryName}
            </Typography.Text>
          )}
        </Flex>
      ),
    },
    {
      title: 'Qty sold',
      dataIndex: 'QtySold',
      key: 'QtySold',
      align: 'right',
    },
    {
      title: 'Net revenue',
      dataIndex: 'NetRevenue',
      key: 'NetRevenue',
      align: 'right',
      render: (v: string) => formatMoney(v),
    },
    {
      title: 'Tax',
      dataIndex: 'TaxCollected',
      key: 'TaxCollected',
      align: 'right',
      render: (v: string) => formatMoney(v),
    },
    {
      title: 'COGS',
      dataIndex: 'COGS',
      key: 'COGS',
      align: 'right',
      render: (v: string) => (
        <Typography.Text style={{ color: '#dc2626' }}>
          {formatMoney(v)}
        </Typography.Text>
      ),
    },
    {
      title: 'Gross profit',
      dataIndex: 'GrossProfit',
      key: 'GrossProfit',
      align: 'right',
      render: (v: string) => {
        const n = Number(v);
        return (
          <Typography.Text
            strong
            style={{ color: n < 0 ? '#dc2626' : '#16a34a' }}
          >
            {formatMoney(v)}
          </Typography.Text>
        );
      },
    },
    {
      title: 'Margin %',
      dataIndex: 'MarginPct',
      key: 'MarginPct',
      align: 'right',
      render: (v: string) => {
        const n = Number(v);
        const color = n < 0 ? 'red' : n < 10 ? 'orange' : 'green';
        return <Tag color={color}>{n.toFixed(2)}%</Tag>;
      },
    },
  ];

  const total = data?.Total;

  return (
    <ReportShell
      title="Profit & COGS"
      subtitle="Gross profit by product or time bucket"
      printable
      filters={
        <Row gutter={[12, 12]}>
          <Col xs={24} md={8}>
            <RangePicker
              value={range}
              onChange={(v) =>
                setRange(v && v[0] && v[1] ? [v[0], v[1]] : range)
              }
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={7}>
            <Segmented
              value={group}
              onChange={(v) => setGroup(v as ProfitGroup)}
              block
              options={[
                { label: 'By product', value: 'none' },
                { label: 'Day', value: 'day' },
                { label: 'Week', value: 'week' },
                { label: 'Month', value: 'month' },
              ]}
            />
          </Col>
          <Col xs={12} md={5}>
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
          <Col xs={12} md={4}>
            <Select
              value={categoryId}
              onChange={setCategoryId}
              placeholder="All categories"
              allowClear
              showSearch
              optionFilterProp="label"
              options={categories.map((c) => ({
                label: c.Name,
                value: c.Id,
              }))}
              style={{ width: '100%' }}
            />
          </Col>
        </Row>
      }
    >
      {total && (
        <Row gutter={[12, 12]}>
          <Col xs={12} md={5}>
            <KpiCard label="Qty sold" value={total.QtySold.toLocaleString()} />
          </Col>
          <Col xs={12} md={5}>
            <KpiCard
              label="Net revenue"
              value={formatMoney(total.NetRevenue)}
              strong
            />
          </Col>
          <Col xs={12} md={5}>
            <KpiCard
              label="COGS"
              value={formatMoney(total.COGS)}
              valueColor="#dc2626"
            />
          </Col>
          <Col xs={12} md={5}>
            <KpiCard
              label="Gross profit"
              value={formatMoney(total.GrossProfit)}
              strong
              valueColor={Number(total.GrossProfit) < 0 ? '#dc2626' : '#16a34a'}
            />
          </Col>
          <Col xs={12} md={4}>
            <KpiCard
              label="Margin"
              value={`${Number(total.MarginPct).toFixed(2)}%`}
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
          <Empty
            description="No sales in this range"
            style={{ padding: 32 }}
          />
        ) : isMobile ? (
          <Flex vertical gap={8} style={{ padding: 8 }}>
            {data.Rows.map((row, idx) => {
              const profit = Number(row.GrossProfit);
              return (
                <Card
                  key={row.ProductId ?? row.Name ?? `row-${idx}`}
                  size="small"
                  styles={{ body: { padding: 10 } }}
                >
                  <Flex justify="space-between" gap={8} align="flex-start">
                    <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                      <Typography.Text strong ellipsis>
                        {row.Name}
                      </Typography.Text>
                      {row.SKU && (
                        <Typography.Text
                          type="secondary"
                          style={{ fontSize: 11 }}
                        >
                          {row.SKU}
                        </Typography.Text>
                      )}
                      {row.CategoryName && (
                        <Typography.Text
                          type="secondary"
                          style={{ fontSize: 11 }}
                        >
                          {row.CategoryName}
                        </Typography.Text>
                      )}
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 11, marginTop: 4 }}
                      >
                        {row.QtySold} sold · rev {formatMoney(row.NetRevenue)} ·
                        cost {formatMoney(row.COGS)}
                      </Typography.Text>
                    </Flex>
                    <Flex vertical gap={2} align="flex-end">
                      <Typography.Text
                        strong
                        style={{ color: profit < 0 ? '#dc2626' : '#16a34a' }}
                      >
                        {formatMoney(row.GrossProfit)}
                      </Typography.Text>
                      <Tag color={profit < 0 ? 'red' : 'green'}>
                        {Number(row.MarginPct).toFixed(1)}%
                      </Tag>
                    </Flex>
                  </Flex>
                </Card>
              );
            })}
          </Flex>
        ) : (
          <Table<ProfitReportRow>
            rowKey={(r, idx) => r.ProductId ?? r.Name ?? `row-${idx ?? 0}`}
            columns={columns}
            dataSource={data.Rows}
            pagination={{ pageSize: 50, showSizeChanger: false }}
            scroll={{ x: 'max-content' }}
            size="middle"
          />
        )}
      </Card>
    </ReportShell>
  );
}