import { Card, Col, Row, Tag, Typography, Flex } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { formatDateTime } from '@/lib/format';

const statCol = { xs: 24, sm: 12, lg: 6 } as const;

interface KpiCardProps {
  title: string;
}

/**
 * Placeholder KPI card. Real numbers land in F8 once report endpoints
 * are wired. Keeping the component here (rather than in F8) so the
 * Dashboard layout is settled now and F8 is a drop-in swap.
 */
function KpiCard({ title }: KpiCardProps) {
  return (
    <Card>
      <Flex vertical gap={4}>
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          {title}
        </Typography.Text>
        <Typography.Title
          level={3}
          style={{ margin: 0, color: '#94a3b8', fontWeight: 500 }}
        >
          —
        </Typography.Title>
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          Pending F8
        </Typography.Text>
      </Flex>
    </Card>
  );
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div>
      <Flex vertical gap={6} style={{ marginBottom: 24 }}>
        <Typography.Title
          level={3}
          style={{ margin: 0, fontSize: 'clamp(1.25rem, 3vw, 1.5rem)' }}
        >
          Welcome{user?.FullName ? `, ${user.FullName}` : ''}
        </Typography.Title>

        <Flex align="center" gap={8} wrap="wrap">
          <Typography.Text type="secondary">
            Signed in as <strong>{user?.Username ?? '—'}</strong>
          </Typography.Text>
          {user?.Roles?.length ? (
            <Flex gap={4} wrap="wrap">
              {user.Roles.map((r) => (
                <Tag key={r} color="cyan" style={{ marginInlineEnd: 0 }}>
                  {r}
                </Tag>
              ))}
            </Flex>
          ) : null}
        </Flex>

        {user?.LastLogin && (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Last sign-in: {formatDateTime(user.LastLogin)}
          </Typography.Text>
        )}
      </Flex>

      <Row gutter={[16, 16]}>
        <Col {...statCol}>
          <KpiCard title="Today's Sales" />
        </Col>
        <Col {...statCol}>
          <KpiCard title="Transactions Today" />
        </Col>
        <Col {...statCol}>
          <KpiCard title="Pending Cheques" />
        </Col>
        <Col {...statCol}>
          <KpiCard title="Low Stock Items" />
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>
          What's next
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
          Dashboard KPIs will pull live numbers from the report endpoints
          (sales summary, cash flow, cheque calendar, stock valuation) once
          <strong> F8 — Reports</strong> is built. Until then this page shows
          the layout, role summary, and a stable home for the KPI grid.
        </Typography.Paragraph>
      </Card>
    </div>
  );
}