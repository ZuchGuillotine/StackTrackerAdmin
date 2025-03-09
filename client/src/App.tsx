import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import Layout from "@/components/layout";
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import Login from './pages/auth-page';
import Dashboard from './pages/dashboard';
import UserManagement from './pages/user-management';
import BlogManagement from './pages/blog-management';
import BlogEditor from './pages/blog-editor';
import ResearchManagement from "./pages/research-management";
import ResearchEditor from "./pages/research-editor";
import NoMatch from "./pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: import.meta.env.PROD,
    },
  },
});

function PrivateRoute({ component: Component, ...rest }: any) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return <Component {...rest} />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="theme">
        <AuthProvider>
          <Layout>
            <Switch>
              <Route path="/login" component={Login} />
              <Route path="/">
                <PrivateRoute component={Dashboard} />
              </Route>
              <Route path="/users">
                <PrivateRoute component={UserManagement} />
              </Route>
              <Route path="/blog">
                <PrivateRoute component={BlogManagement} />
              </Route>
              <Route path="/blog-editor/:id">
                <PrivateRoute component={BlogEditor} />
              </Route>
              <Route path="/blog-editor/new">
                <PrivateRoute component={BlogEditor} />
              </Route>
              <Route path="/research">
                <PrivateRoute component={ResearchManagement} />
              </Route>
              <Route path="/research-editor/:id">
                <PrivateRoute component={ResearchEditor} />
              </Route>
              <Route path="/research-editor/new">
                <PrivateRoute component={ResearchEditor} />
              </Route>
              <Route component={NoMatch} />
            </Switch>
          </Layout>
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;