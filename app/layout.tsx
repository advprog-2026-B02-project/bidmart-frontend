import type {Metadata} from "next";
import "./globals.css";
import {AuthProvider} from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import NotificationListener from "@/components/NotificationListener";

export const metadata: Metadata = {
    title: "BidMart - Real-time Auction Platform",
    description: "Platform lelang kompetitif secara real-time",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="id">
        <body className="bg-bidcream font-sans text-gray-900 antialiased">
        <AuthProvider>
            <Navbar/>
            <NotificationListener/>
            {children}
        </AuthProvider>
        </body>
        </html>
    );
}
