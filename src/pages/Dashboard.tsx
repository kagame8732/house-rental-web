import React from "react";
import { useDashboardData } from "../hooks/useDashboardData";
import { DashboardHeader } from "../components/DashboardHeader";
import { StatsGrid } from "../components/StatsGrid";
import { RecentLeases } from "../components/RecentLeases";
import { UrgentMaintenance } from "../components/UrgentMaintenance";
import { ExpiringLeases } from "../components/ExpiringLeases";

const Dashboard: React.FC = () => {
  const {
    stats,
    recentLeases,
    urgentMaintenance,
    expiringLeases,
    loading,
    leasesPage,
    maintenancePage,
    leasesPagination,
    maintenancePagination,
    handleRefresh,
    handleLeasesPageChange,
    handleMaintenancePageChange,
  } = useDashboardData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader loading={loading} onRefresh={handleRefresh} />

      <StatsGrid stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentLeases
          leases={recentLeases}
          currentPage={leasesPage}
          totalPages={leasesPagination?.totalPages || 1}
          onPageChange={handleLeasesPageChange}
        />

        <UrgentMaintenance
          maintenance={urgentMaintenance}
          currentPage={maintenancePage}
          totalPages={maintenancePagination?.totalPages || 1}
          onPageChange={handleMaintenancePageChange}
        />
      </div>

      <ExpiringLeases leases={expiringLeases} />
    </div>
  );
};

export default Dashboard;
