
import { motion } from "framer-motion";
import { TiltCard } from "@/components/ui/tilt-card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const issues = [
  {
    id: 1,
    title: "Homelessness",
    description: "Help connect homeless individuals with shelters and support services.",
    image: "https://images.unsplash.com/photo-1518398046578-8cca57782e17?q=80&w=3540&auto=format&fit=crop",
    color: "from-purple-500/20 to-purple-700/20",
  },
  {
    id: 2,
    title: "Food Insecurity",
    description: "Support food banks and meal programs to fight hunger in communities.",
    image: "https://images.unsplash.com/photo-1594708767771-a5e9d3f88538?q=80&w=3510&auto=format&fit=crop",
    color: "from-teal-500/20 to-teal-700/20",
  },
  {
    id: 3,
    title: "Animal Welfare",
    description: "Help rescue abandoned animals and support animal shelters.",
    image: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?q=80&w=3571&auto=format&fit=crop",
    color: "from-orange-500/20 to-orange-700/20",
  },
  {
    id: 4,
    title: "Education Access",
    description: "Support initiatives making education accessible to underserved communities.",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=3422&auto=format&fit=crop",
    color: "from-purple-500/20 to-purple-700/20",
  },
];

export const IssuesSection = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">Key Issues We Address</h2>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
            Our platform connects communities to solve these pressing social challenges together.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {issues.map((issue) => (
            <motion.div key={issue.id} variants={itemVariants}>
              <TiltCard className="h-full">
                <div className="relative h-full rounded-xl overflow-hidden border border-border group">
                  <div className="absolute inset-0 bg-gradient-to-b from-background/60 to-background/90 z-10"></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-background/60 to-background/90 z-10"></div>
                  <div className={`absolute inset-0 bg-gradient-to-br ${issue.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0`}></div>
                  
                  <img 
                    src={issue.image} 
                    alt={issue.title}
                    className="absolute h-full w-full object-cover object-center transform group-hover:scale-110 transition-transform duration-700"
                  />
                  
                  <div className="relative z-20 p-6 flex flex-col h-full">
                    <h3 className="text-xl font-semibold mb-2">{issue.title}</h3>
                    <p className="text-foreground/70 mb-6 flex-grow">{issue.description}</p>
                    <Button asChild variant="ghost" className="justify-start pl-0 hover:pl-2 transition-all duration-300 w-fit">
                      <Link to={`/issues/${issue.id}`}>
                        Learn More <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mt-12 text-center"
        >

        </motion.div>
      </div>
    </section>
  );
};
