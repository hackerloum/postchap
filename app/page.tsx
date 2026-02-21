import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { LogoWall } from "@/components/marketing/LogoWall";
import { ProductSection } from "@/components/landing/product-section";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Security } from "@/components/landing/security";
import { Integrations } from "@/components/landing/integrations";
import { Testimonials } from "@/components/landing/testimonials";
import { Pricing } from "@/components/landing/pricing";
import { FAQ } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <main className="min-h-screen pt-16">
      <Nav />
      <Hero />
      <LogoWall />
      <ProductSection />
      <FeatureGrid />
      <HowItWorks />
      <Security />
      <Integrations />
      <Testimonials />
      <Pricing />
      <FAQ />
      <Footer />
    </main>
  );
}
