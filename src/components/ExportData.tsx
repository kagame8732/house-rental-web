import React from "react";
import { Download, FileText } from "lucide-react";
import { formatCurrency } from "../utils/currency";
import toast from "react-hot-toast";
import type { Tenant, Property, Maintenance } from "../types";

interface ExportDataProps {
  tenants?: Tenant[];
  properties?: Property[];
  maintenance?: Maintenance[];
  dataType: "all" | "tenants" | "properties" | "maintenance";
  title?: string;
}

export const ExportData: React.FC<ExportDataProps> = ({
  tenants = [],
  properties = [],
  maintenance = [],
  dataType,
  title = "Export Data",
}) => {
  const exportToCSV = () => {
    let csvData: any[] = [];
    let filename = "";

    switch (dataType) {
      case "all":
        // Export all data types
        const allData = [
          ...tenants.map((tenant) => ({
            Type: "Tenant",
            Name: tenant.name,
            "ID Number": tenant.idNumber,
            Phone: tenant.phone,
            Email: tenant.email || "",
            Address: tenant.address || "",
            Property:
              properties.find((p) => p.id === tenant.propertyId)?.name || "",
            Status: tenant.status,
            "Monthly Payment": tenant.payment || 0,
            "Payment Date": tenant.paymentDate || "",
            "Payment Method": tenant.paymentMethod || "",
            "Months Paid": tenant.monthsPaid || 0,
            "Total Amount": tenant.totalAmount || 0,
            "Stay Start Date": tenant.stayStartDate || "",
            "Stay End Date": tenant.stayEndDate || "",
            "Created Date": tenant.createdAt,
            "Updated Date": tenant.updatedAt,
          })),
          ...properties.map((property) => ({
            Type: "Property",
            Name: property.name,
            Address: property.address,
            PropertyType: property.type,
            Status: property.status,
            "Monthly Rent": property.monthlyRent || 0,
            "Created Date": property.createdAt,
            "Updated Date": property.updatedAt,
          })),
          ...maintenance.map((item) => ({
            Type: "Maintenance",
            Title: item.title,
            Description: item.description,
            Property:
              properties.find((p) => p.id === item.propertyId)?.name || "",
            Status: item.status,
            Priority: item.priority,
            "Scheduled Date": item.scheduledDate || "",
            "Completed Date": item.completedDate || "",
            Cost: item.cost || 0,
            Notes: item.notes || "",
            "Created Date": item.createdAt,
            "Updated Date": item.updatedAt,
          })),
        ];
        csvData = allData;
        filename = `complete_data_export_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        break;

      case "tenants":
        csvData = tenants.map((tenant) => ({
          Name: tenant.name,
          "ID Number": tenant.idNumber,
          Phone: tenant.phone,
          Email: tenant.email || "",
          Address: tenant.address || "",
          Property:
            properties.find((p) => p.id === tenant.propertyId)?.name || "",
          Status: tenant.status,
          "Monthly Payment": tenant.payment || 0,
          "Payment Date": tenant.paymentDate || "",
          "Payment Method": tenant.paymentMethod || "",
          "Months Paid": tenant.monthsPaid || 0,
          "Total Amount": tenant.totalAmount || 0,
          "Stay Start Date": tenant.stayStartDate || "",
          "Stay End Date": tenant.stayEndDate || "",
          "Created Date": tenant.createdAt,
          "Updated Date": tenant.updatedAt,
        }));
        filename = `tenants_export_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        break;

      case "properties":
        csvData = properties.map((property) => ({
          Name: property.name,
          Address: property.address,
          Type: property.type,
          Status: property.status,
          "Monthly Rent": property.monthlyRent || 0,
          "Created Date": property.createdAt,
          "Updated Date": property.updatedAt,
        }));
        filename = `properties_export_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        break;

      case "maintenance":
        csvData = maintenance.map((item) => ({
          Title: item.title,
          Description: item.description,
          Property:
            properties.find((p) => p.id === item.propertyId)?.name || "",
          Status: item.status,
          Priority: item.priority,
          "Scheduled Date": item.scheduledDate || "",
          "Completed Date": item.completedDate || "",
          Cost: item.cost || 0,
          Notes: item.notes || "",
          "Created Date": item.createdAt,
          "Updated Date": item.updatedAt,
        }));
        filename = `maintenance_export_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        break;
    }

    if (csvData.length === 0) {
      toast.error("No data available to export");
      return;
    }

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        headers
          .map((header) => `"${row[header as keyof typeof row]}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(
      `${
        dataType.charAt(0).toUpperCase() + dataType.slice(1)
      } CSV file downloaded successfully`
    );
  };

  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      let content = `
        <html>
          <head>
            <title>${title} - ${new Date().toLocaleDateString()}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .section { margin-bottom: 30px; }
              .section h2 { color: #333; border-bottom: 2px solid #2563eb; padding-bottom: 5px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .summary { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${title}</h1>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
      `;

      // Add summary section for all data
      if (dataType === "all") {
        content += `
          <div class="summary">
            <h3>Summary</h3>
            <p><strong>Total Properties:</strong> ${properties.length}</p>
            <p><strong>Total Tenants:</strong> ${tenants.length}</p>
            <p><strong>Active Tenants:</strong> ${
              tenants.filter((t) => t.status === "active").length
            }</p>
            <p><strong>Total Maintenance Items:</strong> ${
              maintenance.length
            }</p>
            <p><strong>Pending Maintenance:</strong> ${
              maintenance.filter((m) => m.status === "pending").length
            }</p>
          </div>
        `;
      }

      // Add tenants section
      if (
        (dataType === "all" || dataType === "tenants") &&
        tenants.length > 0
      ) {
        content += `
          <div class="section">
            <h2>Tenants (${tenants.length})</h2>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Property</th>
                  <th>Status</th>
                  <th>Monthly Payment</th>
                  <th>Total Paid</th>
                </tr>
              </thead>
              <tbody>
                ${tenants
                  .map(
                    (tenant) => `
                  <tr>
                    <td>${tenant.name}</td>
                    <td>${
                      properties.find((p) => p.id === tenant.propertyId)
                        ?.name || "N/A"
                    }</td>
                    <td>${tenant.status}</td>
                    <td>${formatCurrency(tenant.payment || 0)}</td>
                    <td>${formatCurrency(tenant.totalAmount || 0)}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `;
      }

      // Add properties section
      if (
        (dataType === "all" || dataType === "properties") &&
        properties.length > 0
      ) {
        content += `
          <div class="section">
            <h2>Properties (${properties.length})</h2>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Address</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Monthly Rent</th>
                </tr>
              </thead>
              <tbody>
                ${properties
                  .map(
                    (property) => `
                  <tr>
                    <td>${property.name}</td>
                    <td>${property.address}</td>
                    <td>${property.type}</td>
                    <td>${property.status}</td>
                    <td>${formatCurrency(property.monthlyRent || 0)}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `;
      }

      // Add maintenance section
      if (
        (dataType === "all" || dataType === "maintenance") &&
        maintenance.length > 0
      ) {
        content += `
          <div class="section">
            <h2>Maintenance (${maintenance.length})</h2>
            <table>
              <thead>
                  <tr>
                    <th>Title</th>
                    <th>Property</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Scheduled Date</th>
                  </tr>
              </thead>
              <tbody>
                ${maintenance
                  .map(
                    (item) => `
                  <tr>
                    <td>${item.title}</td>
                    <td>${
                      properties.find((p) => p.id === item.propertyId)?.name ||
                      "N/A"
                    }</td>
                    <td>${item.status}</td>
                    <td>${item.priority}</td>
                    <td>${
                      item.scheduledDate
                        ? new Date(item.scheduledDate).toLocaleDateString()
                        : "N/A"
                    }</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `;
      }

      content += `
          </body>
        </html>
      `;

      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.print();
    }

    toast.success(
      `${
        dataType.charAt(0).toUpperCase() + dataType.slice(1)
      } PDF report generated successfully`
    );
  };

  const getDataCount = () => {
    switch (dataType) {
      case "all":
        return tenants.length + properties.length + maintenance.length;
      case "tenants":
        return tenants.length;
      case "properties":
        return properties.length;
      case "maintenance":
        return maintenance.length;
      default:
        return 0;
    }
  };

  const dataCount = getDataCount();

  if (dataCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center space-x-3">
      <span className="text-sm text-gray-600">
        {dataCount} {dataType === "all" ? "items" : dataType} available
      </span>
      <button
        onClick={exportToCSV}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        title={`Export ${dataType} to CSV`}
      >
        <Download className="h-4 w-4 mr-2" />
        CSV
      </button>
      <button
        onClick={exportToPDF}
        className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        title={`Export ${dataType} to PDF`}
      >
        <FileText className="h-4 w-4 mr-2" />
        PDF
      </button>
    </div>
  );
};
