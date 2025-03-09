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
import ResearchManagement from "@/pages/research-management"; // Added import
import ResearchEditor from "@/pages/research-editor";       // Added import
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/blog" component={BlogManagement} />
      <ProtectedRoute path="/blog-editor/:id" component={() => <BlogEditor />} />
      <ProtectedRoute path="/research" component={ResearchManagement} />
      <ProtectedRoute path="/research-editor/:id" component={() => <ResearchEditor />} />
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
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import BlogPosts from './pages/BlogPosts';
import BlogPostEditor from './pages/BlogPostEditor';
import ResearchDocuments from './pages/ResearchDocuments';
import ResearchDocumentEditor from './pages/ResearchDocumentEditor';
import Layout from './components/Layout';
import theme from './theme';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="blog" element={<BlogPosts />} />
              <Route path="blog/new" element={<BlogPostEditor />} />
              <Route path="blog/:id" element={<BlogPostEditor />} />
              <Route path="research" element={<ResearchDocuments />} />
              <Route path="research/new" element={<ResearchDocumentEditor />} />
              <Route path="research/:id" element={<ResearchDocumentEditor />} />
              <Route path="users" element={<Users />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
