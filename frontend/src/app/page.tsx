import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TrustTicker from "@/components/TrustTicker";
import ProductSuite from "@/components/ProductSuite";
import DarkHorizon from "@/components/DarkHorizon";
import CadDeveloperBanner from "@/components/CadDeveloperBanner";
import EditorialQuote from "@/components/EditorialQuote";
import BentoProofGrid from "@/components/BentoProofGrid";
import FailureSimulator from "@/components/FailureSimulator";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-canvas">
      {/* 1. Navigation */}
      <Navbar />

      {/* 2. Hero Section */}
      <Hero />

      {/* 3. Infinite Marquee Ticker */}
      <TrustTicker />

      {/* 4. Bilateral Architecture */}
      <ProductSuite />

      <div className="relative">
        
        <div className="relative z-20 bg-dark-cosmic-stripes shadow-[0_40px_100px_rgba(0,0,0,0.95)]">
          <DarkHorizon />
          <CadDeveloperBanner />
        </div>
        <div className="sticky bottom-0 z-10 w-full min-h-[540px] lg:min-h-[660px] bg-attio-dots flex items-center justify-center overflow-hidden">
          <EditorialQuote />
        </div>

      </div>
      <div className="relative z-30 bg-canvas">
        {/* 6. Bento Grid of Proof */}
        <BentoProofGrid />

        {/* 7. Payment Failure & Safe Recovery Simulator */}
        <FailureSimulator />

        {/* 8. Footer */}
        <Footer />
      </div>
    </main>
  );
}