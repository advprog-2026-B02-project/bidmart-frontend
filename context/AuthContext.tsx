"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, LoginSuccessResponse } from "@/types/auth";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (data: LoginSuccessResponse) => void;
    logout: () => Promise<void>;
    checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkSession = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/me");
            if (res.ok) {
                const data: User = await res.json();
                setUser(data);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Gagal ngecek sesi:", error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            checkSession();
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    const login = (data: LoginSuccessResponse) => {
        setUser(data.user);
    };

    const logout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            setUser(null);
        } catch (error) {
            console.error("Logout gagal:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, checkSession }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth harus digunakan di dalam AuthProvider");
    }
    return context;
};