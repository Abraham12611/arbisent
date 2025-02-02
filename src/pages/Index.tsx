import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import About from "@/components/About";

const Index = () => {
  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <Hero />
      <Features />
      <About />
    </div>
  );
};

export default Index;