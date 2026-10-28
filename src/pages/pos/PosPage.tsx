import { useState } from 'react';
import {
  Flex,
  Grid,
  Skeleton,
  Typography,
  Tag,
  Button,
  Drawer,
  Tooltip,
} from 'antd';
import { User, LogOut, ShoppingCart, ChevronRight } from 'lucide-react';
import { useMyOpenSession } from '@/hooks/queries/useCashSession';
import { useTerminal } from '@/hooks/queries/useTerminals';
import { usePermission } from '@/hooks/usePermission';
import { OpenSessionPrompt } from './OpenSessionPrompt';
import { ProductSearch } from './ProductSearch';
import { CartPanel } from './CartPanel';
import { CustomerSelector } from './CustomerSelector';
import { CheckoutModal } from './CheckoutModal';
import { ReceiptModal } from './ReceiptModal';
import { CloseSessionModal } from './CloseSessionModal';
import { usePosCartStore, computeCartTotals } from '@/stores/posCartStore';
import { formatMoney } from '@/lib/format';
import type { SaleDetail } from '@/types/sale';

const { useBreakpoint } = Grid;

export function PosPage() {
  const screens = useBreakpoint();

  // Below 992px → drawer cart. The 240px sider (visible at md) leaves
  // too little room for a permanent 360px cart column on tablet widths.
  const useDrawerCart = !screens.lg;

  // Wider cart on truly large desktops. 360px is the safe default.
  const cartWidth = screens.xxl ? 400 : 360;

  const canDiscount = usePermission('sales.discount');

  const { data: session, isLoading } = useMyOpenSession();
  const { data: terminal } = useTerminal(session?.TerminalId ?? null);

  const lines = usePosCartStore((s) => s.lines);
  const invoiceDiscount = usePosCartStore((s) => s.invoiceDiscount);
  const clearCart = usePosCartStore((s) => s.clear);
  const customerId = usePosCartStore((s) => s.customerId);

  const [checkoutTotal, setCheckoutTotal] = useState<string | null>(null);
  const [receiptInfo, setReceiptInfo] = useState<{
    sale: SaleDetail;
    cashTendered?: number;
    changeDue?: number;
  } | null>(null);
  const [closeOpen, setCloseOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 10 }} />;
  }

  if (!session) {
    return <OpenSessionPrompt />;
  }

  const totalItems = lines.reduce((s, l) => s + l.Qty, 0);
  const cartTotals = computeCartTotals(lines, invoiceDiscount);

  const handleNewSale = () => {
    setReceiptInfo(null);
    clearCart();
  };

  const handleCheckout = (total: string) => {
    if (useDrawerCart) setCartDrawerOpen(false);
    setCheckoutTotal(total);
  };

  return (
    <Flex
      vertical
      gap={useDrawerCart ? 8 : 16}
      style={{
        minHeight: useDrawerCart ? 'auto' : 'calc(100vh - 128px)',
        paddingBottom: useDrawerCart && lines.length > 0 ? 88 : 0,
      }}
    >
      {/* ─── Header strip ───────────────────────────────────── */}
      {useDrawerCart ? (
        <Flex
          justify="space-between"
          align="center"
          gap={8}
          style={{
            padding: '8px 12px',
            background: '#f0fdfa',
            border: '1px solid #99f6e4',
            borderRadius: 6,
          }}
        >
          <Flex align="center" gap={6} style={{ minWidth: 0, flex: 1 }}>
            <Tag color="cyan" style={{ marginInlineEnd: 0, flexShrink: 0 }}>
              {session.Terminal.Code}
            </Tag>
            <div style={{ minWidth: 0, flex: 1 }}>
              <CustomerSelector />
            </div>
          </Flex>
          <Tooltip title="Close drawer">
            <Button
              size="small"
              type="text"
              icon={<LogOut size={16} />}
              onClick={() => setCloseOpen(true)}
            />
          </Tooltip>
        </Flex>
      ) : (
        <Flex
          justify="space-between"
          align="center"
          wrap="wrap"
          gap={8}
          style={{
            padding: '10px 14px',
            background: '#f0fdfa',
            border: '1px solid #99f6e4',
            borderRadius: 6,
          }}
        >
          <Flex align="center" gap={12} wrap="wrap">
            <Flex align="center" gap={6}>
              <Tag color="cyan" style={{ marginInlineEnd: 0 }}>
                {session.Terminal.Name} ({session.Terminal.Code})
              </Tag>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Opened {new Date(session.OpenedAt).toLocaleTimeString()}
              </Typography.Text>
            </Flex>
            <CustomerSelector />
          </Flex>
          <Flex align="center" gap={8}>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              <User size={11} style={{ display: 'inline', marginRight: 4 }} />
              {session.Cashier.FullName ?? session.Cashier.Username}
            </Typography.Text>
            <Button
              size="small"
              icon={<LogOut size={12} />}
              onClick={() => setCloseOpen(true)}
            >
              Close drawer
            </Button>
          </Flex>
        </Flex>
      )}

      {/* ─── Main workspace ────────────────────────────────── */}
      {useDrawerCart ? (
        <>
          <ProductSearch
            warehouseId={terminal?.WarehouseId}
            warehouseName={terminal?.Warehouse?.Name}
          />

          {lines.length > 0 && (
            <div
              onClick={() => setCartDrawerOpen(true)}
              style={{
                position: 'fixed',
                left: 12,
                right: 12,
                bottom: 12,
                zIndex: 40,
                background: '#0d9488',
                color: '#fff',
                borderRadius: 10,
                padding: '12px 16px',
                boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Flex align="center" gap={10}>
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <ShoppingCart size={20} />
                  <span
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -10,
                      background: '#fff',
                      color: '#0d9488',
                      borderRadius: 10,
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '0 6px',
                      minWidth: 18,
                      height: 18,
                      lineHeight: '18px',
                      textAlign: 'center',
                    }}
                  >
                    {totalItems}
                  </span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {totalItems} item{totalItems === 1 ? '' : 's'}
                </span>
              </Flex>
              <Flex align="center" gap={8}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>
                  {formatMoney(cartTotals.total)}
                </span>
                <ChevronRight size={18} />
              </Flex>
            </div>
          )}

          <Drawer
            title="Cart"
            placement="bottom"
            open={cartDrawerOpen}
            onClose={() => setCartDrawerOpen(false)}
            height="85vh"
            styles={{
              body: {
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
              },
            }}
          >
            <div style={{ flex: 1, minHeight: 0 }}>
              <CartPanel
                onCheckout={handleCheckout}
                canDiscount={canDiscount}
                warehouseId={terminal?.WarehouseId}
              />
            </div>
          </Drawer>
        </>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `minmax(0, 1fr) ${cartWidth}px`,
            gap: 16,
            flex: 1,
            minHeight: 0,
          }}
        >
          <ProductSearch
            warehouseId={terminal?.WarehouseId}
            warehouseName={terminal?.Warehouse?.Name}
          />
          <CartPanel
            onCheckout={handleCheckout}
            canDiscount={canDiscount}
            warehouseId={terminal?.WarehouseId}
          />
        </div>
      )}

      {/* ─── Modals ──────────────────────────────────────────── */}
      <CheckoutModal
        open={!!checkoutTotal}
        total={checkoutTotal ?? '0'}
        session={session}
        hasCustomer={!!customerId}
        onClose={() => setCheckoutTotal(null)}
        onSuccess={(result) => {
          setCheckoutTotal(null);
          setReceiptInfo(result);
        }}
      />

      <ReceiptModal
        open={!!receiptInfo}
        sale={receiptInfo?.sale ?? null}
        cashTendered={receiptInfo?.cashTendered}
        changeDue={receiptInfo?.changeDue}
        onClose={() => setReceiptInfo(null)}
        onNewSale={handleNewSale}
      />

      <CloseSessionModal
        open={closeOpen}
        session={session}
        onClose={() => setCloseOpen(false)}
      />
    </Flex>
  );
}