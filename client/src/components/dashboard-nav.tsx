import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Database,
  LogOut 
} from "lucide-react";

const items = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
  },
  {
    title: "Blog Management",
    icon: FileText,
    href: "/blog",
  },
  {
    title: "User Management",
    icon: Users,
    href: "/users",
  },
  {
    title: "Reference Data",
    icon: Database,
    href: "/reference",
  },
];

export function DashboardNav() {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();

  return (
    <div className="relative h-screen border-r bg-sidebar p-4 w-64">
      <div className="mb-4">
        <h2 className="px-2 text-lg font-semibold tracking-tight">
          Admin Dashboard
        </h2>
      </div>
      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="space-y-1 p-2">
          {items.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={location === item.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2",
                  location === item.href && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Button>
            </Link>
          ))}
        </div>
      </ScrollArea>
      <div className="absolute bottom-4 left-4 right-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
