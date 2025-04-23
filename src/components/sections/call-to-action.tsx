
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, Users } from "lucide-react";

export const CallToAction = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-purple-900/30 via-purple-900/10 to-teal-900/10 overflow-hidden relative">
      {/* Abstract shapes */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            Ready to <span className="text-gradient">Make a Difference</span>?
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-xl text-foreground/80 mb-10"
          >
            Join our community of change-makers today and help build a better tomorrow.
            Every contribution matters, whether you're reporting issues, volunteering time,
            or offering resources.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
          >
            {[
              {
                title: "Report an Issue",
                description: "Identify problems in your community that need attention.",
                icon: <MapPin className="h-12 w-12 mb-4 text-purple-500" />,
                link: "/report",
                color: "bg-purple-500/10 border-purple-500/20",
              },
              {
                title: "Volunteer",
                description: "Contribute your time and skills to help solve community issues.",
                icon: <Users className="h-12 w-12 mb-4 text-teal-500" />,
                link: "/volunteer",
                color: "bg-teal-500/10 border-teal-500/20",
              },
              {
                title: "Donate",
                description: "Provide resources and support to community initiatives.",
                icon: <Heart className="h-12 w-12 mb-4 text-orange-500" />,
                link: "/donate",
                color: "bg-orange-500/10 border-orange-500/20",
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + (index * 0.1) }}
                viewport={{ once: true, margin: "-100px" }}
                className={`p-6 rounded-xl border ${item.color} flex flex-col items-center text-center`}
              >
                {item.icon}
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-foreground/70 mb-4">{item.description}</p>
                <Button asChild variant="ghost" className="mt-auto group">
                  <Link to={item.link}>
                    Get Started 
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <Button asChild size="lg" className="btn-gradient rounded-full px-8 text-lg">
              <Link to="/register">
                Join Mero Samaj Today <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

function MapPin(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
