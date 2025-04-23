
import React from "react";
import { Tilt } from "react-tilt";
import { cn } from "@/lib/utils";

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

const defaultOptions = {
  reverse: false,
  max: 15,
  perspective: 1000,
  scale: 1.05,
  speed: 1000,
  transition: true,
  axis: null,
  reset: true,
  easing: "cubic-bezier(.03,.98,.52,.99)",
}

export const TiltCard = ({ 
  children, 
  className,
  ...props 
}: TiltCardProps) => {
  return (
    <Tilt options={defaultOptions} className={cn("w-full", className)} {...props}>
      <div className="w-full h-full">
        {children}
      </div>
    </Tilt>
  );
};
