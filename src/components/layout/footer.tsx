
import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Github, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 via-teal-500 to-orange-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">MS</span>
            </div>
            <span className="font-bold text-xl text-gradient">Mero Samaj</span>
          </div>
          <p className="text-foreground/70 mb-6 max-w-md">
            A centralized social impact platform connecting individuals, NGOs, volunteers, 
            and donors to address critical societal issues.
          </p>
          <div className="flex space-x-4">
            <Button size="icon" variant="ghost" className="rounded-full">
              <Facebook className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost" className="rounded-full">
              <Twitter className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost" className="rounded-full">
              <Instagram className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost" className="rounded-full">
              <Github className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
          <ul className="space-y-2">
            <li>
              <Link to="/about" className="text-foreground/70 hover:text-foreground transition-colors">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/how-it-works" className="text-foreground/70 hover:text-foreground transition-colors">
                How It Works
              </Link>
            </li>
            <li>
              <Link to="/report" className="text-foreground/70 hover:text-foreground transition-colors">
                Report Issue
              </Link>
            </li>
            <li>
              <Link to="/organizations" className="text-foreground/70 hover:text-foreground transition-colors">
                Organizations
              </Link>
            </li>
            <li>
              <Link to="/volunteer" className="text-foreground/70 hover:text-foreground transition-colors">
                Volunteer
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-4">Contact Us</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-foreground/70">
              <Mail className="h-4 w-4" />
              <span>info@merosamaj.org</span>
            </li>
            <li className="mt-4">
              <Button className="btn-gradient rounded-full w-full">
                <Link to="/contact">Get in Touch</Link>
              </Button>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="border-t border-border">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-foreground/60 text-sm">
            © {new Date().getFullYear()} Mero Samaj. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="/privacy-policy" className="text-sm text-foreground/60 hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="text-sm text-foreground/60 hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
