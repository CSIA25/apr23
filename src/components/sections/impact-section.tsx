
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Card } from "@/components/ui/card";
import { TiltCard } from "@/components/ui/tilt-card";
import { BarChart, AreaChart, LineChart } from "@/components/ui/charts";

export function ImpactSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.6], [0, 1, 1]);
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.6], [0.8, 1, 1]);

  return (
    <section ref={ref} className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          style={{ opacity, scale }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Impact</h2>
          <p className="text-muted-foreground">
            Through collaborative efforts, we've made significant progress in addressing
            community challenges. Here's the impact we've created together.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <TiltCard className="bg-background shadow-lg rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">Issues Resolved</h3>
            <div className="h-64">
              <BarChart
                data={[
                  { name: "Jan", value: 40 },
                  { name: "Feb", value: 30 },
                  { name: "Mar", value: 45 },
                  { name: "Apr", value: 60 },
                  { name: "May", value: 75 },
                  { name: "Jun", value: 55 },
                ]}
              />
            </div>
            <p className="mt-4 text-muted-foreground">
              75+ community issues successfully resolved in the past 6 months.
            </p>
          </TiltCard>

          <TiltCard className="bg-background shadow-lg rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">Volunteer Hours</h3>
            <div className="h-64">
              <AreaChart
                data={[
                  { name: "Jan", value: 400 },
                  { name: "Feb", value: 300 },
                  { name: "Mar", value: 550 },
                  { name: "Apr", value: 700 },
                  { name: "May", value: 900 },
                  { name: "Jun", value: 800 },
                ]}
              />
            </div>
            <p className="mt-4 text-muted-foreground">
              3,650+ hours contributed by our dedicated volunteers.
            </p>
          </TiltCard>

          <TiltCard className="bg-background shadow-lg rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">Donations</h3>
            <div className="h-64">
              <LineChart
                data={[
                  { name: "Jan", value: 2000 },
                  { name: "Feb", value: 3000 },
                  { name: "Mar", value: 2500 },
                  { name: "Apr", value: 4500 },
                  { name: "May", value: 5000 },
                  { name: "Jun", value: 7000 },
                ]}
              />
            </div>
            <p className="mt-4 text-muted-foreground">
              $24,000+ in donations allocated to community projects.
            </p>
          </TiltCard>
        </div>
      </div>
    </section>
  );
}
