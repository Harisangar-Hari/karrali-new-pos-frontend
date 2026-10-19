export interface AuditLogRow {
  Id: string;
  UserId: string | null;
  Action: string;
  Entity: string | null;
  EntityId: string | null;
  Before: unknown;
  After: unknown;
  Metadata: unknown;
  Ip: string | null;
  UserAgent: string | null;
  CreatedAt: string;
}

export interface QueryAuditLogParams {
  page?: number;
  limit?: number;
  UserId?: string;
  Action?: string;
  Entity?: string;
  EntityId?: string;
  From?: string;
  To?: string;
  search?: string;
}

/**
 * Common entity names — used to populate the entity filter dropdown.
 * Not exhaustive; users can type any value.
 */
export const COMMON_ENTITIES = [
  'User',
  'Customer',
  'Supplier',
  'Product',
  'Category',
  'Brand',
  'Warehouse',
  'Terminal',
  'Sale',
  'SaleReturn',
  'Purchase',
  'SupplierPayment',
  'SupplierCheque',
  'CustomerCheque',
  'CreditPayment',
  'CashSession',
  'CashMovement',
  'CashLedger',
  'Expense',
  'BankAccount',
  'Quotation',
  'Setting',
  'StockMovement',
  'LoyaltyTransaction',
] as const;

/**
 * Common action prefixes. Actions are SCREAMING_SNAKE_CASE with the
 * entity name and past-tense verb (e.g. PRODUCT_CREATED). Filtering by
 * prefix works because the backend does exact match on Action — this
 * list is a helper for the UI's search suggestions.
 */
export const COMMON_ACTIONS = [
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGOUT',
  'USER_CREATED',
  'USER_UPDATED',
  'USER_DELETED',
  'USER_ROLES_ASSIGNED',
  'USER_PASSWORD_CHANGED',
  'USER_PASSWORD_RESET',
  'SALE_CREATED',
  'SALE_CANCELLED',
  'SALE_RETURN_CREATED',
  'PURCHASE_CREATED',
  'PURCHASE_CANCELLED',
  'PRODUCT_CREATED',
  'PRODUCT_UPDATED',
  'PRODUCT_DELETED',
  'CUSTOMER_CREATED',
  'CUSTOMER_UPDATED',
  'CUSTOMER_BALANCE_ADJUSTED',
  'SUPPLIER_CREATED',
  'EXPENSE_CREATED',
  'EXPENSE_DELETED',
  'SETTING_UPDATED',
  'QUOTATION_CONVERTED',
  'LOYALTY_POINTS_ADJUSTED',
] as const;

/**
 * Human-readable label per action prefix. Falls back to the raw
 * SCREAMING_SNAKE string when unknown.
 */
export function humanizeAction(action: string): string {
  // INSERT order matters — longest prefix first so USER_PASSWORD_CHANGED
  // doesn't accidentally match USER_CREATED patterns.
  return action
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}