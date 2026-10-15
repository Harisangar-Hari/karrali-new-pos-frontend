import type { ReactNode } from 'react';
import { Button, Card, Flex, Grid, Typography } from 'antd';
import { ArrowLeft, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const { useBreakpoint } = Grid;

interface Props {
    title: string;
    subtitle?: string;
    /** Extra controls rendered to the right of the title (date pickers, filters). */
    filters?: ReactNode;
    /** Pass true to show a Print button that fires window.print(). */
    printable?: boolean;
    /** Optional back button destination. */
    backTo?: string;
    children: ReactNode;
}

export function ReportShell({
    title,
    subtitle,
    filters,
    printable,
    backTo,
    children,
}: Props) {
    const navigate = useNavigate();
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const handlePrint = () => window.print();

    return (
        <Flex vertical gap={16}>
            <Flex
                justify="space-between"
                align="flex-start"
                wrap="wrap"
                gap={8}
                className="no-print"
            >
                <Flex align="center" gap={8} style={{ flex: 1, minWidth: 0 }}>
                    {backTo && (
                        <Button
                            type="text"
                            icon={<ArrowLeft size={16} />}
                            onClick={() => navigate(backTo)}
                        />
                    )}
                    <Flex vertical gap={2} style={{ minWidth: 0 }}>
                        <Typography.Title
                            level={3}
                            style={{ margin: 0, fontSize: 'clamp(1.15rem, 3vw, 1.5rem)' }}
                        >
                            {title}
                        </Typography.Title>
                        {subtitle && (
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                {subtitle}
                            </Typography.Text>
                        )}
                    </Flex>
                </Flex>
                {printable && (
                    <Button icon={<Printer size={14} />} onClick={handlePrint}>
                        {isMobile ? 'Print' : 'Print report'}
                    </Button>
                )}
            </Flex>

            {filters && (
                <Card
                    size="small"
                    styles={{ body: { padding: isMobile ? 12 : 16 } }}
                    className="no-print"
                >
                    {filters}
                </Card>
            )}

            {children}
        </Flex>
    );
}