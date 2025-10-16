import React from "react";
import { Search, X } from "lucide-react";

interface PropertiesSearchAndFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortOrder: "ASC" | "DESC";
  onSortOrderChange: (value: "ASC" | "DESC") => void;
  onClearFilters: () => void;
}

const PropertiesSearchAndFilter: React.FC<PropertiesSearchAndFilterProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  onClearFilters,
}) => {
  const hasActiveFilters =
    searchTerm ||
    statusFilter ||
    typeFilter ||
    sortBy !== "createdAt" ||
    sortOrder !== "DESC";

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search properties by name or address..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm"
            />
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <label
              htmlFor="status-filter"
              className="text-sm font-medium text-gray-700"
            >
              Status:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center space-x-2">
            <label
              htmlFor="type-filter"
              className="text-sm font-medium text-gray-700"
            >
              Type:
            </label>
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(e) => onTypeChange(e.target.value)}
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Types</option>
              <option value="house">House</option>
              <option value="apartment">Apartment</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center space-x-2">
            <label
              htmlFor="sort-by"
              className="text-sm font-medium text-gray-700"
            >
              Sort by:
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="createdAt">Created Date</option>
              <option value="name">Name</option>
              <option value="monthlyRent">Monthly Rent</option>
              <option value="status">Status</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="flex items-center space-x-2">
            <select
              value={sortOrder}
              onChange={(e) =>
                onSortOrderChange(e.target.value as "ASC" | "DESC")
              }
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="DESC">Newest First</option>
              <option value="ASC">Oldest First</option>
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="inline-flex items-center px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertiesSearchAndFilter;

