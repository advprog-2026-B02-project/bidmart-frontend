export type TransactionType =
    | 'TOPUP'
    | 'WITHDRAW'
    | 'HOLD'
    | 'RELEASE'
    | 'CAPTURE'
    | 'PAYMENT_RECEIVED'
    | 'WALLET_FROZEN';

export type HoldStatus = 'ACTIVE' | 'RELEASED' | 'CAPTURED';

export interface Wallet {
    id: string;
    userId: string;
    availableBalance: number;
    heldBalance: number;
    frozen: boolean;
    createdAt: string;
    updatedAt: string | null;
    version: number;
}

export interface BalanceHold {
    id: string;
    walletId: string;
    userId: string;
    auctionId: string | null;
    bidId: string | null;
    amount: number;
    status: HoldStatus;
    createdAt: string;
    updatedAt: string;
}

export interface WalletTransaction {
    id: string;
    walletId: string;
    type: TransactionType;
    amount: number;
    balanceAfter: number;
    description: string | null;
    referenceId: string | null;
    createdAt: string;
}