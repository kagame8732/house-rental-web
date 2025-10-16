import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { apiService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import type { Tenant, Property, PaginationParams } from "../types";
import { formatCurrency } from "../utils/currency";
import toast from "react-hot-toast";
import Pagination from "../components/Pagination";
import SearchAndFilter from "../components/SearchAndFilter";

const Tenants: React.FC = () => {
  const { user, token } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]); // All properties for display
  const [availableProperties, setAvailableProperties] = useState<Property[]>(
    []
  ); // Available properties for form
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    phone?: string;
    email?: string;
  }>({});

  // Pagination and filtering state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    propertyId: "",
    status: "active" as "active" | "inactive" | "evicted",
    payment: "",
    paymentDate: "",
    paymentMethod: "" as "cash" | "bank" | "mobile_money" | "",
  });

  const loadData = useCallback(
    async (page = pagination.page) => {
      try {
        setLoading(true);

        // Build pagination parameters
        const params: PaginationParams = {
          page,
          limit: pagination.limit,
          sortBy,
          sortOrder,
          search: searchTerm || undefined,
          status: statusFilter || undefined,
          propertyId: propertyFilter || undefined,
        };

        const [tenantsRes, allPropertiesRes, availablePropertiesRes] =
          await Promise.all([
            apiService.getTenants(params),
            apiService.getProperties(), // All properties for display
            apiService.getAvailableProperties(), // Available properties for form
          ]);

        setTenants(tenantsRes.data || []);
        setAllProperties(allPropertiesRes.data || []);
        setAvailableProperties(availablePropertiesRes.data || []);

        // Update pagination info
        if (tenantsRes.pagination) {
          setPagination((prev) => ({
            ...prev,
            page: tenantsRes.pagination!.page,
            total: tenantsRes.pagination!.total,
            totalPages: tenantsRes.pagination!.totalPages,
          }));
        }

        if (page === 1) {
          toast.success("Data loaded successfully");
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    },
    [
      pagination.page,
      pagination.limit,
      sortBy,
      sortOrder,
      searchTerm,
      statusFilter,
      propertyFilter,
    ]
  );

  useEffect(() => {
    if (user && token) {
      loadData();
    }
  }, [user, token, loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate phone number and email
    const phoneError = validatePhoneNumber(formData.phone);
    const emailError = validateEmail(formData.email);

    if (phoneError || emailError) {
      setValidationErrors({
        phone: phoneError,
        email: emailError,
      });
      return;
    }

    // Clear validation errors
    setValidationErrors({});

    try {
      setLoading(true);

      const submitData = {
        ...formData,
        payment: formData.payment ? parseFloat(formData.payment) : undefined,
        paymentDate: formData.paymentDate || undefined,
        paymentMethod: formData.paymentMethod || undefined,
      };

      if (editingTenant) {
        await apiService.updateTenant(editingTenant.id, submitData);
        toast.success("Tenant updated successfully");
      } else {
        await apiService.createTenant(submitData);
        toast.success("Tenant created successfully");
      }

      setFormData({
        name: "",
        phone: "",
        email: "",
        address: "",
        propertyId: "",
        status: "active",
        payment: "",
        paymentDate: "",
        paymentMethod: "",
      });
      setValidationErrors({});
      setShowForm(false);
      setEditingTenant(null);
      await loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save tenant");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (tenant: Tenant) => {
    try {
      setLoading(true);
      // When editing, we need to load all properties to include the tenant's current property
      const [tenantsRes, allPropertiesRes] = await Promise.all([
        apiService.getTenants(),
        apiService.getProperties(),
      ]);
      setTenants(tenantsRes.data || []);
      setAllProperties(allPropertiesRes.data || []); // Use all properties for editing

      setFormData({
        name: tenant.name,
        phone: tenant.phone,
        email: tenant.email || "",
        address: tenant.address || "",
        propertyId: tenant.propertyId,
        status: tenant.status,
        payment: tenant.payment?.toString() || "",
        paymentDate: tenant.paymentDate || "",
        paymentMethod: tenant.paymentMethod || "",
      });
      setEditingTenant(tenant);
      setShowForm(true);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load data for editing"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tenant?")) return;

    try {
      setLoading(true);
      await apiService.deleteTenant(id);
      toast.success("Tenant deleted successfully");
      await loadData();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete tenant"
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = async () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      propertyId: "",
      status: "active",
      payment: "",
      paymentDate: "",
      paymentMethod: "",
    });
    setValidationErrors({});
    setShowForm(false);
    setEditingTenant(null);
    // Reload available properties when resetting form
    await loadData();
  };

  const validatePhoneNumber = (phone: string): string | undefined => {
    // Remove any non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, "");

    if (!phone.trim()) {
      return "Phone number is required";
    }

    if (digitsOnly.length !== 10) {
      return "Phone number must be exactly 10 digits";
    }

    // Check for uniqueness
    const existingTenant = tenants.find(
      (tenant) =>
        tenant.phone === phone &&
        (!editingTenant || tenant.id !== editingTenant.id)
    );

    if (existingTenant) {
      return "Phone number already exists";
    }

    return undefined;
  };

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return undefined; // Email is optional
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }

    // Check for uniqueness
    const existingTenant = tenants.find(
      (tenant) =>
        tenant.email === email &&
        (!editingTenant || tenant.id !== editingTenant.id)
    );

    if (existingTenant) {
      return "Email address already exists";
    }

    return undefined;
  };

  // Pagination and filtering handlers
  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
    // Load data with the new page immediately
    loadDataWithPage(page);
  };

  const loadDataWithPage = useCallback(
    async (page: number) => {
      try {
        setLoading(true);

        // Build pagination parameters
        const params: PaginationParams = {
          page,
          limit: pagination.limit,
          sortBy,
          sortOrder,
          search: searchTerm || undefined,
          status: statusFilter || undefined,
          propertyId: propertyFilter || undefined,
        };

        const [tenantsRes, allPropertiesRes, availablePropertiesRes] =
          await Promise.all([
            apiService.getTenants(params),
            apiService.getProperties(), // All properties for display
            apiService.getAvailableProperties(), // Available properties for form
          ]);

        setTenants(tenantsRes.data || []);
        setAllProperties(allPropertiesRes.data || []);
        setAvailableProperties(availablePropertiesRes.data || []);

        // Update pagination info
        if (tenantsRes.pagination) {
          setPagination((prev) => ({
            ...prev,
            page: tenantsRes.pagination!.page,
            total: tenantsRes.pagination!.total,
            totalPages: tenantsRes.pagination!.totalPages,
          }));
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    },
    [
      pagination.limit,
      sortBy,
      sortOrder,
      searchTerm,
      statusFilter,
      propertyFilter,
    ]
  );

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePropertyChange = (value: string) => {
    setPropertyFilter(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSortByChange = (value: string) => {
    setSortBy(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSortOrderChange = (value: "ASC" | "DESC") => {
    setSortOrder(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setPropertyFilter("");
    setSortBy("createdAt");
    setSortOrder("DESC");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Effect to reload data when filters change
  useEffect(() => {
    if (user && token) {
      const timeoutId = setTimeout(() => {
        loadDataWithPage(1);
      }, 300); // Debounce search

      return () => clearTimeout(timeoutId);
    }
  }, [
    searchTerm,
    statusFilter,
    propertyFilter,
    sortBy,
    sortOrder,
    user,
    token,
    loadDataWithPage,
  ]);

  const getPropertyName = (propertyId: string) => {
    const property = allProperties.find((p) => p.id === propertyId);
    return property ? property.name : "Unknown Property";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Tenants</h1>
                <p className="text-gray-600 mt-1">
                  Manage your tenants and track payments
                </p>
              </div>
              <button
                onClick={async () => {
                  await resetForm();
                  setShowForm(true);
                }}
                className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Tenant
              </button>
            </div>
          </div>

          {/* Add/Edit Form */}
          {showForm && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingTenant ? "Edit Tenant" : "Add New Tenant"}
                </h3>
              </div>
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter tenant name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                        <span className="text-xs text-gray-500 ml-1">
                          (10 digits)
                        </span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({ ...formData, phone: value });

                          // Real-time validation
                          const error = validatePhoneNumber(value);
                          setValidationErrors((prev) => ({
                            ...prev,
                            phone: error,
                          }));
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                          validationErrors.phone
                            ? "border-red-300 focus:ring-red-500"
                            : "border-gray-300 focus:ring-blue-500"
                        }`}
                        placeholder="Enter 10-digit phone number"
                        maxLength={10}
                      />
                      {validationErrors.phone && (
                        <p className="mt-1 text-sm text-red-600">
                          {validationErrors.phone}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                        <span className="text-xs text-gray-500 ml-1">
                          (optional, must be unique)
                        </span>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({ ...formData, email: value });

                          // Real-time validation
                          const error = validateEmail(value);
                          setValidationErrors((prev) => ({
                            ...prev,
                            email: error,
                          }));
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                          validationErrors.email
                            ? "border-red-300 focus:ring-red-500"
                            : "border-gray-300 focus:ring-blue-500"
                        }`}
                        placeholder="Enter email address"
                      />
                      {validationErrors.email && (
                        <p className="mt-1 text-sm text-red-600">
                          {validationErrors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter tenant address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Property
                      </label>
                      <select
                        required
                        value={formData.propertyId}
                        onChange={(e) => {
                          const selectedPropertyId = e.target.value;
                          const selectedProperty = availableProperties.find(
                            (p) => p.id === selectedPropertyId
                          );

                          setFormData({
                            ...formData,
                            propertyId: selectedPropertyId,
                            payment:
                              selectedProperty?.monthlyRent?.toString() || "",
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a property</option>
                        {availableProperties.map((property) => (
                          <option key={property.id} value={property.id}>
                            {property.name} - {property.address}{" "}
                            {property.monthlyRent
                              ? `(RWF ${property.monthlyRent.toLocaleString(
                                  "en-US"
                                )})`
                              : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            status: e.target.value as
                              | "active"
                              | "inactive"
                              | "evicted",
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="evicted">Evicted</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Amount (RWF)
                        {formData.propertyId && (
                          <span className="text-xs text-gray-500 ml-1">
                            (Auto-filled from property)
                          </span>
                        )}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.payment}
                        onChange={(e) =>
                          setFormData({ ...formData, payment: e.target.value })
                        }
                        disabled={!!formData.propertyId}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          formData.propertyId
                            ? "bg-gray-100 cursor-not-allowed"
                            : ""
                        }`}
                        placeholder="Enter payment amount"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Date
                      </label>
                      <input
                        type="date"
                        value={formData.paymentDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            paymentDate: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method
                      </label>
                      <select
                        value={formData.paymentMethod}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            paymentMethod: e.target.value as
                              | "cash"
                              | "bank"
                              | "mobile_money"
                              | "",
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select payment method</option>
                        <option value="cash">Cash</option>
                        <option value="bank">Bank Transfer</option>
                        <option value="mobile_money">Mobile Money</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 pt-6 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
                    >
                      {loading
                        ? "Saving..."
                        : editingTenant
                        ? "Update Tenant"
                        : "Create Tenant"}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="inline-flex items-center px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 shadow-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Search and Filter */}
          <SearchAndFilter
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            statusFilter={statusFilter}
            onStatusChange={handleStatusChange}
            propertyFilter={propertyFilter}
            onPropertyChange={handlePropertyChange}
            sortBy={sortBy}
            onSortByChange={handleSortByChange}
            sortOrder={sortOrder}
            onSortOrderChange={handleSortOrderChange}
            properties={allProperties}
            onClearFilters={handleClearFilters}
          />

          {/* Tenants List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                All Tenants ({pagination.total})
              </h3>
            </div>
            <div className="p-6">
              {loading && !showForm ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : tenants.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No tenants found</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Add your first tenant
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Tenant
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Property
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Payment
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Payment Date
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Payment Method
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tenants.map((tenant) => (
                        <tr key={tenant.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {tenant.name}
                            </div>
                            {tenant.address && (
                              <div className="text-sm text-gray-500">
                                {tenant.address}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {tenant.phone}
                            </div>
                            {tenant.email && (
                              <div className="text-sm text-gray-500">
                                {tenant.email}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {getPropertyName(tenant.propertyId)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
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
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatCurrency(tenant.payment)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {tenant.paymentDate
                                ? new Date(
                                    tenant.paymentDate
                                  ).toLocaleDateString()
                                : "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {tenant.paymentMethod
                                ? tenant.paymentMethod
                                    .replace("_", " ")
                                    .replace(/\b\w/g, (l) => l.toUpperCase())
                                : "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(tenant.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleEdit(tenant)}
                                className="inline-flex items-center p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(tenant.id)}
                                className="inline-flex items-center p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tenants;
