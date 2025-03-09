import { BlogPost, ReferenceData, User } from "@shared/schema";

const MAIN_APP_URL = import.meta.env.VITE_MAIN_APP_URL;

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  const res = await fetch(`${MAIN_APP_URL}/api/blog-posts`, {
    credentials: "include"
  });
  if (!res.ok) throw new Error("Failed to fetch blog posts");
  return res.json();
}

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${MAIN_APP_URL}/api/users`, {
    credentials: "include"
  });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function fetchReferenceData(): Promise<ReferenceData[]> {
  const res = await fetch(`${MAIN_APP_URL}/api/reference-data`, {
    credentials: "include"
  });
  if (!res.ok) throw new Error("Failed to fetch reference data");
  return res.json();
}
import axios from 'axios';

export async function fetchUsers() {
  const response = await axios.get('/api/admin/users');
  return response.data;
}
