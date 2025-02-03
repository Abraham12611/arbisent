import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import PriceDashboard from "@/components/PriceDashboard";
import About from "@/components/About";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <Hero />
      <PriceDashboard />
      <About />
      <Footer />
    </div>
  );
};

export default Index;