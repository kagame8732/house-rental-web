import { useState, useEffect, useCallback } from "react";
import { apiService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import type { Lease, Maintenance } from "../types";
import toast from "react-hot-toast";

interface DashboardStats {
  totalProperties: number;
  totalTenants: number;
  activeLeases: number;
  pendingMaintenance: number;
  monthlyRevenue: number;
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
    activeLeases: 0,
    pendingMaintenance: 0,
    monthlyRevenue: 0,
  });

  // Data state
  const [recentLeases, setRecentLeases] = useState<Lease[]>([]);
  const [urgentMaintenance, setUrgentMaintenance] = useState<Maintenance[]>([]);
  const [expiringLeases, setExpiringLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [leasesPage, setLeasesPage] = useState(1);
  const [maintenancePage, setMaintenancePage] = useState(1);
  const [leasesPagination, setLeasesPagination] =
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
        leasesRes,
        maintenanceRes,
        activeLeasesRes,
        pendingMaintenanceRes,
        expiringLeasesRes,
        monthlyRevenueRes,
      ] = await Promise.all([
        apiService.getProperties({ limit: 10 }),
        apiService.getTenants({ limit: 10 }),
        apiService.getLeases({
          page: leasesPage,
          limit: 2,
          sortBy: "createdAt",
          sortOrder: "DESC",
        }),
        apiService.getMaintenance({
          page: maintenancePage,
          limit: 10,
          sortBy: "priority",
          sortOrder: "DESC",
        }),
        apiService.getLeases({ status: "active" }),
        apiService.getMaintenance({ status: "pending" }),
        apiService.getLeasesExpiringSoon(30),
        apiService.getMonthlyRevenue(),
      ]);

      const properties = propertiesRes.data || [];
      const tenants = tenantsRes.data || [];
      const leases = leasesRes.data || [];
      const maintenance = maintenanceRes.data || [];

      // Calculate stats
      setStats({
        totalProperties: propertiesRes.pagination?.total || properties.length,
        totalTenants: tenantsRes.pagination?.total || tenants.length,
        activeLeases:
          activeLeasesRes.pagination?.total ||
          activeLeasesRes.data?.length ||
          0,
        pendingMaintenance:
          pendingMaintenanceRes.pagination?.total ||
          pendingMaintenanceRes.data?.length ||
          0,
        monthlyRevenue: monthlyRevenueRes.data?.totalRevenue || 0,
      });

      // Set data
      setRecentLeases(leases);
      setUrgentMaintenance(
        maintenance
          .filter((m) => m.priority === "urgent" || m.priority === "high")
          .slice(0, 5)
      );
      setExpiringLeases(expiringLeasesRes.data || []);

      // Set pagination info
      setLeasesPagination(leasesRes.pagination || null);
      setMaintenancePagination(maintenanceRes.pagination || null);

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
  }, [leasesPage, maintenancePage, user, token]);

  const handleRefresh = useCallback(() => {
    toast.loading("Refreshing dashboard...", { id: "refresh" });
    loadDashboardData().finally(() => {
      toast.dismiss("refresh");
    });
  }, [loadDashboardData]);

  const handleLeasesPageChange = useCallback((newPage: number) => {
    setLeasesPage(newPage);
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
    recentLeases,
    urgentMaintenance,
    expiringLeases,
    loading,

    // Pagination
    leasesPage,
    maintenancePage,
    leasesPagination,
    maintenancePagination,

    // Actions
    handleRefresh,
    handleLeasesPageChange,
    handleMaintenancePageChange,
  };
};
