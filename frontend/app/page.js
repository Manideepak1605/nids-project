import Hero from "@/components/landing_page/Hero";
import Stats from "@/components/landing_page/Stats";
import HowItWorks from "@/components/landing_page/HowItWorks";
import Features from "@/components/landing_page/Features";
import TechStack from "@/components/landing_page/TechStack";
import Footer from "@/components/landing_page/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-[#0b0b14] to-black text-gray-200">
      <Hero />
      <Stats />
      <HowItWorks />
      <Features />
      <TechStack />
      <Footer />
    </main>
  );
}
