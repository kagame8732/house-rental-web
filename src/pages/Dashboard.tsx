import React from "react";
import { AlertTriangle } from "lucide-react";
import { formatCurrency } from "../utils/currency";
import { DashboardHeader } from "../components/DashboardHeader";
import { StatsGrid } from "../components/StatsGrid";
import { UrgentMaintenance } from "../components/UrgentMaintenance";
import { ExportData } from "../components/ExportData";
import { useDashboardData } from "../hooks/useDashboardData";
import type { Tenant } from "../types";

const Dashboard: React.FC = () => {
  const {
    stats,
    recentTenants,
    allTenants,
    activeLeases,
    urgentMaintenance,
    allMaintenance,
    properties,
    loading,
    maintenancePage,
    maintenancePagination,
    handleRefresh,
    handleMaintenancePageChange,
  } = useDashboardData();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parseDateOnly = (value: string) => {
    const [year, month, day] = value.split("T")[0].split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const addMonths = (value: string, months: number) => {
    const date = parseDateOnly(value);
    date.setMonth(date.getMonth() + months);
    return date;
  };

  const tenantLeaseAlerts = allTenants
    .filter((tenant) => tenant.status === "active")
    .map((tenant) => {
      const derivedEndDate =
        !tenant.stayEndDate && tenant.stayStartDate && tenant.monthsPaid
          ? addMonths(tenant.stayStartDate, tenant.monthsPaid)
          : null;
      const endDate = tenant.stayEndDate
        ? parseDateOnly(tenant.stayEndDate)
        : derivedEndDate;

      if (!endDate) {
        return null;
      }

      const daysUntilEnd = Math.ceil(
        (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        key: `tenant-${tenant.id}`,
        tenant,
        tenantName: tenant.name,
        endDate,
        daysUntilEnd,
      };
    })
    .filter((alert): alert is NonNullable<typeof alert> => Boolean(alert));

  const activeLeaseAlerts = activeLeases
    .filter((lease) => lease.status === "active" && lease.endDate)
    .map((lease) => {
      const endDate = parseDateOnly(lease.endDate);
      const daysUntilEnd = Math.ceil(
        (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        key: `lease-${lease.id}`,
        tenant: lease.tenant,
        tenantName: lease.tenant?.name || "Tenant",
        endDate,
        daysUntilEnd,
      };
    });

  const leaseAlerts = [...activeLeaseAlerts, ...tenantLeaseAlerts]
    .filter((alert) => alert.daysUntilEnd >= 0 && alert.daysUntilEnd <= 30)
    .sort((a, b) => a.daysUntilEnd - b.daysUntilEnd);

  const getLeaseMessage = (daysUntilEnd: number) => {
    if (daysUntilEnd === 0) {
      return "lease ends today";
    }

    if (daysUntilEnd === 1) {
      return "lease ends in 1 day";
    }

    return `lease ends in ${daysUntilEnd} days`;
  };

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

      {/* Lease Alerts */}
      {leaseAlerts.length > 0 && (
        <div className="card">
          <div className="card-header pb-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Lease Alerts
            </h3>
          </div>
          <div className="card-content">
            <div className="space-y-3">
              {leaseAlerts.map(({ key, tenant, tenantName, endDate, daysUntilEnd }) => (
                <div
                  key={key}
                  className="flex flex-col gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="font-semibold text-yellow-800">
                    {tenant?.name || tenantName} — {getLeaseMessage(daysUntilEnd)} (
                    {endDate.toISOString().split("T")[0]})
                  </p>
                  <span className="inline-flex w-fit rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-yellow-800">
                    Expiring Soon
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Export Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Export Data</h2>
            <p className="text-sm text-gray-600">
              Download complete business data
            </p>
          </div>
          <ExportData
            tenants={recentTenants}
            properties={properties}
            maintenance={allMaintenance}
            dataType="all"
            title="Complete Business Report"
          />
        </div>
      </div>

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
