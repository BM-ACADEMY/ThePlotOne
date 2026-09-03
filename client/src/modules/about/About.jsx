import React from "react";
import { Helmet } from "react-helmet-async"; // Helmet is now here
import AboutBanner from "./AboutBanner";
import WhatWeDo from "./WhatWeDo";
import MeetFounder from "./MeetFounder";
import WhyChooseUs from "./WhyChooseUs";
import OurVision from "./OurVision";
import PropertyCTA from "./FindYourProperty";

export default function About() {
  return (
    <>
      {/* SEO META DETAILS */}
      <Helmet>
        <title>About The Plot One | Trusted Experts</title>
        <meta
          name="description"
          content="Learn about The Plot One, your trusted real estate partner in Kottakuppam, Puducherry for buying and selling property."
        />
      </Helmet>

      {/* PAGE CONTENT */}
      <div className="bg-white">
        <AboutBanner />
        <WhatWeDo />
        <MeetFounder />
        <WhyChooseUs />
        <OurVision />
        {/* <PropertyCTA /> */}
        {/* Next sections will go here */}
      </div>
    </>
  );
}
