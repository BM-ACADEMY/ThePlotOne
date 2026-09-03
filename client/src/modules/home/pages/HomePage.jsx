import { useEffect, useState } from "react";
import axios from "axios";
import { Helmet } from "react-helmet-async";
import HeroSection from "../components/HeroSection";
import PropertyTypeList from "../components/PropertyTypeList";
import BuilderPromoterProperties from "../components/BuilderPromoterProperties";
import FeaturedProperties from "../components/FeaturedProperties";
import BannerAdSection from "../components/BannerAdSection";
import WhyChooseUs from "../components/WhyChooseUs";
import Testimonials from "../components/Testimonials";
import MapComponent from "../components/MapComponent";
import PostPropertyCTA from "../components/PostPropertyCTA";
import RecommendedProperties from "../components/RecommendedProperties";
import MeetKamar from "./MeetKamar";
import AdvertiserTypeSection from "../components/AdvertiserTypeSection";

const HomePage = () => {
  const [mapProperties, setMapProperties] = useState([]);

  useEffect(() => {
    const fetchMapProperties = async () => {
      try {
        // Fetch properties for the map (verified, all properties)
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/properties/fetch-all-property?isVerified=true`,
        );
        if (Array.isArray(res.data.properties)) {
          setMapProperties(res.data.properties);
        } else if (Array.isArray(res.data)) {
          setMapProperties(res.data);
        }
      } catch (error) {
        console.error("Error fetching map properties", error);
      }
    };
    fetchMapProperties();
  }, []);

  return (
    <div>
      <Helmet>
        <title>The Plot One | Buy & Sell in Pondicherry</title>
        <meta
          name="description"
          content="Explore verified plots, villas, and commercial properties in Pondicherry. Trusted real estate experts in Kottakuppam & nearby areas."
        />
      </Helmet>
      <HeroSection />
      <PropertyTypeList />
      <FeaturedProperties />
          <BannerAdSection />


      <RecommendedProperties />
        <AdvertiserTypeSection />
      <BuilderPromoterProperties />
      <MeetKamar />
      {/* <WhyChooseUs /> */}
      <Testimonials />
      <PostPropertyCTA />
    </div>
  );
};

export default HomePage;
