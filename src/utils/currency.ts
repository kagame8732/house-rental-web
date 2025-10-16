/**
 * Formats a number or string as currency with RWF prefix and comma separators
 * @param value - The value to format (number or string)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  value: number | string | null | undefined
): string => {
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }

  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return "Not set";
  }

  return `RWF ${numValue.toLocaleString("en-US")}`;
};




