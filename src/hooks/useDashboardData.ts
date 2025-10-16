import { useState, useEffect, useCallback } from "react";
import { apiService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import type { Tenant, Maintenance, Property } from "../types";
import toast from "react-hot-toast";

interface DashboardStats {
  totalProperties: number;
  totalTenants: number;
  activeTenants: number;
  pendingMaintenance: number;
  totalMonthlyRevenue: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const useDashboardData = () => {
  const { user, token } = useAuth();

  // Stats state
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    totalTenants: 0,
    activeTenants: 0,
    pendingMaintenance: 0,
    totalMonthlyRevenue: 0,
  });

  // Data state
  const [recentTenants, setRecentTenants] = useState<Tenant[]>([]);
  const [urgentMaintenance, setUrgentMaintenance] = useState<Maintenance[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [tenantsPage, setTenantsPage] = useState(1);
  const [maintenancePage, setMaintenancePage] = useState(1);
  const [tenantsPagination, setTenantsPagination] =
    useState<PaginationInfo | null>(null);
  const [maintenancePagination, setMaintenancePagination] =
    useState<PaginationInfo | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (!user || !token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log("Loading dashboard data...");

      const [
        propertiesRes,
        tenantsRes,
        maintenanceRes,
        activeTenantsRes,
        pendingMaintenanceRes,
      ] = await Promise.all([
        apiService.getProperties({ limit: 10 }),
        apiService.getTenants({
          page: tenantsPage,
          limit: 5,
          sortBy: "createdAt",
          sortOrder: "DESC",
        }),
        apiService.getMaintenance({
          page: maintenancePage,
          limit: 10,
          sortBy: "priority",
          sortOrder: "DESC",
        }),
        apiService.getTenants({ status: "active" }),
        apiService.getMaintenance({ status: "pending" }),
      ]);

      const properties = propertiesRes.data || [];
      const tenants = tenantsRes.data || [];
      const maintenance = maintenanceRes.data || [];
      const activeTenants = activeTenantsRes.data || [];

      // Calculate total monthly revenue from properties with monthly rent
      const totalMonthlyRevenue = properties.reduce((sum, property) => {
        return sum + (property.monthlyRent || 0);
      }, 0);

      // Calculate stats
      setStats({
        totalProperties: propertiesRes.pagination?.total || properties.length,
        totalTenants: tenantsRes.pagination?.total || tenants.length,
        activeTenants: activeTenantsRes.pagination?.total || activeTenants.length,
        pendingMaintenance:
          pendingMaintenanceRes.pagination?.total ||
          pendingMaintenanceRes.data?.length ||
          0,
        totalMonthlyRevenue,
      });

      // Set data
      setRecentTenants(tenants);
      setProperties(properties);
      
      // Filter urgent maintenance and set pagination for urgent items only
      const urgentItems = maintenance.filter((m) => m.priority === "urgent" || m.priority === "high");
      setUrgentMaintenance(urgentItems.slice(0, 5));

      // Set pagination info
      setTenantsPagination(tenantsRes.pagination || null);
      
      // Create pagination info for urgent maintenance only
      setMaintenancePagination({
        page: 1,
        limit: 5,
        total: urgentItems.length,
        totalPages: Math.ceil(urgentItems.length / 5),
      });

      console.log("Dashboard data loaded successfully");
      toast.success("Dashboard data loaded successfully");
    } catch (error: unknown) {
      console.error("Error loading dashboard data:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to load data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [tenantsPage, maintenancePage, user, token]);

  const handleRefresh = useCallback(() => {
    toast.loading("Refreshing dashboard...", { id: "refresh" });
    loadDashboardData().finally(() => {
      toast.dismiss("refresh");
    });
  }, [loadDashboardData]);

  const handleTenantsPageChange = useCallback((newPage: number) => {
    setTenantsPage(newPage);
  }, []);

  const handleMaintenancePageChange = useCallback((newPage: number) => {
    setMaintenancePage(newPage);
  }, []);

  // Load data when component mounts and when dependencies change
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return {
    // Data
    stats,
    recentTenants,
    urgentMaintenance,
    properties,
    loading,

    // Pagination
    tenantsPage,
    maintenancePage,
    tenantsPagination,
    maintenancePagination,

    // Actions
    handleRefresh,
    handleTenantsPageChange,
    handleMaintenancePageChange,
  };
};
