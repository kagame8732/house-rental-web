import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiService } from "../services/api";
import type { ReportOverview } from "../types";
import { formatCurrency } from "../utils/currency";

const Reports: React.FC = () => {
  const [report, setReport] = useState<ReportOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const response = await apiService.getReportOverview();
        setReport(response.data || null);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Failed to load report";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <p className="text-gray-600">No report data available.</p>
      </div>
    );
  }

  const statCards = [
    { label: "Total Properties", value: report.totals.properties },
    { label: "Active Properties", value: report.totals.activeProperties },
    { label: "Total Tenants", value: report.totals.tenants },
    { label: "Active Tenants", value: report.totals.activeTenants },
    { label: "Maintenance Items", value: report.totals.maintenance },
    { label: "Pending Maintenance", value: report.totals.pendingMaintenance },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-900">Reports Overview</h2>
        <p className="mt-1 text-sm text-gray-600">
          Consolidated business metrics from properties, tenants, and maintenance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white border border-gray-200 rounded-xl p-5"
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Financial
          </h3>
          <div className="mt-4 space-y-3 text-sm">
            <p className="flex justify-between">
              <span className="text-gray-500">Expected Monthly Rent</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(report.financial.expectedMonthlyRent)}
              </span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-500">Collected Amount</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(report.financial.collectedAmount)}
              </span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-500">Outstanding Amount</span>
              <span className="font-medium text-red-600">
                {formatCurrency(report.financial.outstandingAmount)}
              </span>
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Tenant Status
          </h3>
          <div className="mt-4 space-y-2">
            {Object.entries(report.breakdowns.tenantStatus).map(([key, value]) => (
              <p key={key} className="flex justify-between text-sm">
                <span className="text-gray-500 capitalize">
                  {key.replace("_", " ")}
                </span>
                <span className="font-medium text-gray-900">{value}</span>
              </p>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Maintenance
          </h3>
          <div className="mt-4 space-y-2">
            {Object.entries(report.breakdowns.maintenanceStatus).map(
              ([key, value]) => (
                <p key={key} className="flex justify-between text-sm">
                  <span className="text-gray-500 capitalize">
                    {key.replace("_", " ")}
                  </span>
                  <span className="font-medium text-gray-900">{value}</span>
                </p>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
