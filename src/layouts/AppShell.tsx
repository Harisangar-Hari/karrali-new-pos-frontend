import { useEffect, useMemo, useState } from 'react';
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Typography,
  Flex,
  Drawer,
  Button,
  Grid,
  theme as antdTheme,
} from 'antd';
import {
  LogOut,
  User as UserIcon,
  ChevronDown,
  Menu as MenuIcon,
} from 'lucide-react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useNavItems } from '@/hooks/useNavItems';
import { flatLeafKeys } from '@/config/nav';
import { ChangeOwnPasswordModal } from '@/pages/users/ChangeOwnPasswordModal';
import { KeyRound } from 'lucide-react';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

/**
 * Returns the leaf nav key that best matches the current pathname.
 * Uses longest-prefix matching so /sales/abc-123 highlights /sales.
 */
function pickSelectedKey(pathname: string, leafKeys: string[]): string[] {
  const sorted = [...leafKeys].sort((a, b) => b.length - a.length);
  for (const k of sorted) {
    if (k === '/') {
      if (pathname === '/') return ['/'];
      continue;
    }
    if (pathname === k || pathname.startsWith(k + '/')) return [k];
  }
  return [pathname];
}

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.md; // < 768px

  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer },
  } = antdTheme.useToken();

  const menuItems = useNavItems();
  const leafKeys = useMemo(() => flatLeafKeys(), []);
  const selectedKeys = useMemo(
    () => pickSelectedKey(location.pathname, leafKeys),
    [location.pathname, leafKeys],
  );

  // Close the mobile drawer on navigation.
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore — clear locally regardless.
    }
    clear();
    navigate('/login', { replace: true });
  };

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserIcon size={14} />,
        label: user?.Username ?? 'Account',
        disabled: true,
      },
      { type: 'divider' as const },
      {
        key: 'change-password',
        icon: <KeyRound size={14} />,
        label: 'Change password',
        onClick: () => setChangePasswordOpen(true),
      },
      { type: 'divider' as const },
      {
        key: 'logout',
        icon: <LogOut size={14} />,
        label: 'Sign out',
        danger: true,
        onClick: handleLogout,
      },
    ],
  };

  const navMenu = (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={selectedKeys}
      onClick={({ key }) => navigate(key)}
      items={menuItems}
      style={{ borderInlineEnd: 'none', }}
    />
  );

  const brand = (
    <Flex
      align="center"
      justify="center"
      style={{
        height: 56,
        color: '#fff',
        fontWeight: 700,
        letterSpacing: 1,
        fontSize: 16,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {isMobile || !collapsed ? 'KARRALI' : 'K'}
    </Flex>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Desktop sider */}
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={240}
          breakpoint="md"
          style={{
            height: '100vh',
            position: 'sticky',
            top: 0,
            insetInlineStart: 0,
          }}
        >
          <Flex
            vertical
            style={{
              height: '100%',
              overflow: 'hidden',
            }}
          >
            <div style={{ flexShrink: 0 }}>{brand}</div>
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
              }}
              className="app-shell-nav-scroll"
            >
              {navMenu}
            </div>
          </Flex>
        </Sider>
      )}

      {/* Mobile drawer */}
      {isMobile && (
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={260}
          closable={false}
          styles={{
            body: { padding: 0, background: '#0f172a' },
            header: { display: 'none' },
          }}
        >
          {brand}
          <div style={{ overflowY: 'auto', height: 'calc(100vh - 56px)' }}>
            {navMenu}
          </div>
        </Drawer>
      )}

      <Layout>
        <Header
          style={{
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
            padding: isMobile ? '0 8px' : '0 16px',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          {isMobile && (
            <Button
              type="text"
              icon={<MenuIcon size={20} />}
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
            />
          )}
          <div style={{ flex: 1 }} />
          <Dropdown menu={userMenu} trigger={['click']} placement="bottomRight">
            <Flex
              align="center"
              gap={8}
              style={{ cursor: 'pointer', padding: '4px 8px' }}
            >
              <Avatar size="small" style={{ background: '#0d9488' }}>
                {user?.Username?.[0]?.toUpperCase() ?? '?'}
              </Avatar>
              {!isMobile && (
                <Typography.Text strong>
                  {user?.Username ?? 'Guest'}
                </Typography.Text>
              )}
              <ChevronDown size={14} />
            </Flex>
          </Dropdown>
        </Header>

        <Content
          style={{
            padding: isMobile ? 12 : 24,
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
      <ChangeOwnPasswordModal
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </Layout>
  );
}