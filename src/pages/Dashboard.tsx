// src/pages/Dashboard.tsx
import React, { useState, useEffect, useCallback } from 'react'; // Ensure useCallback is imported
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
    Loader2, CheckCircle, XCircle, Utensils, PackageCheck,
    User, CalendarDays, StickyNote, UserCheck, Megaphone, Gift, Link as LinkIcon, // Added Gift, LinkIcon
    Building, Phone, Globe, MapPin, Hash, Ban, ExternalLink // Added NGO/Restaurant Icons
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Link, Navigate, useNavigate } from 'react-router-dom'; // Import useNavigate
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, Timestamp, serverTimestamp, orderBy, limit, getDoc, arrayRemove } from "firebase/firestore"; // Added arrayRemove
import { app } from "@/firebase";
import { useToast } from '@/hooks/use-toast'; // Corrected path
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Import other role-specific components
import NgoIssuesView from '@/components/dashboard/NgoIssuesView';
import AddOpportunityForm from '@/components/dashboard/AddOpportunityForm';
import MyReportedIssues from '@/components/dashboard/MyReportedIssues';
import NgoMyOpportunitiesView from '@/components/dashboard/NgoMyOpportunitiesView';
import AddFoodDonationForm from '@/components/dashboard/AddFoodDonationForm';
import SuperAdminPanel from './SuperAdminPanel'; // Assuming this might be used differently now

const db = getFirestore(app);

// --- Interfaces (Ensure consistency) ---
interface FoodDonation {
    id: string;
    restaurantId: string;
    restaurantName: string;
    foodType: string;
    quantity: string;
    pickupLocation: string;
    pickupInstructions?: string;
    bestBefore?: Timestamp;
    status: 'available' | 'claimed' | 'unavailable'; // Added 'unavailable'
    createdAt: Timestamp;
    claimedByVolunteerId?: string;
    volunteerName?: string;
    claimedAt?: Timestamp;
    volunteerPickupNotes?: string;
}

interface FoodRequest {
    id: string;
    ngoId: string;
    foodType: string;
    quantity: number;
    description: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: Timestamp;
    ngoName?: string; // Populated after fetching
}

// --- Helper Functions ---
const getInitials = (name?: string | null): string => {
    if (!name) return '?';
    const names = name.trim().split(' ').filter(Boolean); // Filter empty strings
    if (names.length === 0) return '?';
    if (names.length === 1) return names[0][0].toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
};

const formatDate = (dateInput: Timestamp | undefined | null, includeTime = true): string => {
    if (!dateInput) return "N/A";
    try {
        const date = dateInput.toDate();
        if (isNaN(date.getTime())) return "Invalid Date";
        return format(date, includeTime ? "PPp" : "PP"); // Format like "Jun 15, 2024, 6:00 PM" or "Jun 15, 2024"
    } catch (e) {
        console.error("Error formatting date:", dateInput, e);
        return "Error";
    }
};

// --- Main Dashboard Component ---
const Dashboard = () => {
    const { user, userRole, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate(); // Add navigate

    // --- State specific to Restaurant Role ---
    const [foodRequests, setFoodRequests] = useState<FoodRequest[]>([]); // NGO Requests
    const [myDonations, setMyDonations] = useState<FoodDonation[]>([]); // All donations by this restaurant
    const [loadingRequests, setLoadingRequests] = useState(false); // Initialize to false
    const [loadingDonations, setLoadingDonations] = useState(false); // Initialize to false
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [ngoNames, setNgoNames] = useState<{ [id: string]: string }>({});

    // --- Fetch NGO names ---
    const fetchNgoNames = useCallback(async (ngoIds: string[]) => {
        const namesToFetch = ngoIds.filter(id => id && !ngoNames[id]); // Only fetch IDs not already in state
        if (namesToFetch.length === 0) return;

        const uniqueNgoIds = [...new Set(namesToFetch)];
        const names: { [id: string]: string } = {};

        const fetchPromises = uniqueNgoIds.map(async (id) => {
           try {
               const ngoProfileRef = doc(db, "ngo_profiles", id);
               const profileSnap = await getDoc(ngoProfileRef);
               names[id] = profileSnap.exists() ? profileSnap.data()?.orgName : `NGO (${id.substring(0, 5)}...)`;
           } catch (error) {
               console.error(`Error fetching NGO name for ${id}:`, error);
               names[id] = `NGO (${id.substring(0, 5)}...)`;
           }
       });
       await Promise.all(fetchPromises);
       // Use functional update to avoid race conditions if called rapidly
       setNgoNames(prev => ({ ...prev, ...names }));
    }, [db, ngoNames]); // Correct dependency

    // --- Effects for Restaurant Role ---
    useEffect(() => {
        let isMounted = true; // Prevent state update on unmounted component

        // Fetch Pending NGO Food Requests
        const fetchRequests = async () => {
            if (!isMounted) return;
            console.log("Restaurant Dashboard: Fetching NGO food requests...");
            setLoadingRequests(true);
            try {
                const q = query(collection(db, "food_requests"), where("status", "==", "pending"), orderBy("createdAt", "desc"), limit(15));
                const snapshot = await getDocs(q);
                 if (!isMounted) return;
                const requests: FoodRequest[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FoodRequest));
                setFoodRequests(requests);
                console.log(`Restaurant Dashboard: Fetched ${requests.length} NGO requests.`);
                const ngoIds = requests.map(req => req.ngoId).filter(id => id);
                if (ngoIds.length > 0) {
                    fetchNgoNames(ngoIds); // Fetch names
                }
            } catch (error: any) {
                console.error("Error fetching food requests:", error);
                if (isMounted) toast({ title: "Error", description: "Failed to load food requests.", variant: "destructive" });
            } finally {
                if (isMounted) setLoadingRequests(false);
            }
        };

        // Fetch Restaurant's Own Donations
        const fetchMyDonations = async () => {
            if (!isMounted || !user) return;
            console.log("Restaurant Dashboard: Fetching own donations for user:", user.uid);
            setLoadingDonations(true);
            try {
                const q = query(
                    collection(db, "food_donations"),
                    where("restaurantId", "==", user.uid),
                    orderBy("createdAt", "desc"),
                    limit(50) // Fetch a reasonable number
                );
                const snapshot = await getDocs(q);
                if (!isMounted) return;
                const donations: FoodDonation[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FoodDonation));
                setMyDonations(donations);
                console.log(`Restaurant Dashboard: Fetched ${donations.length} own donations.`);
            } catch (error: any) {
                console.error("Error fetching restaurant donations:", error);
                if (isMounted) toast({ title: "Error", description: "Failed to load your listed donations.", variant: "destructive" });
            } finally {
                if (isMounted) setLoadingDonations(false);
            }
        };

        // Only run fetches if the role is correct and auth is not loading
        if (userRole === 'restaurant' && !authLoading) {
            fetchRequests();
            fetchMyDonations();
        } else {
            // Reset state if role is not restaurant or auth is loading/user logs out
            setFoodRequests([]);
            setMyDonations([]);
            setLoadingRequests(false);
            setLoadingDonations(false);
        }

        return () => { isMounted = false }; // Cleanup

    }, [authLoading, user, userRole, toast, fetchNgoNames, db]); // Dependencies


    // --- Handler specific to Restaurant Role ---
    const handleVerification = async (requestId: string, status: 'accepted' | 'rejected') => {
        if (!user) return;
        setUpdatingId(requestId);
        try {
            const requestRef = doc(db, "food_requests", requestId);
            await updateDoc(requestRef, {
                 status,
                 restaurantId: user.uid,
                 restaurantName: user.displayName || user.email || 'Restaurant',
                 updatedAt: serverTimestamp()
               });
            setFoodRequests(prev => prev.filter(req => req.id !== requestId));
            toast({ title: `Request ${status}`, description: `Food request has been ${status}.` });
        } catch (error: any) {
            toast({ title: "Update Failed", description: error.message, variant: "destructive" });
            console.error("Error updating request status:", error);
        } finally {
            setUpdatingId(null);
        }
   };

    // Handler to mark own donation as unavailable (Optional)
   const markDonationUnavailable = async (donationId: string) => {
        setUpdatingId(donationId);
        try {
            const donationRef = doc(db, "food_donations", donationId);
            await updateDoc(donationRef, { status: 'unavailable' }); // Use 'unavailable' or delete
            // Update local state immediately
            setMyDonations(prev => prev.map(d => d.id === donationId ? {...d, status: 'unavailable'} : d));
            toast({title: "Donation Updated", description: "Marked as unavailable."});
        } catch (error: any) {
            toast({title: "Update Failed", description: error.message, variant: "destructive"});
            console.error("Error marking donation unavailable:", error);
        } finally {
            setUpdatingId(null);
        }
   };


    // --- Render Logic ---

    // Loading State
    if (authLoading) {
         return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <span className="ml-4 text-muted-foreground">Loading Dashboard...</span>
            </div>
        );
    }

    // Not Logged In State
    if (!user) {
         return ( // Navigate to login if not logged in (handled by RequireAuth usually)
             <Navigate to="/login" replace />
         );
    }

    // Filter donations for display (moved inside render logic to use latest state)
    const availableDonations = myDonations.filter(d => d.status === 'available');
    const claimedDonations = myDonations.filter(d => d.status === 'claimed');
    const unavailableDonations = myDonations.filter(d => d.status === 'unavailable');

    // Function to render content based on user role
    const renderDashboardContent = () => {
        console.log(`Rendering dashboard for role: ${userRole} (User ID: ${user?.uid})`); // Verify role and ID

        switch (userRole) {
            case 'volunteer':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold">Volunteer Dashboard</h2>
                        <MyReportedIssues />
                        {/* Consider adding a "My Volunteer Signups" component */}
                        <div className="mt-6 flex gap-4">
                            <Button asChild><Link to="/volunteer">Find Opportunities</Link></Button>
                            <Button variant="secondary" asChild><Link to="/report">Report New Issue</Link></Button>
                        </div>
                    </div>
                );

            case 'ngo':
                 return (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-semibold">NGO Dashboard</h2>
                        {/* Pass necessary props if user exists */}
                        {user?.uid && <NgoMyOpportunitiesView ngoId={user.uid} />}
                        {user?.uid && <NgoIssuesView ngoId={user.uid} />}
                        {user?.uid && <AddOpportunityForm ngoId={user.uid} ngoName={user.name || user.displayName || 'NGO'} />}
                        {/* <Button asChild variant="outline" className="mt-4"><Link to="/ngo/food-request">Request Food Donation</Link></Button> */}
                    </div>
                );

             case 'restaurant':
                console.log("Rendering Restaurant Dashboard content");
                return (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-semibold">Restaurant Dashboard</h2>
                        <p className="text-muted-foreground">List surplus food you'd like to donate and manage incoming requests.</p>

                        {/* Add Food Donation Form */}
                        {user?.uid && <AddFoodDonationForm restaurantId={user.uid} restaurantName={user?.displayName || user?.email || 'Restaurant'} />}

                         {/* Tabs for Donations and Requests */}
                         <Tabs defaultValue="my-donations" className="w-full mt-12">
                             <TabsList className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-2"> {/* Adjusted cols */}
                                 <TabsTrigger value="my-donations">Available ({availableDonations.length})</TabsTrigger>
                                 <TabsTrigger value="claimed-donations">Claimed ({claimedDonations.length})</TabsTrigger>
                                 <TabsTrigger value="unavailable-donations">Unavailable ({unavailableDonations.length})</TabsTrigger> {/* Added Tab */}
                                 <TabsTrigger value="ngo-requests">NGO Requests ({foodRequests.length})</TabsTrigger>
                             </TabsList>

                              {/* My Listed Donations Tab */}
                             <TabsContent value="my-donations">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2"><Utensils className="h-5 w-5 text-green-600"/> Your Available Food Donations</CardTitle>
                                        <CardDescription>Food listed that is currently available for pickup.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {loadingDonations && <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
                                        {!loadingDonations && availableDonations.length === 0 && <p className="text-muted-foreground text-center py-8">You have no available donations listed currently.</p>}
                                        {!loadingDonations && availableDonations.length > 0 && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                                                {availableDonations.map(donation => (
                                                    <Card key={donation.id} className="bg-background/50 border flex flex-col">
                                                        <CardHeader className="pb-2">
                                                            <CardTitle className="text-base">{donation.foodType}</CardTitle>
                                                            <CardDescription className="text-xs pt-1">Listed: {formatDate(donation.createdAt)}</CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="text-sm space-y-1 pb-3 flex-grow">
                                                            <p><strong className="font-medium">Quantity:</strong> {donation.quantity}</p>
                                                            <p><strong className="font-medium">Pickup:</strong> {donation.pickupLocation}</p>
                                                            {donation.pickupInstructions && <p><strong className="font-medium">Instructions:</strong> {donation.pickupInstructions}</p>}
                                                            {donation.bestBefore && <p><strong className="font-medium">Best Before:</strong> {formatDate(donation.bestBefore)}</p>}
                                                        </CardContent>
                                                        <CardFooter className="pt-3 border-t">
                                                             <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="outline" size="sm" className="w-full" disabled={updatingId === donation.id}>
                                                                        {updatingId === donation.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <XCircle className="h-4 w-4 mr-1"/>} Mark as Unavailable
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader><AlertDialogTitle>Confirm Action</AlertDialogTitle><AlertDialogDescription>Mark this donation as unavailable? Volunteers will no longer see it.</AlertDialogDescription></AlertDialogHeader>
                                                                    <AlertDialogFooter><AlertDialogCancel disabled={updatingId === donation.id}>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => markDonationUnavailable(donation.id)} disabled={updatingId === donation.id}>Confirm</AlertDialogAction></AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </CardFooter>
                                                    </Card>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Claimed Donations Tab */}
                            <TabsContent value="claimed-donations">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2"><PackageCheck className="h-5 w-5 text-blue-600"/>Donations Claimed by Volunteers</CardTitle>
                                        <CardDescription>History of your donations that have been picked up.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                         {loadingDonations && <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
                                        {!loadingDonations && claimedDonations.length === 0 && <p className="text-muted-foreground text-center py-8">No donations have been claimed yet.</p>}
                                        {!loadingDonations && claimedDonations.length > 0 && (
                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                                                {claimedDonations.map(donation => (
                                                    <Card key={donation.id} className="bg-card border">
                                                         <CardHeader className="pb-2">
                                                            <CardTitle className="text-base">{donation.foodType}</CardTitle>
                                                             <CardDescription className="text-xs pt-1 flex items-center">
                                                                <CalendarDays className="h-3.5 w-3.5 mr-1 text-muted-foreground"/> Claimed on: {formatDate(donation.claimedAt)}
                                                            </CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="text-sm space-y-2 pb-3">
                                                             <div className="flex items-center gap-2">
                                                                {/* Ideally fetch volunteer photoURL too, but name is good start */}
                                                                <Avatar className="h-6 w-6">
                                                                    <AvatarFallback className="text-xs bg-muted">{getInitials(donation.volunteerName)}</AvatarFallback>
                                                                </Avatar>
                                                                <span>Claimed by: <strong>{donation.volunteerName || 'Volunteer'}</strong></span>
                                                            </div>
                                                             {donation.volunteerPickupNotes && (
                                                                <div className="flex items-start gap-2 pt-2 border-t mt-2">
                                                                    <StickyNote className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0"/>
                                                                    <p><strong className="font-medium">Volunteer Notes:</strong> {donation.volunteerPickupNotes}</p>
                                                                </div>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Unavailable Donations Tab */}
                            <TabsContent value="unavailable-donations">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2"><Ban className="h-5 w-5 text-gray-500"/> Unavailable Donations</CardTitle>
                                        <CardDescription>Donations you have marked as no longer available.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {loadingDonations && <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
                                        {!loadingDonations && unavailableDonations.length === 0 && <p className="text-muted-foreground text-center py-8">No donations marked as unavailable.</p>}
                                        {!loadingDonations && unavailableDonations.length > 0 && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                                                {unavailableDonations.map(donation => (
                                                    <Card key={donation.id} className="bg-muted/50 border border-dashed opacity-70">
                                                        <CardHeader className="pb-2">
                                                            <CardTitle className="text-base text-muted-foreground">{donation.foodType}</CardTitle>
                                                            <CardDescription className="text-xs pt-1">Listed: {formatDate(donation.createdAt)}</CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="text-sm space-y-1 pb-3 text-muted-foreground">
                                                            <p>Quantity: {donation.quantity}</p>
                                                            <p>Pickup: {donation.pickupLocation}</p>
                                                        </CardContent>
                                                        {/* No actions needed here usually */}
                                                    </Card>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>


                             {/* Incoming NGO Requests Tab (keep as is) */}
                             <TabsContent value="ngo-requests">
                                 <Card>
                                     <CardHeader>
                                         <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5 text-indigo-600"/>Incoming Food Requests from NGOs</CardTitle>
                                         <CardDescription>Review requests for food donations made by NGOs.</CardDescription>
                                     </CardHeader>
                                     <CardContent>
                                         {loadingRequests && <div className="flex justify-center p-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
                                         {!loadingRequests && foodRequests.length === 0 && <p className="text-muted-foreground text-center py-8">No pending food requests from NGOs.</p>}
                                         {!loadingRequests && foodRequests.length > 0 && (
                                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto pr-2">
                                                 {foodRequests.map(req => (
                                                     <Card key={req.id} className="flex flex-col bg-card border">
                                                          <CardHeader className="pb-3">
                                                             <CardTitle className="text-base">{req.foodType}</CardTitle>
                                                             <CardDescription className="text-xs pt-1">Requested by: {ngoNames[req.ngoId] || 'Loading NGO...'}</CardDescription>
                                                         </CardHeader>
                                                         <CardContent className="flex-grow space-y-2 text-sm pt-0">
                                                             <p><strong className="font-medium">Quantity:</strong> {req.quantity} {req.quantity > 1 ? "units" : "unit"}</p>
                                                             <p><strong className="font-medium">Description:</strong> {req.description || 'N/A'}</p>
                                                             <p className="text-xs text-muted-foreground pt-1">Requested: {formatDate(req.createdAt)}</p>
                                                         </CardContent>
                                                         <CardFooter className="flex justify-end gap-2 border-t pt-3 pb-3">
                                                             <Button variant="outline" size="sm" disabled={updatingId === req.id} className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleVerification(req.id, 'rejected')}>
                                                                 {updatingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}Reject
                                                             </Button>
                                                             <Button variant="default" size="sm" disabled={updatingId === req.id} className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleVerification(req.id, 'accepted')}>
                                                                 {updatingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}Accept
                                                             </Button>
                                                         </CardFooter>
                                                     </Card>
                                                 ))}
                                             </div>
                                         )}
                                    </CardContent>
                                 </Card>
                             </TabsContent>
                         </Tabs>
                    </div>
                );

            case 'superadmin':
                 return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold">Super Admin Overview</h2>
                        <p className="text-muted-foreground">Admin verification panel:</p>
                         {/* Link directly to the component/page */}
                         <Button asChild>
                             <Link to="/superadmin/verify-ngos">Verify Entities</Link>
                         </Button>
                         {/* If SuperAdminPanel is not a separate route, render it here */}
                         {/* <SuperAdminPanel /> */}
                    </div>
                );

            default: // Fallback for null or unexpected roles
                return (
                     <div className="space-y-6">
                        <h2 className="text-2xl font-semibold">Welcome, {user.displayName || user.email}!</h2>
                         {userRole === null && (
                             <p className="text-orange-600 bg-orange-100 p-3 rounded-md text-sm">
                                 Your role is not fully set up. If you registered as an NGO or Restaurant, please wait for admin approval. Otherwise, you can explore as a volunteer.
                             </p>
                         )}
                        <p className="text-muted-foreground">Your account is active. Explore Mero Samaj using the navigation bar.</p>
                        {/* Show volunteer components as a default fallback */}
                        <MyReportedIssues />
                        {/* <MyDonationsPlaceholder /> */}
                    </div>
                );
        }
    };

    // Main component structure
    return (
        <motion.div className="min-h-screen flex flex-col" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
            <Navbar />
            <main className="flex-grow pt-24 pb-16">
                <section>
                    <div className="container mx-auto px-4">
                        {renderDashboardContent()}
                    </div>
                </section>
            </main>
            <Footer />
        </motion.div>
    );
};

export default Dashboard;