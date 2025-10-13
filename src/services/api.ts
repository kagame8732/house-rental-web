/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import type { AxiosInstance, AxiosResponse } from "axios";
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  User,
  Property,
  Tenant,
  Maintenance,
  PaginationParams,
} from "../types";

class ApiService {
  private api: AxiosInstance;

  constructor() {
    const BASE_URL = import.meta.env.VITE_BASE_URL;
    this.api = axios.create({
      baseURL: BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");
        console.log("API Request:", {
          url: config.url,
          method: config.method,
          token: token ? "Present" : "Missing",
        });
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        console.error("Request interceptor error:", error);
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => {
        console.log("API Response:", {
          url: response.config.url,
          status: response.status,
          data: response.data,
        });
        return response;
      },
      (error) => {
        console.error("API Error:", {
          url: error.config?.url,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response: AxiosResponse<ApiResponse<LoginResponse>> =
      await this.api.post("/auth/login", credentials);
    return response.data;
  }

  async getProfile(): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.get(
      "/auth/profile"
    );
    return response.data;
  }

  // Properties endpoints
  async getProperties(
    params?: PaginationParams
  ): Promise<ApiResponse<Property[]>> {
    const response: AxiosResponse<ApiResponse<Property[]>> = await this.api.get(
      "/properties",
      { params }
    );
    return response.data;
  }

  async getProperty(id: string): Promise<ApiResponse<Property>> {
    const response: AxiosResponse<ApiResponse<Property>> = await this.api.get(
      `/properties/${id}`
    );
    return response.data;
  }

  async getAvailableProperties(): Promise<ApiResponse<Property[]>> {
    const response: AxiosResponse<ApiResponse<Property[]>> = await this.api.get(
      "/properties/available"
    );
    return response.data;
  }

  async checkPropertyAvailability(
    id: string
  ): Promise<
    ApiResponse<{ propertyId: string; isAvailable: boolean; currentTenant: any }>
  > {
    const response: AxiosResponse<
      ApiResponse<{
        propertyId: string;
        isAvailable: boolean;
        currentTenant: any;
      }>
    > = await this.api.get(`/properties/${id}/availability`);
    return response.data;
  }

  async createProperty(
    data: Omit<Property, "id" | "createdAt" | "updatedAt" | "ownerId">
  ): Promise<ApiResponse<Property>> {
    const response: AxiosResponse<ApiResponse<Property>> = await this.api.post(
      "/properties",
      data
    );
    return response.data;
  }

  async updateProperty(
    id: string,
    data: Partial<Property>
  ): Promise<ApiResponse<Property>> {
    const response: AxiosResponse<ApiResponse<Property>> = await this.api.put(
      `/properties/${id}`,
      data
    );
    return response.data;
  }

  async deleteProperty(id: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await this.api.delete(
      `/properties/${id}`
    );
    return response.data;
  }

  // Tenants endpoints
  async getTenants(params?: PaginationParams): Promise<ApiResponse<Tenant[]>> {
    const response: AxiosResponse<ApiResponse<Tenant[]>> = await this.api.get(
      "/tenants",
      { params }
    );
    return response.data;
  }

  async getTenant(id: string): Promise<ApiResponse<Tenant>> {
    const response: AxiosResponse<ApiResponse<Tenant>> = await this.api.get(
      `/tenants/${id}`
    );
    return response.data;
  }

  async createTenant(
    data: Omit<Tenant, "id" | "createdAt" | "updatedAt">
  ): Promise<ApiResponse<Tenant>> {
    const response: AxiosResponse<ApiResponse<Tenant>> = await this.api.post(
      "/tenants",
      data
    );
    return response.data;
  }

  async updateTenant(
    id: string,
    data: Partial<Tenant>
  ): Promise<ApiResponse<Tenant>> {
    const response: AxiosResponse<ApiResponse<Tenant>> = await this.api.put(
      `/tenants/${id}`,
      data
    );
    return response.data;
  }

  async deleteTenant(id: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await this.api.delete(
      `/tenants/${id}`
    );
    return response.data;
  }

  // Maintenance endpoints
  async getMaintenance(
    params?: PaginationParams
  ): Promise<ApiResponse<Maintenance[]>> {
    const response: AxiosResponse<ApiResponse<Maintenance[]>> =
      await this.api.get("/maintenance", { params });
    return response.data;
  }

  async getMaintenanceItem(id: string): Promise<ApiResponse<Maintenance>> {
    const response: AxiosResponse<ApiResponse<Maintenance>> =
      await this.api.get(`/maintenance/${id}`);
    return response.data;
  }

  async createMaintenance(
    data: Omit<Maintenance, "id" | "createdAt" | "updatedAt">
  ): Promise<ApiResponse<Maintenance>> {
    const response: AxiosResponse<ApiResponse<Maintenance>> =
      await this.api.post("/maintenance", data);
    return response.data;
  }

  async updateMaintenance(
    id: string,
    data: Partial<Maintenance>
  ): Promise<ApiResponse<Maintenance>> {
    const response: AxiosResponse<ApiResponse<Maintenance>> =
      await this.api.put(`/maintenance/${id}`, data);
    return response.data;
  }

  async deleteMaintenance(id: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await this.api.delete(
      `/maintenance/${id}`
    );
    return response.data;
  }
}

export const apiService = new ApiService();
