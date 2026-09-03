import React, { useEffect } from "react";
import L from "leaflet";
import { Link } from "react-router-dom";
import { formatIndianPrice, formatPriceRange } from "@/utils/formatPrice";
import { getImageUrl } from "@/utils/imageUrl";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  LayersControl,
  LayerGroup,
} from "react-leaflet";

const { BaseLayer, Overlay } = LayersControl;

// Custom marker icon for properties
const customIconUrl = "/assets/marker-custom-optimized.webp";

const CustomIcon = L.icon({
  iconUrl: customIconUrl,
  iconSize: [38, 48], // Size of the icon
  iconAnchor: [19, 48], // Point of the icon which will correspond to marker's location
  popupAnchor: [0, -45], // Point from which the popup should open relative to the iconAnchor
});

const UpdateMapCenter = ({ properties }) => {
  const map = useMap();

  useEffect(() => {
    if (properties.length > 0) {
      const validProperties = properties.filter(
        (p) => p.location?.coordinates?.lat && p.location?.coordinates?.lng,
      );

      if (validProperties.length > 0) {
        const bounds = L.latLngBounds(
          validProperties.map((p) => [
            p.location.coordinates.lat,
            p.location.coordinates.lng,
          ]),
        );
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [properties, map]);

  return null;
};

const MapComponent = ({ properties }) => {
  const defaultPosition = [11.9416, 79.8083];

  // Group properties by category for overlays
  const forSaleProperties = properties.filter(
    (p) => p.basicInfo?.category === "Sale" || p.basicInfo?.category === "Sell",
  );
  const forRentProperties = properties.filter(
    (p) => p.basicInfo?.category === "Rent",
  );
  const otherProperties = properties.filter(
    (p) =>
      p.basicInfo?.category !== "Sale" &&
      p.basicInfo?.category !== "Sell" &&
      p.basicInfo?.category !== "Rent",
  );

  const renderMarkers = (propsList) =>
    propsList.map((property) => {
      if (
        !property.location?.coordinates?.lat ||
        !property.location?.coordinates?.lng
      )
        return null;

      return (
        <Marker
          key={property._id}
          position={[
            property.location.coordinates.lat,
            property.location.coordinates.lng,
          ]}
          icon={CustomIcon}
        >
          <Popup minWidth={180} maxWidth={220}>
            <div className="w-[180px] sm:w-[200px]">
              <Link
                to={`/properties/${property.slug || property._id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <div className="relative h-32 w-full mb-2 rounded-md overflow-hidden">
                  <img
                    src={getImageUrl(
                      property.media?.featuredImage ||
                        property.media?.images?.[0],
                    )}
                    alt={property.basicInfo?.title || "Property"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${property.basicInfo?.category === "Rent" ? "bg-orange-500 text-white" : "bg-blue-600 text-white"}`}
                    >
                      {property.basicInfo?.category}
                    </span>
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1 leading-tight">
                  {property.basicInfo?.title || "Untitled Property"}
                </h3>
                <p className="text-xs text-gray-600 mb-1 truncate">
                  {property.location?.city || "Unknown City"}
                </p>
                <p className="text-sm font-semibold text-blue-600">
                  {formatPriceRange(
                    property.pricing?.sell?.minPrice || property.pricing?.rent?.minRent,
                    property.pricing?.sell?.maxPrice || property.pricing?.rent?.maxRent,
                    property.pricing?.sell?.price || property.pricing?.rent?.monthlyRent || 0
                  )}
                </p>
              </Link>
            </div>
          </Popup>
        </Marker>
      );
    });

  return (
    <div className="h-full w-full rounded-xl overflow-hidden sticky top-24">
      <MapContainer
        center={defaultPosition}
        zoom={13}
        scrollWheelZoom={false}
        className="h-full w-full z-0"
        style={{ height: "100%", minHeight: "500px" }}
      >
        <LayersControl position="topright">
          <BaseLayer name="Street Map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </BaseLayer>
          <BaseLayer checked name="Satellite View">
            <LayerGroup>
              <TileLayer
                attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
              <TileLayer
                attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              />
            </LayerGroup>
          </BaseLayer>

          {properties && properties.length > 0 && (
            <UpdateMapCenter properties={properties} />
          )}

          {forSaleProperties.length > 0 && (
            <Overlay checked name="For Sale">
              <LayerGroup>{renderMarkers(forSaleProperties)}</LayerGroup>
            </Overlay>
          )}

          {forRentProperties.length > 0 && (
            <Overlay checked name="For Rent">
              <LayerGroup>{renderMarkers(forRentProperties)}</LayerGroup>
            </Overlay>
          )}

          {otherProperties.length > 0 && (
            <Overlay checked name="Other Types">
              <LayerGroup>{renderMarkers(otherProperties)}</LayerGroup>
            </Overlay>
          )}
        </LayersControl>
      </MapContainer>
    </div>
  );
};

export default MapComponent;
