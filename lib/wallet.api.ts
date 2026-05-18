const WALLET_BASE = "/api/wallet/api/v1/wallet";

export type WalletResponse = {
    userId: string;
    availableBalance: number;
    heldBalance: number;
    totalBalance: number;
    frozen: boolean;
    updatedAt: string;
};

export type TransactionResponse = {
    id: string;
    type: string;
    amount: number;
    description?: string | null;
    referenceId?: string | null;
    balanceAfter: number;
    createdAt: string;
};

export type TransactionPage = {
    content: TransactionResponse[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
};

export type WithdrawResponse = {
    transactionId: string;
    amount: number;
    fee: number;
    netAmount: number;
    status: string;
    estimatedCompletion: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${WALLET_BASE}${path}`, {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...(init?.headers ?? {}),
        },
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
        const message =
            typeof data === "object" && data !== null && "message" in data
                ? String(data.message)
                : `Wallet request failed with status ${response.status}`;
        throw new Error(message);
    }

    return data as T;
}

export function getWallet() {
    return request<WalletResponse>("/me");
}

export function topUpWallet(amount: number) {
    return request<WalletResponse>("/me/topup", {
        method: "POST",
        body: JSON.stringify({ amount }),
    });
}

export function withdrawWallet(payload: {
    amount: number;
    bankCode: string;
    accountNumber: string;
    accountName: string;
}) {
    return request<WithdrawResponse>("/me/withdraw", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function getTransactions(page = 0, size = 10) {
    return request<TransactionPage>(`/me/transactions?page=${page}&size=${size}&sort=createdAt,desc`);
}
