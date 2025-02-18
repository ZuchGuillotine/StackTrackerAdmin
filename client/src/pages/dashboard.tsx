import { DashboardNav } from "@/components/dashboard-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { fetchBlogPosts, fetchUsers, fetchReferenceData } from "@/lib/api";
import { FileText, Users, Database } from "lucide-react";

export default function Dashboard() {
  const { data: blogPosts } = useQuery({
    queryKey: ['/api/blog-posts'],
    queryFn: fetchBlogPosts
  });

  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    queryFn: fetchUsers
  });

  const { data: referenceData } = useQuery({
    queryKey: ['/api/reference-data'],
    queryFn: fetchReferenceData
  });

  return (
    <div className="flex h-screen">
      <DashboardNav />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-8">Dashboard Overview</h1>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Blog Posts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{blogPosts?.length ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users?.length ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Reference Data</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{referenceData?.length ?? 0}</div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
