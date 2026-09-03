/**
 * Formats numbers into a readable "k", "M" format.
 * Examples:
 * 999 -> 999
 * 1000 -> 1k
 * 1100 -> 1.1k
 * 1000000 -> 1M
 * @param {number} num 
 * @returns {string|number}
 */
export const formatNumber = (num) => {
    if (!num || isNaN(num)) return 0;

    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    }

    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    }

    return num;
};
