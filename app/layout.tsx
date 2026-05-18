import type { Metadata } from "next";
import React from "react";
import "./globals.css";

export const metadata: Metadata = {
    title: "BidMart",
    description: "BidMart Auth",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="id">
        <body className="font-sans">{children}</body>
        </html>
    );
}
