export interface User {
  id: string;
  name: string;
  phone: string;
  role: "admin" | "owner";
  createdAt: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  type: "house" | "apartment";
  status: "active" | "inactive";
  monthlyRent?: number;
  ownerId: string;
  isAvailable?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  status: "active" | "inactive" | "evicted";
  payment?: number;
  propertyId: string;
  property?: Property;
  createdAt: string;
  updatedAt: string;
}

export interface Maintenance {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  propertyId: string;
  cost?: number;
  scheduledDate?: string;
  completedDate?: string;
  notes?: string;
  property?: Property;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  search?: string;
  status?: string;
  type?: string;
  priority?: string;
  propertyId?: string;
}

