import React from 'react'
import HeroSection from './Hero'
import Comparison from './Comparison'
import HowItWorks from './HowItWorks'
import ProofSection from './ProofSection'
import Pricing from './Pricing'

export const AgentInfo = () => {
  return (
    <div className="min-h-screen bg-[#fffbf7]">
      <HeroSection />
      <Comparison />
      <HowItWorks />
      <ProofSection />
      <Pricing />
    </div>
  )
}
