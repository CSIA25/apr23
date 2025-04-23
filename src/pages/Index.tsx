// src/pages/Index.tsx
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/sections/hero-section";
import { IssuesSection } from "@/components/sections/issues-section";
import { OrganizationsSection } from "@/components/sections/organizations-section";
import { ImpactSection } from "@/components/sections/impact-section";
import { CallToAction } from "@/components/sections/call-to-action";

const Home = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col"
    >
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <IssuesSection />
        <OrganizationsSection />
        {/* --- Remove Leaderboard Section Usage --- */}
        {/* <DonationLeaderboardSection /> */}
        <ImpactSection />
        <CallToAction />
      </main>
      <Footer />
    </motion.div>
  );
};

export default Home;