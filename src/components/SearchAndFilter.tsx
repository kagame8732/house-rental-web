import React from "react";
import { Search, X } from "lucide-react";
import type { Property } from "../types";

interface SearchAndFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  propertyFilter: string;
  onPropertyChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortOrder: "ASC" | "DESC";
  onSortOrderChange: (value: "ASC" | "DESC") => void;
  properties: Property[];
  onClearFilters: () => void;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  propertyFilter,
  onPropertyChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  properties,
  onClearFilters,
}) => {
  const hasActiveFilters =
    searchTerm ||
    statusFilter ||
    propertyFilter ||
    sortBy !== "createdAt" ||
    sortOrder !== "DESC";

  return (
    <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm">
      <div className="flex flex-col space-y-6">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Search Tenants
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
            />
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-end gap-4">
          {/* Status Filter */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="evicted">Evicted</option>
            </select>
          </div>

          {/* Property Filter */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Property
            </label>
            <select
              value={propertyFilter}
              onChange={(e) => onPropertyChange(e.target.value)}
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
            >
              <option value="">All Properties</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Sort by
            </label>
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
            >
              <option value="createdAt">Created Date</option>
              <option value="name">Name</option>
              <option value="phone">Phone</option>
              <option value="status">Status</option>
              <option value="payment">Payment Amount</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-semibold text-gray-700">Order</label>
            <select
              value={sortOrder}
              onChange={(e) =>
                onSortOrderChange(e.target.value as "ASC" | "DESC")
              }
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
            >
              <option value="DESC">Newest First</option>
              <option value="ASC">Oldest First</option>
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-semibold text-gray-700 opacity-0">
                Clear
              </label>
              <button
                onClick={onClearFilters}
                className="inline-flex items-center px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchAndFilter;
