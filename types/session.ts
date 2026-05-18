export interface UserSession {
    id: string;
    ipAddress: string;
    userAgent: string;
    isCurrentSession: boolean;
    lastActiveAt: string;
    createdAt: string;
}