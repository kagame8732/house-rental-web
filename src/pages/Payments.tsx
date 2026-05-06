import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  Plus,
  X,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { apiService } from "../services/api";
import type { Property, Tenant } from "../types";
import { formatCurrency } from "../utils/currency";

type PaymentStatus = "paid" | "pending" | "late";
type StatusFilter = "all" | PaymentStatus;

interface PaymentFormState {
  tenantId: string;
  month: string;
  dateReceived: string;
  rentAmount: string;
  lateFee: string;
  lateFeeReason: string;
  status: PaymentStatus;
  paymentMethod: "cash" | "bank" | "mobile_money";
  note: string;
}

interface PaymentRecord {
  tenant: Tenant;
  property?: Property;
  monthKey: string;
  monthLabel: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod?: string;
  paymentDate?: string;
}

const paymentMethods = {
  cash: "Cash",
  bank: "Bank transfer",
  mobile_money: "Mobile money",
};

const toDateInputValue = (date: Date): string => date.toISOString().split("T")[0];

const toMonthInputValue = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const getMonthLabel = (monthValue: string): string => {
  if (!monthValue) {
    return "";
  }

  const [year, month] = monthValue.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
};

const Payments: React.FC = () => {
  const currentMonth = toMonthInputValue(new Date());
  const today = toDateInputValue(new Date());
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [monthFilter, setMonthFilter] = useState(currentMonth);
  const [formData, setFormData] = useState<PaymentFormState>({
    tenantId: "",
    month: currentMonth,
    dateReceived: today,
    rentAmount: "",
    lateFee: "0",
    lateFeeReason: "",
    status: "paid",
    paymentMethod: "bank",
    note: "",
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [tenantsRes, propertiesRes] = await Promise.all([
        apiService.getTenants({ limit: 100, sortBy: "createdAt", sortOrder: "DESC" }),
        apiService.getProperties({ limit: 100 }),
      ]);

      setTenants(tenantsRes.data || []);
      setProperties(propertiesRes.data || []);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load payments"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getTenantProperty = useCallback(
    (tenant: Tenant): Property | undefined =>
      tenant.property || properties.find((property) => property.id === tenant.propertyId),
    [properties]
  );

  const paymentRecords = useMemo<PaymentRecord[]>(() => {
    return tenants
      .filter((tenant) => tenant.status === "active")
      .map((tenant) => {
        const paymentDate = tenant.paymentDate
          ? new Date(tenant.paymentDate)
          : null;
        const monthKey = paymentDate ? toMonthInputValue(paymentDate) : monthFilter;
        const property = getTenantProperty(tenant);
        const paymentStatus =
          tenant.paymentStatus || (paymentDate ? "paid" : "pending");

        return {
          tenant,
          property,
          monthKey,
          monthLabel: paymentDate
            ? paymentDate.toISOString().slice(0, 7)
            : monthFilter,
          amount: Number(tenant.payment || tenant.totalAmount || 0),
          status: paymentStatus,
          paymentMethod: tenant.paymentMethod,
          paymentDate: tenant.paymentDate,
        };
      })
      .filter((record) => record.monthKey === monthFilter)
      .filter((record) => statusFilter === "all" || record.status === statusFilter);
  }, [getTenantProperty, monthFilter, statusFilter, tenants]);

  const unpaidTenants = useMemo(
    () =>
      tenants.filter((tenant) => {
        if (tenant.status !== "active") {
          return false;
        }

        if ((tenant.paymentStatus || "pending") !== "paid") {
          return true;
        }

        if (!tenant.paymentDate) {
          return true;
        }

        return toMonthInputValue(new Date(tenant.paymentDate)) !== monthFilter;
      }),
    [monthFilter, tenants]
  );

  const total = paymentRecords.reduce(
    (sum, record) => sum + (record.status === "paid" ? record.amount : 0),
    0
  );

  const getPaymentStatusClass = (status: PaymentStatus) => {
    if (status === "paid") {
      return "bg-green-100 text-green-700";
    }

    if (status === "late") {
      return "bg-red-100 text-red-700";
    }

    return "bg-yellow-100 text-yellow-700";
  };

  const showPaymentHistoryNotice = () => {
    toast.error("Deleting individual payments needs payment history support");
  };

  const openModal = (tenant?: Tenant) => {
    const selectedTenant = tenant || null;
    const property = selectedTenant ? getTenantProperty(selectedTenant) : undefined;
    const monthlyRent = Number(property?.monthlyRent || 0);

    setFormData({
      tenantId: selectedTenant?.id || "",
      month: monthFilter,
      dateReceived: today,
      rentAmount: monthlyRent ? String(monthlyRent) : "",
      lateFee: "0",
      lateFeeReason: "",
      status: selectedTenant?.paymentStatus || "paid",
      paymentMethod: selectedTenant?.paymentMethod || "bank",
      note: "",
    });
    setShowModal(true);
  };

  const handleTenantChange = (tenantId: string) => {
    const tenant = tenants.find((item) => item.id === tenantId);
    const property = tenant ? getTenantProperty(tenant) : undefined;
    const monthlyRent = Number(property?.monthlyRent || 0);

    setFormData({
      ...formData,
      tenantId,
      rentAmount: monthlyRent ? String(monthlyRent) : "",
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.tenantId) {
      toast.error("Select a tenant");
      return;
    }

    const rentAmount = Number(formData.rentAmount || 0);
    const lateFee = Number(formData.lateFee || 0);
    const amount = rentAmount + lateFee;
    const [year, month] = formData.month.split("-").map(Number);
    const monthStart = toDateInputValue(new Date(year, month - 1, 1));

    try {
      setLoading(true);
      if (formData.status !== "paid") {
        await apiService.updateTenant(formData.tenantId, {
          paymentStatus: formData.status,
        });
        toast.success("Payment status updated successfully");
        setShowModal(false);
        await loadData();
        return;
      }

      await apiService.recordTenantPayment(formData.tenantId, {
        amount,
        monthsPaid: 1,
        paymentDate: formData.dateReceived,
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.status,
        stayStartDate: monthStart,
      });
      toast.success("Payment recorded successfully");
      setShowModal(false);
      await loadData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">Track rent collections and due tenants</p>
        </div>
        <button
          type="button"
          onClick={() => openModal()}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Record Payment</span>
        </button>
      </div>

      {unpaidTenants.length > 0 && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6">
          <div className="flex items-center gap-2 text-base font-semibold text-yellow-800">
            <AlertTriangle className="h-5 w-5" />
            No payment recorded this month for:
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {unpaidTenants.map((tenant) => (
              <button
                key={tenant.id}
                type="button"
                onClick={() => openModal(tenant)}
                className="rounded-lg border border-yellow-300 bg-white px-4 py-2 text-sm font-semibold text-yellow-800 transition hover:bg-yellow-100"
              >
                {tenant.name} →
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-3">
            {(["all", "paid", "pending", "late"] as StatusFilter[]).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`h-10 rounded-lg border px-4 text-sm font-medium capitalize transition ${
                  statusFilter === status
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {status}
              </button>
            ))}

            <label className="relative">
              <input
                type="month"
                value={monthFilter}
                onChange={(event) => setMonthFilter(event.target.value)}
                className="h-10 rounded-lg border border-gray-300 bg-white px-3 pr-10 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
              <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </label>
          </div>

          <p className="text-sm font-medium text-gray-600">
            {paymentRecords.length} records · Total: {formatCurrency(total)}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">
            Payments for {getMonthLabel(monthFilter)}
          </h3>
        </div>
        <div className="card-content">
          {loading && paymentRecords.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>
          ) : paymentRecords.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              No payments found for {getMonthLabel(monthFilter)}.
            </div>
          ) : (
            <div className="space-y-3">
              {paymentRecords.map((record) => (
                <div
                  key={`${record.tenant.id}-${record.paymentDate}`}
                  className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      {record.tenant.name}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {record.monthLabel} · {record.paymentDate || "No payment date"} ·{" "}
                      {record.paymentMethod
                        ? paymentMethods[record.paymentMethod as keyof typeof paymentMethods]
                        : "Payment method"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-base font-semibold text-gray-900">
                      {formatCurrency(record.amount)}
                    </p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${getPaymentStatusClass(record.status)}`}
                    >
                      {record.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => openModal(record.tenant)}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={showPaymentHistoryNotice}
                      className="rounded-md border border-red-200 bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                      title="Delete payment requires payment history"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Record Payment</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Tenant
                </label>
                <div className="relative">
                  <select
                    required
                    value={formData.tenantId}
                    onChange={(event) => handleTenantChange(event.target.value)}
                    className="w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Select tenant —</option>
                    {tenants
                      .filter((tenant) => tenant.status === "active")
                      .map((tenant) => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.name}
                        </option>
                      ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Month
                  </label>
                  <input
                    type="month"
                    required
                    value={formData.month}
                    onChange={(event) =>
                      setFormData({ ...formData, month: event.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Date Received
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dateReceived}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        dateReceived: event.target.value,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Rent Amount (RWF)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.rentAmount}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        rentAmount: event.target.value,
                      })
                    }
                    placeholder="1200"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Late Fee (RWF)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.lateFee}
                    onChange={(event) =>
                      setFormData({ ...formData, lateFee: event.target.value })
                    }
                    placeholder="0"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Late Fee Reason
                </label>
                <input
                  type="text"
                  value={formData.lateFeeReason}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      lateFeeReason: event.target.value,
                    })
                  }
                  placeholder="e.g. Paid 5 days late"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        status: event.target.value as PaymentStatus,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="late">Late</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Payment Method
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        paymentMethod: event.target.value as
                          | "cash"
                          | "bank"
                          | "mobile_money",
                      })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank transfer</option>
                    <option value="mobile_money">Mobile money</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  value={formData.note}
                  onChange={(event) =>
                    setFormData({ ...formData, note: event.target.value })
                  }
                  placeholder="Any additional notes..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? "Saving..." : "Record Payment"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
