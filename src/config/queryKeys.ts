export const qk = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  dashboard: {
    summary: ['dashboard', 'summary'] as const,
  },
  products: {
    all: ['products'] as const,
    list: (filters?: unknown) => ['products', 'list', filters ?? {}] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
  },
  customers: {
    all: ['customers'] as const,
    list: (filters?: unknown) => ['customers', 'list', filters ?? {}] as const,
    detail: (id: string) => ['customers', 'detail', id] as const,
    creditStatus: (id: string) => ['customers', 'credit-status', id] as const,
    ledger: (id: string, filters?: unknown) =>
      ['customers', 'ledger', id, filters ?? {}] as const,
  },
  sales: {
    all: ['sales'] as const,
    list: (filters?: unknown) => ['sales', 'list', filters ?? {}] as const,
    detail: (id: string) => ['sales', 'detail', id] as const,
  },
  stock: {
    all: ['stock'] as const,
    product: (productId: string) => ['stock', 'product', productId] as const,
    ledger: (filters?: unknown) => ['stock', 'ledger', filters ?? {}] as const,
  },
  saleReturns: {
    all: ['sale-returns'] as const,
    list: (filters?: unknown) =>
      ['sale-returns', 'list', filters ?? {}] as const,
    detail: (id: string) => ['sale-returns', 'detail', id] as const,
  },
  creditPayments: {
    all: ['credit-payments'] as const,
    list: (filters?: unknown) =>
      ['credit-payments', 'list', filters ?? {}] as const,
    detail: (id: string) => ['credit-payments', 'detail', id] as const,
  },
  customerCheques: {
    all: ['customer-cheques'] as const,
    list: (filters?: unknown) =>
      ['customer-cheques', 'list', filters ?? {}] as const,
    detail: (id: string) => ['customer-cheques', 'detail', id] as const,
  },
  expenses: {
    all: ['expenses'] as const,
    list: (filters?: unknown) => ['expenses', 'list', filters ?? {}] as const,
    detail: (id: string) => ['expenses', 'detail', id] as const,
  },
  expenseCategories: {
    all: ['expense-categories'] as const,
    list: (filters?: unknown) =>
      ['expense-categories', 'list', filters ?? {}] as const,
    detail: (id: string) => ['expense-categories', 'detail', id] as const,
  },
  bankAccounts: {
    all: ['bank-accounts'] as const,
    list: (filters?: unknown) =>
      ['bank-accounts', 'list', filters ?? {}] as const,
    detail: (id: string) => ['bank-accounts', 'detail', id] as const,
  },
  cashMovements: {
    all: ['cash-movements'] as const,
    list: (filters?: unknown) =>
      ['cash-movements', 'list', filters ?? {}] as const,
    detail: (id: string) => ['cash-movements', 'detail', id] as const,
  },
  cashSessions: {
    all: ['cash-sessions'] as const,
    me: ['cash-sessions', 'me'] as const,
    list: (filters?: unknown) =>
      ['cash-sessions', 'list', filters ?? {}] as const,
    detail: (id: string) => ['cash-sessions', 'detail', id] as const,
    expectedCash: (id: string) =>
      ['cash-sessions', 'expected-cash', id] as const,
    ledger: (filters?: unknown) =>
      ['cash-sessions', 'ledger', filters ?? {}] as const,
  },
  reports: {
    all: ['reports'] as const,
  },
  suppliers: {
    all: ['suppliers'] as const,
    list: (filters?: unknown) => ['suppliers', 'list', filters ?? {}] as const,
    detail: (id: string) => ['suppliers', 'detail', id] as const,
  },
  categories: {
    all: ['categories'] as const,
    list: (filters?: unknown) => ['categories', 'list', filters ?? {}] as const,
    detail: (id: string) => ['categories', 'detail', id] as const,
    lookup: ['categories', 'lookup'] as const,
  },
  brands: {
    all: ['brands'] as const,
    list: (filters?: unknown) => ['brands', 'list', filters ?? {}] as const,
    detail: (id: string) => ['brands', 'detail', id] as const,
    lookup: ['brands', 'lookup'] as const,
  },
  warehouses: {
    all: ['warehouses'] as const,
    list: (filters?: unknown) => ['warehouses', 'list', filters ?? {}] as const,
    detail: (id: string) => ['warehouses', 'detail', id] as const,
    lookup: ['warehouses', 'lookup'] as const,
  },
  terminals: {
    all: ['terminals'] as const,
    list: (filters?: unknown) => ['terminals', 'list', filters ?? {}] as const,
    detail: (id: string) => ['terminals', 'detail', id] as const,
  },
} as const;