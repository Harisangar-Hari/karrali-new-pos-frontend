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
import { ChequeCalendarPage } from '@/pages/reports/ChequeCalendarPage';
import { ArAgingPage } from '@/pages/reports/ArAgingPage';
import { InventoryMovementPage } from '@/pages/reports/InventoryMovementPage';
import { StockValuationPage } from '@/pages/reports/StockValuationPage';
import { ProfitPage } from '@/pages/reports/ProfitPage';

import { NewPurchasePage } from '@/pages/purchases/NewPurchasePage';
import { PurchasesListPage } from '@/pages/purchases/PurchasesListPage';
import { SupplierPaymentsListPage } from '@/pages/supplier-payments/SupplierPaymentsListPage';
import { SupplierChequesListPage } from '@/pages/supplier-cheques/SupplierChequesListPage';
import { SalesListPage } from '@/pages/sales/SalesListPage';
import { UsersListPage } from '@/pages/users/UsersListPage';
import { SettingsListPage } from '@/pages/settings/SettingsListPage';
import { LoyaltyPage } from '@/pages/loyalty/LoyaltyPage';
import { QuotationFormPage } from '@/pages/quotations/QuotationFormPage';
import { QuotationsListPage } from '@/pages/quotations/QuotationsListPage';
import { StockLedgerPage } from '@/pages/stock/StockLedgerPage';
import { AuditLogsListPage } from '@/pages/audit/AuditLogsListPage';
import { SupplierDetailPage } from '@/pages/suppliers/SupplierDetailPage';

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
          { path: '/stock', element: <StockLedgerPage /> },
          { path: '/warehouses', element: <WarehousesListPage /> },
          { path: '/terminals', element: <TerminalsListPage /> },

          // F4 — People
          { path: '/customers', element: <CustomersListPage /> },
          { path: '/customers/:id', element: <CustomerDetailPage /> },
          { path: '/suppliers', element: <SuppliersListPage /> },
          { path: '/suppliers/:id', element: <SupplierDetailPage /> },


          // F5 — POS
          { path: '/pos', element: <PosPage /> },
          { path: '/sales', element: <SalesListPage /> },

          // F6 — Purchasing
          { path: '/purchases', element: <PurchasesListPage /> },
          { path: '/purchases/new', element: <NewPurchasePage /> },
          { path: '/supplier-payments', element: <SupplierPaymentsListPage /> },
          { path: '/supplier-cheques', element: <SupplierChequesListPage /> },


          // F7 — Cash & Banking
          { path: '/cash-sessions', element: <CashSessionsListPage /> },
          { path: '/cash-movements', element: <CashMovementsListPage /> },
          { path: '/bank-accounts', element: <BankAccountsListPage /> },
          { path: '/expenses', element: <ExpensesListPage /> },
          { path: '/expense-categories', element: <ExpenseCategoriesListPage /> },
          // F8 — Reports

          { path: '/reports/profit', element: <ProfitPage /> },
          { path: '/reports/stock-valuation', element: <StockValuationPage /> },
          { path: '/reports/inventory-movement', element: <InventoryMovementPage /> },
          { path: '/reports/ar-aging', element: <ArAgingPage /> },
          { path: '/reports/cheque-calendar', element: <ChequeCalendarPage /> },
          { path: '/reports/sales-summary', element: <SalesSummaryPage /> },
          { path: '/reports/z-report', element: <ZReportPage /> },
          { path: '/reports/cash-flow', element: <CashFlowPage /> },

          // F9 — Returns & Payments
          { path: '/sale-returns', element: <SaleReturnsListPage /> },
          { path: '/sale-returns/new', element: <NewSaleReturnPage /> },
          { path: '/credit-payments', element: <CreditPaymentsListPage /> },
          { path: '/customer-cheques', element: <CustomerChequesListPage /> },

          // F10 — Marketing & Admin
          { path: '/quotations', element: <QuotationsListPage /> },
          { path: '/quotations/new', element: <QuotationFormPage /> },
          { path: '/quotations/:id/edit', element: <QuotationFormPage /> },
          { path: '/loyalty', element: <LoyaltyPage /> },
          { path: '/users', element: <UsersListPage /> },
          { path: '/settings', element: <SettingsListPage /> },
          { path: '/audit-logs', element: <AuditLogsListPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);