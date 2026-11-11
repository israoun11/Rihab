import type { Category, Project, ProjectInput, SiteContent } from "@rihab/shared";
import { api } from "../api/http";

export interface MediaItem {
  id: string;
  url: string;
  filename: string;
  contentType: string;
  size: number;
  width: number;
  height: number;
  uploadedAt: string;
}

export const adminApi = {
  me: () => api<{ email: string | null }>("GET", "/api/auth/me"),
  login: (email: string, password: string) => api<{ email: string }>("POST", "/api/auth/login", { email, password }),
  logout: () => api<void>("POST", "/api/auth/logout"),

  content: () => api<SiteContent>("GET", "/api/admin/content"),
  saveSection: (page: string, section: string, data: unknown) => api<SiteContent>("PUT", `/api/admin/content/${page}/${section}`, data),
  resetSection: (page: string, section: string) => api<SiteContent>("DELETE", `/api/admin/content/${page}/${section}`),

  projects: () => api<Project[]>("GET", "/api/admin/projects"),
  createProject: (p: ProjectInput) => api<Project>("POST", "/api/admin/projects", p),
  updateProject: (id: string, p: ProjectInput) => api<Project>("PUT", `/api/admin/projects/${id}`, p),
  deleteProject: (id: string) => api<void>("DELETE", `/api/admin/projects/${id}`),
  orderProjects: (ids: string[]) => api<Project[]>("PUT", "/api/admin/projects/order", { ids }),

  categories: () => api<Category[]>("GET", "/api/admin/categories"),
  createCategory: (slug: string, name: string) => api<Category>("POST", "/api/admin/categories", { slug, name }),
  updateCategory: (id: string, name: string) => api<Category>("PUT", `/api/admin/categories/${id}`, { name }),
  deleteCategory: (id: string) => api<void>("DELETE", `/api/admin/categories/${id}`),
  orderCategories: (ids: string[]) => api<Category[]>("PUT", "/api/admin/categories/order", { ids }),

  media: () => api<MediaItem[]>("GET", "/api/admin/media"),
  upload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api<MediaItem>("POST", "/api/admin/media", fd);
  },
  deleteMedia: (id: string) => api<void>("DELETE", `/api/admin/media/${id}`),
};

export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const formatSize = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} Mo` : `${Math.max(1, Math.round(n / 1024))} Ko`);
