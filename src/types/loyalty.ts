export interface LoyaltyTierConfig {
  Name: string;
  MinLifetime: number;
}

export interface LoyaltyConfig {
  Enabled: boolean;
  CurrencyPerPoint: number;
  RedeemRate: number;
  MinRedeem: number;
  MaxRedeemPercent: number;
  Tiers: LoyaltyTierConfig[];
}

export interface LoyaltyStatus {
  CustomerId: string;
  Code: string;
  Name: string;
  Points: number;
  LifetimeEarned: number;
  Tier: string;
  NextTier: string | null;
  PointsToNextTier: number | null;
  RedeemValue: string;
}

export type LoyaltyTransactionType = 'EARN' | 'REDEEM' | 'ADJUST' | 'REVERSAL';

export interface LoyaltyTransactionRow {
  Id: string;
  CustomerId: string;
  Type: LoyaltyTransactionType;
  Points: number;
  PointsAfter: number;
  SaleId: string | null;
  SaleReturnId: string | null;
  Notes: string | null;
  CreatedAt: string;
  CreatedByUserId: string | null;
  Customer: { Id: string; Name: string; Code: string };
}

export interface AdjustPointsInput {
  Points: number;
  Reason: string;
}

export interface QueryLoyaltyTransactionParams {
  page?: number;
  limit?: number;
  CustomerId?: string;
  Type?: LoyaltyTransactionType;
  From?: string;
  To?: string;
  sortBy?: 'CreatedAt' | 'Points';
  sortOrder?: 'asc' | 'desc';
}