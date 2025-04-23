// src/pages/Volunteer.tsx

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Clock, MapPin, Users, Check, Loader2, AlertCircle, Package, Utensils } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TiltCard } from "@/components/ui/tilt-card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { getFirestore, collection, query, where, getDocs, orderBy, Timestamp, doc, updateDoc, arrayUnion, getDoc, arrayRemove, limit, serverTimestamp } from "firebase/firestore";
import { app } from "../firebase";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
// Import Dialog components
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea"; // Import Textarea

// --- Interfaces ---
interface Opportunity {
    id: string;
    title: string;
    description: string;
    category: string;
    location: string;
    date: string | Timestamp;
    time: string;
    spots: number;
    orgId: string;
    orgName: string;
    createdAt: Timestamp;
    status: 'open' | 'full' | 'closed';
    signedUpVolunteers?: string[];
}

interface FoodDonation {
    id: string;
    restaurantId: string;
    restaurantName: string;
    foodType: string;
    quantity: string;
    pickupLocation: string;
    pickupInstructions?: string;
    bestBefore?: Timestamp;
    status: 'available' | 'claimed';
    createdAt: Timestamp;
    claimedByVolunteerId?: string;
    volunteerName?: string; // Added
    claimedAt?: Timestamp; // Added
    volunteerPickupNotes?: string; // Added
}

const VolunteerPage = () => {
    // State hooks (keep existing ones)
    const { toast } = useToast();
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [loadingOpps, setLoadingOpps] = useState(true);
    const [loadingFood, setLoadingFood] = useState(true);
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [foodDonations, setFoodDonations] = useState<FoodDonation[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [claimingFoodId, setClaimingFoodId] = useState<string | null>(null);
    const [pickupNotes, setPickupNotes] = useState(""); // State for pickup notes

    const db = getFirestore(app);

    // Fetch User Profile Effect (keep as is)
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (user) {
                const userRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(userRef);
                if (docSnap.exists()) {
                    setUserProfile(docSnap.data());
                } else {
                    console.warn("Volunteer.tsx: User profile not found in Firestore for UID:", user.uid);
                }
            } else {
                setUserProfile(null);
            }
        };
        fetchUserProfile();
    }, [user, db]);

    // Fetch Opportunities and Food Donations Effect (keep as is)
    useEffect(() => {
        let isMounted = true;

        const fetchOpportunities = async () => {
            if (!isMounted) return;
            setLoadingOpps(true);
            try {
                const q = query(
                    collection(db, "opportunities"),
                    where("status", "==", "open"),
                    orderBy("createdAt", "desc"),
                    limit(15)
                );
                const querySnapshot = await getDocs(q);
                if (!isMounted) return;
                const opps: Opportunity[] = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                     // More robust check
                     if (data.title && data.orgId && data.createdAt instanceof Timestamp && data.status) {
                        opps.push({ id: doc.id, ...data } as Opportunity);
                     } else {
                        console.warn("Skipping opportunity doc with missing or invalid fields:", doc.id, data);
                    }
                });
                setOpportunities(opps);
                 if (!error) setError(null);
            } catch (err: any) {
                console.error("Error fetching opportunities:", err);
                if (isMounted && !error) setError("Failed to load opportunities.");
            } finally {
                if (isMounted) setLoadingOpps(false);
            }
        };

        const fetchFoodDonations = async () => {
            if (!isMounted) return;
            setLoadingFood(true);
            try {
                const foodQuery = query(
                    collection(db, "food_donations"),
                    where("status", "==", "available"),
                    orderBy("createdAt", "desc"),
                    limit(15)
                );
                const foodSnapshot = await getDocs(foodQuery);
                if (!isMounted) return;
                const donations: FoodDonation[] = foodSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FoodDonation));
                setFoodDonations(donations);
                if (!error) setError(null);
            } catch (err: any) {
                console.error("Error fetching food donations:", err);
                if (isMounted && !error) setError("Failed to load food donations.");
            } finally {
                if (isMounted) setLoadingFood(false);
            }
        };

        fetchOpportunities();
        fetchFoodDonations();

        return () => { isMounted = false; };

    }, [db, error]); // Keep error dependency here

    // Handler Functions (handleSignUp, handleCancelSignUp - keep as is)
     const handleSignUp = async (opportunityId: string, currentSpots: number, signedUpVolunteers: string[] = []) => {
        console.log("Attempting signup:", { opportunityId, userId: user?.uid });
        if (!user) { toast({ title: "Please Login", description: "You need to be logged in to sign up.", variant: "destructive" }); return; }
        if (signedUpVolunteers.includes(user.uid)) { toast({ title: "Already Signed Up", variant: "default" }); return; }
        if (signedUpVolunteers.length >= currentSpots) { toast({ title: "Opportunity Full", variant: "destructive" }); return; }

        const opportunityRef = doc(db, "opportunities", opportunityId);
        try {
            const updatePayload: { signedUpVolunteers: any; status?: 'full' } = {
                signedUpVolunteers: arrayUnion(user.uid)
            };
            if ((signedUpVolunteers?.length || 0) + 1 >= currentSpots) {
                updatePayload.status = 'full';
            }

            console.log("handleSignUp Update Payload:", JSON.stringify(updatePayload));
            await updateDoc(opportunityRef, updatePayload);

            toast({ title: "Sign Up Successful!", description: "You're registered for the opportunity." });
            setOpportunities(prevOpps => prevOpps.map(opp =>
                opp.id === opportunityId
                    ? { ...opp, signedUpVolunteers: [...(opp.signedUpVolunteers || []), user.uid], status: updatePayload.status || opp.status }
                    : opp
            ));
        } catch (err: any) {
            console.error("Error signing up:", err);
            toast({ title: "Sign Up Failed", description: err.message || "Could not sign up.", variant: "destructive" });
        }
    };

     const handleCancelSignUp = async (opportunityId: string) => {
        console.log("Attempting cancel signup:", { opportunityId, userId: user?.uid });
        if (!user) return;
        const opportunityRef = doc(db, "opportunities", opportunityId);
        try {
            const updatePayload = {
                signedUpVolunteers: arrayRemove(user.uid),
                status: 'open' as Opportunity['status']
            };
            console.log("handleCancelSignUp Update Payload:", JSON.stringify(updatePayload));
            await updateDoc(opportunityRef, updatePayload);

            toast({ title: "Sign Up Cancelled", description: "You are no longer registered." });
            setOpportunities(prevOpps => prevOpps.map(opp =>
                opp.id === opportunityId
                    ? { ...opp, signedUpVolunteers: (opp.signedUpVolunteers || []).filter(uid => uid !== user.uid), status: 'open' }
                    : opp
            ));
        } catch (err: any) {
            console.error("Error cancelling sign up:", err);
            toast({ title: "Cancellation Failed", description: err.message || "Could not cancel sign up.", variant: "destructive" });
        }
    };


    // Modified handleClaimFood
    const handleClaimFood = async (donationId: string, notes: string) => {
        console.log("Attempting claim food:", { donationId, userId: user?.uid, notes });
        if (!user) { toast({ title: "Please Login", description: "You need to be logged in to claim.", variant: "destructive" }); return; }
        setClaimingFoodId(donationId);

        const donationRef = doc(db, "food_donations", donationId);
        try {
            const donationSnap = await getDoc(donationRef);
            if (!donationSnap.exists() || donationSnap.data()?.status !== 'available') {
                throw new Error("This donation is no longer available or does not exist.");
            }

            const updatePayload = {
                status: 'claimed' as const,
                claimedByVolunteerId: user.uid,
                volunteerName: userProfile?.name || user.displayName || user.email || 'Unknown Volunteer', // Use fetched profile name first
                claimedAt: serverTimestamp(),
                volunteerPickupNotes: notes // Add the notes here
            };

            console.log("handleClaimFood Update Payload:", JSON.stringify(updatePayload));
            await updateDoc(donationRef, updatePayload);

            toast({ title: "Donation Claimed!", description: "Please arrange pickup as per instructions." });
            setFoodDonations(prevDonations => prevDonations.filter(d => d.id !== donationId));
            setPickupNotes(""); // Reset notes after successful claim

        } catch (err: any) {
            console.error("Error claiming food donation:", err);
            toast({ title: "Claim Failed", description: err.message || "Could not claim donation.", variant: "destructive" });
        } finally {
            setClaimingFoodId(null);
        }
    };


    // Helper Functions (keep as is)
    const isUserSignedUp = (opportunity: Opportunity): boolean => {
        return !!user && !!opportunity.signedUpVolunteers?.includes(user.uid);
    };

    const formatDate = (dateInput: string | Timestamp | undefined): string => {
        if (!dateInput) return "Date not specified";
        try {
             const date = dateInput instanceof Timestamp ? dateInput.toDate() : new Date(dateInput);
             if (isNaN(date.getTime())) return "Invalid Date";
             return format(date, "PPP");
        } catch (e) {
             console.error("Error formatting date:", dateInput, e);
             return "Invalid Date";
        }
    };

     const formatBestBefore = (dateInput: Timestamp | undefined): string | null => {
        if (!dateInput) return null;
        try {
             const date = dateInput.toDate();
             if (isNaN(date.getTime())) return "Invalid Date";
             return format(date, "PP p");
        } catch (e) {
             console.error("Error formatting best before date:", dateInput, e);
             return "Invalid Date";
        }
    };

    // --- Render Logic ---
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col"
        >
            <Navbar />
            <main className="flex-grow pt-20">
                <section className="py-12 md:py-16">
                    <div className="container mx-auto px-4">
                        {/* Header */}
                        <motion.div /* ... */ className="max-w-3xl mx-auto text-center mb-12">
                             <h1 className="text-4xl md:text-5xl font-bold mb-4">Volunteer Hub</h1>
                             <p className="text-muted-foreground">
                                Find available food donations and volunteer opportunities in your community.
                            </p>
                        </motion.div>

                        {/* Search/Filter Bar */}
                        <motion.div /* ... */ className="mb-10 flex flex-col md:flex-row justify-start max-w-5xl mx-auto gap-4">
                            {/* ... keep existing filters ... */}
                              <div className="flex flex-col md:flex-row gap-4 flex-grow">
                                <Input placeholder="Search events or food..." className="md:max-w-xs" />
                                <Select>
                                    <SelectTrigger className="md:w-[180px]">
                                        <SelectValue placeholder="All Categories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        <SelectItem value="food">Food Donations</SelectItem>
                                        <SelectItem value="environment">Environment</SelectItem>
                                        <SelectItem value="social welfare">Social Welfare</SelectItem>
                                        <SelectItem value="education">Education</SelectItem>
                                        <SelectItem value="healthcare">Healthcare</SelectItem>
                                        <SelectItem value="animal welfare">Animal Welfare</SelectItem>
                                        <SelectItem value="event support">Event Support</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant={"outline"} className={cn("w-full md:w-auto justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {selectedDate ? format(selectedDate, "PPP") : <span>Filter by date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                                    </PopoverContent>
                                </Popover>
                             </div>
                        </motion.div>

                         {/* Error Display */}
                        {error && (
                            <div className="flex items-center text-destructive bg-destructive/10 p-4 rounded-md mb-6 max-w-6xl mx-auto">
                                <AlertCircle className="h-5 w-5 mr-2" /> {error}
                            </div>
                        )}

                        {/* Food Donation Section */}
                        <motion.div className="mb-16" id="food-donations">
                             <h2 className="text-3xl font-bold mb-6 text-center md:text-left">Available Food Donations</h2>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                                {loadingFood && ( /* ... loading state ... */
                                    <div className="lg:col-span-3 flex justify-center items-center p-8">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                        <span className="ml-3 text-muted-foreground">Loading Food Donations...</span>
                                    </div>
                                )}
                                {!loadingFood && foodDonations.length === 0 && !error && ( /* ... empty state ... */
                                     <p className="lg:col-span-3 text-muted-foreground text-center py-8">No available food donations right now.</p>
                                )}
                                {!loadingFood && foodDonations.length > 0 && foodDonations.map((donation, index) => (
                                    <TiltCard key={donation.id} className="h-full">
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="bg-card border rounded-xl overflow-hidden h-full flex flex-col shadow-sm hover:shadow-lg"
                                        >
                                            {/* Food Card Content (keep as is) */}
                                            <div className="p-5 flex-grow">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-semibold text-lg leading-tight mr-2">{donation.foodType}</h3>
                                                    <Badge variant="outline" className="text-xs flex-shrink-0 bg-green-100 border-green-300 text-green-800">Food</Badge>
                                                </div>
                                                <p className="text-muted-foreground mb-3 text-sm">Quantity: {donation.quantity}</p>
                                                <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                                                    <div className="flex items-center">
                                                        <Utensils className="h-3.5 w-3.5 mr-1.5 text-foreground/70" />
                                                        <span className="text-foreground/90 font-medium">{donation.restaurantName}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <MapPin className="h-3.5 w-3.5 mr-1.5" />
                                                        <span>Pickup: {donation.pickupLocation}</span>
                                                    </div>
                                                    {donation.pickupInstructions && <div className="flex items-start"><strong className="font-medium mr-1.5 shrink-0">Instruct:</strong> <p className="flex-1">{donation.pickupInstructions}</p></div>}
                                                    {donation.bestBefore && <div className="flex items-center"><CalendarIcon className="h-3.5 w-3.5 mr-1.5"/><strong className="font-medium">Best By:</strong><span className="ml-1">{formatBestBefore(donation.bestBefore)}</span></div>}
                                                    <p className="text-xs text-muted-foreground pt-1">Listed: {format(donation.createdAt.toDate(), 'PP p')}</p>
                                                </div>
                                            </div>
                                            {/* Claim Button with Dialog */}
                                            <div className="p-4 pt-0">
                                                <Dialog onOpenChange={(open) => !open && setPickupNotes("")}> {/* Reset notes when dialog closes */}
                                                    <DialogTrigger asChild>
                                                        <Button variant="default" size="sm" className="w-full bg-green-600 hover:bg-green-700" disabled={!user || claimingFoodId === donation.id}>
                                                            {claimingFoodId === donation.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Package className="h-4 w-4 mr-1"/> }
                                                            Claim Donation
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Confirm Claim & Pickup Details</DialogTitle>
                                                            <DialogDescription>
                                                                You are claiming "{donation.foodType}" from {donation.restaurantName}. Please provide brief details for the restaurant (e.g., estimated pickup time, contact person).
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="py-4">
                                                            <Label htmlFor={`notes-${donation.id}`} className="sr-only">Pickup Notes</Label>
                                                            <Textarea
                                                                id={`notes-${donation.id}`}
                                                                placeholder="E.g., 'Will pick up around 7 PM, ask for Ramesh', 'My name is [Your Name]'"
                                                                value={pickupNotes}
                                                                onChange={(e) => setPickupNotes(e.target.value)}
                                                                rows={3}
                                                            />
                                                        </div>
                                                        <DialogFooter>
                                                            <DialogClose asChild>
                                                                <Button type="button" variant="outline">Cancel</Button>
                                                            </DialogClose>
                                                            <Button
                                                                type="button"
                                                                onClick={() => handleClaimFood(donation.id, pickupNotes)}
                                                                disabled={claimingFoodId === donation.id || !pickupNotes.trim()} // Disable if no notes or loading
                                                                className="bg-green-600 hover:bg-green-700"
                                                            >
                                                                 {claimingFoodId === donation.id ? <Loader2 className="h-4 w-4 animate-spin mr-1"/> : <Check className="h-4 w-4 mr-1"/> }
                                                                Confirm Claim
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                                {!user && <p className="text-xs text-destructive text-center mt-1">Login to claim</p> }
                                            </div>
                                        </motion.div>
                                    </TiltCard>
                                ))}
                             </div>
                        </motion.div>

                        {/* Volunteer Opportunities Grid (keep as is) */}
                         <motion.div className="mt-12" id="volunteer-events">
                              <h2 className="text-3xl font-bold mb-6 text-center md:text-left">Volunteer Events</h2>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                                {loadingOpps && ( /* ... loading state ... */
                                    <div className="lg:col-span-3 flex justify-center items-center p-8">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                        <span className="ml-3 text-muted-foreground">Loading Opportunities...</span>
                                    </div>
                                )}
                                {!loadingOpps && opportunities.length === 0 && !error && ( /* ... empty state ... */
                                    <p className="lg:col-span-3 text-muted-foreground text-center py-8">No open volunteer opportunities found.</p>
                                )}
                                {!loadingOpps && opportunities.length > 0 && opportunities.map((opportunity, index) => (
                                    <TiltCard key={opportunity.id} className="h-full">
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="bg-card border rounded-xl overflow-hidden h-full flex flex-col shadow-sm hover:shadow-md"
                                        >
                                            <div className="p-5 flex-grow">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-semibold text-lg leading-tight mr-2">{opportunity.title}</h3>
                                                    <Badge variant={
                                                        opportunity.category === "environment" ? "teal" :
                                                        opportunity.category === "social welfare" ? "purple" :
                                                        opportunity.category === "education" ? "orange" : "secondary"
                                                    } className="text-xs flex-shrink-0 ml-2 capitalize">{opportunity.category}</Badge>
                                                </div>
                                                <p className="text-muted-foreground mb-3 text-sm line-clamp-3">{opportunity.description}</p>
                                                <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                                                     <div className="flex items-center">
                                                        <Users className="h-3.5 w-3.5 mr-1.5 text-foreground/70" />
                                                        <span className="text-foreground/90 font-medium">{opportunity.orgName}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <MapPin className="h-3.5 w-3.5 mr-1.5" />
                                                        <span>{opportunity.location}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                                                        <span>{formatDate(opportunity.date)}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Clock className="h-3.5 w-3.5 mr-1.5" />
                                                        <span>{opportunity.time}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Users className="h-3.5 w-3.5 mr-1.5" />
                                                        <span>
                                                            {Math.max(0, opportunity.spots - (opportunity.signedUpVolunteers?.length || 0))} / {opportunity.spots} spots left
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-4 pt-0">
                                                {isUserSignedUp(opportunity) ? (
                                                    <Button variant="destructive" size="sm" className="w-full" onClick={() => handleCancelSignUp(opportunity.id)} > Cancel Sign Up </Button>
                                                ) : (
                                                    <Button variant="default" size="sm" className="w-full" onClick={() => handleSignUp(opportunity.id, opportunity.spots, opportunity.signedUpVolunteers)} disabled={(opportunity.signedUpVolunteers?.length || 0) >= opportunity.spots || opportunity.status !== 'open' || !user} >
                                                        {opportunity.status === 'full' ? 'Full' : opportunity.status === 'closed' ? 'Closed' : 'Sign Up'}
                                                    </Button>
                                                )}
                                                {!user && <p className="text-xs text-destructive text-center mt-1">Login to sign up</p> }
                                            </div>
                                        </motion.div>
                                    </TiltCard>
                                ))}
                             </div>
                        </motion.div>
                    </div>
                </section>
            </main>
            <Footer />
        </motion.div>
    );
};

export default VolunteerPage;