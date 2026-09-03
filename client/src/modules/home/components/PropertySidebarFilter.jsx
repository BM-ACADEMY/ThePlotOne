import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useNav } from "@/context/NavContext";
import { Slider, ConfigProvider } from "antd";

const PropertySidebarFilter = ({
    filters,
    onFilterChange,
    onClearFilters
}) => {
    const { locations, approvalTypes, priceRanges, propertyCategories, businessTypes, propertyTypes, maxPrice: backendMaxPrice } = useNav();
    const [openSections, setOpenSections] = useState({
        budget: true,
        location: true,
        approval: true,
        usageType: true,
        category: true,
        businessType: true,
    });

    const toggleSection = (section) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const filteredPropertyTypes = propertyTypes.filter(type => {
        if (!filters.usageType || filters.usageType.length === 0) return true;
        return filters.usageType.includes(type.usageType);
    });

    const handleChipClick = (category, value) => {
        const currentValues = filters[category] || [];
        const newValues = currentValues.includes(value)
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value];
        onFilterChange(category, newValues);
    };

    const formatPrice = (val) => {
        if (!val && val !== 0) return "";
        if (val >= 10000000) return `${(val / 10000000).toFixed(1)} Cr`;
        if (val >= 100000) return `${(val / 100000).toFixed(0)} L`;
        if (val >= 1000) return `${(val / 1000).toFixed(0)} K`;
        return `${val}`;
    };

    const minPossible = 0;
    // Slider cap: 20 Cr to keep it usable, but we use backendMaxPrice for the logical range if it's below that
    const sliderCap = 200000000;
    const maxPossible = Math.max(sliderCap, backendMaxPrice || 200000000);

    const handleBudgetChange = (val) => {
        const min = val[0];
        let max = val[1];

        // If max is at the very end and there's more in the backend, send null/high value
        if (max === maxPossible && backendMaxPrice > maxPossible) {
            // Effectively "Any" price above slider cap
            onFilterChange({ minPrice: min, maxPrice: "" });
        } else {
            onFilterChange({ minPrice: min, maxPrice: max });
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 sticky top-30 max-h-[calc(100vh-120px)] flex flex-col overflow-hidden">
            <div className="flex-1 p-6 space-y-8 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                {/* Budget Range Section */}
                <div className="space-y-4">
                    <button
                        onClick={() => toggleSection("budget")}
                        className="flex items-center justify-between w-full text-left focus:outline-none cursor-pointer"
                    >
                        <span className="text-sm font-bold text-gray-900 uppercase tracking-wider">Budget Range</span>
                        {openSections.budget ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    {openSections.budget && (
                        <div className="px-2 pt-2 pb-6">
                            <ConfigProvider
                                theme={{
                                    token: {
                                        colorPrimary: "#166aa8",
                                    },
                                }}
                            >
                                <Slider
                                    range
                                    min={minPossible}
                                    max={maxPossible}
                                    defaultValue={[minPossible, maxPossible]}
                                    value={[
                                        Number(filters.minPrice) || minPossible,
                                        Number(filters.maxPrice) || maxPossible
                                    ]}
                                    onChange={handleBudgetChange}
                                    onAfterChange={handleBudgetChange}
                                    tooltip={{
                                        formatter: (val) => {
                                            if (val === maxPossible && backendMaxPrice > maxPossible) return `${formatPrice(val)}+`;
                                            return formatPrice(val);
                                        }
                                    }}
                                />
                            </ConfigProvider>
                            <div className="flex justify-between mt-2">
                                <span className="text-[11px] font-bold text-gray-500">{formatPrice(filters.minPrice || minPossible)}</span>
                                <span className="text-[11px] font-bold text-gray-500">{formatPrice(filters.maxPrice || maxPossible)}</span>
                            </div>
                        </div>
                    )}
                </div>

                <hr className="border-gray-100" />

                {/* Location */}
                <div className="space-y-4">
                    <button
                        onClick={() => toggleSection("location")}
                        className="flex items-center justify-between w-full text-left focus:outline-none cursor-pointer"
                    >
                        <span className="text-sm font-bold text-gray-900 uppercase tracking-wider">Location</span>
                        {openSections.location ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    {openSections.location && (
                        <div className="flex flex-wrap gap-2">
                            {locations.map((loc) => {
                                const name = typeof loc === "string" ? loc : loc?.name || "Unknown";
                                return (
                                    <button
                                        key={name}
                                        onClick={() => handleChipClick("location", name)}
                                        className={`px-4 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer ${(filters.location || []).includes(name)
                                            ? "bg-blue-50 border-blue-600 text-blue-700"
                                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
                                            }`}
                                    >
                                        + {name}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <hr className="border-gray-100" />

                {/* Approval */}
                <div className="space-y-4">
                    <button
                        onClick={() => toggleSection("approval")}
                        className="flex items-center justify-between w-full text-left focus:outline-none cursor-pointer"
                    >
                        <span className="text-sm font-bold text-gray-900 uppercase tracking-wider">Approval</span>
                        {openSections.approval ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    {openSections.approval && (
                        <div className="flex flex-wrap gap-2">
                            {approvalTypes.map((app) => {
                                const name = typeof app === "string" ? app : app?.name || "Unknown";
                                return (
                                    <button
                                        key={name}
                                        onClick={() => handleChipClick("approval", name)}
                                        className={`px-4 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer ${(filters.approval || []).includes(name)
                                            ? "bg-blue-50 border-blue-600 text-blue-700"
                                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
                                            }`}
                                    >
                                        + {name}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <hr className="border-gray-100" />

                {/* Usage & Property Type */}
                <div className="space-y-4">
                    <button
                        onClick={() => toggleSection("usageType")}
                        className="flex items-center justify-between w-full text-left focus:outline-none cursor-pointer"
                    >
                        <span className="text-sm font-bold text-gray-900 uppercase tracking-wider">Usage & Property Type</span>
                        {openSections.usageType ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    {openSections.usageType && (
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {["Residential", "Commercial"].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => handleChipClick("usageType", type)}
                                        className={`px-4 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                                            (filters.usageType || []).includes(type)
                                                ? "bg-[#166aa8] border-[#166aa8] text-white shadow-sm"
                                                : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>

                            {filteredPropertyTypes.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                                    {filteredPropertyTypes.map((type) => (
                                        <button
                                            key={type._id || type.name}
                                            onClick={() => handleChipClick("type", type.name)}
                                            className={`px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
                                                (filters.type || []).includes(type.name)
                                                    ? "bg-blue-50 border-blue-600 text-blue-700"
                                                    : "bg-gray-50/50 border-gray-100 text-gray-500 hover:border-gray-300"
                                            }`}
                                        >
                                            + {type.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <hr className="border-gray-100" />

                {/* Property Category */}
                <div className="space-y-4">
                    <button
                        onClick={() => toggleSection("category")}
                        className="flex items-center justify-between w-full text-left focus:outline-none cursor-pointer"
                    >
                        <span className="text-sm font-bold text-gray-900 uppercase tracking-wider">Property Category</span>
                        {openSections.category ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    {openSections.category && (
                        <div className="flex flex-wrap gap-2">
                            {propertyCategories.map((cat) => {
                                const name = typeof cat === "string" ? cat : cat?.name || "Unknown";
                                return (
                                    <button
                                        key={name}
                                        onClick={() => handleChipClick("category", name)}
                                        className={`px-4 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer ${(filters.category || []).includes(name)
                                            ? "bg-blue-50 border-blue-600 text-blue-700"
                                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
                                            }`}
                                    >
                                        + {name.charAt(0).toUpperCase() + name.slice(1)}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <hr className="border-gray-100" />

                {/* Business Type */}
                <div className="space-y-4">
                    <button
                        onClick={() => toggleSection("businessType")}
                        className="flex items-center justify-between w-full text-left focus:outline-none cursor-pointer"
                    >
                        <span className="text-sm font-bold text-gray-900 uppercase tracking-wider">Business Type</span>
                        {openSections.businessType ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    {openSections.businessType && (
                        <div className="flex flex-wrap gap-2">
                            {businessTypes.map((type) => {
                                const name = typeof type === "string" ? type : type?.name || "Unknown";
                                return (
                                    <button
                                        key={type._id || name}
                                        onClick={() => handleChipClick("businessType", type._id || name)}
                                        className={`px-4 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer ${(filters.businessType || []).includes(type._id || name)
                                            ? "bg-blue-50 border-blue-600 text-blue-700"
                                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
                                            }`}
                                    >
                                        + {name}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <button
                        onClick={onClearFilters}
                        className="w-full text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                    >
                        Clear All Filters
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PropertySidebarFilter;
