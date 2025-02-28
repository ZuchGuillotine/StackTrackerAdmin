
import React from "react";
import Header from "@/components/header";
import { useAuth } from "@/hooks/use-auth";
import { DashboardNav } from "@/components/dashboard-nav";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const isLoggedIn = !!user;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <div className="flex flex-1">
        {isLoggedIn && user?.isAdmin && (
          <DashboardNav />
        )}
        <main className={`flex-1 ${isLoggedIn && user?.isAdmin ? 'p-4' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
