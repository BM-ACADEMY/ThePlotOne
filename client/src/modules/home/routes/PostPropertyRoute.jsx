import React from 'react'
import PostPropertySteps from '../pages/postproperty/PostPropertySteps'
import WhyPostProperty from '../pages/postproperty/WhyPostProperty'
import AdditionalBenefits from '../pages/postproperty/AdditionalBenefits'
import Testimonials from '../pages/postproperty/Testimonials'
import FinalCTA from '../pages/postproperty/FinalCTA'
import FAQSection from '../pages/postproperty/FAQSection'
export const PostPropertyRoute = () => {
  return (
    <>
      <PostPropertySteps />
      <WhyPostProperty />
      <AdditionalBenefits />
      <Testimonials />
      {/* <FinalCTA /> */}
      <FAQSection />
    </>
  )
}
