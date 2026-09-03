import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Search, ChevronDown, Check, ChevronRight, AlertTriangle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useNav } from "@/context/NavContext";

/**
 * Reusable Property Search Bar
 * @param {string} variant - 'hero' or 'header'
 * @param {boolean} showFilters - Whether to show Location/Approval/Budget dropdowns
 * @param {boolean} showKeyword - Whether to show the keyword search input
 */
const PropertySearchBar = ({
    variant = "hero",
    showFilters = true,
    showKeyword = true
}) => {
    const navigate = useNavigate();
    const locationObj = useLocation();
    const { locations, approvalTypes, priceRanges, propertyTypes } = useNav();

    // --- STATE MANAGEMENT ---
    const [searchQuery, setSearchQuery] = useState("");
    const [location, setLocation] = useState("");
    const [approval, setApproval] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");

    const [error, setError] = useState("");
    // Property Type Selector State
    const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
    const [activeUsageTab, setActiveUsageTab] = useState("Residential");
    const [selectedTypes, setSelectedTypes] = useState([]); // array of type names

    // Dropdown UI State
    const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
    const [isApprovalDropdownOpen, setIsApprovalDropdownOpen] = useState(false);
    const [isBudgetDropdownOpen, setIsBudgetDropdownOpen] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
    const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);

    // Refs for click-outside
    const locationRef = useRef(null);
    const approvalRef = useRef(null);
    const budgetRef = useRef(null);
    const typeRef = useRef(null);
    const searchInputRef = useRef(null);
    const suggestionsRef = useRef(null);
    const ignoreNextSuggest = useRef(false);

    // Animated Placeholder State
    const searchPlaceholders = [
        'Search "Flats for rent in sector 77 Noida"',
        'Search "3 BHK Villa in White Town"',
        'Search "Commercial space for lease"',
    ];
    const [placeholderIdx, setPlaceholderIdx] = useState(0);

    // Derived: available usage tabs from propertyTypes
    const usageTabs = useMemo(() => {
        return [...new Set((propertyTypes || []).map(t => t.usageType).filter(Boolean))];
    }, [propertyTypes]);

    const filteredSubtypes = useMemo(() => {
        return (propertyTypes || []).filter(t => t.usageType === activeUsageTab);
    }, [propertyTypes, activeUsageTab]);

    // --- EFFECTS ---
    useEffect(() => {
        const params = new URLSearchParams(locationObj.search);

        const searchParam = params.get("search");
        if (searchParam !== null) setSearchQuery(searchParam);

        const locParam = params.get("location");
        if (locParam !== null) setLocation(locParam);

        const appParam = params.get("approval");
        if (appParam !== null) setApproval(appParam);

        const minP = params.get("minPrice");
        if (minP !== null) setMinPrice(minP);

        const maxP = params.get("maxPrice");
        if (maxP !== null) setMaxPrice(maxP);

        const typeParam = params.get("type");
        if (typeParam !== null) {
            const types = typeParam.split(",");
            setSelectedTypes(types);
            // Set active usage tab based on first selected type
            const firstType = (propertyTypes || []).find(t => t.name === types[0]);
            if (firstType) setActiveUsageTab(firstType.usageType);
        }
    }, [locationObj.search, propertyTypes]);

    useEffect(() => {
        const placeholderInterval = setInterval(() => {
            setPlaceholderIdx((prev) => (prev + 1) % searchPlaceholders.length);
        }, 3000);

        const handleClickOutside = (event) => {
            if (locationRef.current && !locationRef.current.contains(event.target)) setIsLocationDropdownOpen(false);
            if (approvalRef.current && !approvalRef.current.contains(event.target)) setIsApprovalDropdownOpen(false);
            if (budgetRef.current && !budgetRef.current.contains(event.target)) setIsBudgetDropdownOpen(false);
            if (typeRef.current && !typeRef.current.contains(event.target)) setIsTypeDropdownOpen(false);
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) setIsSuggestionsOpen(false);
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            clearInterval(placeholderInterval);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [searchPlaceholders.length]);

    // Fetch Suggestions Effect
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (ignoreNextSuggest.current) {
                ignoreNextSuggest.current = false;
                return;
            }

            setIsSuggestionsLoading(true);
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/properties/suggestions`, {
                    params: { query: searchQuery }
                });
                setSuggestions(response.data);

                // Only open if there is an active search query
                if (searchQuery.length > 0) {
                    setIsSuggestionsOpen(true);
                } else {
                    setIsSuggestionsOpen(false);
                }
            } catch (error) {
                console.error("Error fetching suggestions:", error);
                setSuggestions([]);
            } finally {
                setIsSuggestionsLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 150);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    useEffect(() => {
        if (error) setError("");
    }, [searchQuery, location, approval, minPrice, maxPrice, selectedTypes]);

    // Auto-clear error after 4 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(""), 4000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    // --- HANDLERS ---
    const handleSearch = useCallback((overrideParams = {}) => {
        const finalSearch = overrideParams.search !== undefined ? overrideParams.search : searchQuery;
        const finalLocation = overrideParams.location !== undefined ? overrideParams.location : location;
        const finalTypes = overrideParams.type !== undefined ? overrideParams.type : selectedTypes;

        // Validation: If everything is empty
        if (!finalSearch && !finalLocation && !approval && !minPrice && !maxPrice && finalTypes.length === 0) {
            setError("Please try again with the location included!");
            return;
        }

        const params = new URLSearchParams();
        if (finalSearch) params.append("search", finalSearch);
        if (finalLocation) params.append("location", finalLocation);
        if (approval) params.append("approval", approval);
        if (minPrice) params.append("minPrice", minPrice);
        if (maxPrice) params.append("maxPrice", maxPrice);
        if (finalTypes.length > 0) params.append("type", Array.isArray(finalTypes) ? finalTypes.join(",") : finalTypes);

        navigate(`/properties?${params.toString()}`);
    }, [searchQuery, location, selectedTypes, approval, minPrice, maxPrice, navigate]);

    const selectBudget = useCallback((range) => {
        setMinPrice(range.min || "");
        setMaxPrice(range.max || "");
        setIsBudgetDropdownOpen(false);
    }, []);

    const getBudgetLabel = useMemo(() => {
        if (!minPrice && !maxPrice) return "Budget";
        const selected = priceRanges.find(r => String(r.min) === String(minPrice) && String(r.max) === String(maxPrice));
        return selected ? selected.label : `${minPrice} - ${maxPrice}`;
    }, [minPrice, maxPrice, priceRanges]);

    const toggleTypeSelection = useCallback((typeName) => {
        setSelectedTypes(prev =>
            prev.includes(typeName)
                ? prev.filter(t => t !== typeName)
                : [...prev, typeName]
        );
    }, []);

    const getTypeSelectorLabel = useMemo(() => {
        if (selectedTypes.length === 0) return "All Properties";
        // Determine usage tab of selected types
        const firstType = (propertyTypes || []).find(t => t.name === selectedTypes[0]);
        const usageLabel = firstType?.usageType || "Properties";
        if (selectedTypes.length === 1) return selectedTypes[0];
        return `${usageLabel} (${selectedTypes.length})`;
    }, [selectedTypes, propertyTypes]);

    const isHeader = variant === "header";

    return (
        <div className={`w-full ${isHeader ? "max-w-4xl" : "max-w-6xl"} flex justify-center`}>
            <motion.div
                initial={isHeader ? { opacity: 0, scale: 0.95 } : { width: "10%", opacity: 0 }}
                animate={isHeader ? { opacity: 1, scale: 1 } : { width: "100%", opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className={`bg-white p-2 rounded-full lg:rounded-2xl shadow-2xl flex flex-row items-center relative z-50 w-full overflow-visible cursor-text ${isHeader ? "h-12 border border-gray-200" : "h-14 md:h-[72px]"
                    }`}
            >


                {/* 1. SEARCH INPUT */}
                {showKeyword && (
                    <div className={`flex-grow flex items-center ${isHeader ? "pl-3 pr-1" : "pl-4 pr-2 md:px-6"} h-full min-w-0 relative ${showFilters ? "lg:border-r border-gray-100" : ""}`} ref={suggestionsRef}>
                        <Search className={`${isHeader ? "w-4 h-4" : "w-5 h-5"} text-gray-400 mr-2 flex-shrink-0`} />

                        <div className="relative w-full h-full flex items-center overflow-hidden">
                            {!searchQuery && (
                                <AnimatePresence mode="popLayout">
                                    <motion.span
                                        key={placeholderIdx}
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: -20, opacity: 0 }}
                                        transition={{ duration: 0.4, ease: "easeInOut" }}
                                        className={`absolute left-0 text-gray-400 ${isHeader ? "text-xs" : "text-sm md:text-base"} pointer-events-none whitespace-nowrap`}
                                    >
                                        {searchPlaceholders[placeholderIdx]}
                                    </motion.span>
                                </AnimatePresence>
                            )}

                            <input
                                ref={searchInputRef}
                                type="text"
                                autoComplete="off"
                                className={`w-full bg-transparent text-gray-800 ${isHeader ? "text-xs" : "text-sm md:text-base"} focus:outline-none min-w-0 relative z-10`}
                                value={searchQuery}
                                aria-label="Search properties by keyword, location, or project name"
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    if (e.target.value.length > 0) setIsSuggestionsOpen(true);
                                    else setIsSuggestionsOpen(false);
                                }}
                                onFocus={() => {
                                    if (searchQuery.length > 0) setIsSuggestionsOpen(true);
                                }}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            />
                        </div>


                        {/* Search Suggestions Dropdown */}
                        <AnimatePresence>
                            {isSuggestionsOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className={`absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden z-[2000] ${isHeader ? "w-[480px]" : "w-full"}`}
                                >
                                    <div className="max-h-80 overflow-y-auto py-2">
                                        {isSuggestionsLoading ? (
                                            <div className="px-5 py-8 text-center">
                                                <div className="inline-block w-6 h-6 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
                                                <p className="mt-2 text-xs text-gray-400 font-medium animate-pulse lowercase">Searching...</p>
                                            </div>
                                        ) : suggestions.length > 0 ? (
                                            suggestions.map((sug, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => {
                                                        const isLocation = sug.type === "City" || sug.type === "Locality";
                                                        const isType = sug.type === "Type";
                                                        const isProperty = sug.type === "Property";

                                                        ignoreNextSuggest.current = true;
                                                        setSuggestions([]);
                                                        setIsSuggestionsOpen(false);

                                                        if (isLocation) {
                                                            setLocation(sug.value);
                                                            setSearchQuery(""); // Clear keyword if location selected
                                                            handleSearch({ location: sug.value, search: "" });
                                                        } else if (isProperty) {
                                                            navigate(`/properties/${sug.value}`);
                                                            setSearchQuery("");
                                                        } else if (isType) {
                                                            const suggestionType = propertyTypes?.find(t => t.name === sug.value);
                                                            if (suggestionType) setActiveUsageTab(suggestionType.usageType);
                                                            setSelectedTypes([sug.value]);
                                                            setSearchQuery(""); // Clear keyword if type selected
                                                            handleSearch({ type: [sug.value], search: "" });
                                                        } else {
                                                            setSearchQuery(sug.value);
                                                            handleSearch({ search: sug.value });
                                                        }
                                                    }}
                                                    className="w-full text-left px-6 py-4 hover:bg-blue-50/50 flex items-center justify-between transition-colors border-b border-gray-50 last:border-0 group"
                                                >
                                                    <div className="flex flex-col gap-1 pr-4">
                                                        <span className="font-semibold text-gray-900 text-base md:text-lg leading-snug group-hover:text-blue-700 transition-colors">
                                                            {sug.mainText}
                                                        </span>
                                                        <span className="text-sm text-gray-500">
                                                            {sug.subText}
                                                        </span>
                                                    </div>
                                                    <span className="text-[11px] md:text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2.5 py-1 rounded-md shrink-0">
                                                        {sug.type}
                                                    </span>
                                                </button>
                                            ))
                                        ) : searchQuery.length > 0 ? (
                                            <div className="px-5 py-8 text-center space-y-2">
                                                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                                                    <Search className="w-5 h-5 text-gray-300" />
                                                </div>
                                                <div>
                                                    <p className="text-gray-800 font-semibold text-sm">No results found</p>
                                                    <p className="text-gray-500 text-xs mt-1">We couldn't find any matches for "{searchQuery}"</p>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* 2. FILTERS CONTAINER */}
                {showFilters && (
                    <>
                        {/* 0. PROPERTY TYPE SELECTOR */}
                        <div className="relative flex-shrink-0 hidden lg:block" ref={typeRef}>
                            <button
                                onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                                className={`flex items-center gap-1.5 rounded-l-2xl hover:bg-gray-50 font-semibold text-gray-700 transition border-r border-gray-200 h-full px-4 py-2 text-sm cursor-pointer`}
                            >
                                <span className="max-w-[100px] truncate whitespace-nowrap">{getTypeSelectorLabel}</span>
                                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isTypeDropdownOpen ? "rotate-180" : ""}`} />
                            </button>

                            <AnimatePresence>
                                {isTypeDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute top-full mt-3 w-[480px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-[1000] left-0 overflow-hidden"
                                    >
                                        {/* Usage Tabs */}
                                        <div className="flex border-b border-gray-100 bg-gray-50">
                                            {usageTabs.length > 0 ? usageTabs.map(tab => (
                                                <button
                                                    key={tab}
                                                    onClick={() => setActiveUsageTab(tab)}
                                                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeUsageTab === tab
                                                        ? "bg-white text-red-500 border-b-2 border-red-500"
                                                        : "text-gray-500 hover:text-gray-700"
                                                        }`}
                                                >
                                                    {tab}
                                                </button>
                                            )) : (
                                                <>
                                                    <button
                                                        onClick={() => setActiveUsageTab("Residential")}
                                                        className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeUsageTab === "Residential" ? "bg-white text-red-500 border-b-2 border-red-500" : "text-gray-500"}`}
                                                    >
                                                        Residential
                                                    </button>
                                                    <button
                                                        onClick={() => setActiveUsageTab("Commercial")}
                                                        className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeUsageTab === "Commercial" ? "bg-white text-red-500 border-b-2 border-red-500" : "text-gray-500"}`}
                                                    >
                                                        Commercial
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {/* Property Type Checkboxes */}
                                        <div className="p-4">
                                            {filteredSubtypes.length > 0 ? (
                                                <div className="grid grid-cols-2 gap-2">
                                                    {filteredSubtypes.map(type => {
                                                        const isChecked = selectedTypes.includes(type.name);
                                                        return (
                                                            <button
                                                                key={type._id || type.name}
                                                                onClick={() => toggleTypeSelection(type.name)}
                                                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left transition-colors ${isChecked ? "bg-red-50 text-red-600" : "hover:bg-gray-50 text-gray-700"}`}
                                                            >
                                                                <span className={`w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center transition-colors ${isChecked ? "bg-red-500 border-red-500" : "border-gray-300"}`}>
                                                                    {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                                                                </span>
                                                                <span className="font-medium truncate">{type.name}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-400 text-center py-4">No property types found for {activeUsageTab}</p>
                                            )}

                                            {/* Switch tab hint */}
                                            {usageTabs.length > 1 && (
                                                <div className="mt-3 pt-3 border-t border-gray-100">
                                                    <button
                                                        onClick={() => setActiveUsageTab(usageTabs.find(t => t !== activeUsageTab) || usageTabs[0])}
                                                        className="text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1"
                                                    >
                                                        Looking for {usageTabs.find(t => t !== activeUsageTab)} properties?
                                                        <ChevronRight className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer actions */}
                                        <div className="px-4 pb-4 flex items-center justify-between">
                                            <button
                                                onClick={() => setSelectedTypes([])}
                                                className="text-xs text-gray-400 hover:text-gray-600 font-medium"
                                            >
                                                Clear selection
                                            </button>
                                            <button
                                                onClick={() => setIsTypeDropdownOpen(false)}
                                                className="text-xs text-white bg-red-500 hover:bg-red-600 px-4 py-1.5 rounded-full font-medium transition-colors"
                                            >
                                                Done
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    <div className={`hidden lg:flex items-center px-4 gap-1 md:gap-4 flex-shrink-0 ${!showKeyword ? "w-full justify-between" : ""}`}>
                        {/* Location */}
                        <div className="relative" ref={locationRef}>
                            <button
                                onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-gray-50 font-semibold text-gray-700 transition cursor-pointer ${isHeader ? "text-[10px]" : "text-sm"}`}
                            >
                                <span className="max-w-[80px] truncate">{location || "Location"}</span>
                                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isLocationDropdownOpen ? "rotate-180" : ""}`} />
                            </button>
                            <AnimatePresence>
                                {isLocationDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-[1000] left-1/2 -translate-x-1/2"
                                    >
                                        <div className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-50">Select Location</div>
                                        <button onClick={() => { setLocation(""); setIsLocationDropdownOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${!location ? "text-blue-600 font-bold" : "text-gray-600"}`}>
                                            Anywhere {!location && <Check className="w-3 h-3" />}
                                        </button>
                                        <div className="max-h-60 overflow-y-auto">
                                            {locations.map((loc) => {
                                                const name = typeof loc === "string" ? loc : loc?.name || "Unknown";
                                                return (
                                                    <button key={name} onClick={() => { setLocation(name); setIsLocationDropdownOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${location === name ? "text-blue-600 font-bold" : "text-gray-600"}`}>
                                                        {name} {location === name && <Check className="w-3 h-3" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Approval */}
                        <div className="relative" ref={approvalRef}>
                            <button
                                onClick={() => setIsApprovalDropdownOpen(!isApprovalDropdownOpen)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-gray-50 font-semibold text-gray-700 transition cursor-pointer ${isHeader ? "text-[10px]" : "text-sm"}`}
                            >
                                <span className="max-w-[80px] truncate">{approval || "Approval"}</span>
                                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isApprovalDropdownOpen ? "rotate-180" : ""}`} />
                            </button>
                            <AnimatePresence>
                                {isApprovalDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-[1000] left-1/2 -translate-x-1/2"
                                    >
                                        <div className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-50">Select Approval</div>
                                        <button onClick={() => { setApproval(""); setIsApprovalDropdownOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${!approval ? "text-blue-600 font-bold" : "text-gray-600"}`}>
                                            Any {!approval && <Check className="w-3 h-3" />}
                                        </button>
                                        <div className="max-h-60 overflow-y-auto">
                                            {approvalTypes.map((app) => {
                                                const name = typeof app === "string" ? app : app?.name || "Unknown";
                                                return (
                                                    <button key={name} onClick={() => { setApproval(name); setIsApprovalDropdownOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${approval === name ? "text-blue-600 font-bold" : "text-gray-600"}`}>
                                                        {name} {approval === name && <Check className="w-3 h-3" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Budget */}
                        <div className="relative" ref={budgetRef}>
                            <button
                                onClick={() => setIsBudgetDropdownOpen(!isBudgetDropdownOpen)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-gray-50 font-semibold text-gray-700 transition cursor-pointer ${isHeader ? "text-[10px]" : "text-sm"}`}
                            >
                                <span className="max-w-[100px] truncate">{getBudgetLabel}</span>
                                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isBudgetDropdownOpen ? "rotate-180" : ""}`} />
                            </button>
                            <AnimatePresence>
                                {isBudgetDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-[1000] left-1/2 -translate-x-1/2"
                                    >
                                        <div className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-50">Select Budget</div>
                                        <button onClick={() => { selectBudget({}); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${!minPrice && !maxPrice ? "text-blue-600 font-bold" : "text-gray-600"}`}>
                                            Any Budget {!minPrice && !maxPrice && <Check className="w-3 h-3" />}
                                        </button>
                                        <div className="max-h-60 overflow-y-auto">
                                            {priceRanges.map((range) => (
                                                <button key={range.label} onClick={() => { selectBudget(range); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${String(minPrice) === String(range.min) && String(maxPrice) === String(range.max) ? "text-blue-600 font-bold" : "text-gray-600"}`}>
                                                    {range.label} {String(minPrice) === String(range.min) && String(maxPrice) === String(range.max) && <Check className="w-3 h-3" />}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                  </>
                )}

                {/* 3. SEARCH BUTTON */}
                <button
                    onClick={() => handleSearch()}
                    className={`bg-red-500 cursor-pointer hover:bg-red-600 text-white font-medium h-full rounded-full lg:rounded-xl transition-colors duration-300 shadow-md flex items-center justify-center whitespace-nowrap flex-shrink-0 z-10 ${isHeader ? "px-4 md:px-6 text-xs" : "px-5 md:px-10 text-sm md:text-base"
                        }`}
                    aria-label="Submit property search"
                >
                    Search
                </button>

                {/* Validation Error Message - Tooltip Design */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 mt-3 bg-[#fff9e6] border border-[#fef3c7] rounded-md px-6 py-2 flex items-center gap-3 shadow-[0_15px_40px_rgba(0,0,0,0.12)] z-[100] w-[46%] before:content-[''] before:absolute before:bottom-full before:left-8 before:border-[10px] before:border-transparent before:border-b-[#fff9e6]"
                        >
                            <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                            <span className="text-amber-900 text-sm font-semibold tracking-tight">{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default PropertySearchBar;
