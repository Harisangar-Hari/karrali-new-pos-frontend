import { Card, Empty, Typography, Flex } from 'antd';
import { Construction } from 'lucide-react';
import { useLocation } from 'react-router-dom';

/** Path → the phase that will build this page. Used for the placeholder text. */
const PHASE_BY_PATH: Record<string, string> = {
  '/pos': 'F5 — POS / Sale screen',
  '/sales': 'F5 — Sales',
  '/sale-returns': 'F9 — Sale returns',
  '/credit-payments': 'F9 — Credit payments',
  '/customer-cheques': 'F9 — Customer cheques',
  '/products': 'F3 — Catalog',
  '/categories': 'F3 — Catalog',
  '/brands': 'F3 — Catalog',
  '/stock': 'F3 — Catalog',
  '/warehouses': 'F3 — Catalog',
  '/terminals': 'F3 — Catalog',
  '/purchases': 'F6 — Purchases',
  '/supplier-payments': 'F6 — Purchases',
  '/supplier-cheques': 'F6 — Purchases',
  '/customers': 'F4 — Customers',
  '/suppliers': 'F4 — Suppliers',
  '/cash-sessions': 'F7 — Cash',
  '/cash-movements': 'F7 — Cash',
  '/bank-accounts': 'F7 — Cash',
  '/expenses': 'F7 — Cash',
  '/quotations': 'F10 — Quotations',
  '/loyalty': 'F10 — Loyalty',
  '/users': 'F10 — Users',
  '/settings': 'F10 — Settings',
  '/audit-logs': 'F10 — Audit logs',
  '/reports/sales-summary': 'F8 — Reports',
  '/reports/z-report': 'F8 — Reports',
  '/reports/profit': 'F8 — Reports',
  '/reports/stock-valuation': 'F8 — Reports',
  '/reports/inventory-movement': 'F8 — Reports',
  '/reports/ar-aging': 'F8 — Reports',
  '/reports/cheque-calendar': 'F8 — Reports',
  '/reports/cash-flow': 'F8 — Reports',
};

export function PlaceholderPage() {
  const { pathname } = useLocation();
  // Strip trailing segment for detail routes like /customers/:id
  const base = pathname.replace(/\/[^/]+\/?$/, (m, offset) =>
    offset === 0 ? m : '',
  );
  const phase = PHASE_BY_PATH[pathname] ?? PHASE_BY_PATH[base] ?? 'a future phase';

  return (
    <Card>
      <Flex vertical align="center" justify="center" style={{ padding: '32px 0' }}>
        <Empty
          image={
            <Construction
              size={72}
              strokeWidth={1}
              color="#0d9488"
              style={{ margin: '0 auto' }}
            />
          }
          imageStyle={{ height: 80 }}
          description={
            <Flex vertical gap={4} align="center">
              <Typography.Title level={4} style={{ margin: 0 }}>
                Coming soon
              </Typography.Title>
              <Typography.Text type="secondary">
                This page ships in <strong>{phase}</strong>.
              </Typography.Text>
            </Flex>
          }
        />
      </Flex>
    </Card>
  );
}