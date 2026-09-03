import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const NavContext = createContext(null);

export const NavProvider = ({ children }) => {
    const [businessTypes, setBusinessTypes] = useState([]);
    const [propertyCategories, setPropertyCategories] = useState([]);
    const [propertyTypes, setPropertyTypes] = useState([]);
    const [locations, setLocations] = useState([]);
    const [approvalTypes, setApprovalTypes] = useState([]);
    const [priceRanges, setPriceRanges] = useState([]);
    const [maxPrice, setMaxPrice] = useState(10000000);
    const [isLoading, setIsLoading] = useState(true);
    const [isCallbackModalOpen, setIsCallbackModalOpen] = useState(false);

    useEffect(() => {
        const fetchNavData = async () => {
            try {
                const [businessRes, filtersRes, typesRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/business-types?status=active`),
                    axios.get(`${import.meta.env.VITE_API_URL}/properties/filters`),
                    axios.get(`${import.meta.env.VITE_API_URL}/property-types?status=active`)
                ]);

                setBusinessTypes(businessRes.data);
                setPropertyCategories(filtersRes.data.categories || []);
                setPropertyTypes(typesRes.data);
                setLocations(filtersRes.data.locations || []);
                setApprovalTypes(filtersRes.data.approvals || []);
                setPriceRanges(filtersRes.data.priceRanges || []);
                setMaxPrice(filtersRes.data.maxPrice || 10000000);
            } catch (error) {
                console.error("Error fetching navigation data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNavData();
    }, []);

    return (
        <NavContext.Provider value={{ 
            businessTypes, 
            propertyCategories, 
            propertyTypes, 
            locations, 
            approvalTypes, 
            priceRanges, 
            maxPrice, 
            isLoading,
            isCallbackModalOpen,
            setIsCallbackModalOpen
        }}>
            {children}
        </NavContext.Provider>
    );
};

export const useNav = () => {
    const context = useContext(NavContext);
    if (!context) {
        throw new Error("useNav must be used within a NavProvider");
    }
    return context;
};
