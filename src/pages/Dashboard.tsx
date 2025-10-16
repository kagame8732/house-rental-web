import React from "react";
import { formatCurrency } from "../utils/currency";
import { DashboardHeader } from "../components/DashboardHeader";
import { StatsGrid } from "../components/StatsGrid";
import { UrgentMaintenance } from "../components/UrgentMaintenance";
import { useDashboardData } from "../hooks/useDashboardData";
import type { Tenant } from "../types";

const Dashboard: React.FC = () => {
  const {
    stats,
    recentTenants,
    urgentMaintenance,
    loading,
    maintenancePage,
    maintenancePagination,
    handleRefresh,
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
        {/* Recent Tenants */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Tenants
            </h3>
          </div>
          <div className="card-content">
            {recentTenants.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No tenants found</p>
            ) : (
              <div className="space-y-3">
                {recentTenants.map((tenant: Tenant) => (
                  <div
                    key={tenant.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{tenant.name}</p>
                      <p className="text-sm text-gray-500">{tenant.phone}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          tenant.status === "active"
                            ? "bg-green-100 text-green-800"
                            : tenant.status === "inactive"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {tenant.status}
                      </span>
                      {tenant.payment && (
                        <p className="text-sm text-gray-600 mt-1">
                          {formatCurrency(tenant.payment)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <UrgentMaintenance
          maintenance={urgentMaintenance}
          currentPage={maintenancePage}
          totalPages={maintenancePagination?.totalPages || 1}
          totalItems={maintenancePagination?.total || 0}
          itemsPerPage={maintenancePagination?.limit || 10}
          onPageChange={handleMaintenancePageChange}
        />
      </div>
    </div>
  );
};

export default Dashboard;
