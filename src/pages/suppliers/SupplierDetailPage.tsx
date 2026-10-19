import { useState } from 'react';
import {
  Card,
  Descriptions,
  Flex,
  Grid,
  Statistic,
  Tabs,
  Tag,
  Typography,
  Button,
  Skeleton,
  Space,
} from 'antd';
import {
  ArrowLeft,
  Pencil,
  Mail,
  Phone,
  MapPin,
  FileText,
  Landmark,
  ShoppingBag,
  Wallet,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useSupplier,
} from '@/hooks/queries/useSuppliers';
import { usePurchases } from '@/hooks/queries/usePurchases';

import { useSupplierCheques } from '@/hooks/queries/useSupplierCheques';
import { usePermission } from '@/hooks/usePermission';
import { SupplierFormDrawer } from './SupplierFormDrawer';
import { SupplierPurchasesTab } from './SupplierPurchasesTab';
import { SupplierPaymentsTab } from './SupplierPaymentsTab';
import { SupplierChequesTab } from './SupplierChequesTab';
import { formatMoney, formatDate } from '@/lib/format';

const { useBreakpoint } = Grid;

export function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const canManage = usePermission('suppliers.manage');

  const { data: supplier, isLoading } = useSupplier(id ?? null);

  // Load capped summaries for the KPI cards. Tabs do the real paginated
  // fetch — these are just "approximate totals" capped at 100 records.
  const { data: purchasesPage, isLoading: purchasesLoading } = usePurchases({
    SupplierId: id,
    limit: 100,
    sortBy: 'InvoiceDate',
    sortOrder: 'desc',
  });
  const { data: pendingChequesPage, isLoading: pendingChequesLoading } =
    useSupplierCheques({
      SupplierId: id,
      Status: 'PENDING',
      limit: 100,
    });

  const [editOpen, setEditOpen] = useState(false);

  if (isLoading || !supplier) {
    return <Skeleton active paragraph={{ rows: 10 }} />;
  }

  // KPIs computed from the (capped) purchase list
  const purchases = purchasesPage?.data ?? [];
  const totalPurchases = purchases.reduce(
    (sum, p) => sum + Number(p.TotalAmount),
    0,
  );
  const outstanding = purchases
    .filter((p) => p.Status === 'POSTED')
    .reduce(
      (sum, p) => sum + (Number(p.TotalAmount) - Number(p.PaidAmount)),
      0,
    );
  const lastPurchase = purchases[0]?.InvoiceDate ?? null;

  const pendingCheques = pendingChequesPage?.data ?? [];
  const pendingChequeTotal = pendingCheques.reduce(
    (sum, c) => sum + Number(c.Amount),
    0,
  );

  return (
    <Flex vertical gap={16}>
      {/* Header */}
      <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
        <Flex align="center" gap={8} style={{ flex: 1, minWidth: 0 }}>
          <Button
            type="text"
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate('/suppliers')}
          />
          <Flex vertical gap={2} style={{ minWidth: 0 }}>
            <Typography.Title
              level={3}
              style={{ margin: 0, fontSize: 'clamp(1.1rem, 3vw, 1.5rem)' }}
              ellipsis
            >
              {supplier.Name}
            </Typography.Title>
            <Flex align="center" gap={6}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {supplier.Code}
              </Typography.Text>
              {!supplier.IsActive && <Tag>Inactive</Tag>}
            </Flex>
          </Flex>
        </Flex>
        {canManage && (
          <Space>
            <Button
              type="primary"
              icon={<Pencil size={14} />}
              onClick={() => setEditOpen(true)}
            >
              Edit
            </Button>
          </Space>
        )}
      </Flex>

      {/* KPI cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
          gap: 12,
        }}
      >
        <Card size="small">
          <Statistic
            title={
              <Flex align="center" gap={4}>
                <ShoppingBag size={12} color="#94a3b8" />
                <span>Purchases</span>
              </Flex>
            }
            value={purchasesLoading ? '…' : formatMoney(totalPurchases.toFixed(4))}
            valueStyle={{ fontSize: 16 }}
          />
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {purchasesPage?.meta.total ?? 0} invoice
            {(purchasesPage?.meta.total ?? 0) === 1 ? '' : 's'}
          </Typography.Text>
        </Card>
        <Card size="small">
          <Statistic
            title={
              <Flex align="center" gap={4}>
                <Wallet size={12} color="#94a3b8" />
                <span>Outstanding</span>
              </Flex>
            }
            value={
              purchasesLoading ? '…' : formatMoney(outstanding.toFixed(4))
            }
            valueStyle={{
              fontSize: 16,
              color: outstanding > 0 ? '#dc2626' : '#16a34a',
            }}
          />
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            Unpaid on posted invoices
          </Typography.Text>
        </Card>
        <Card size="small">
          <Statistic
            title="Pending cheques"
            value={
              pendingChequesLoading
                ? '…'
                : formatMoney(pendingChequeTotal.toFixed(4))
            }
            valueStyle={{ fontSize: 16 }}
          />
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {pendingCheques.length} pending
          </Typography.Text>
        </Card>
        <Card size="small">
          <Statistic
            title="Last purchase"
            value={lastPurchase ? formatDate(lastPurchase) : '—'}
            valueStyle={{ fontSize: 16 }}
          />
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            Most recent invoice
          </Typography.Text>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <Tabs
          defaultActiveKey="overview"
          items={[
            {
              key: 'overview',
              label: 'Overview',
              children: (
                <OverviewTab supplier={supplier} isMobile={isMobile} />
              ),
            },
            {
              key: 'purchases',
              label: 'Purchases',
              children: id ? <SupplierPurchasesTab supplierId={id} /> : null,
            },
            {
              key: 'payments',
              label: 'Payments',
              children: id ? <SupplierPaymentsTab supplierId={id} /> : null,
            },
            {
              key: 'cheques',
              label: 'Cheques',
              children: id ? <SupplierChequesTab supplierId={id} /> : null,
            },
          ]}
        />
      </Card>

      <SupplierFormDrawer
        open={editOpen}
        supplier={supplier}
        onClose={() => setEditOpen(false)}
      />
    </Flex>
  );
}

function OverviewTab({
  supplier,
  isMobile,
}: {
  supplier: NonNullable<ReturnType<typeof useSupplier>['data']>;
  isMobile: boolean;
}) {
  const items: {
    key: string;
    label: string;
    children: React.ReactNode;
    span?: number;
  }[] = [
    { key: 'code', label: 'Code', children: supplier.Code },
  ];

  if (supplier.Phone) {
    items.push({
      key: 'phone',
      label: 'Phone',
      children: (
        <Flex align="center" gap={4}>
          <Phone size={12} color="#94a3b8" />
          {supplier.Phone}
        </Flex>
      ),
    });
  }
  if (supplier.Email) {
    items.push({
      key: 'email',
      label: 'Email',
      children: (
        <Flex align="center" gap={4}>
          <Mail size={12} color="#94a3b8" />
          {supplier.Email}
        </Flex>
      ),
    });
  }
  if (supplier.TaxNumber) {
    items.push({
      key: 'tax',
      label: 'Tax number',
      children: (
        <Flex align="center" gap={4}>
          <FileText size={12} color="#94a3b8" />
          {supplier.TaxNumber}
        </Flex>
      ),
    });
  }
  if (supplier.PaymentTerms) {
    items.push({
      key: 'terms',
      label: 'Payment terms',
      children: supplier.PaymentTerms,
    });
  }
  if (supplier.Address) {
    items.push({
      key: 'address',
      label: 'Address',
      span: isMobile ? 1 : 2,
      children: (
        <Flex align="flex-start" gap={4}>
          <MapPin size={12} color="#94a3b8" style={{ marginTop: 4 }} />
          <span style={{ whiteSpace: 'pre-wrap' }}>{supplier.Address}</span>
        </Flex>
      ),
    });
  }

  // Bank details block (only when at least one bank field is set)
  const hasBankInfo =
    supplier.BankName ||
    supplier.BankAccountNo ||
    supplier.BankBranch ||
    supplier.BankSwift;

  items.push({
    key: 'created',
    label: 'Created',
    children: formatDate(supplier.CreatedAt),
  });
  items.push({
    key: 'updated',
    label: 'Last updated',
    children: formatDate(supplier.UpdatedAt),
  });

  return (
    <Flex vertical gap={16}>
      <Descriptions
        bordered
        size="small"
        column={isMobile ? 1 : 2}
        items={items}
      />

      {hasBankInfo && (
        <div>
          <Typography.Title level={5} style={{ marginBottom: 8 }}>
            <Flex align="center" gap={6}>
              <Landmark size={14} color="#94a3b8" />
              Bank details
            </Flex>
          </Typography.Title>
          <Descriptions
            bordered
            size="small"
            column={isMobile ? 1 : 2}
            items={[
              ...(supplier.BankName
                ? [
                    {
                      key: 'bank',
                      label: 'Bank',
                      children: supplier.BankName,
                    },
                  ]
                : []),
              ...(supplier.BankBranch
                ? [
                    {
                      key: 'branch',
                      label: 'Branch',
                      children: supplier.BankBranch,
                    },
                  ]
                : []),
              ...(supplier.BankAccountNo
                ? [
                    {
                      key: 'account',
                      label: 'Account number',
                      children: (
                        <Typography.Text
                          style={{ fontFamily: 'monospace', fontSize: 12 }}
                        >
                          {supplier.BankAccountNo}
                        </Typography.Text>
                      ),
                    },
                  ]
                : []),
              ...(supplier.BankSwift
                ? [
                    {
                      key: 'swift',
                      label: 'SWIFT',
                      children: (
                        <Typography.Text
                          style={{ fontFamily: 'monospace', fontSize: 12 }}
                        >
                          {supplier.BankSwift}
                        </Typography.Text>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </div>
      )}

      {supplier.Notes && (
        <div>
          <Typography.Text strong>Notes</Typography.Text>
          <Typography.Paragraph
            type="secondary"
            style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}
          >
            {supplier.Notes}
          </Typography.Paragraph>
        </div>
      )}
    </Flex>
  );
}