import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const LocationContext = createContext(null);

export const LocationProvider = ({ children }) => {
    const [location, setLocation] = useState({
        city: "Pondicherry",
        state: "Puducherry",
        locality: "", // Added locality
        display: "Pondicherry",
        coordinates: null,
        loading: true
    });

    const detectLocation = () => {
        if (!navigator.geolocation) {
            console.error("Geolocation is not supported by this browser.");
            return;
        }

        setLocation(prev => ({ ...prev, loading: true }));

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // Using Nominatim for free reverse geocoding
                    const res = await axios.get(
                        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
                    );
                    const data = res.data;
                    const city = data.address.city || data.address.town || data.address.village || data.address.county || "Detected Location";
                    const locality = data.address.suburb || data.address.neighbourhood || data.address.residential || data.address.subdistrict || "";
                    const state = data.address.state || "";

                    const newLocation = {
                        city,
                        locality,
                        state,
                        display: locality || city,
                        coordinates: { lat: latitude, lng: longitude },
                        loading: false
                    };
                    setLocation(newLocation);
                    localStorage.setItem("userLocation", JSON.stringify(newLocation));
                } catch (error) {
                    console.error("Error with reverse geocoding:", error);
                    setLocation(prev => ({ ...prev, loading: false }));
                }
            },
            (error) => {
                console.error("Error getting location:", error);
                setLocation(prev => ({ ...prev, loading: false }));
            }
        );
    };

    useEffect(() => {
        const savedLocation = localStorage.getItem("userLocation");
        if (savedLocation) {
            try {
                setLocation({ ...JSON.parse(savedLocation), loading: false });
            } catch (e) {
                console.error("Error parsing saved location", e);
                detectLocation();
            }
        } else {
            detectLocation();
        }
    }, []);

    return (
        <LocationContext.Provider value={{ ...location, detectLocation }}>
            {children}
        </LocationContext.Provider>
    );
};

export const useLocation = () => {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error("useLocation must be used within a LocationProvider");
    }
    return context;
};
