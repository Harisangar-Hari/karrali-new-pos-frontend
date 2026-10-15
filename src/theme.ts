import type { ThemeConfig } from 'antd';

export const theme: ThemeConfig = {
  token: {
    colorPrimary: '#0d9488',
    borderRadius: 6,
    fontSize: 14,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  components: {
    Layout: {
      headerHeight: 56,
      headerPadding: '0 16px',
      siderBg: '#0f172a',
      triggerBg: '#1e293b',
    },
    Menu: {
      darkItemBg: '#0f172a',
      darkSubMenuItemBg: '#0b1220',
      darkItemSelectedBg: '#0d9488',
    },
  },
};