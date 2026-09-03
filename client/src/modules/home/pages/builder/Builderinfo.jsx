import React from 'react'
import { Hero } from './Hero'
import Comparison from './Comparison'
import HowItWorks from './HowItWorks'
import Pricing from './Pricing'

export const BuilderInfo = () => {
  return (
    <div className="min-h-screen bg-[#fffbf7]">
      <Hero />
      <Comparison />
      <HowItWorks />
      <Pricing />
    </div>
  )
}

export default BuilderInfo