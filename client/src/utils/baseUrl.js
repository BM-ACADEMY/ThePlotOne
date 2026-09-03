/**
 * Centralized utility to get the base URL of the server.
 * Strips the trailing /api from VITE_API_URL.
 */
export const getBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "";
  // Only replace the trailing /api to avoid matching //api in https://api.domain.com
  return apiUrl.replace(/\/api$/, "");
};

export default getBaseUrl;
