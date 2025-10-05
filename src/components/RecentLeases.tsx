import React from "react";
import type { Lease } from "../types";
import { Pagination } from "./Pagination";

interface RecentLeasesProps {
  leases: Lease[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const RecentLeases: React.FC<RecentLeasesProps> = ({
  leases,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold text-gray-900">Recent Leases</h3>
      </div>
      <div className="card-content">
        <div className="space-y-4">
          {leases.length > 0 ? (
            leases.map((lease) => (
              <div
                key={lease.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {lease.tenant?.name || "Unknown Tenant"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {lease.property?.name || "Unknown Property"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {new Date(lease.startDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No recent leases</p>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
};
