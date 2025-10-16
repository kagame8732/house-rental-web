import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { apiService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import type { Property, PaginationParams } from "../types";
import { formatCurrency } from "../utils/currency";
import toast from "react-hot-toast";
import Pagination from "../components/Pagination";
import PropertiesSearchAndFilter from "../components/PropertiesSearchAndFilter";
import { ExportData } from "../components/ExportData";

const Properties: React.FC = () => {
  const { user, token } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  // Pagination and filtering state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    type: "house" as "house" | "apartment",
    status: "active" as "active" | "inactive",
    monthlyRent: "",
  });

  const loadProperties = useCallback(
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
          type: typeFilter || undefined,
        };

        const response = await apiService.getProperties(params);
        const propertiesData = response.data || [];

        // Check availability for each property
        const propertiesWithAvailability = await Promise.all(
          propertiesData.map(async (property) => {
            try {
              const availabilityResponse =
                await apiService.checkPropertyAvailability(property.id);
              return {
                ...property,
                isAvailable: availabilityResponse.data?.isAvailable ?? false,
              };
            } catch (error) {
              console.error(
                `Failed to check availability for property ${property.id}:`,
                error
              );
              return {
                ...property,
                isAvailable: true, // Default to available if check fails
              };
            }
          })
        );

        setProperties(propertiesWithAvailability);

        // Update pagination info
        if (response.pagination) {
          setPagination((prev) => ({
            ...prev,
            page: response.pagination!.page,
            total: response.pagination!.total,
            totalPages: response.pagination!.totalPages,
          }));
        }

        if (page === 1) {
          toast.success("Properties loaded successfully");
        }
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "Failed to load properties"
        );
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
      typeFilter,
    ]
  );

  // Filter change handlers
  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
    // Load data with the new page immediately
    loadPropertiesWithPage(page);
  };

  const loadPropertiesWithPage = useCallback(
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
          type: typeFilter || undefined,
        };

        const response = await apiService.getProperties(params);
        const propertiesData = response.data || [];

        // Check availability for each property
        const propertiesWithAvailability = await Promise.all(
          propertiesData.map(async (property) => {
            try {
              const availabilityResponse =
                await apiService.checkPropertyAvailability(property.id);
              return {
                ...property,
                isAvailable: availabilityResponse.data?.isAvailable ?? false,
              };
            } catch (error) {
              console.error(
                `Failed to check availability for property ${property.id}:`,
                error
              );
              return {
                ...property,
                isAvailable: true, // Default to available if check fails
              };
            }
          })
        );

        setProperties(propertiesWithAvailability);

        // Update pagination info
        if (response.pagination) {
          setPagination((prev) => ({
            ...prev,
            page: response.pagination!.page,
            total: response.pagination!.total,
            totalPages: response.pagination!.totalPages,
          }));
        }
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "Failed to load properties"
        );
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit, sortBy, sortOrder, searchTerm, statusFilter, typeFilter]
  );

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
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
    setTypeFilter("");
    setSortBy("createdAt");
    setSortOrder("DESC");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  useEffect(() => {
    if (user && token) {
      loadProperties();
    }
  }, [user, token, loadProperties]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (user && token) {
        loadPropertiesWithPage(1);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [
    searchTerm,
    statusFilter,
    typeFilter,
    sortBy,
    sortOrder,
    user,
    token,
    loadPropertiesWithPage,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const submitData = {
        ...formData,
        monthlyRent:
          formData.monthlyRent && formData.monthlyRent.trim() !== ""
            ? parseFloat(formData.monthlyRent)
            : undefined,
      };

      if (editingProperty) {
        await apiService.updateProperty(editingProperty.id, submitData);
        toast.success("Property updated successfully");
      } else {
        await apiService.createProperty(submitData);
        toast.success("Property created successfully");
      }

      setFormData({
        name: "",
        address: "",
        type: "house",
        status: "active",
        monthlyRent: "",
      });
      setShowForm(false);
      setEditingProperty(null);
      await loadProperties();
    } catch (err: any) {
      console.error("Property submission error:", err);
      toast.error(err.message || "Failed to save property");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (property: Property) => {
    setFormData({
      name: property.name,
      address: property.address,
      type: property.type,
      status: property.status,
      monthlyRent: property.monthlyRent?.toString() || "",
    });
    setEditingProperty(property);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return;

    try {
      setLoading(true);
      await apiService.deleteProperty(id);
      toast.success("Property deleted successfully");
      await loadProperties();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete property");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      type: "house",
      status: "active",
      monthlyRent: "",
    });
    setShowForm(false);
    setEditingProperty(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-600">Manage your rental properties</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Property</span>
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingProperty ? "Edit Property" : "Add New Property"}
            </h3>
          </div>
          <div className="card-content">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter property name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter property address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as "house" | "apartment",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="house">House</option>
                    <option value="apartment">Apartment</option>
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
                        status: e.target.value as "active" | "inactive",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Rent (RWF)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.monthlyRent}
                    onChange={(e) =>
                      setFormData({ ...formData, monthlyRent: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter monthly rent amount"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading
                    ? "Saving..."
                    : editingProperty
                    ? "Update"
                    : "Create"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <PropertiesSearchAndFilter
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
        typeFilter={typeFilter}
        onTypeChange={handleTypeChange}
        sortBy={sortBy}
        onSortByChange={handleSortByChange}
        sortOrder={sortOrder}
        onSortOrderChange={handleSortOrderChange}
        onClearFilters={handleClearFilters}
      />

      {/* Export Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Export Properties
            </h2>
            <p className="text-sm text-gray-600">Download properties data</p>
          </div>
          <ExportData
            properties={properties}
            dataType="properties"
            title="Properties Report"
          />
        </div>
      </div>

      {/* Properties List */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">
            All Properties ({properties.length})
          </h3>
        </div>
        <div className="card-content">
          {loading && !showForm ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No properties found</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                Add your first property
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monthly Rent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Availability
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {properties.map((property) => (
                    <tr key={property.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {property.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {property.address}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {property.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            property.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {property.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(property.monthlyRent)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            property.isAvailable !== false
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {property.isAvailable !== false
                            ? "Available"
                            : "Rented"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(property.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(property)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(property.id)}
                            className="text-red-600 hover:text-red-900"
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
  );
};

export default Properties;
