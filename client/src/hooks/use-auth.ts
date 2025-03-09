
import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  loginMutation: ReturnType<typeof useMutation<any, Error, { username: string; password: string }>>;
  logoutMutation: ReturnType<typeof useMutation>;
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

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await axios.post('/api/logout', {}, { withCredentials: true });
    },
    onSuccess: () => {
      setUser(null);
    },
    onError: (error: Error) => {
      console.error('Logout failed', error);
    },
  });

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/user', { withCredentials: true });
        setUser(response.data);
      } catch (error) {
        // If user is not authenticated, the 401 error is expected
        if (axios.isAxiosError(error) && error.response?.status !== 401) {
          console.error('Error fetching current user:', error);
        }
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
        logoutMutation
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
