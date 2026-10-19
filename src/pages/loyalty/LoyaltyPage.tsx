import { Tabs, Card } from 'antd';
import { ReportShell } from '@/components/reports/ReportShell';
import { LoyaltyConfigTab } from './LoyaltyConfigTab';
import { LoyaltyTransactionsTab } from './LoyaltyTransactionsTab';

export function LoyaltyPage() {
  return (
    <ReportShell title="Loyalty" subtitle="Program configuration and transaction history">
      <Card>
        <Tabs
          defaultActiveKey="config"
          items={[
            {
              key: 'config',
              label: 'Configuration',
              children: <LoyaltyConfigTab />,
            },
            {
              key: 'transactions',
              label: 'Transactions',
              children: <LoyaltyTransactionsTab />,
            },
          ]}
        />
      </Card>
    </ReportShell>
  );
}