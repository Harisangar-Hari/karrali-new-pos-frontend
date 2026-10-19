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
  Pagination,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  App,
} from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import {
  Plus,
  Search as SearchIcon,
  Pencil,
  Trash2,
  KeyRound,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import {
  useDeleteUser,
  useUsers,
  useRoles,
} from '@/hooks/queries/useUsers';
import { usePermission } from '@/hooks/usePermission';
import { useAuthStore } from '@/stores/authStore';
import { UserFormDrawer } from './UserFormDrawer';
import { AssignRolesDrawer } from './AssignRolesDrawer';
import { ResetPasswordModal } from './ResetPasswordModal';
import { formatDateTime } from '@/lib/format';
import { getErrorMessage } from '@/lib/api';
import type {
  QueryUserParams,
  UserRow,
  UserSortField,
} from '@/types/user';

const { useBreakpoint } = Grid;
const DEFAULT_PAGE_SIZE = 20;

export function UsersListPage() {
  const { message, modal } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const currentUser = useAuthStore((s) => s.user);
  const currentUserId = currentUser?.Id ?? null;

  const canCreate = usePermission('users.create');
  const canUpdate = usePermission('users.update');
  const canDelete = usePermission('users.delete');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [roleId, setRoleId] = useState<string | undefined>();
  const [isActive, setIsActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState<UserSortField>('Username');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query: QueryUserParams = useMemo(
    () => ({
      page,
      limit,
      search: search || undefined,
      RoleId: roleId,
      IsActive:
        isActive === 'all' ? undefined : isActive === 'active' ? true : false,
      sortBy,
      sortOrder,
    }),
    [page, limit, search, roleId, isActive, sortBy, sortOrder],
  );

  const { data, isLoading, isFetching } = useUsers(query);
  const { data: roles = [] } = useRoles();
  const deleteMutation = useDeleteUser();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [rolesTarget, setRolesTarget] = useState<UserRow | null>(null);
  const [pwdTarget, setPwdTarget] = useState<UserRow | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (row: UserRow) => {
    setEditing(row);
    setFormOpen(true);
  };
  const openRoles = (row: UserRow) => {
    setRolesTarget(row);
    setRolesOpen(true);
  };
  const openResetPwd = (row: UserRow) => setPwdTarget(row);

  const confirmDelete = (row: UserRow) => {
    modal.confirm({
      title: 'Delete user?',
      content: (
        <div>
          <p>
            <strong>{row.Username}</strong> will be soft-deleted and all their
            sessions revoked.
          </p>
          <p style={{ color: '#faad14', marginBottom: 0 }}>
            Guards: cannot delete yourself, the superadmin account, or the last
            remaining admin.
          </p>
        </div>
      ),
      okText: 'Delete',
      okButtonProps: { danger: true },
      async onOk() {
        try {
          await deleteMutation.mutateAsync(row.Id);
          message.success('User deleted');
        } catch (err) {
          message.error(getErrorMessage(err));
          throw err;
        }
      },
    });
  };

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setRoleId(undefined);
    setIsActive('all');
    setPage(1);
  };

  const columns: ColumnsType<UserRow> = useMemo(
    () => [
      {
        title: 'User',
        key: 'user',
        render: (_: unknown, row) => (
          <Flex vertical gap={2}>
            <Flex align="center" gap={6}>
              <Typography.Text strong>{row.Username}</Typography.Text>
              {row.Id === currentUserId && <Tag color="cyan">You</Tag>}
            </Flex>
            {row.FullName && (
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                {row.FullName}
              </Typography.Text>
            )}
            {row.Email && (
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                {row.Email}
              </Typography.Text>
            )}
          </Flex>
        ),
      },
      {
        title: 'Roles',
        key: 'roles',
        render: (_: unknown, row) => (
          <Flex gap={4} wrap="wrap">
            {row.UserRoles.length === 0 ? (
              <Typography.Text type="secondary">—</Typography.Text>
            ) : (
              row.UserRoles.map((ur) => (
                <Tag
                  key={ur.Id}
                  color={ur.Role.Name === 'ADMIN' ? 'red' : 'blue'}
                  style={{ marginInlineEnd: 0 }}
                >
                  {ur.Role.Name}
                </Tag>
              ))
            )}
          </Flex>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'IsActive',
        key: 'IsActive',
        render: (_: unknown, row) =>
          row.IsActive ? (
            <Tag color="green">Active</Tag>
          ) : (
            <Tag>Inactive</Tag>
          ),
      },
      {
        title: 'Last login',
        dataIndex: 'LastLogin',
        key: 'LastLogin',
        sorter: true,
        sortOrder:
          sortBy === 'LastLogin'
            ? sortOrder === 'asc'
              ? 'ascend'
              : 'descend'
            : null,
        render: (v: string | null) =>
          v ? (
            <Typography.Text style={{ fontSize: 12 }}>
              {formatDateTime(v)}
            </Typography.Text>
          ) : (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Never
            </Typography.Text>
          ),
      },
      {
        title: 'Actions',
        key: 'actions',
        align: 'right',
        render: (_: unknown, row) => {
          const items: {
            key: string;
            icon: React.ReactNode;
            label: string;
            danger?: boolean;
            onClick: () => void;
          }[] = [];
          if (canUpdate) {
            items.push({
              key: 'edit',
              icon: <Pencil size={14} />,
              label: 'Edit',
              onClick: () => openEdit(row),
            });
            items.push({
              key: 'roles',
              icon: <ShieldCheck size={14} />,
              label: 'Change roles',
              onClick: () => openRoles(row),
            });
            items.push({
              key: 'pwd',
              icon: <KeyRound size={14} />,
              label: 'Reset password',
              onClick: () => openResetPwd(row),
            });
          }
          if (canDelete) {
            items.push({
              key: 'delete',
              icon: <Trash2 size={14} />,
              label: 'Delete',
              danger: true,
              onClick: () => confirmDelete(row),
            });
          }
          if (items.length === 0) return null;
          return (
            <Dropdown menu={{ items }} trigger={['click']}>
              <Button size="small">
                Actions <ChevronDown size={12} />
              </Button>
            </Dropdown>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sortBy, sortOrder, canUpdate, canDelete, currentUserId],
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
      return <Empty description="No users" style={{ padding: 32 }} />;
    }
    return (
      <Flex vertical gap={8}>
        {data.data.map((row) => (
          <Card key={row.Id} size="small" styles={{ body: { padding: 12 } }}>
            <Flex justify="space-between" gap={8} align="flex-start">
              <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                <Flex align="center" gap={6}>
                  <Typography.Text strong>{row.Username}</Typography.Text>
                  {row.Id === currentUserId && <Tag color="cyan">You</Tag>}
                  {!row.IsActive && <Tag>Inactive</Tag>}
                </Flex>
                {row.FullName && (
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    {row.FullName}
                  </Typography.Text>
                )}
                {row.Email && (
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    {row.Email}
                  </Typography.Text>
                )}
                <Flex gap={4} wrap="wrap" style={{ marginTop: 4 }}>
                  {row.UserRoles.map((ur) => (
                    <Tag
                      key={ur.Id}
                      color={ur.Role.Name === 'ADMIN' ? 'red' : 'blue'}
                      style={{ marginInlineEnd: 0 }}
                    >
                      {ur.Role.Name}
                    </Tag>
                  ))}
                </Flex>
              </Flex>
              {(canUpdate || canDelete) && (
                <Dropdown
                  menu={{
                    items: [
                      ...(canUpdate
                        ? [
                            {
                              key: 'edit',
                              icon: <Pencil size={14} />,
                              label: 'Edit',
                              onClick: () => openEdit(row),
                            },
                            {
                              key: 'roles',
                              icon: <ShieldCheck size={14} />,
                              label: 'Change roles',
                              onClick: () => openRoles(row),
                            },
                            {
                              key: 'pwd',
                              icon: <KeyRound size={14} />,
                              label: 'Reset password',
                              onClick: () => openResetPwd(row),
                            },
                          ]
                        : []),
                      ...(canDelete
                        ? [
                            {
                              key: 'delete',
                              icon: <Trash2 size={14} />,
                              label: 'Delete',
                              danger: true,
                              onClick: () => confirmDelete(row),
                            },
                          ]
                        : []),
                    ],
                  }}
                  trigger={['click']}
                >
                  <Button size="small">Actions</Button>
                </Dropdown>
              )}
            </Flex>
          </Card>
        ))}
      </Flex>
    );
  };

  const handleTableChange: NonNullable<
    TableProps<UserRow>['onChange']
  > = (pagination, _filters, sorter) => {
    if (Array.isArray(sorter)) return;
    if (sorter.field && sorter.order) {
      setSortBy(sorter.field as UserSortField);
      setSortOrder(sorter.order === 'ascend' ? 'asc' : 'desc');
    }
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
        <Typography.Title level={3} style={{ margin: 0 }}>
          Users
        </Typography.Title>
        {canCreate && (
          <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>
            {isMobile ? 'New' : 'New user'}
          </Button>
        )}
      </Flex>

      <Card size="small" styles={{ body: { padding: isMobile ? 12 : 16 } }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={10}>
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search username, full name, or email"
              prefix={<SearchIcon size={14} />}
              allowClear
            />
          </Col>
          <Col xs={12} md={7}>
            <Select
              value={roleId}
              onChange={(v) => {
                setRoleId(v);
                setPage(1);
              }}
              placeholder="Role"
              allowClear
              options={roles.map((r) => ({ label: r.Name, value: r.Id }))}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} md={7}>
            <Flex align="center" justify="space-between" gap={8}>
              <Select
                value={isActive}
                onChange={(v) => {
                  setIsActive(v);
                  setPage(1);
                }}
                options={[
                  { label: 'All status', value: 'all' },
                  { label: 'Active', value: 'active' },
                  { label: 'Inactive', value: 'inactive' },
                ]}
                style={{ flex: 1 }}
              />
              <Button type="link" size="small" onClick={resetFilters}>
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
          <Table<UserRow>
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

      <UserFormDrawer
        open={formOpen}
        user={editing}
        onClose={() => setFormOpen(false)}
      />
      <AssignRolesDrawer
        open={rolesOpen}
        user={rolesTarget}
        currentUserId={currentUserId}
        onClose={() => {
          setRolesOpen(false);
          setRolesTarget(null);
        }}
      />
      <ResetPasswordModal
        open={!!pwdTarget}
        user={pwdTarget}
        onClose={() => setPwdTarget(null)}
      />
    </Flex>
  );
}