import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Flex,
  Grid,
  Input,
  Pagination,
  Row,
  Select,
  Spin,
  Table,
  Tag,
  Typography,
  Tooltip,
} from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import {
  Search as SearchIcon,
  Eye,
  User as UserIcon,
  FileText,
  Wrench,
} from 'lucide-react';
import  { type Dayjs } from 'dayjs';
import { useAuditLogs } from '@/hooks/queries/useAuditLogs';
import { useUsers } from '@/hooks/queries/useUsers';
import { AuditLogDetailDrawer } from './AuditLogDetailDrawer';
import { formatDateTime } from '@/lib/format';
import {
  COMMON_ACTIONS,
  COMMON_ENTITIES,
  humanizeAction,
  type AuditLogRow,
  type QueryAuditLogParams,
} from '@/types/audit';

const { useBreakpoint } = Grid;
const { RangePicker } = DatePicker;
const DEFAULT_PAGE_SIZE = 50;

/**
 * Color a row by the shape of the action verb. CREATE-ish → green,
 * UPDATE-ish → blue, DELETE / VOID / CANCEL → red, everything else
 * (LOGIN, LOGOUT, etc.) → default.
 */
function actionColor(action: string): string {
  if (
    action.includes('DELETED') ||
    action.includes('VOIDED') ||
    action.includes('CANCELLED') ||
    action.includes('FAILED') ||
    action.includes('BOUNCED')
  ) {
    return 'red';
  }
  if (
    action.includes('CREATED') ||
    action.includes('CLEARED') ||
    action.includes('CONVERTED') ||
    action.includes('SUCCESS')
  ) {
    return 'green';
  }
  if (
    action.includes('UPDATED') ||
    action.includes('ADJUSTED') ||
    action.includes('ASSIGNED') ||
    action.includes('REVERSED')
  ) {
    return 'blue';
  }
  return 'default';
}

export function AuditLogsListPage() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState<string | undefined>();
  const [action, setAction] = useState<string | undefined>();
  const [entity, setEntity] = useState<string | undefined>();
  const [entityId, setEntityId] = useState('');
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);

  // Debounce search + entityId
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const [entityIdDebounced, setEntityIdDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => {
      setEntityIdDebounced(entityId.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [entityId]);

  const query: QueryAuditLogParams = useMemo(
    () => ({
      page,
      limit,
      search: search || undefined,
      UserId: userId,
      Action: action,
      Entity: entity,
      EntityId: entityIdDebounced || undefined,
      From: range?.[0]?.startOf('day').toISOString(),
      To: range?.[1]?.endOf('day').toISOString(),
    }),
    [page, limit, search, userId, action, entity, entityIdDebounced, range],
  );

  const { data, isLoading, isFetching } = useAuditLogs(query);

  // Resolve user IDs → display names client-side. The backend doesn't
  // join User onto audit rows, and fetching the full user list once is
  // cheaper than N+1 lookups.
  const { data: usersPage } = useUsers({ limit: 100, includeDeleted: true });

  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of usersPage?.data ?? []) {
      map.set(u.Id, u.FullName ? `${u.FullName} (${u.Username})` : u.Username);
    }
    return map;
  }, [usersPage]);

  const [detail, setDetail] = useState<AuditLogRow | null>(null);

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setUserId(undefined);
    setAction(undefined);
    setEntity(undefined);
    setEntityId('');
    setRange(null);
    setPage(1);
  };

  const userOptions = useMemo(
    () =>
      (usersPage?.data ?? []).map((u) => ({
        label: u.FullName ? `${u.FullName} (${u.Username})` : u.Username,
        value: u.Id,
      })),
    [usersPage],
  );

  const columns: ColumnsType<AuditLogRow> = useMemo(
    () => [
      {
        title: 'When',
        dataIndex: 'CreatedAt',
        key: 'CreatedAt',
        width: 180,
        render: (v: string) => (
          <Typography.Text style={{ fontSize: 12 }}>
            {formatDateTime(v)}
          </Typography.Text>
        ),
      },
      {
        title: 'Actor',
        dataIndex: 'UserId',
        key: 'UserId',
        width: 200,
        render: (v: string | null) =>
          v ? (
            <Flex align="center" gap={4}>
              <UserIcon size={11} color="#94a3b8" />
              <Typography.Text style={{ fontSize: 12 }}>
                {userMap.get(v) ?? v.slice(0, 8)}
              </Typography.Text>
            </Flex>
          ) : (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Anonymous
            </Typography.Text>
          ),
      },
      {
        title: 'Action',
        dataIndex: 'Action',
        key: 'Action',
        render: (v: string) => (
          <Flex vertical gap={2}>
            <Tag
              color={actionColor(v)}
              style={{ marginInlineEnd: 0, fontSize: 11 }}
            >
              {v}
            </Tag>
            <Typography.Text type="secondary" style={{ fontSize: 10 }}>
              {humanizeAction(v)}
            </Typography.Text>
          </Flex>
        ),
      },
      {
        title: 'Entity',
        key: 'entity',
        render: (_: unknown, row) =>
          row.Entity ? (
            <Flex vertical gap={2}>
              <Typography.Text style={{ fontSize: 12 }}>
                {row.Entity}
              </Typography.Text>
              {row.EntityId && (
                <Tooltip title={row.EntityId}>
                  <Typography.Text type="secondary" style={{ fontSize: 10 }}>
                    {row.EntityId.slice(0, 8)}…
                  </Typography.Text>
                </Tooltip>
              )}
            </Flex>
          ) : (
            <Typography.Text type="secondary">—</Typography.Text>
          ),
      },
      {
        title: 'IP',
        dataIndex: 'Ip',
        key: 'Ip',
        width: 130,
        render: (v: string | null) =>
          v ? (
            <Typography.Text
              style={{ fontFamily: 'monospace', fontSize: 11 }}
            >
              {v}
            </Typography.Text>
          ) : (
            <Typography.Text type="secondary">—</Typography.Text>
          ),
      },
      {
        title: 'Actions',
        key: 'actions',
        align: 'right',
        width: 60,
        render: (_: unknown, row) => (
          <Button
            type="text"
            size="small"
            icon={<Eye size={14} />}
            onClick={() => setDetail(row)}
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userMap],
  );

  const renderMobileList = () => {
    if (isLoading) {
      return (
        <Flex justify="center" style={{ padding: 48 }}>
          <Spin />
        </Flex>
      );
    }
    if (!data || data.data.length === 0) {
      return <Empty description="No audit entries" style={{ padding: 32 }} />;
    }
    return (
      <Flex vertical gap={8}>
        {data.data.map((row) => (
          <Card
            key={row.Id}
            size="small"
            styles={{ body: { padding: 10 } }}
            onClick={() => setDetail(row)}
            style={{ cursor: 'pointer' }}
          >
            <Flex justify="space-between" gap={8} align="flex-start">
              <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                <Tag
                  color={actionColor(row.Action)}
                  style={{ marginInlineEnd: 0, width: 'fit-content' }}
                >
                  {row.Action}
                </Tag>
                <Typography.Text
                  type="secondary"
                  style={{ fontSize: 11 }}
                >
                  {formatDateTime(row.CreatedAt)}
                </Typography.Text>
                <Typography.Text style={{ fontSize: 12 }}>
                  {row.UserId
                    ? userMap.get(row.UserId) ?? row.UserId.slice(0, 8)
                    : 'Anonymous'}
                </Typography.Text>
                {row.Entity && (
                  <Typography.Text
                    type="secondary"
                    style={{ fontSize: 11 }}
                  >
                    {row.Entity}
                    {row.EntityId ? ` · ${row.EntityId.slice(0, 8)}…` : ''}
                  </Typography.Text>
                )}
              </Flex>
            </Flex>
          </Card>
        ))}
      </Flex>
    );
  };

  const handleTableChange: NonNullable<
    TableProps<AuditLogRow>['onChange']
  > = (pagination) => {
    if (pagination.current && pagination.current !== page) {
      setPage(pagination.current);
    }
    if (pagination.pageSize && pagination.pageSize !== limit) {
      setLimit(pagination.pageSize);
      setPage(1);
    }
  };

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
        <Flex vertical gap={2}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Audit logs
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Read-only, newest first. Every write in the system is recorded here.
          </Typography.Text>
        </Flex>
      </Flex>

      <Card size="small" styles={{ body: { padding: isMobile ? 12 : 16 } }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={7}>
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search action or entity"
              prefix={<SearchIcon size={14} />}
              allowClear
            />
          </Col>
          <Col xs={24} md={6}>
            <Select
              value={userId}
              onChange={(v) => {
                setUserId(v);
                setPage(1);
              }}
              placeholder="All users"
              allowClear
              showSearch
              optionFilterProp="label"
              options={userOptions}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} md={5}>
            <Select
              value={action}
              onChange={(v) => {
                setAction(v);
                setPage(1);
              }}
              placeholder="Action"
              allowClear
              showSearch
              options={COMMON_ACTIONS.map((a) => ({ label: a, value: a }))}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} md={6}>
            <Select
              value={entity}
              onChange={(v) => {
                setEntity(v);
                setPage(1);
              }}
              placeholder="Entity"
              allowClear
              showSearch
              options={COMMON_ENTITIES.map((e) => ({ label: e, value: e }))}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={10}>
            <Input
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              placeholder="Entity ID (UUID)"
              prefix={<FileText size={14} />}
              allowClear
            />
          </Col>
          <Col xs={24} md={10}>
            <RangePicker
              value={range}
              onChange={(v) =>
                setRange(v && v[0] && v[1] ? [v[0], v[1]] : null)
              }
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={4}>
            <Flex justify="flex-end">
              <Button
                type="link"
                size="small"
                icon={<Wrench size={12} />}
                onClick={resetFilters}
              >
                Reset
              </Button>
            </Flex>
          </Col>
        </Row>
      </Card>

      <Card styles={{ body: { padding: isMobile ? 8 : 0 } }}>
        {isMobile ? (
          renderMobileList()
        ) : (
          <Table<AuditLogRow>
            rowKey="Id"
            columns={columns}
            dataSource={data?.data ?? []}
            loading={isLoading || isFetching}
            onChange={handleTableChange}
            pagination={{
              current: page,
              pageSize: limit,
              total: data?.meta.total ?? 0,
              showSizeChanger: true,
              showTotal: (t, r) => `${r[0]}–${r[1]} of ${t}`,
            }}
            scroll={{ x: 'max-content' }}
            size="middle"
          />
        )}

        {isMobile && data && (
          <Flex justify="center" style={{ padding: 12 }}>
            <Pagination
              current={page}
              pageSize={limit}
              total={data.meta.total}
              onChange={(p, ps) => {
                setPage(p);
                if (ps !== limit) setLimit(ps);
              }}
              simple
            />
          </Flex>
        )}
      </Card>

      <AuditLogDetailDrawer
        open={!!detail}
        log={detail}
        userMap={userMap}
        onClose={() => setDetail(null)}
      />
    </Flex>
  );
}