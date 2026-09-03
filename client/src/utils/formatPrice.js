/**
 * Formats a number into Indian currency format (Lakhs/Crores).
 * @param {number} price - The price to format.
 * @returns {string} - Formatted price string.
 */
export const formatIndianPrice = (price) => {
  if (price === null || price === undefined) return "N/A";

  const numPrice = Number(price);
  if (isNaN(numPrice)) return price;

  if (numPrice >= 10000000) {
    return `₹ ${(numPrice / 10000000).toFixed(2)} Cr`;
  } else if (numPrice >= 100000) {
    return `₹ ${(numPrice / 100000).toFixed(2)} L`;
  } else {
    return `₹ ${numPrice.toLocaleString("en-IN")}`;
  }
};

/**
 * Formats a price range (min to max) into Indian currency format.
 * If both min and max are provided, returns "₹X to ₹Y".
 * Otherwise falls back to a single formatted price.
 * @param {number} minPrice
 * @param {number} maxPrice
 * @param {number} [fallbackPrice] - single price to display if range is absent
 * @returns {string}
 */
export const formatPriceRange = (minPrice, maxPrice, fallbackPrice) => {
  const hasMin = minPrice != null && minPrice !== '' && !isNaN(Number(minPrice)) && Number(minPrice) > 0;
  const hasMax = maxPrice != null && maxPrice !== '' && !isNaN(Number(maxPrice)) && Number(maxPrice) > 0;

  if (hasMin && hasMax) {
    return `${formatIndianPrice(minPrice)} - ${formatIndianPrice(maxPrice)}`;
  }
  if (hasMin) return formatIndianPrice(minPrice);
  if (hasMax) return formatIndianPrice(maxPrice);
  return formatIndianPrice(fallbackPrice || 0);
};
