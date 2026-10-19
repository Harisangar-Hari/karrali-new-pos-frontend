import { useMemo } from 'react';
import {
  Card,
  Col,
  Divider,
  Empty,
  Flex,

  Row,
  Skeleton,
  Tag,
  Typography,
  Button,
} from 'antd';
import {
  ShoppingCart,
  Wallet,
  CreditCard,
  AlertTriangle,
  Package,
  Users,
  TrendingUp,
  ArrowRight,
  Receipt,
  Banknote,
  Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAuthStore } from '@/stores/authStore';
import { usePermission } from '@/hooks/usePermission';
import { useMyOpenSession } from '@/hooks/queries/useCashSession';
import {
  useArAging,
  useChequeCalendar,
  useStockValuation,
  useZReport,
} from '@/hooks/queries/useReports';
import { useProducts } from '@/hooks/queries/useProducts';
import { useSales } from '@/hooks/queries/useSales';
import { formatMoney, formatDateTime } from '@/lib/format';
import type { SalePaymentMethod } from '@/types/sale';



const TILE_COL = { xs: 12, sm: 12, md: 6, lg: 6 } as const;

const METHOD_COLOR: Record<SalePaymentMethod, string> = {
  CASH: 'green',
  CARD: 'blue',
  CREDIT: 'red',
  CHEQUE: 'purple',
};

/* ─── KPI tile ──────────────────────────────────────────── */

interface KpiProps {
  label: string;
  value: string;
  subtitle?: string;
  valueColor?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  onClick?: () => void;
}

function Kpi({
  label,
  value,
  subtitle,
  valueColor,
  icon,
  loading,
  onClick,
}: KpiProps) {
  return (
    <Card
      size="small"
      hoverable={!!onClick}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', height: '100%' }}
      styles={{ body: { padding: '12px 14px' } }}
    >
      <Flex justify="space-between" align="flex-start" gap={8}>
        <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Typography.Text
            type="secondary"
            style={{ fontSize: 11 }}
            ellipsis
          >
            {label}
          </Typography.Text>
          {loading ? (
            <Skeleton.Input
              active
              size="small"
              style={{ width: 80, height: 26 }}
            />
          ) : (
            <Typography.Text
              strong
              style={{
                fontSize: 20,
                color: valueColor,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {value}
            </Typography.Text>
          )}
          {subtitle && !loading && (
            <Typography.Text
              type="secondary"
              style={{ fontSize: 11 }}
              ellipsis
            >
              {subtitle}
            </Typography.Text>
          )}
        </Flex>
        {icon && (
          <div style={{ opacity: 0.35, flexShrink: 0 }}>{icon}</div>
        )}
      </Flex>
    </Card>
  );
}

/* ─── Quick action button ──────────────────────────────── */

interface QuickActionProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

function QuickAction({ label, icon, onClick, disabled }: QuickActionProps) {
  return (
    <Button
      size="large"
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 64,
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        flex: 1,
      }}
    >
      <span style={{ color: '#0d9488' }}>{icon}</span>
      <span style={{ fontSize: 12 }}>{label}</span>
    </Button>
  );
}

/* ─── Page ──────────────────────────────────────────────── */

export function DashboardPage() {
  const navigate = useNavigate();
  

  const user = useAuthStore((s) => s.user);
  const canCreateSale = usePermission('sales.create');
  const canCreateCustomer = usePermission('customers.create');
  const canCreateProduct = usePermission('products.create');
  const canViewReports = usePermission('reports.sales');

  const today = dayjs().format('YYYY-MM-DD');
  const todayLabel = dayjs().format('dddd, D MMMM YYYY');

  // ─── Queries ────────────────────────────────────────────
  const { data: session, isLoading: sessionLoading } = useMyOpenSession();

  const { data: zReport, isLoading: zLoading } = useZReport({ Date: today });

  const { data: chequeCal, isLoading: chequeLoading } = useChequeCalendar({});

  const { data: arAging, isLoading: arLoading } = useArAging({});

  const {
    data: stockVal,
    isLoading: stockValLoading,
  } = useStockValuation({ limit: 1, InStockOnly: false });

  const { data: lowStockPage, isLoading: lowStockLoading } = useProducts({
    lowStock: true,
    limit: 1,
    IsActive: true,
  });

  const { data: recentSales, isLoading: salesLoading } = useSales({
    limit: 5,
    sortBy: 'CreatedAt',
    sortOrder: 'desc',
  });

  // ─── Derived values ─────────────────────────────────────
  const totalAr = arAging ? Number(arAging.Totals.Grand) : 0;
  const arCustomers = arAging?.Rows.length ?? 0;
  const overdue90Plus = arAging
    ? Number(arAging.Totals.Days91To180) + Number(arAging.Totals.DaysOver180)
    : 0;

  const pendingCustCheques = chequeCal
    ? Number(chequeCal.CustomerTotal)
    : 0;
  const pendingSuppCheques = chequeCal
    ? Number(chequeCal.SupplierTotal)
    : 0;

  const stockCost = stockVal ? Number(stockVal.TotalCost) : 0;
  const stockRetail = stockVal ? Number(stockVal.TotalRetail) : 0;
  const potentialMargin = stockRetail - stockCost;

  const lowStockCount = lowStockPage?.meta.total ?? 0;

  const topProducts = useMemo(() => {
    if (!zReport) return [];
    return zReport.TopProducts.slice(0, 5);
  }, [zReport]);

  // ─── Render ─────────────────────────────────────────────
  return (
    <Flex vertical gap={16}>
      {/* Greeting */}
      <Flex justify="space-between" align="flex-start" wrap="wrap" gap={8}>
        <Flex vertical gap={4} style={{ flex: 1, minWidth: 0 }}>
          <Typography.Title
            level={3}
            style={{ margin: 0, fontSize: 'clamp(1.15rem, 3vw, 1.5rem)' }}
          >
            Welcome back
            {user?.FullName
              ? `, ${user.FullName.split(' ')[0]}`
              : user?.Username
                ? `, ${user.Username}`
                : ''}
          </Typography.Title>
          <Flex align="center" gap={6} wrap="wrap">
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {todayLabel}
            </Typography.Text>
            {user?.Roles?.length ? (
              <>
                <Typography.Text type="secondary">·</Typography.Text>
                {user.Roles.map((r) => (
                  <Tag
                    key={r}
                    color="cyan"
                    style={{ marginInlineEnd: 0, fontSize: 11 }}
                  >
                    {r}
                  </Tag>
                ))}
              </>
            ) : null}
          </Flex>
        </Flex>
      </Flex>

      {/* Drawer status banner */}
      {!sessionLoading && session && (
        <Card
          size="small"
          style={{ background: '#f0fdfa', borderColor: '#99f6e4' }}
          styles={{ body: { padding: '10px 14px' } }}
        >
          <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
            <Flex align="center" gap={10} wrap="wrap">
              <Tag
                color="green"
                style={{ marginInlineEnd: 0, fontWeight: 600 }}
              >
                DRAWER OPEN
              </Tag>
              <Typography.Text style={{ fontSize: 12 }}>
                {session.Terminal.Name} ({session.Terminal.Code}) · opened{' '}
                {formatDateTime(session.OpenedAt)}
              </Typography.Text>
              <Divider
                type="vertical"
                style={{ margin: '0 4px', borderColor: '#99f6e4' }}
              />
              <Flex align="center" gap={4}>
                <Typography.Text
                  type="secondary"
                  style={{ fontSize: 12 }}
                >
                  Expected cash
                </Typography.Text>
                <Typography.Text
                  strong
                  style={{ fontSize: 14, color: '#0d9488' }}
                >
                  {formatMoney(session.ExpectedCash)}
                </Typography.Text>
              </Flex>
            </Flex>
            <Button
              type="primary"
              size="small"
              icon={<ArrowRight size={12} />}
              onClick={() => navigate('/pos')}
            >
              Go to POS
            </Button>
          </Flex>
        </Card>
      )}

      {!sessionLoading && !session && canCreateSale && (
        <Card
          size="small"
          style={{ background: '#fffbeb', borderColor: '#fde68a' }}
          styles={{ body: { padding: '10px 14px' } }}
        >
          <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
            <Flex align="center" gap={10} wrap="wrap">
              <Tag
                color="gold"
                style={{ marginInlineEnd: 0, fontWeight: 600 }}
              >
                NO DRAWER OPEN
              </Tag>
              <Typography.Text style={{ fontSize: 12 }}>
                Start your shift by opening a cash drawer from the POS.
              </Typography.Text>
            </Flex>
            <Button
              type="primary"
              size="small"
              icon={<Wallet size={12} />}
              onClick={() => navigate('/pos')}
            >
              Open drawer
            </Button>
          </Flex>
        </Card>
      )}

      {/* Row 1 — Today's trade */}
      <Row gutter={[12, 12]}>
        <Col {...TILE_COL}>
          <Kpi
            label="Net sales today"
            value={
              zReport
                ? formatMoney(zReport.Sales.NetSales)
                : '—'
            }
            subtitle={
              zReport
                ? `${zReport.Sales.Count} transaction${
                    zReport.Sales.Count === 1 ? '' : 's'
                  }`
                : undefined
            }
            valueColor="#0d9488"
            icon={<TrendingUp size={32} />}
            loading={zLoading}
            onClick={canViewReports ? () => navigate('/reports/sales-summary') : undefined}
          />
        </Col>
        <Col {...TILE_COL}>
          <Kpi
            label="Cash collected"
            value={zReport ? formatMoney(zReport.Payments.Cash) : '—'}
            subtitle={
              zReport && Number(zReport.Payments.Card) > 0
                ? `+ ${formatMoney(zReport.Payments.Card)} card`
                : undefined
            }
            valueColor="#16a34a"
            icon={<Banknote size={32} />}
            loading={zLoading}
          />
        </Col>
        <Col {...TILE_COL}>
          <Kpi
            label="Credit issued"
            value={zReport ? formatMoney(zReport.Payments.Credit) : '—'}
            subtitle={
              zReport && Number(zReport.Payments.Cheque) > 0
                ? `+ ${formatMoney(zReport.Payments.Cheque)} cheque`
                : undefined
            }
            valueColor={
              zReport && Number(zReport.Payments.Credit) > 0
                ? '#dc2626'
                : undefined
            }
            icon={<CreditCard size={32} />}
            loading={zLoading}
          />
        </Col>
        <Col {...TILE_COL}>
          <Kpi
            label="Refunds / cancels"
            value={
              zReport
                ? formatMoney(
                    (
                      Number(zReport.Returns.Total) +
                      Number(zReport.Cancels.Value)
                    ).toFixed(4),
                  )
                : '—'
            }
            subtitle={
              zReport
                ? `${zReport.Returns.Count} return${
                    zReport.Returns.Count === 1 ? '' : 's'
                  } · ${zReport.Cancels.Count} cancel${
                    zReport.Cancels.Count === 1 ? '' : 's'
                  }`
                : undefined
            }
            valueColor={
              zReport &&
              (Number(zReport.Returns.Total) > 0 ||
                Number(zReport.Cancels.Value) > 0)
                ? '#dc2626'
                : undefined
            }
            icon={<Receipt size={32} />}
            loading={zLoading}
          />
        </Col>
      </Row>

      {/* Row 2 — Money owed */}
      <Row gutter={[12, 12]}>
        <Col {...TILE_COL}>
          <Kpi
            label="Customer receivables"
            value={formatMoney(totalAr.toFixed(4))}
            subtitle={
              arAging
                ? `${arCustomers} customer${
                    arCustomers === 1 ? '' : 's'
                  } owe you`
                : undefined
            }
            valueColor={totalAr > 0 ? '#dc2626' : '#16a34a'}
            icon={<Users size={32} />}
            loading={arLoading}
            onClick={() => navigate('/reports/ar-aging')}
          />
        </Col>
        <Col {...TILE_COL}>
          <Kpi
            label="Overdue 90+ days"
            value={formatMoney(overdue90Plus.toFixed(4))}
            subtitle={
              overdue90Plus > 0 ? 'Chase these first' : 'All current'
            }
            valueColor={overdue90Plus > 0 ? '#dc2626' : '#16a34a'}
            icon={<AlertTriangle size={32} />}
            loading={arLoading}
            onClick={() => navigate('/reports/ar-aging')}
          />
        </Col>
        <Col {...TILE_COL}>
          <Kpi
            label="Incoming cheques"
            value={formatMoney(pendingCustCheques.toFixed(4))}
            subtitle="Pending from customers"
            valueColor="#16a34a"
            icon={<Banknote size={32} />}
            loading={chequeLoading}
            onClick={() => navigate('/customer-cheques')}
          />
        </Col>
        <Col {...TILE_COL}>
          <Kpi
            label="Outgoing cheques"
            value={formatMoney(pendingSuppCheques.toFixed(4))}
            subtitle="Pending to suppliers"
            valueColor="#dc2626"
            icon={<CreditCard size={32} />}
            loading={chequeLoading}
            onClick={() => navigate('/supplier-cheques')}
          />
        </Col>
      </Row>

      {/* Row 3 — Inventory */}
      <Row gutter={[12, 12]}>
        <Col {...TILE_COL}>
          <Kpi
            label="Stock at cost"
            value={formatMoney(stockCost.toFixed(4))}
            subtitle="What you paid for it"
            icon={<Package size={32} />}
            loading={stockValLoading}
            onClick={() => navigate('/reports/stock-valuation')}
          />
        </Col>
        <Col {...TILE_COL}>
          <Kpi
            label="Stock at retail"
            value={formatMoney(stockRetail.toFixed(4))}
            subtitle="What it can sell for"
            icon={<Package size={32} />}
            loading={stockValLoading}
            onClick={() => navigate('/reports/stock-valuation')}
          />
        </Col>
        <Col {...TILE_COL}>
          <Kpi
            label="Potential margin"
            value={formatMoney(potentialMargin.toFixed(4))}
            subtitle="Retail − cost"
            valueColor={potentialMargin < 0 ? '#dc2626' : '#16a34a'}
            icon={<TrendingUp size={32} />}
            loading={stockValLoading}
          />
        </Col>
        <Col {...TILE_COL}>
          <Kpi
            label="Low stock items"
            value={lowStockCount.toLocaleString()}
            subtitle={
              lowStockCount > 0 ? 'Reorder these soon' : 'All healthy'
            }
            valueColor={lowStockCount > 0 ? '#f59e0b' : '#16a34a'}
            icon={<AlertTriangle size={32} />}
            loading={lowStockLoading}
            onClick={() => navigate('/products')}
          />
        </Col>
      </Row>

      {/* Quick actions */}
      <Card size="small" title="Quick actions">
        <Flex gap={8} wrap="wrap">
          {canCreateSale && (
            <QuickAction
              label="Point of Sale"
              icon={<ShoppingCart size={18} />}
              onClick={() => navigate('/pos')}
            />
          )}
          {canCreateCustomer && (
            <QuickAction
              label="Add customer"
              icon={<Users size={18} />}
              onClick={() => navigate('/customers')}
            />
          )}
          {canCreateProduct && (
            <QuickAction
              label="Add product"
              icon={<Package size={18} />}
              onClick={() => navigate('/products')}
            />
          )}
          {canViewReports && (
            <QuickAction
              label="Reports"
              icon={<TrendingUp size={18} />}
              onClick={() => navigate('/reports/sales-summary')}
            />
          )}
          <QuickAction
            label="Sales history"
            icon={<Receipt size={18} />}
            onClick={() => navigate('/sales')}
          />
        </Flex>
      </Card>

      {/* Two columns: top products + recent sales */}
      <Row gutter={[12, 12]}>
        <Col xs={24} lg={12}>
          <Card
            size="small"
            title={
              <Flex align="center" gap={6}>
                <TrendingUp size={14} color="#0d9488" />
                <span>Top products today</span>
              </Flex>
            }
            styles={{ body: { padding: topProducts.length === 0 ? 24 : 0 } }}
          >
            {zLoading ? (
              <Skeleton active paragraph={{ rows: 4 }} style={{ padding: 16 }} />
            ) : topProducts.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    No sales yet today
                  </Typography.Text>
                }
                style={{ margin: 0 }}
              />
            ) : (
              <Flex vertical>
                {topProducts.map((p, idx) => (
                  <Flex
                    key={p.ProductId}
                    justify="space-between"
                    align="center"
                    gap={8}
                    style={{
                      padding: '10px 14px',
                      borderBottom:
                        idx < topProducts.length - 1
                          ? '1px solid #f0f0f0'
                          : 'none',
                    }}
                  >
                    <Flex align="center" gap={10} style={{ flex: 1, minWidth: 0 }}>
                      <Tag
                        color="cyan"
                        style={{
                          marginInlineEnd: 0,
                          minWidth: 24,
                          textAlign: 'center',
                          fontWeight: 600,
                        }}
                      >
                        {idx + 1}
                      </Tag>
                      <Flex vertical gap={0} style={{ flex: 1, minWidth: 0 }}>
                        <Typography.Text strong ellipsis style={{ fontSize: 13 }}>
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
                    </Flex>
                    <Flex vertical gap={0} align="flex-end">
                      <Typography.Text strong style={{ fontSize: 13 }}>
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
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            size="small"
            title={
              <Flex align="center" gap={6}>
                <Clock size={14} color="#0d9488" />
                <span>Recent sales</span>
              </Flex>
            }
            extra={
              <Button
                type="link"
                size="small"
                onClick={() => navigate('/sales')}
              >
                View all <ArrowRight size={11} />
              </Button>
            }
            styles={{
              body: {
                padding: salesLoading || !recentSales?.data?.length ? 24 : 0,
              },
            }}
          >
            {salesLoading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : !recentSales?.data?.length ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    No sales recorded yet
                  </Typography.Text>
                }
                style={{ margin: 0 }}
              />
            ) : (
              <Flex vertical>
                {recentSales.data.map((sale, idx) => {
                  const methods: SalePaymentMethod[] = [];
                  if (Number(sale.CashAmount) > 0) methods.push('CASH');
                  if (Number(sale.CardAmount) > 0) methods.push('CARD');
                  if (Number(sale.CreditAmount) > 0) methods.push('CREDIT');
                  if (Number(sale.ChequeAmount) > 0) methods.push('CHEQUE');

                  return (
                    <Flex
                      key={sale.Id}
                      justify="space-between"
                      align="center"
                      gap={8}
                      style={{
                        padding: '10px 14px',
                        borderBottom:
                          idx < recentSales.data.length - 1
                            ? '1px solid #f0f0f0'
                            : 'none',
                        cursor: 'pointer',
                      }}
                      onClick={() => navigate('/sales')}
                      className="pos-product-row"
                    >
                      <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                        <Flex align="center" gap={6} wrap="wrap">
                          <Typography.Text
                            strong
                            style={{ fontSize: 13 }}
                            ellipsis
                          >
                            {sale.InvoiceNumber}
                          </Typography.Text>
                          {sale.Status !== 'COMPLETED' && (
                            <Tag
                              color={
                                sale.Status === 'CANCELLED'
                                  ? 'default'
                                  : sale.Status === 'FULLY_RETURNED'
                                    ? 'purple'
                                    : 'orange'
                              }
                              style={{ marginInlineEnd: 0, fontSize: 10 }}
                            >
                              {sale.Status.replace('_', ' ')}
                            </Tag>
                          )}
                        </Flex>
                        <Typography.Text
                          type="secondary"
                          style={{ fontSize: 11 }}
                        >
                          {sale.Customer?.Name ?? 'Walk-in'} ·{' '}
                          {formatDateTime(sale.CreatedAt)}
                        </Typography.Text>
                        <Flex gap={4} wrap="wrap" style={{ marginTop: 2 }}>
                          {methods.map((m) => (
                            <Tag
                              key={m}
                              color={METHOD_COLOR[m]}
                              style={{ marginInlineEnd: 0, fontSize: 10 }}
                            >
                              {m}
                            </Tag>
                          ))}
                        </Flex>
                      </Flex>
                      <Typography.Text
                        strong
                        style={{ fontSize: 13, whiteSpace: 'nowrap' }}
                      >
                        {formatMoney(sale.TotalAmount)}
                      </Typography.Text>
                    </Flex>
                  );
                })}
              </Flex>
            )}
          </Card>
        </Col>
      </Row>
    </Flex>
  );
}