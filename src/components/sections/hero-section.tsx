
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BannerScene from "../three-scene/banner-scene";
import { ArrowRight, Heart, Lightbulb, Users } from "lucide-react";

export const HeroSection = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <section className="relative min-h-screen pt-24 overflow-hidden">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0 opacity-60">
        <BannerScene />
      </div>
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background z-10"></div>
      
      <div className="container mx-auto px-4 relative z-20">
        <motion.div
          className="flex flex-col items-center text-center pt-16 md:pt-24"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 
            className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-teal-500 to-orange-500"
            variants={itemVariants}
          >
            Connect. Collaborate. <br />Create Change.
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-foreground/80 mb-8 max-w-2xl"
            variants={itemVariants}
          >
            A central hub for communities to address social issues, 
            connect with NGOs, and make a real difference together.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 mb-16"
            variants={itemVariants}
          >
            <Button asChild size="lg" className="btn-gradient rounded-full text-lg px-8">
              <Link to="/report">
                Report an Issue <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full text-lg border-2">
              <Link to="/how-it-works">See How It Works</Link>
            </Button>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 mt-8"
            variants={containerVariants}
          >
            {[
              {
                icon: <Lightbulb className="h-10 w-10 text-purple-500" />,
                title: "Report Issues",
                description: "Easily report community issues with location and evidence.",
                delay: 0.4,
              },
              {
                icon: <Users className="h-10 w-10 text-teal-500" />,
                title: "Connect with NGOs",
                description: "Bridge the gap between organizations and those in need.",
                delay: 0.5,
              },
              {
                icon: <Heart className="h-10 w-10 text-orange-500" />,
                title: "Volunteer & Donate",
                description: "Contribute your time or resources to help solve issues.",
                delay: 0.6,
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="bg-card/30 backdrop-blur-sm p-6 rounded-xl border border-border"
                variants={itemVariants}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <div className="mb-4">{item.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-foreground/70">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
      
      {/* Wave separator */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full">
          <path 
            fill="currentColor" 
            fillOpacity="0.05" 
            d="M0,224L48,213.3C96,203,192,181,288,154.7C384,128,480,96,576,90.7C672,85,768,107,864,128C960,149,1056,171,1152,165.3C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
        </svg>
      </div>
    </section>
  );
};
