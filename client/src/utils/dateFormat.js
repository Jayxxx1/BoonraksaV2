/**
 * Format a date string or object into Thai format (dd/mm/yyyy)
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string (e.g., "29/01/2026")
 */
export const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Format a date string or object into Thai time format (HH:mm)
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted time string (e.g., "15:45")
 */
export const formatTime = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

/**
 * Format a date string or object into full Thai DateTime format (dd/mm/yyyy HH:mm)
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted datetime string (e.g., "29/01/2026 15:45")
 */
export const formatDateTime = (date) => {
  if (!date) return "-";
  return `${formatDate(date)} ${formatTime(date)}`;
};
