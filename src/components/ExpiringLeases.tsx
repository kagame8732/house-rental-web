import React from "react";
import type { Lease } from "../types";

interface ExpiringLeasesProps {
  leases: Lease[];
}

export const ExpiringLeases: React.FC<ExpiringLeasesProps> = ({ leases }) => {
  if (leases.length === 0) return null;

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold text-gray-900">
          Leases Expiring Soon
        </h3>
        <p className="text-sm text-gray-600">
          Leases expiring in the next 30 days
        </p>
      </div>
      <div className="card-content">
        <div className="space-y-4">
          {leases.map((lease) => {
            const daysUntilExpiry = Math.ceil(
              (new Date(lease.endDate).getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24)
            );
            return (
              <div
                key={lease.id}
                className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {lease.tenant?.name || "Unknown Tenant"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {lease.property?.name || "Unknown Property"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Expires: {new Date(lease.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    {daysUntilExpiry} days left
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
