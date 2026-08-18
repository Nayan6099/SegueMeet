"use client";

import LandingHero from "../../components/landing/LandingHero";
import LandingFeatures from "../../components/landing/LandingFeatures";
import LandingHowItWorks from "../../components/landing/LandingHowItWorks";
import LandingTestimonials from "../../components/landing/LandingTestimonials";
import LandingFAQ from "../../components/landing/LandingFAQ";
import LandingCTA from "../../components/landing/LandingCTA";
import LandingFooter from "../../components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="font-sans text-gray-800 antialiased scroll-smooth">
      <LandingHero />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingTestimonials />
      <LandingFAQ />
      <LandingCTA />
      <LandingFooter />
    </div>
  );
}
