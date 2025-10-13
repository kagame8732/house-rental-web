import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { apiService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import type { Tenant, Property } from "../types";
import { formatCurrency } from "../utils/currency";
import toast from "react-hot-toast";

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

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    propertyId: "",
    status: "active" as "active" | "inactive" | "evicted",
    payment: "",
  });

  useEffect(() => {
    if (user && token) {
      loadData();
    }
  }, [user, token]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tenantsRes, allPropertiesRes, availablePropertiesRes] =
        await Promise.all([
          apiService.getTenants(),
          apiService.getProperties(), // All properties for display
          apiService.getAvailableProperties(), // Available properties for form
        ]);
      setTenants(tenantsRes.data || []);
      setAllProperties(allPropertiesRes.data || []);
      setAvailableProperties(availablePropertiesRes.data || []);
      toast.success("Data loaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const submitData = {
        ...formData,
        payment: formData.payment ? parseFloat(formData.payment) : undefined,
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
      });
      setShowForm(false);
      setEditingTenant(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save tenant");
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
      setProperties(allPropertiesRes.data || []); // Use all properties for editing

      setFormData({
        name: tenant.name,
        phone: tenant.phone,
        email: tenant.email || "",
        address: tenant.address || "",
        propertyId: tenant.propertyId,
        status: tenant.status,
        payment: tenant.payment?.toString() || "",
      });
      setEditingTenant(tenant);
      setShowForm(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to load data for editing");
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
    } catch (err: any) {
      toast.error(err.message || "Failed to delete tenant");
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
    });
    setShowForm(false);
    setEditingTenant(null);
    // Reload available properties when resetting form
    await loadData();
  };

  const getPropertyName = (propertyId: string) => {
    const property = allProperties.find((p) => p.id === propertyId);
    return property ? property.name : "Unknown Property";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tenants</h1>
          <p className="text-gray-600">Manage your tenants</p>
        </div>
        <button
          onClick={async () => {
            await resetForm();
            setShowForm(true);
          }}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Tenant</span>
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingTenant ? "Edit Tenant" : "Add New Tenant"}
            </h3>
          </div>
          <div className="card-content">
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
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email address"
                  />
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
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.payment}
                    onChange={(e) =>
                      setFormData({ ...formData, payment: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter payment amount"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? "Saving..." : editingTenant ? "Update" : "Create"}
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

      {/* Tenants List */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">
            All Tenants ({tenants.length})
          </h3>
        </div>
        <div className="card-content">
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(tenant.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(tenant)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(tenant.id)}
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
        </div>
      </div>
    </div>
  );
};

export default Tenants;
