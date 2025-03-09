
import { BlogPost, ReferenceData, User } from "@shared/schema";
import axios from 'axios';

const MAIN_APP_URL = import.meta.env.VITE_MAIN_APP_URL;

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  const res = await fetch(`${MAIN_APP_URL}/api/blog-posts`, {
    credentials: "include"
  });
  if (!res.ok) throw new Error("Failed to fetch blog posts");
  return res.json();
}

export async function fetchUsers(): Promise<User[]> {
  try {
    // Try to fetch from admin API first (preferred method)
    const response = await axios.get('/api/admin/users');
    return response.data;
  } catch (error) {
    // Fallback to the main app URL if admin API fails
    const res = await fetch(`${MAIN_APP_URL}/api/users`, {
      credentials: "include"
    });
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
  }
}

export async function fetchReferenceData(): Promise<ReferenceData[]> {
  const res = await fetch(`${MAIN_APP_URL}/api/reference-data`, {
    credentials: "include"
  });
  if (!res.ok) throw new Error("Failed to fetch reference data");
  return res.json();
}
import { BlogPost, ReferenceData, User } from "@shared/schema";
import axios from 'axios';

const MAIN_APP_URL = import.meta.env.VITE_MAIN_APP_URL;

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  const res = await fetch(`${MAIN_APP_URL}/api/blog-posts`, {
    credentials: "include"
  });
  if (!res.ok) throw new Error("Failed to fetch blog posts");
  return res.json();
}

export async function fetchUsers(): Promise<User[]> {
  try {
    // Try to fetch from admin API first (preferred method)
    const response = await axios.get('/api/admin/users');
    return response.data;
  } catch (error) {
    // Fallback to the main app URL if admin API fails
    const res = await fetch(`${MAIN_APP_URL}/api/users`, {
      credentials: "include"
    });
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
  }
}

export async function fetchReferenceData(): Promise<ReferenceData[]> {
  const res = await fetch(`${MAIN_APP_URL}/api/reference-data`, {
    credentials: "include"
  });
  if (!res.ok) throw new Error("Failed to fetch reference data");
  return res.json();
}

// Add the missing apiRequest function
export const apiRequest = async (method: string, url: string, data?: any) => {
  try {
    const response = await axios({
      method,
      url,
      data,
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error(`API request error (${method} ${url}):`, error);
    throw error;
  }
};
