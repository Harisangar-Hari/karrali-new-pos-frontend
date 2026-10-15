import type { ReactNode } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Undo2,
  CreditCard,
  Banknote,
  Package,
  FolderTree,
  Tags,
  Boxes,
  Building2,
  Monitor,
  Truck,
  Wallet,
  ArrowLeftRight,
  Landmark,
  ReceiptText,
  Users,
  UserSquare2,
  FileText,
  Gift,
  BarChart3,
  Settings as SettingsIcon,
  UserCog,
  ScrollText,
} from 'lucide-react';

export interface NavNode {
  /** Path (leaf) or group identifier (when `group: true`). */
  key: string;
  label: string;
  icon?: ReactNode;
  /** Any-of these permissions grants visibility. Undefined = always visible. */
  permissions?: string[];
  children?: NavNode[];
  /** Renders as a section header instead of a clickable item. */
  group?: boolean;
}

export const NAV_TREE: NavNode[] = [
  {
    key: '/',
    label: 'Dashboard',
    icon: <LayoutDashboard size={16} />,
  },

  // ─── OPERATIONS ───────────────────────────────────────────
  {
    key: 'group-operations',
    label: 'Operations',
    group: true,
    children: [
      {
        key: '/pos',
        label: 'Point of Sale',
        icon: <ShoppingCart size={16} />,
        permissions: ['sales.create'],
      },
      {
        key: '/sales',
        label: 'Sales',
        icon: <Receipt size={16} />,
        permissions: ['sales.view'],
      },
      {
        key: '/sale-returns',
        label: 'Sale Returns',
        icon: <Undo2 size={16} />,
        permissions: ['sale_returns.view'],
      },
      {
        key: '/credit-payments',
        label: 'Credit Payments',
        icon: <CreditCard size={16} />,
        permissions: ['credit_payments.view'],
      },
      {
        key: '/customer-cheques',
        label: 'Customer Cheques',
        icon: <Banknote size={16} />,
        permissions: ['customer_cheques.view'],
      },
    ],
  },

  // ─── CATALOG ──────────────────────────────────────────────
  {
    key: 'group-catalog',
    label: 'Catalog',
    group: true,
    children: [
      {
        key: '/products',
        label: 'Products',
        icon: <Package size={16} />,
        permissions: ['products.view'],
      },
      {
        key: '/categories',
        label: 'Categories',
        icon: <FolderTree size={16} />,
        permissions: ['categories.manage'],
      },
      {
        key: '/brands',
        label: 'Brands',
        icon: <Tags size={16} />,
        permissions: ['brands.manage'],
      },
      {
        key: '/stock',
        label: 'Stock',
        icon: <Boxes size={16} />,
        permissions: ['stock.view'],
      },
      {
        key: '/warehouses',
        label: 'Warehouses',
        icon: <Building2 size={16} />,
        permissions: ['warehouses.view'],
      },
      {
        key: '/terminals',
        label: 'Terminals',
        icon: <Monitor size={16} />,
        permissions: ['terminals.view'],
      },
    ],
  },

  // ─── PURCHASING ───────────────────────────────────────────
  {
    key: 'group-purchasing',
    label: 'Purchasing',
    group: true,
    children: [
      {
        key: '/purchases',
        label: 'Purchases',
        icon: <Truck size={16} />,
        permissions: ['purchases.view'],
      },
      {
        key: '/supplier-payments',
        label: 'Supplier Payments',
        icon: <Wallet size={16} />,
        permissions: ['supplier_payments.view'],
      },
      {
        key: '/supplier-cheques',
        label: 'Supplier Cheques',
        icon: <Banknote size={16} />,
        permissions: ['supplier_cheques.view'],
      },
    ],
  },

  // ─── PEOPLE ───────────────────────────────────────────────
  {
    key: 'group-people',
    label: 'People',
    group: true,
    children: [
      {
        key: '/customers',
        label: 'Customers',
        icon: <Users size={16} />,
        permissions: ['customers.view'],
      },
      {
        key: '/suppliers',
        label: 'Suppliers',
        icon: <UserSquare2 size={16} />,
        permissions: ['suppliers.view'],
      },
    ],
  },

  // ─── FINANCE ──────────────────────────────────────────────
  {
    key: 'group-finance',
    label: 'Finance',
    group: true,
    children: [
      {
        key: '/cash-sessions',
        label: 'Cash Sessions',
        icon: <Wallet size={16} />,
        permissions: ['cash_sessions.view'],
      },
      {
        key: '/cash-movements',
        label: 'Cash Movements',
        icon: <ArrowLeftRight size={16} />,
        permissions: ['cash_movements.view'],
      },
      {
        key: '/bank-accounts',
        label: 'Bank Accounts',
        icon: <Landmark size={16} />,
        permissions: ['bank_accounts.view'],
      },
      {
        key: '/expenses',
        label: 'Expenses',
        icon: <ReceiptText size={16} />,
        permissions: ['expenses.view'],
      },
      {
        key: '/expense-categories',
        label: 'Expense Categories',
        icon: <ReceiptText size={16} />,
        permissions: ['expense_categories.view'],
      },
    ],
  },

  // ─── MARKETING ────────────────────────────────────────────
  {
    key: 'group-marketing',
    label: 'Marketing',
    group: true,
    children: [
      {
        key: '/quotations',
        label: 'Quotations',
        icon: <FileText size={16} />,
        permissions: ['quotations.view'],
      },
      {
        key: '/loyalty',
        label: 'Loyalty',
        icon: <Gift size={16} />,
        permissions: ['loyalty.view'],
      },
    ],
  },

  // ─── REPORTS ──────────────────────────────────────────────
  {
    key: 'group-reports',
    label: 'Reports',
    group: true,
    children: [
      {
        key: '/reports/sales-summary',
        label: 'Sales Summary',
        icon: <BarChart3 size={16} />,
        permissions: ['reports.sales'],
      },
      {
        key: '/reports/z-report',
        label: 'Z-Report',
        icon: <BarChart3 size={16} />,
        permissions: ['reports.z_report'],
      },
      {
        key: '/reports/profit',
        label: 'Profit',
        icon: <BarChart3 size={16} />,
        permissions: ['reports.profit'],
      },
      {
        key: '/reports/stock-valuation',
        label: 'Stock Valuation',
        icon: <BarChart3 size={16} />,
        permissions: ['reports.stock'],
      },
      {
        key: '/reports/inventory-movement',
        label: 'Inventory Movement',
        icon: <BarChart3 size={16} />,
        permissions: ['reports.stock'],
      },
      {
        key: '/reports/ar-aging',
        label: 'AR Aging',
        icon: <BarChart3 size={16} />,
        permissions: ['reports.aging'],
      },
      {
        key: '/reports/cheque-calendar',
        label: 'Cheque Calendar',
        icon: <BarChart3 size={16} />,
        permissions: ['reports.cheque_calendar'],
      },
      {
        key: '/reports/cash-flow',
        label: 'Cash Flow',
        icon: <BarChart3 size={16} />,
        permissions: ['reports.cashflow'],
      },
    ],
  },

  // ─── ADMIN ────────────────────────────────────────────────
  {
    key: 'group-admin',
    label: 'Admin',
    group: true,
    children: [
      {
        key: '/users',
        label: 'Users',
        icon: <UserCog size={16} />,
        permissions: ['users.view'],
      },
      {
        key: '/settings',
        label: 'Settings',
        icon: <SettingsIcon size={16} />,
        permissions: ['settings.view'],
      },
      {
        key: '/audit-logs',
        label: 'Audit Logs',
        icon: <ScrollText size={16} />,
        permissions: ['audit.view'],
      },
    ],
  },
];

/** Walks NAV_TREE and returns only the keys of clickable leaves. */
export function flatLeafKeys(nodes: NavNode[] = NAV_TREE): string[] {
  const out: string[] = [];
  for (const n of nodes) {
    if (n.group || (n.children && n.children.length > 0)) {
      out.push(...flatLeafKeys(n.children ?? []));
    } else {
      out.push(n.key);
    }
  }
  return out;
}