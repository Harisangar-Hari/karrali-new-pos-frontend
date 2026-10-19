import { useState } from 'react';
import {
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Grid,
  Pagination,
  Progress,
  Row,
  Skeleton,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Gift, Sparkles } from 'lucide-react';
import { useLoyaltyStatus, useLoyaltyTransactions } from '@/hooks/queries/useLoyalty';
import { usePermission } from '@/hooks/usePermission';
import { AdjustPointsModal } from '@/pages/loyalty/AdjustPointsModal';
import { formatMoney, formatDateTime } from '@/lib/format';
import type { LoyaltyTransactionRow, LoyaltyTransactionType } from '@/types/loyalty';

const { useBreakpoint } = Grid;

const TYPE_COLOR: Record<LoyaltyTransactionType, string> = {
  EARN: 'green',
  REDEEM: 'orange',
  ADJUST: 'blue',
  REVERSAL: 'red',
};

interface Props {
  customerId: string;
}

export function CustomerLoyaltyTab({ customerId }: Props) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const canAdjust = usePermission('loyalty.adjust');

  const { data: status, isLoading: statusLoading } =
    useLoyaltyStatus(customerId);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const { data: txns, isLoading: txnsLoading } = useLoyaltyTransactions({
    CustomerId: customerId,
    page,
    limit,
    sortBy: 'CreatedAt',
    sortOrder: 'desc',
  });

  const columns: ColumnsType<LoyaltyTransactionRow> = [
    {
      title: 'When',
      dataIndex: 'CreatedAt',
      key: 'CreatedAt',
      render: (v: string) => (
        <Typography.Text style={{ fontSize: 12 }}>
          {formatDateTime(v)}
        </Typography.Text>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'Type',
      key: 'Type',
      render: (t: LoyaltyTransactionType) => (
        <Tag color={TYPE_COLOR[t]} style={{ marginInlineEnd: 0 }}>
          {t}
        </Tag>
      ),
    },
    {
      title: 'Points',
      dataIndex: 'Points',
      key: 'Points',
      align: 'right',
      render: (v: number) => (
        <Typography.Text
          strong
          style={{ color: v > 0 ? '#16a34a' : '#dc2626' }}
        >
          {v > 0 ? '+' : ''}
          {v}
        </Typography.Text>
      ),
    },
    {
      title: 'Balance after',
      dataIndex: 'PointsAfter',
      key: 'PointsAfter',
      align: 'right',
      render: (v: number) => v.toLocaleString(),
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
  ];

  if (statusLoading || !status) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  // Progress toward next tier
  const tierProgress =
    status.PointsToNextTier !== null && status.PointsToNextTier > 0
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              (status.LifetimeEarned /
                (status.LifetimeEarned + status.PointsToNextTier)) *
                100,
            ),
          ),
        )
      : 100;

  return (
    <Flex vertical gap={16}>
      {/* Header: status + adjust button */}
      <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
        <Flex align="center" gap={8}>
          <Tag color="gold" icon={<Sparkles size={12} />}>
            {status.Tier}
          </Tag>
          {status.NextTier && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Next: {status.NextTier} (
              {status.PointsToNextTier?.toLocaleString()} pts to go)
            </Typography.Text>
          )}
        </Flex>
        {canAdjust && (
          <Button
            icon={<Gift size={14} />}
            onClick={() => setAdjustOpen(true)}
          >
            Adjust points
          </Button>
        )}
      </Flex>

      {/* KPIs */}
      <Row gutter={[12, 12]}>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="Current points"
              value={status.Points.toLocaleString()}
              valueStyle={{ color: '#0d9488' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="Lifetime earned"
              value={status.LifetimeEarned.toLocaleString()}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="Redeem value"
              value={formatMoney(status.RedeemValue)}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="Tier" value={status.Tier} />
          </Card>
        </Col>
      </Row>

      {status.NextTier && (
        <Card size="small">
          <Flex vertical gap={4}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Progress to {status.NextTier}
            </Typography.Text>
            <Progress
              percent={tierProgress}
              strokeColor="#0d9488"
              format={(p) => `${p ?? 0}%`}
            />
          </Flex>
        </Card>
      )}

      {/* Transactions */}
      <Card
        title="Points history"
        size="small"
        styles={{ body: { padding: isMobile ? 8 : 0 } }}
      >
        {txnsLoading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : !txns?.data?.length ? (
          <Empty description="No loyalty activity yet" style={{ padding: 24 }} />
        ) : isMobile ? (
          <>
            <Flex vertical gap={8} style={{ padding: 8 }}>
              {txns.data.map((row) => (
                <Card
                  key={row.Id}
                  size="small"
                  styles={{ body: { padding: 10 } }}
                >
                  <Flex justify="space-between" gap={8} align="flex-start">
                    <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                      <Flex align="center" gap={6}>
                        <Tag
                          color={TYPE_COLOR[row.Type]}
                          style={{ marginInlineEnd: 0 }}
                        >
                          {row.Type}
                        </Tag>
                        <Typography.Text
                          type="secondary"
                          style={{ fontSize: 11 }}
                        >
                          {formatDateTime(row.CreatedAt)}
                        </Typography.Text>
                      </Flex>
                      {row.Notes && (
                        <Typography.Text
                          type="secondary"
                          style={{ fontSize: 11 }}
                          ellipsis
                        >
                          {row.Notes}
                        </Typography.Text>
                      )}
                    </Flex>
                    <Flex vertical gap={2} align="flex-end">
                      <Typography.Text
                        strong
                        style={{
                          color: row.Points > 0 ? '#16a34a' : '#dc2626',
                        }}
                      >
                        {row.Points > 0 ? '+' : ''}
                        {row.Points}
                      </Typography.Text>
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 11 }}
                      >
                        bal {row.PointsAfter}
                      </Typography.Text>
                    </Flex>
                  </Flex>
                </Card>
              ))}
            </Flex>
            <Flex justify="center" style={{ padding: 12 }}>
              <Pagination
                current={page}
                pageSize={limit}
                total={txns.meta.total}
                onChange={(p, ps) => {
                  setPage(p);
                  if (ps !== limit) setLimit(ps);
                }}
                simple
              />
            </Flex>
          </>
        ) : (
          <Table<LoyaltyTransactionRow>
            rowKey="Id"
            columns={columns}
            dataSource={txns.data}
            pagination={{
              current: page,
              pageSize: limit,
              total: txns.meta.total,
              onChange: (p, ps) => {
                setPage(p);
                if (ps !== limit) setLimit(ps);
              },
              showSizeChanger: true,
              showTotal: (t, r) => `${r[0]}–${r[1]} of ${t}`,
            }}
            size="small"
          />
        )}
      </Card>

      <AdjustPointsModal
        open={adjustOpen}
        customerId={customerId}
        customerName={status.Name}
        currentPoints={status.Points}
        onClose={() => setAdjustOpen(false)}
      />
    </Flex>
  );
}