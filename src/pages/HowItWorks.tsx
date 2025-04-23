import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, BellRing, Users, PackagePlus, CheckCircle, ArrowRight } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: Megaphone,
      title: "1. Report an Issue or Offer Food",
      description: "See a problem in your community (like needed repairs or stray animals) or have surplus food to donate? Use our simple form to report it with details, location, and optionally, a photo.",
      color: "text-purple-500",
      bgColor: "bg-purple-100",
    },
    {
      icon: BellRing,
      title: "2. Connect & Notify",
      description: "Our platform analyzes the report. For issues, relevant NGOs or local bodies interested in that category are automatically notified. Food donations become visible to registered volunteers.",
      color: "text-blue-500",
      bgColor: "bg-blue-100",
    },
    {
      icon: Users,
      title: "3. Volunteers Take Action",
      description: "Registered volunteers browse available tasks, including food donation pickups. They can claim a task based on their availability and location. NGOs can also post specific volunteer opportunities.",
      color: "text-teal-500",
      bgColor: "bg-teal-100",
    },
    {
        icon: PackagePlus,
        title: "4. Food Delivery (Example Task)",
        description: "A volunteer claims a food donation pickup, coordinates with the donor, collects the food, and delivers it to a designated distribution point or directly to individuals in need.",
        color: "text-green-500",
        bgColor: "bg-green-100",
    },
    {
      icon: CheckCircle,
      title: "5. Resolution & Impact",
      description: "NGOs work on resolving reported issues. Volunteers complete tasks like food delivery. Progress is tracked, and contributors earn recognition for making a positive impact.",
      color: "text-orange-500",
      bgColor: "bg-orange-100",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col"
    >
      <Navbar />
      <main className="flex-grow pt-24 md:pt-32">
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4">
            {/* Header Section */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto text-center mb-16"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">How Mero Samaj Works</h1>
              <p className="text-xl text-muted-foreground">
                Connecting communities, volunteers, and organizations for collective impact. Here's a step-by-step guide.
              </p>
            </motion.div>

            {/* Steps Section */}
            <motion.div
              className="relative max-w-4xl mx-auto" // Add relative positioning for the line
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Optional: Vertical connecting line (adjust styling as needed) */}
              <div className="absolute left-1/2 md:left-6 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2 md:translate-x-0 hidden md:block" aria-hidden="true"></div>

              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  className="relative mb-12 md:mb-16 md:pl-16" // Add padding for desktop layout
                  variants={itemVariants}
                >
                   {/* Dot on the line */}
                   <div className={`absolute left-1/2 md:left-6 top-1 w-5 h-5 rounded-full ${step.bgColor} border-4 border-background -translate-x-1/2 md:-translate-x-1/2 transform hidden md:flex items-center justify-center`}>
                       <div className={`w-2 h-2 rounded-full ${step.color.replace('text-', 'bg-')}`}></div>
                   </div>

                  <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className={`flex flex-row items-start gap-4 ${step.bgColor}/30 p-4 md:p-6`}>
                      <div className={`p-3 rounded-full ${step.bgColor} hidden md:block`}>
                          <step.icon className={`h-6 w-6 ${step.color}`} />
                      </div>
                      <div>
                          <CardTitle className="text-xl md:text-2xl">{step.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 pt-2 md:pt-4">
                      <p className="text-foreground/80">{step.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

             {/* Call to Action Section */}
             <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: steps.length * 0.15 + 0.2, duration: 0.6 }}
                className="mt-16 text-center"
            >
                <h2 className="text-3xl font-semibold mb-6">Ready to Get Involved?</h2>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                     <Button asChild size="lg" className="btn-gradient rounded-full">
                       <Link to="/report">
                         Report an Issue <ArrowRight className="ml-2 h-5 w-5" />
                       </Link>
                     </Button>
                     <Button asChild size="lg" variant="outline" className="rounded-full">
                       <Link to="/volunteer">
                         Become a Volunteer <Users className="ml-2 h-5 w-5" />
                       </Link>
                     </Button>
                     <Button asChild size="lg" variant="secondary" className="rounded-full">
                       <Link to="/donate">
                         Donate <PackagePlus className="ml-2 h-5 w-5" />
                       </Link>
                     </Button>
                </div>
            </motion.div>

          </div>
        </section>
      </main>
      <Footer />
    </motion.div>
  );
};

export default HowItWorks;