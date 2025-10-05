import React from "react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
}) => {
  return (
    <div className="card">
      <div className="card-content p-4">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg ${bgColor}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div className="ml-3">
            <p className="text-xs font-medium text-gray-600">{title}</p>
            <p className="text-lg font-bold text-gray-900">{value}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
