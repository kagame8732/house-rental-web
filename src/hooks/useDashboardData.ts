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
  totalRentCollected: number;
  outstandingRent: number;
  occupancyRate: number;
  annualRevenue: number;
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
    totalRentCollected: 0,
    outstandingRent: 0,
    occupancyRate: 0,
    annualRevenue: 0,
  });

  // Data state
  const [recentTenants, setRecentTenants] = useState<Tenant[]>([]);
  const [urgentMaintenance, setUrgentMaintenance] = useState<Maintenance[]>([]);
  const [allMaintenance, setAllMaintenance] = useState<Maintenance[]>([]);
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
        allTenantsRes,
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
        apiService.getTenants(), // Get all tenants for analytics
      ]);

      const properties = propertiesRes.data || [];
      const tenants = tenantsRes.data || [];
      const maintenance = maintenanceRes.data || [];
      const activeTenants = activeTenantsRes.data || [];
      const allTenants = allTenantsRes.data || [];

      // Calculate analytics metrics
      const totalRentCollected = allTenants.reduce((sum, tenant) => {
        return sum + (tenant.totalAmount || 0);
      }, 0);

      // Outstanding rent calculation
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      let outstandingRent = 0;
      allTenants.forEach((tenant) => {
        if (tenant.status === "active") {
          const property = properties.find((p) => p.id === tenant.propertyId);
          if (property) {
            const startDate = tenant.stayStartDate
              ? new Date(tenant.stayStartDate)
              : null;
            if (startDate) {
              const monthsSinceStart =
                (currentYear - startDate.getFullYear()) * 12 +
                (currentMonth - startDate.getMonth());
              const expectedTotal =
                monthsSinceStart * (property.monthlyRent || 0);
              const actualPaid = tenant.totalAmount || 0;
              outstandingRent += Math.max(0, expectedTotal - actualPaid);
            }
          }
        }
      });

      // Occupancy rate
      const totalUnits = propertiesRes.pagination?.total || properties.length;
      const occupiedUnits =
        activeTenantsRes.pagination?.total || activeTenants.length;
      const occupancyRate =
        totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

      // Annual revenue (projected) - based on total rent collected
      const annualRevenue = totalRentCollected > 0 ? (totalRentCollected / Math.max(1, allTenants.length)) * 12 : 0;

      // Calculate stats
      setStats({
        totalProperties: propertiesRes.pagination?.total || properties.length,
        totalTenants: tenantsRes.pagination?.total || tenants.length,
        activeTenants:
          activeTenantsRes.pagination?.total || activeTenants.length,
        pendingMaintenance:
          pendingMaintenanceRes.pagination?.total ||
          pendingMaintenanceRes.data?.length ||
          0,
        totalRentCollected,
        outstandingRent,
        occupancyRate,
        annualRevenue,
      });

      // Set data
      setRecentTenants(tenants);
      setProperties(properties);
      setAllMaintenance(maintenance);

      // Filter urgent maintenance and set pagination for urgent items only
      const urgentItems = maintenance.filter(
        (m) => m.priority === "urgent" || m.priority === "high"
      );
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
    allMaintenance,
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
