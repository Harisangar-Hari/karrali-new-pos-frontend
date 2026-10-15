import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/layouts/AppShell';
import { ProductsListPage } from '@/pages/products/ProductsListPage';
import { CategoriesListPage } from '@/pages/categories/CategoriesListPage';
import { BrandsListPage } from '@/pages/brands/BrandsListPage';
import { WarehousesListPage } from '@/pages/warehouses/WarehousesListPage';
import { TerminalsListPage } from '@/pages/terminals/TerminalsListPage';
import { CustomerDetailPage } from '@/pages/customers/CustomerDetailPage';
import { CustomersListPage } from '@/pages/customers/CustomersListPage';
import { SuppliersListPage } from '@/pages/suppliers/SuppliersListPage';
import { PosPage } from '@/pages/pos/PosPage';
import { NewSaleReturnPage } from '@/pages/sale-returns/NewSaleReturnPage';
import { SaleReturnsListPage } from '@/pages/sale-returns/SaleReturnsListPage';
import { CreditPaymentsListPage } from '@/pages/credit-payments/CreditPaymentsListPage';
import { CustomerChequesListPage } from '@/pages/customer-cheques/CustomerChequesListPage';
import { ExpensesListPage } from '@/pages/expenses/ExpensesListPage';
import { CashMovementsListPage } from '@/pages/cash-movements/CashMovementsListPage';
import { CashSessionsListPage } from '@/pages/cash-sessions/CashSessionsListPage';
import { BankAccountsListPage } from '@/pages/bank-accounts/BankAccountsListPage';
import { ExpenseCategoriesListPage } from '@/pages/expense-categories/ExpenseCategoriesListPage';
import { CashFlowPage } from '@/pages/reports/CashFlowPage';
import { ZReportPage } from '@/pages/reports/ZReportPage';
import { SalesSummaryPage } from '@/pages/reports/SalesSummaryPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <DashboardPage /> },

          // F3 — Catalog
          { path: '/products', element: <ProductsListPage /> },
          { path: '/categories', element: <CategoriesListPage /> },
          { path: '/brands', element: <BrandsListPage /> },
          { path: '/stock', element: <PlaceholderPage /> },
          { path: '/warehouses', element: <WarehousesListPage /> },
          { path: '/terminals', element: <TerminalsListPage /> },

          // F4 — People
          { path: '/customers', element: <CustomersListPage /> },
          { path: '/customers/:id', element: <CustomerDetailPage /> },
          { path: '/suppliers', element: <SuppliersListPage /> },
          { path: '/suppliers/:id', element: <PlaceholderPage /> },

          // F5 — POS
          { path: '/pos', element: <PosPage /> },
          { path: '/sales', element: <PlaceholderPage /> },
          { path: '/sales/:id', element: <PlaceholderPage /> },

          // F6 — Purchasing
          { path: '/purchases', element: <PlaceholderPage /> },
          { path: '/purchases/:id', element: <PlaceholderPage /> },
          { path: '/supplier-payments', element: <PlaceholderPage /> },
          { path: '/supplier-cheques', element: <PlaceholderPage /> },

          // F7 — Cash & Banking
          { path: '/cash-sessions', element: <CashSessionsListPage /> },
          { path: '/cash-movements', element: <CashMovementsListPage /> },
          { path: '/bank-accounts', element: <BankAccountsListPage /> },
          { path: '/expenses', element: <ExpensesListPage /> },
          { path: '/expense-categories', element: <ExpenseCategoriesListPage /> },
          // F8 — Reports

          { path: '/reports/profit', element: <PlaceholderPage /> },
          { path: '/reports/stock-valuation', element: <PlaceholderPage /> },
          { path: '/reports/inventory-movement', element: <PlaceholderPage /> },
          { path: '/reports/ar-aging', element: <PlaceholderPage /> },
          { path: '/reports/cheque-calendar', element: <PlaceholderPage /> },
          { path: '/reports/sales-summary', element: <SalesSummaryPage /> },
          { path: '/reports/z-report', element: <ZReportPage /> },
          { path: '/reports/cash-flow', element: <CashFlowPage /> },

          // F9 — Returns & Payments
          { path: '/sale-returns', element: <SaleReturnsListPage /> },
          { path: '/sale-returns/new', element: <NewSaleReturnPage /> },
          { path: '/credit-payments', element: <CreditPaymentsListPage /> },
          { path: '/customer-cheques', element: <CustomerChequesListPage /> },

          // F10 — Marketing & Admin
          { path: '/quotations', element: <PlaceholderPage /> },
          { path: '/loyalty', element: <PlaceholderPage /> },
          { path: '/users', element: <PlaceholderPage /> },
          { path: '/settings', element: <PlaceholderPage /> },
          { path: '/audit-logs', element: <PlaceholderPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);