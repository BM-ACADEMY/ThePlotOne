import { getBaseUrl } from "./baseUrl";

/**
 * Centralized utility to handle image URL construction.
 * Ensures consistent behavior across the application and handles both relative and absolute URLs.
 */
export const getImageUrl = (path) => {
  if (!path) return "/properties/noimage.webp";

  // If it's already an absolute URL, return it
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("//")
  ) {
    return path;
  }

  const baseUrl = getBaseUrl();

  // Ensure the path starts with a slash
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
};

export default getImageUrl;
