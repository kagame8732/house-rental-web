import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { apiService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import type { Maintenance, Property, PaginationParams } from "../types";
import toast from "react-hot-toast";
import Pagination from "../components/Pagination";
import MaintenanceSearchAndFilter from "../components/MaintenanceSearchAndFilter";

const MaintenancePage: React.FC = () => {
  const { user, token } = useAuth();
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingMaintenance, setEditingMaintenance] =
    useState<Maintenance | null>(null);

  // Pagination and filtering state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    propertyId: "",
    cost: "",
    scheduledDate: "",
    notes: "",
    status: "pending" as "pending" | "in_progress" | "completed" | "cancelled",
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
          priority: priorityFilter || undefined,
          propertyId: propertyFilter || undefined,
        };

        const [maintenanceRes, propertiesRes] = await Promise.all([
          apiService.getMaintenance(params),
          apiService.getProperties(),
        ]);

        setMaintenance(maintenanceRes.data || []);
        setProperties(propertiesRes.data || []);

        // Update pagination info
        if (maintenanceRes.pagination) {
          setPagination((prev) => ({
            ...prev,
            page: maintenanceRes.pagination!.page,
            total: maintenanceRes.pagination!.total,
            totalPages: maintenanceRes.pagination!.totalPages,
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
      priorityFilter,
      propertyFilter,
    ]
  );

  // Filter change handlers
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
          priority: priorityFilter || undefined,
          propertyId: propertyFilter || undefined,
        };

        const [maintenanceRes, propertiesRes] = await Promise.all([
          apiService.getMaintenance(params),
          apiService.getProperties(),
        ]);

        setMaintenance(maintenanceRes.data || []);
        setProperties(propertiesRes.data || []);

        // Update pagination info
        if (maintenanceRes.pagination) {
          setPagination((prev) => ({
            ...prev,
            page: maintenanceRes.pagination!.page,
            total: maintenanceRes.pagination!.total,
            totalPages: maintenanceRes.pagination!.totalPages,
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
      priorityFilter,
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

  const handlePriorityChange = (value: string) => {
    setPriorityFilter(value);
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
    setPriorityFilter("");
    setPropertyFilter("");
    setSortBy("createdAt");
    setSortOrder("DESC");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  useEffect(() => {
    if (user && token) {
      loadData();
    }
  }, [user, token, loadData]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (user && token) {
        loadDataWithPage(1);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [
    searchTerm,
    statusFilter,
    priorityFilter,
    propertyFilter,
    sortBy,
    sortOrder,
    user,
    token,
    loadDataWithPage,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const maintenanceData = {
        ...formData,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        scheduledDate: formData.scheduledDate
          ? new Date(formData.scheduledDate).toISOString()
          : undefined,
      };

      if (editingMaintenance) {
        await apiService.updateMaintenance(
          editingMaintenance.id,
          maintenanceData
        );
        toast.success("Maintenance request updated successfully");
      } else {
        await apiService.createMaintenance(maintenanceData);
        toast.success("Maintenance request created successfully");
      }

      setFormData({
        title: "",
        description: "",
        priority: "medium",
        propertyId: "",
        cost: "",
        scheduledDate: "",
        notes: "",
        status: "pending",
      });
      setShowForm(false);
      setEditingMaintenance(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save maintenance request");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (maintenanceItem: Maintenance) => {
    setFormData({
      title: maintenanceItem.title,
      description: maintenanceItem.description,
      priority: maintenanceItem.priority,
      propertyId: maintenanceItem.propertyId,
      cost: maintenanceItem.cost ? maintenanceItem.cost.toString() : "",
      scheduledDate: maintenanceItem.scheduledDate
        ? new Date(maintenanceItem.scheduledDate).toISOString().split("T")[0]
        : "",
      notes: maintenanceItem.notes || "",
      status: maintenanceItem.status,
    });
    setEditingMaintenance(maintenanceItem);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this maintenance request?"))
      return;

    try {
      setLoading(true);
      await apiService.deleteMaintenance(id);
      toast.success("Maintenance request deleted successfully");
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete maintenance request");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      propertyId: "",
      cost: "",
      scheduledDate: "",
      notes: "",
      status: "pending",
    });
    setShowForm(false);
    setEditingMaintenance(null);
  };

  const getPropertyName = (propertyId: string) => {
    const property = properties.find((p) => p.id === propertyId);
    return property ? property.name : "Unknown Property";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Maintenance</h1>
          <p className="text-gray-600">Manage maintenance requests</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Request</span>
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingMaintenance
                ? "Edit Maintenance Request"
                : "Add New Maintenance Request"}
            </h3>
          </div>
          <div className="card-content">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter maintenance title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property
                  </label>
                  <select
                    required
                    value={formData.propertyId}
                    onChange={(e) =>
                      setFormData({ ...formData, propertyId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a property</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name} - {property.address}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: e.target.value as
                          | "low"
                          | "medium"
                          | "high"
                          | "urgent",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
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
                          | "pending"
                          | "in_progress"
                          | "completed"
                          | "cancelled",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Cost (RWF)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) =>
                      setFormData({ ...formData, cost: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter estimated cost"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scheduledDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the maintenance issue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter any additional notes"
                />
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading
                    ? "Saving..."
                    : editingMaintenance
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
      <MaintenanceSearchAndFilter
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
        priorityFilter={priorityFilter}
        onPriorityChange={handlePriorityChange}
        propertyFilter={propertyFilter}
        onPropertyChange={handlePropertyChange}
        sortBy={sortBy}
        onSortByChange={handleSortByChange}
        sortOrder={sortOrder}
        onSortOrderChange={handleSortOrderChange}
        properties={properties}
        onClearFilters={handleClearFilters}
      />

      {/* Maintenance List */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">
            All Maintenance Requests ({maintenance.length})
          </h3>
        </div>
        <div className="card-content">
          {loading && !showForm ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : maintenance.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No maintenance requests found</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                Add your first maintenance request
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Request
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost
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
                  {maintenance.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.title}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {item.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getPropertyName(item.propertyId)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                            item.priority
                          )}`}
                        >
                          {item.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.cost
                            ? `RWF ${item.cost.toLocaleString()}`
                            : "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
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

export default MaintenancePage;
