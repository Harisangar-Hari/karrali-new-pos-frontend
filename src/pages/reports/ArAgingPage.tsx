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
  Switch,
  Table,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { ReportShell } from '@/components/reports/ReportShell';
import { KpiCard } from '@/components/reports/KpiCard';
import { useArAging } from '@/hooks/queries/useReports';
import { formatMoney, formatDate } from '@/lib/format';
import type { ArAgingRow } from '@/types/reports';

const { useBreakpoint } = Grid;
const { RangePicker } = DatePicker;

/**
 * Bucket-specific colors — green for "fresh", escalating to deep red for
 * the oldest. Matches the visual convention most accountants expect.
 */
const BUCKET_COLORS: Record<keyof ArAgingRow['Buckets'], string> = {
  Current: '#16a34a',       // 0–30 days
  Days31To60: '#65a30d',    // 31–60
  Days61To90: '#ca8a04',    // 61–90
  Days91To180: '#ea580c',   // 91–180
  DaysOver180: '#dc2626',   // 180+
};

export function ArAgingPage() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [range, setRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('year'),
    dayjs(),
  ]);
  const [includeZero, setIncludeZero] = useState(false);

  const params = useMemo(
    () => ({
      From: range[0].startOf('day').toISOString(),
      To: range[1].endOf('day').toISOString(),
      IncludeZeroBalance: includeZero || undefined,
    }),
    [range, includeZero],
  );

  const { data, isLoading } = useArAging(params);

  const columns: ColumnsType<ArAgingRow> = [
    {
      title: 'Customer',
      key: 'name',
      fixed: 'left',
      render: (_: unknown, row) => (
        <Flex vertical gap={2}>
          <Typography.Text strong>{row.Name}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {row.Code}
            {row.Phone ? ` · ${row.Phone}` : ''}
          </Typography.Text>
        </Flex>
      ),
    },
    {
      title: 'Balance',
      dataIndex: 'Balance',
      key: 'Balance',
      align: 'right',
      render: (v: string) => (
        <Typography.Text strong style={{ color: '#0d9488' }}>
          {formatMoney(v)}
        </Typography.Text>
      ),
    },
    {
      title: 'Credit limit',
      dataIndex: 'CreditLimit',
      key: 'CreditLimit',
      align: 'right',
      render: (v: string) => formatMoney(v),
    },
    {
      title: 'Available',
      dataIndex: 'AvailableCredit',
      key: 'AvailableCredit',
      align: 'right',
      render: (v: string) => {
        const n = Number(v);
        return (
          <Typography.Text style={{ color: n < 0 ? '#dc2626' : undefined }}>
            {formatMoney(v)}
          </Typography.Text>
        );
      },
    },
    {
      title: '0–30',
      key: 'Current',
      align: 'right',
      render: (_: unknown, row) => (
        <Typography.Text style={{ color: BUCKET_COLORS.Current, fontSize: 12 }}>
          {formatMoney(row.Buckets.Current)}
        </Typography.Text>
      ),
    },
    {
      title: '31–60',
      key: 'Days31To60',
      align: 'right',
      render: (_: unknown, row) => (
        <Typography.Text
          style={{ color: BUCKET_COLORS.Days31To60, fontSize: 12 }}
        >
          {formatMoney(row.Buckets.Days31To60)}
        </Typography.Text>
      ),
    },
    {
      title: '61–90',
      key: 'Days61To90',
      align: 'right',
      render: (_: unknown, row) => (
        <Typography.Text
          style={{ color: BUCKET_COLORS.Days61To90, fontSize: 12 }}
        >
          {formatMoney(row.Buckets.Days61To90)}
        </Typography.Text>
      ),
    },
    {
      title: '91–180',
      key: 'Days91To180',
      align: 'right',
      render: (_: unknown, row) => (
        <Typography.Text
          style={{ color: BUCKET_COLORS.Days91To180, fontSize: 12 }}
        >
          {formatMoney(row.Buckets.Days91To180)}
        </Typography.Text>
      ),
    },
    {
      title: '180+',
      key: 'DaysOver180',
      align: 'right',
      render: (_: unknown, row) => (
        <Typography.Text
          strong
          style={{ color: BUCKET_COLORS.DaysOver180, fontSize: 12 }}
        >
          {formatMoney(row.Buckets.DaysOver180)}
        </Typography.Text>
      ),
    },
    {
      title: 'Last credit sale',
      dataIndex: 'LastCreditSaleDate',
      key: 'LastCreditSaleDate',
      render: (v: string | null) =>
        v ? (
          <Typography.Text style={{ fontSize: 12 }}>
            {formatDate(v)}
          </Typography.Text>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
  ];

  const totals = data?.Totals;

  return (
    <ReportShell
      title="AR aging"
      subtitle="Outstanding customer balances bucketed by age (FIFO)"
      printable
      filters={
        <Row gutter={[12, 12]}>
          <Col xs={24} md={14}>
            <RangePicker
              value={range}
              onChange={(v) =>
                setRange(v && v[0] && v[1] ? [v[0], v[1]] : range)
              }
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={10}>
            <Flex align="center" gap={8}>
              <Switch
                size="small"
                checked={includeZero}
                onChange={setIncludeZero}
              />
              <Typography.Text style={{ fontSize: 12 }}>
                Include customers with zero / negative balance
              </Typography.Text>
            </Flex>
          </Col>
        </Row>
      }
    >
      {totals && (
        <Row gutter={[12, 12]}>
          <Col xs={24} md={6}>
            <KpiCard
              label="Total outstanding"
              value={formatMoney(totals.Grand)}
              strong
              valueColor="#0d9488"
              hint={`${data?.Rows.length ?? 0} customer${data?.Rows.length === 1 ? '' : 's'}`}
            />
          </Col>
          <Col xs={12} md={4}>
            <KpiCard
              label="0–30 days"
              value={formatMoney(totals.Current)}
              valueColor={BUCKET_COLORS.Current}
            />
          </Col>
          <Col xs={12} md={4}>
            <KpiCard
              label="31–60 days"
              value={formatMoney(totals.Days31To60)}
              valueColor={BUCKET_COLORS.Days31To60}
            />
          </Col>
          <Col xs={12} md={5}>
            <KpiCard
              label="61–90 days"
              value={formatMoney(totals.Days61To90)}
              valueColor={BUCKET_COLORS.Days61To90}
            />
          </Col>
          <Col xs={12} md={5}>
            <KpiCard
              label="90+ days"
              value={formatMoney(
                (
                  Number(totals.Days91To180) + Number(totals.DaysOver180)
                ).toFixed(4),
              )}
              valueColor={BUCKET_COLORS.DaysOver180}
            />
          </Col>
        </Row>
      )}

      <Card styles={{ body: { padding: isMobile ? 8 : 0 } }}>
        {isLoading ? (
          <Flex justify="center" style={{ padding: 48 }}>
            <Skeleton active paragraph={{ rows: 8 }} />
          </Flex>
        ) : !data?.Rows?.length ? (
          <Empty
            description="No customers with outstanding balances"
            style={{ padding: 32 }}
          />
        ) : isMobile ? (
          <Flex vertical gap={8} style={{ padding: 8 }}>
            {data.Rows.map((row) => (
              <Card
                key={row.CustomerId}
                size="small"
                styles={{ body: { padding: 10 } }}
              >
                <Flex justify="space-between" gap={8} align="flex-start">
                  <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                    <Typography.Text strong ellipsis>
                      {row.Name}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      {row.Code}
                      {row.Phone ? ` · ${row.Phone}` : ''}
                    </Typography.Text>
                    <Flex gap={4} wrap="wrap" style={{ marginTop: 4 }}>
                      <Typography.Text
                        style={{ fontSize: 11, color: BUCKET_COLORS.Current }}
                      >
                        0–30 {formatMoney(row.Buckets.Current)}
                      </Typography.Text>
                      {Number(row.Buckets.Days31To60) > 0 && (
                        <Typography.Text
                          style={{
                            fontSize: 11,
                            color: BUCKET_COLORS.Days31To60,
                          }}
                        >
                          31–60 {formatMoney(row.Buckets.Days31To60)}
                        </Typography.Text>
                      )}
                      {Number(row.Buckets.Days91To180) > 0 && (
                        <Typography.Text
                          style={{
                            fontSize: 11,
                            color: BUCKET_COLORS.Days91To180,
                          }}
                        >
                          90+{' '}
                          {formatMoney(
                            (
                              Number(row.Buckets.Days91To180) +
                              Number(row.Buckets.DaysOver180)
                            ).toFixed(4),
                          )}
                        </Typography.Text>
                      )}
                    </Flex>
                  </Flex>
                  <Flex vertical gap={2} align="flex-end">
                    <Typography.Text strong style={{ color: '#0d9488' }}>
                      {formatMoney(row.Balance)}
                    </Typography.Text>
                    <Typography.Text
                      type="secondary"
                      style={{ fontSize: 11 }}
                    >
                      limit {formatMoney(row.CreditLimit)}
                    </Typography.Text>
                  </Flex>
                </Flex>
              </Card>
            ))}
          </Flex>
        ) : (
          <Table<ArAgingRow>
            rowKey="CustomerId"
            columns={columns}
            dataSource={data.Rows}
            pagination={{ pageSize: 50, showSizeChanger: false }}
            scroll={{ x: 'max-content' }}
            size="middle"
            summary={() => (
              <Table.Summary.Row style={{ fontWeight: 600 }}>
                <Table.Summary.Cell index={0}>
                  <Typography.Text strong>
                    Total ({data.Rows.length})
                  </Typography.Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <Typography.Text strong style={{ color: '#0d9488' }}>
                    {formatMoney(data.Totals.Grand)}
                  </Typography.Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  —
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  —
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  <Typography.Text
                    strong
                    style={{ color: BUCKET_COLORS.Current }}
                  >
                    {formatMoney(data.Totals.Current)}
                  </Typography.Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  <Typography.Text
                    strong
                    style={{ color: BUCKET_COLORS.Days31To60 }}
                  >
                    {formatMoney(data.Totals.Days31To60)}
                  </Typography.Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} align="right">
                  <Typography.Text
                    strong
                    style={{ color: BUCKET_COLORS.Days61To90 }}
                  >
                    {formatMoney(data.Totals.Days61To90)}
                  </Typography.Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7} align="right">
                  <Typography.Text
                    strong
                    style={{ color: BUCKET_COLORS.Days91To180 }}
                  >
                    {formatMoney(data.Totals.Days91To180)}
                  </Typography.Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={8} align="right">
                  <Typography.Text
                    strong
                    style={{ color: BUCKET_COLORS.DaysOver180 }}
                  >
                    {formatMoney(data.Totals.DaysOver180)}
                  </Typography.Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={9} align="right" />
              </Table.Summary.Row>
            )}
          />
        )}
      </Card>
    </ReportShell>
  );
}