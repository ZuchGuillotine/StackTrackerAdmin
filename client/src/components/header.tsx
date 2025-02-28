
import * as React from "react";
import { Link } from "wouter";
import { HeaderNavigation } from "./header-navigation";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="font-bold text-xl">StackTracker</span>
        </Link>
        <div className="mr-4 hidden md:flex">
          <HeaderNavigation />
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button variant="outline" asChild>
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
