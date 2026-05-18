export type Role = 'BUYER' | 'SELLER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export interface User {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    roles: Role[];
    emailVerified: boolean;
    status: UserStatus;
    createdAt: string;
}

export interface LoginSuccessResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: User;
}

export interface Login2FAResponse {
    partialToken: string;
    requires2FA: true;
    methods: string[];
    expiresIn: number;
}