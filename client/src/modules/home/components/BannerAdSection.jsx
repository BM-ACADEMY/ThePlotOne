import { useState, useEffect } from "react";
import axios from "axios";
import { getImageUrl } from "@/utils/imageUrl";

// Import Swiper React components and styles
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

const BannerAdSection = () => {
  const [activeAds, setActiveAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveAds = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/banner-ads/active`,
        );
        if (response.data.success) {
          setActiveAds(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching active banner ads:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchActiveAds();
  }, []);

  if (loading)
    return (
      <section className="w-full my-2">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="w-full aspect-[4/1] bg-gray-200 animate-pulse rounded-xl"></div>
        </div>
      </section>
    );

  if (activeAds.length === 0) return null;

  return (
    <section className="w-full py-4">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="w-full overflow-hidden shadow-md rounded-2xl border border-gray-100">
          <Swiper
            autoHeight={true}
            modules={[Autoplay, Pagination]}
            spaceBetween={0}
            slidesPerView={1}
            loop={activeAds.length > 1}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
            className="w-full overflow-hidden"
          >
            {activeAds.map((ad) => (
              <SwiperSlide key={ad._id} className="!w-full !m-0 !p-0">
                <div
                  className={`relative w-full h-auto duration-500 ${ad.linkUrl?.trim() ? "hover:opacity-95 cursor-pointer" : ""}`}
                >
                  {ad.linkUrl?.trim() ? (
                    <a
                      href={ad.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full h-full"
                    >
                      <AdContent ad={ad} />
                    </a>
                  ) : (
                    <AdContent ad={ad} />
                  )}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
};

const AdContent = ({ ad }) => (
  <img
    src={getImageUrl(ad.imageUrl)}
    alt={ad.title}
    className="w-full h-auto block transition-transform duration-700"
    loading="lazy"
  />
);

export default BannerAdSection;
