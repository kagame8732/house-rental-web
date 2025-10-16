import React from "react";
import {
  Building2,
  UserCheck,
  Wrench,
  DollarSign,
  AlertCircle,
  Home,
  Calendar,
} from "lucide-react";
import { formatCurrency } from "../utils/currency";
import { StatCard } from "./StatCard";

interface DashboardStats {
  totalProperties: number;
  totalTenants: number;
  activeTenants: number;
  pendingMaintenance: number;
  totalRentCollected: number;
  outstandingRent: number;
  occupancyRate: number;
  annualRevenue: number;
}

interface StatsGridProps {
  stats: DashboardStats;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
  const statCards = [
    {
      title: "Total Properties",
      value: stats.totalProperties,
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Active Tenants",
      value: stats.activeTenants,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Occupancy Rate",
      value: `${stats.occupancyRate.toFixed(1)}%`,
      icon: Home,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Total Rent Collected",
      value: formatCurrency(stats.totalRentCollected),
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Outstanding Rent",
      value: formatCurrency(stats.outstandingRent),
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Annual Revenue (Projected)",
      value: formatCurrency(stats.annualRevenue),
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Pending Maintenance",
      value: stats.pendingMaintenance,
      icon: Wrench,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
          bgColor={stat.bgColor}
        />
      ))}
    </div>
  );
};
