
import React from "react";
import Header from "@/components/header";
import { useAuth } from "@/hooks/use-auth";

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
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
