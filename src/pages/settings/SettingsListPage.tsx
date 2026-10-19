import { useEffect, useMemo, useState } from 'react';
import {
    Button,
    Card,
    Col,
    Dropdown,
    Empty,
    Flex,
    Grid,
    Input,
    Row,
    Spin,
    Table,
    Tag,
    Typography,
    App,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    Plus,
    Search as SearchIcon,
    Pencil,
    Trash2,
    Eye,
    ChevronDown,
} from 'lucide-react';
import {
    useDeleteSetting,
    useSettings,
} from '@/hooks/queries/useSettings';
import { usePermission } from '@/hooks/usePermission';
import { SettingFormDrawer } from './SettingFormDrawer';
import { SettingValueModal } from './SettingValueModal';
import { formatDateTime } from '@/lib/format';
import { getErrorMessage } from '@/lib/api';
import {
    getSettingShape,
    previewValue,
    type SettingRow,
    type SettingShape,
} from '@/types/setting';

const { useBreakpoint } = Grid;

const SHAPE_COLOR: Record<SettingShape, string> = {
    string: 'green',
    number: 'blue',
    boolean: 'cyan',
    null: 'default',
    array: 'purple',
    object: 'magenta',
};

export function SettingsListPage() {
    const { message, modal } = App.useApp();
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const canManage = usePermission('settings.manage');

    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        const t = setTimeout(() => setSearch(searchInput.trim()), 300);
        return () => clearTimeout(t);
    }, [searchInput]);

    const { data, isLoading, isFetching } = useSettings({
        search: search || undefined,
    });

    const deleteMutation = useDeleteSetting();

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<SettingRow | null>(null);
    const [viewing, setViewing] = useState<SettingRow | null>(null);

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };
    const openEdit = (row: SettingRow) => {
        setEditing(row);
        setFormOpen(true);
    };

    const confirmDelete = (row: SettingRow) => {
        modal.confirm({
            title: 'Delete setting?',
            content: (
                <div>
                    <p>
                        <strong>{row.Key}</strong> will be permanently removed.
                    </p>
                    <p style={{ color: '#faad14', marginBottom: 0 }}>
                        Settings have no soft-delete. The value is preserved only in the
                        audit log.
                    </p>
                </div>
            ),
            okText: 'Delete',
            okButtonProps: { danger: true },
            async onOk() {
                try {
                    await deleteMutation.mutateAsync(row.Key);
                    message.success('Setting deleted');
                } catch (err) {
                    message.error(getErrorMessage(err));
                    throw err;
                }
            },
        });
    };

    const columns: ColumnsType<SettingRow> = useMemo(
        () => [
            {
                title: 'Key',
                dataIndex: 'Key',
                key: 'Key',
                render: (_: unknown, row) => (
                    <Flex vertical gap={2}>
                        <Typography.Text
                            strong
                            style={{ fontFamily: 'monospace', fontSize: 13 }}
                        >
                            {row.Key}
                        </Typography.Text>
                        {row.Description && (
                            <Typography.Text
                                type="secondary"
                                style={{ fontSize: 11 }}
                                ellipsis
                            >
                                {row.Description}
                            </Typography.Text>
                        )}
                    </Flex>
                ),
            },
            {
                title: 'Type',
                key: 'shape',
                width: 90,
                render: (_: unknown, row) => {
                    const shape = getSettingShape(row.Value);
                    return (
                        <Tag color={SHAPE_COLOR[shape]} style={{ marginInlineEnd: 0 }}>
                            {shape}
                        </Tag>
                    );
                },
            },
            {
                title: 'Value',
                key: 'value',
                render: (_: unknown, row) => {
                    const shape = getSettingShape(row.Value);
                    const preview = previewValue(row.Value);
                    const clickable = shape === 'object' || shape === 'array';
                    return (
                        <Flex align="center" gap={6}>
                            <Typography.Text
                                style={{
                                    fontFamily: 'monospace',
                                    fontSize: 12,
                                }}
                                ellipsis
                            >
                                {preview}
                            </Typography.Text>
                            {clickable && (
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<Eye size={12} />}
                                    onClick={() => setViewing(row)}
                                />
                            )}
                        </Flex>
                    );
                },
            },
            {
                title: 'Updated',
                dataIndex: 'UpdatedAt',
                key: 'UpdatedAt',
                width: 160,
                render: (v: string) => (
                    <Typography.Text style={{ fontSize: 12 }}>
                        {formatDateTime(v)}
                    </Typography.Text>
                ),
            },
            {
                title: '',
                key: 'actions',
                width: 60,
                align: 'right',
                render: (_: unknown, row) => {
                    if (!canManage) return null;
                    const items = [
                        {
                            key: 'edit',
                            icon: <Pencil size={14} />,
                            label: 'Edit',
                            onClick: () => openEdit(row),
                        },
                        {
                            key: 'delete',
                            icon: <Trash2 size={14} />,
                            label: 'Delete',
                            danger: true,
                            onClick: () => confirmDelete(row),
                        },
                    ];
                    return (
                        <Dropdown menu={{ items }} trigger={['click']}>
                            <Button size="small" type="text">
                                <ChevronDown size={14} />
                            </Button>
                        </Dropdown>
                    );
                },
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [canManage],
    );

    const renderMobileList = () => {
        if (isLoading) {
            return (
                <Flex justify="center" style={{ padding: 48 }}>
                    <Spin />
                </Flex>
            );
        }
        if (!data || data.length === 0) {
            return <Empty description="No settings" style={{ padding: 32 }} />;
        }
        return (
            <Flex vertical gap={8}>
                {data.map((row) => {
                    const shape = getSettingShape(row.Value);
                    const clickable = shape === 'object' || shape === 'array';
                    return (
                        <Card key={row.Key} size="small" styles={{ body: { padding: 12 } }}>
                            <Flex justify="space-between" gap={8} align="flex-start">
                                <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                                    <Typography.Text
                                        strong
                                        style={{ fontFamily: 'monospace', fontSize: 13 }}
                                        ellipsis
                                    >
                                        {row.Key}
                                    </Typography.Text>
                                    {row.Description && (
                                        <Typography.Text
                                            type="secondary"
                                            style={{ fontSize: 11 }}
                                            ellipsis
                                        >
                                            {row.Description}
                                        </Typography.Text>
                                    )}
                                    <Flex align="center" gap={6} style={{ marginTop: 4 }}>
                                        <Tag
                                            color={SHAPE_COLOR[shape]}
                                            style={{ marginInlineEnd: 0 }}
                                        >
                                            {shape}
                                        </Tag>
                                        <Typography.Text
                                            style={{ fontFamily: 'monospace', fontSize: 11 }}
                                            ellipsis
                                        >
                                            {previewValue(row.Value, 40)}
                                        </Typography.Text>
                                        {clickable && (
                                            <Button
                                                type="text"
                                                size="small"
                                                icon={<Eye size={12} />}
                                                onClick={() => setViewing(row)}
                                            />
                                        )}
                                    </Flex>
                                </Flex>
                                {canManage && (
                                    <Dropdown
                                        menu={{
                                            items: [
                                                {
                                                    key: 'edit',
                                                    icon: <Pencil size={14} />,
                                                    label: 'Edit',
                                                    onClick: () => openEdit(row),
                                                },
                                                {
                                                    key: 'delete',
                                                    icon: <Trash2 size={14} />,
                                                    label: 'Delete',
                                                    danger: true,
                                                    onClick: () => confirmDelete(row),
                                                },
                                            ],
                                        }}
                                        trigger={['click']}
                                    >
                                        <Button size="small" type="text">
                                            <ChevronDown size={14} />
                                        </Button>
                                    </Dropdown>
                                )}
                            </Flex>
                        </Card>
                    );
                })}
            </Flex>
        );
    };

    return (
        <Flex vertical gap={16}>
            <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
                <Typography.Title level={3} style={{ margin: 0 }}>
                    Settings
                </Typography.Title>
                {canManage && (
                    <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>
                        {isMobile ? 'New' : 'New setting'}
                    </Button>
                )}
            </Flex>

            <Card size="small" styles={{ body: { padding: isMobile ? 12 : 16 } }}>
                <Row gutter={[12, 12]}>
                    <Col xs={24} md={16}>
                        <Input
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search by key or description"
                            prefix={<SearchIcon size={14} />}
                            allowClear
                        />
                    </Col>
                    <Col xs={24} md={8}>
                        <Flex justify="flex-end">
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                {data?.length ?? 0} setting
                                {data?.length === 1 ? '' : 's'}
                            </Typography.Text>
                        </Flex>
                    </Col>
                </Row>
            </Card>

            <Card styles={{ body: { padding: isMobile ? 8 : 0 } }}>
                {isMobile ? (
                    renderMobileList()
                ) : (
                    <Table<SettingRow>
                        rowKey="Key"
                        columns={columns}
                        dataSource={data ?? []}
                        loading={isLoading || isFetching}
                        pagination={false}
                        scroll={{ x: 'max-content' }}
                        size="middle"
                    />
                )}
            </Card>

            <SettingFormDrawer
                open={formOpen}
                setting={editing}
                onClose={() => setFormOpen(false)}
            />
            <SettingValueModal
                open={!!viewing}
                setting={viewing}
                onClose={() => setViewing(null)}
            />
        </Flex>
    );
}