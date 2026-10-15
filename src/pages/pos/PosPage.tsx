import { useState } from 'react';
import { Flex, Grid, Skeleton, Typography, Tag, Button } from 'antd';
import { User } from 'lucide-react';
import { useMyOpenSession } from '@/hooks/queries/useCashSession';
import { useTerminal } from '@/hooks/queries/useTerminals';
import { usePermission } from '@/hooks/usePermission';
import { OpenSessionPrompt } from './OpenSessionPrompt';
import { ProductSearch } from './ProductSearch';
import { CartPanel } from './CartPanel';
import { CustomerSelector } from './CustomerSelector';
import { CheckoutModal } from './CheckoutModal';
import { ReceiptModal } from './ReceiptModal';
import { usePosCartStore } from '@/stores/posCartStore';
import type { SaleDetail } from '@/types/sale';
import { CloseSessionModal } from './CloseSessionModal';
import { LogOut } from 'lucide-react';

const { useBreakpoint } = Grid;

export function PosPage() {
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const canDiscount = usePermission('sales.discount');

    const { data: session, isLoading } = useMyOpenSession();
    const { data: terminal } = useTerminal(session?.TerminalId ?? null);
    const clearCart = usePosCartStore((s) => s.clear);
    const customerId = usePosCartStore((s) => s.customerId);

    const [checkoutTotal, setCheckoutTotal] = useState<string | null>(null);
    const [receiptSale, setReceiptSale] = useState<SaleDetail | null>(null);
    const [closeOpen, setCloseOpen] = useState(false);

    if (isLoading) {
        return <Skeleton active paragraph={{ rows: 10 }} />;
    }

    if (!session) {
        return <OpenSessionPrompt />;
    }

    const handleNewSale = () => {
        setReceiptSale(null);
        clearCart();
    };

    return (
        <Flex
            vertical
            gap={16}
            style={{ minHeight: isMobile ? 'auto' : 'calc(100vh - 128px)' }}
        >
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

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 400px',
                    gap: 16,
                    flex: 1,
                    minHeight: 0,
                }}
            >
                <ProductSearch warehouseId={terminal?.WarehouseId} />
                <CartPanel
                    onCheckout={(total) => setCheckoutTotal(total)}
                    canDiscount={canDiscount}
                    warehouseId={terminal?.WarehouseId}
                />
            </div>

            <CheckoutModal
                open={!!checkoutTotal}
                total={checkoutTotal ?? '0'}
                session={session}
                hasCustomer={!!customerId}
                onClose={() => setCheckoutTotal(null)}
                onSuccess={(sale) => {
                    setCheckoutTotal(null);
                    setReceiptSale(sale);
                }}
            />

            <ReceiptModal
                open={!!receiptSale}
                sale={receiptSale}
                onClose={() => setReceiptSale(null)}
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