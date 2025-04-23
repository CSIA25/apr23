// src/pages/Organizations.tsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TiltCard } from "@/components/ui/tilt-card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, MapPin, Users, Globe, Loader2, AlertCircle } from "lucide-react"; // Removed Calendar, Award, Check
import { getFirestore, collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore"; // Import Firestore
import { app } from "../firebase"; // Adjust path if needed
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"; // Import Card components

// Interface for NGO data fetched from Firestore
interface NgoData {
    id: string; // User UID (which is the doc ID in ngo_profiles)
    orgName: string;
    description: string;
    address: string;
    website?: string;
    focusAreas: string[];
    contactEmail: string; // Added from ngo_profiles for potential display
    contactPhone?: string; // Added
    // Add other fields you might want to display, e.g., logoUrl if available
    submittedAt: Timestamp; // To potentially sort or display registration date
}

const OrganizationsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [organizations, setOrganizations] = useState<NgoData[]>([]); // State for fetched orgs
  const [filteredOrgs, setFilteredOrgs] = useState<NgoData[]>([]); // State for filtered orgs
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate(); // Initialize navigate hook

  const db = getFirestore(app);

   // Fetch approved organizations
   useEffect(() => {
    const fetchApprovedNgos = async () => {
        setLoading(true);
        setError(null);
        console.log("OrganizationsPage: Fetching approved NGOs...");
        try {
            const q = query(
                collection(db, "ngo_profiles"),
                where("verificationStatus", "==", "approved"),
                orderBy("orgName", "asc") // Order alphabetically
            );
            const querySnapshot = await getDocs(q);
            const fetchedNgos: NgoData[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // Basic check for essential display fields
                if (data.orgName && data.description && data.address) {
                    fetchedNgos.push({
                        id: doc.id,
                        orgName: data.orgName,
                        description: data.description,
                        address: data.address,
                        website: data.website,
                        focusAreas: data.focusAreas || [],
                        contactEmail: data.contactEmail,
                        contactPhone: data.contactPhone,
                        submittedAt: data.submittedAt,
                        // Add other fields as needed from data
                    } as NgoData); // Assert type more safely if needed
                } else {
                    console.warn("OrganizationsPage: Skipping NGO profile with missing essential fields:", doc.id, data);
                }
            });
            console.log(`OrganizationsPage: Found ${fetchedNgos.length} approved NGOs.`);
            setOrganizations(fetchedNgos);
            setFilteredOrgs(fetchedNgos);
        } catch (err: any) {
            console.error("OrganizationsPage: Error fetching approved NGOs:", err);
            setError("Failed to load organizations. Please try again later.");
        } finally {
            setLoading(false);
            console.log("OrganizationsPage: NGO Fetching finished.");
        }
    };

    fetchApprovedNgos();
}, [db]); // Dependency on db


  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    if (term.trim() === "") {
      setFilteredOrgs(organizations); // Reset to all fetched orgs
    } else {
      const filtered = organizations.filter(
        org =>
          org.orgName.toLowerCase().includes(term) ||
          org.description.toLowerCase().includes(term) ||
          org.address.toLowerCase().includes(term) || // Added address search
          org.focusAreas.some(area => area.toLowerCase().includes(term))
      );
      setFilteredOrgs(filtered);
    }
  };

  // Removed hardcoded organizationsData

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col"
    >
      <Navbar />
      <main className="flex-grow pt-24 pb-16"> {/* Adjusted padding */}
        <section>
          <div className="container mx-auto px-4">
            {/* Header */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl mx-auto text-center mb-12"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Partner Organizations</h1>
              <p className="text-lg text-muted-foreground"> {/* Adjusted text size */}
                Discover verified organizations making a positive impact in our communities.
              </p>
            </motion.div>

            {/* Search/Filter Bar */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-10"
            >
              <div className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto"> {/* Adjusted max-width */}
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /> {/* Adjusted icon size */}
                  <Input
                    placeholder="Search by name, focus area, location..." // Updated placeholder
                    className="pl-10 h-10" // Ensure consistent height
                    value={searchTerm}
                    onChange={handleSearch}
                    disabled={loading}
                  />
                </div>
                {/* Filter button can be added later */}
                {/* <Button variant="outline" className="md:w-auto flex items-center h-10">
                  <Filter className="h-4 w-4 mr-2" /> Filter
                </Button> */}
              </div>
            </motion.div>

            {/* Organizations Grid / Loading / Error States */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="min-h-[300px]" // Added min-height for loading/empty state
            >
                 {loading && (
                      <div className="flex justify-center items-center p-16">
                          <Loader2 className="h-12 w-12 animate-spin text-primary" />
                      </div>
                 )}
                  {error && (
                     <div className="flex flex-col items-center justify-center text-center text-destructive bg-destructive/10 p-6 rounded-lg">
                         <AlertCircle className="h-8 w-8 mb-2"/>
                         <p className="font-medium">Error Loading Organizations</p>
                         <p className="text-sm">{error}</p>
                     </div>
                  )}
                  {!loading && !error && filteredOrgs.length === 0 && (
                      <p className="text-muted-foreground text-center py-16 text-lg">
                          {searchTerm ? 'No organizations match your search.' : 'No verified organizations found yet.'}
                     </p>
                  )}

                  {!loading && !error && filteredOrgs.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filteredOrgs.map((org, index) => (
                            <TiltCard key={org.id} className="h-full">
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }} // Faster stagger
                                className="bg-card border rounded-xl overflow-hidden h-full flex flex-col shadow-sm hover:shadow-lg transition-shadow duration-300"
                              >
                                <CardHeader className="pb-3">
                                     {/* Optional Logo Placeholder */}
                                     {/* <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center mb-3">
                                         <Building className="h-6 w-6 text-muted-foreground" />
                                     </div> */}
                                    <CardTitle className="text-lg leading-tight">{org.orgName}</CardTitle>
                                    <CardDescription className="text-xs flex items-center pt-1">
                                          <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                                          <span>{org.address}</span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow pt-0 pb-4 px-5"> {/* Adjusted padding */}
                                  <p className="text-muted-foreground text-sm mb-3 line-clamp-4">{org.description}</p> {/* Increased line clamp */}
                                   <div className="space-y-1 text-xs">
                                       {org.website && (
                                           <div className="flex items-center gap-1.5 text-muted-foreground">
                                               <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                                                <a href={org.website.startsWith('http') ? org.website : `https://${org.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary truncate hover:underline">{org.website}</a>
                                           </div>
                                       )}
                                        {org.focusAreas.length > 0 && (
                                            <div className="flex items-start gap-1.5 pt-1">
                                                <Users className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                                                <div className="flex flex-wrap gap-1">
                                                    {org.focusAreas.map(area => <Badge key={area} variant="secondary" className="px-1.5 py-0">{area}</Badge>)}
                                                </div>
                                            </div>
                                        )}
                                   </div>
                                </CardContent>

                                <CardFooter className="p-4 pt-0 flex justify-between items-center"> {/* Adjusted padding */}
                                   {/* FIX: Use onClick for navigation instead of asChild here */}
                                   <Button
                                       variant="outline"
                                       size="sm"
                                       onClick={() => navigate(`/organizations/${org.id}`)} // Navigate programmatically
                                   >
                                       View Details
                                   </Button>
                                    {/* Donate button can still use asChild if needed, or onClick */}
                                    <Button asChild variant="default" size="sm">
                                        <Link to={`/donate?ngo=${org.id}`}>Donate</Link>
                                    </Button>
                                </CardFooter>
                              </motion.div>
                            </TiltCard>
                          ))}
                      </div>
                  )}
             </motion.div>

          </div>
        </section>
      </main>
      <Footer />
    </motion.div>
  );
};

export default OrganizationsPage;