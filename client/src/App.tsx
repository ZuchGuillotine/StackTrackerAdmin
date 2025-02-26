import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import BlogManagement from "@/pages/blog-management";
import UserManagement from "@/pages/user-management";
import ReferenceManagement from "@/pages/reference-management";
import BlogEditor from "@/pages/blog-editor";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/blog" component={BlogManagement} />
      <ProtectedRoute path="/blog-editor/:id" component={BlogEditor} />
      <ProtectedRoute path="/users" component={UserManagement} />
      <ProtectedRoute path="/reference" component={ReferenceManagement} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
