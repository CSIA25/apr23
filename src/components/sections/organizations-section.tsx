
import { motion } from "framer-motion";
import { TiltCard } from "@/components/ui/tilt-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, MapPin, Check } from "lucide-react";
import { Link } from "react-router-dom";

const organizations = [
  {
    id: 1,
    name: "Community Helpers Network",
    description: "Providing shelter, food, and resources to homeless individuals and families.",
    location: "Kathmandu",
    impact: "23,400+ people helped",
    category: "Homelessness",
    image: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=3387&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "Food For All Initiative",
    description: "Distributing meals and food supplies to fight hunger in vulnerable communities.",
    location: "Pokhara",
    impact: "120,000+ meals served",
    category: "Food Security",
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=3540&auto=format&fit=crop",
  },
  {
    id: 3,
    name: "Animal Rescue Foundation",
    description: "Rescuing, rehabilitating, and rehoming abandoned and mistreated animals.",
    location: "Bhaktapur",
    impact: "5,200+ animals rescued",
    category: "Animal Welfare",
    image: "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?q=80&w=3388&auto=format&fit=crop",
  },
];

export const OrganizationsSection = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
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
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">Partner Organizations</h2>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
            Meet the amazing organizations working tirelessly to make a difference in our communities.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {organizations.map((org) => (
            <motion.div key={org.id} variants={itemVariants}>
              <TiltCard className="h-full">
                <div className="h-full rounded-xl overflow-hidden border border-border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-shadow duration-300">
                  <div className="relative h-48">
                    <img
                      src={org.image}
                      alt={org.name}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
                    <Badge className="absolute top-4 left-4 bg-background/70 backdrop-blur-sm">
                      {org.category}
                    </Badge>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{org.name}</h3>
                    
                    <div className="flex items-center text-sm text-foreground/70 mb-4">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{org.location}</span>
                    </div>
                    
                    <p className="text-foreground/80 mb-4">{org.description}</p>
                    
                    <div className="flex items-center text-sm font-medium text-teal-500 mb-6">
                      <Check className="h-4 w-4 mr-1" />
                      <span>{org.impact}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Button asChild variant="outline" size="sm" className="rounded-full">
                        <Link to={`/organizations/${org.id}`}>View Profile</Link>
                      </Button>
                      
                      <Button asChild variant="ghost" size="sm" className="rounded-full">
                        <Link to={`/donate/${org.id}`}>Donate</Link>
                      </Button>
                    </div>
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
          <Button asChild size="lg" className="btn-gradient rounded-full">
            <Link to="/organizations">
              View All Organizations <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
