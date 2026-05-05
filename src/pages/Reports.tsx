import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, Printer } from "lucide-react";
import toast from "react-hot-toast";
import { apiService } from "../services/api";
import type { ReportOverview } from "../types";

const monthLabels = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

const statusStyles = {
  paid:
    "border-green-200 bg-green-50 text-green-700",
  pending:
    "border-yellow-200 bg-yellow-50 text-yellow-700",
  late_unpaid:
    "border-red-200 bg-red-50 text-red-600",
  not_yet_due:
    "border-gray-200 bg-gray-50 text-gray-400",
};

const legendItems = [
  { label: "Paid", className: "border-green-200 bg-green-50" },
  { label: "Pending", className: "border-yellow-200 bg-yellow-50" },
  { label: "Late / Unpaid", className: "border-red-200 bg-red-50" },
  { label: "Not yet due", className: "border-gray-200 bg-gray-50" },
];

const formatRwf = (value: number | string | null | undefined): string => {
  const amount = Number(value || 0);
  return `Rwf ${Math.floor(amount).toLocaleString("en-US")}`;
};

const Reports: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [report, setReport] = useState<ReportOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const yearOptions = useMemo(
    () => Array.from({ length: 7 }, (_, index) => currentYear - 3 + index),
    [currentYear]
  );

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const response = await apiService.getReportOverview(selectedYear);
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
  }, [selectedYear]);

  const annualPayment = report?.annualPayment;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Annual Payment Report
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Monthly rent collection summary -{" "}
              {annualPayment?.activeTenants || 0} active tenants
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="relative">
              <span className="sr-only">Report year</span>
              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(Number(event.target.value))}
                className="input h-10 appearance-none py-0 pl-3 pr-10"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            </label>

            <button
              type="button"
              onClick={() => window.print()}
              className="btn btn-outline h-10 gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap gap-x-6 gap-y-3">
          {legendItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 text-sm font-medium text-gray-600"
            >
              <span
                className={`h-4 w-4 rounded border ${item.className}`}
                aria-hidden="true"
              />
              {item.label}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
          </div>
        ) : !annualPayment ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
            <p className="text-gray-600">No report data available.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1280px] border-collapse overflow-hidden text-left">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="w-64 px-6 py-4">Tenant</th>
                    {monthLabels.map((month) => (
                      <th key={month} className="px-2 py-4 text-center">
                        {month}
                      </th>
                    ))}
                    <th className="px-6 py-4 text-right text-gray-700">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {annualPayment.tenants.map((tenant) => (
                    <tr
                      key={tenant.id}
                      className="border-b border-gray-200 bg-white"
                    >
                      <th className="border-r border-gray-200 px-6 py-5">
                        <p className="text-base font-semibold text-gray-900">
                          {tenant.name}
                        </p>
                        <p className="mt-1 text-sm font-normal text-gray-500">
                          {formatRwf(tenant.monthlyRent)}/mo
                        </p>
                      </th>
                      {tenant.months.map((month) => (
                        <td key={month.month} className="px-2 py-4">
                          <div
                            className={`flex h-10 min-w-24 items-center justify-center rounded-md border text-sm font-semibold ${statusStyles[month.status]}`}
                          >
                            {month.status === "not_yet_due"
                              ? "-"
                              : month.amount > 0
                              ? formatRwf(month.amount)
                              : "0"}
                          </div>
                        </td>
                      ))}
                      <td className="px-6 py-5 text-right text-base font-semibold text-gray-900">
                        {formatRwf(tenant.totalPaid)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="border-r border-gray-200 px-6 py-5">
                      Monthly Total
                    </th>
                    {annualPayment.monthlyTotals.map((amount, index) => (
                      <td key={monthLabels[index]} className="px-2 py-5 text-center">
                        <span
                          className={
                            amount > 0 ? "text-gray-900" : "text-gray-400"
                          }
                        >
                          {amount > 0 ? formatRwf(amount) : "-"}
                        </span>
                      </td>
                    ))}
                    <td className="px-6 py-5 text-right text-base font-semibold text-gray-900">
                      {formatRwf(annualPayment.collectedYtd)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </>
        )}
      </div>

      {annualPayment && !loading && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Collected YTD</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {formatRwf(annualPayment.collectedYtd)}
            </p>
            <p className="mt-1 text-sm text-gray-500">{annualPayment.year}</p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Paid On Time</p>
            <p className="mt-2 text-2xl font-semibold text-green-600">
              {annualPayment.paidOnTime}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              of {annualPayment.dueMonths} due months
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Late Payments</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {annualPayment.latePayments}
            </p>
            <p className="mt-1 text-sm text-gray-500">recorded late</p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Unpaid Months</p>
            <p className="mt-2 text-2xl font-semibold text-yellow-600">
              {annualPayment.unpaidMonths}
            </p>
            <p className="mt-1 text-sm text-gray-500">no record</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
