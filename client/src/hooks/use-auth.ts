
import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/api';

interface User {
  id: number;
  username: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  loginMutation: ReturnType<typeof useMutation<any, Error, { username: string; password: string }>>;
  logoutMutation: ReturnType<typeof useMutation>;
  registerMutation: ReturnType<typeof useMutation>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await axios.post('/api/login', credentials, { withCredentials: true });
      return response.data;
    },
    onSuccess: (userData) => {
      setUser(userData);
      setError(null);
    },
    onError: (error: Error) => {
      setError(error);
      setUser(null);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await axios.post('/api/register', credentials, { withCredentials: true });
      return response.data;
    },
    onSuccess: (userData) => {
      setUser(userData);
      setError(null);
    },
    onError: (error: Error) => {
      setError(error);
      setUser(null);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      setUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get('/api/user', { withCredentials: true });
        setUser(response.data);
        setError(null);
      } catch (err) {
        console.log('Not authenticated or error fetching user', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
