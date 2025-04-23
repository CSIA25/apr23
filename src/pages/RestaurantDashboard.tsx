// src/pages/RestaurantDashboard.tsx
import React, { useState, useEffect } from 'react';
import { getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Utensils, PackageCheck, User, CalendarDays, StickyNote } from 'lucide-react'; // Added Icons
import { useAuth } from '@/context/AuthContext';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, Timestamp, serverTimestamp, orderBy, limit } from "firebase/firestore"; // Added limit
import { app } from "@/firebase";
import { useToast } from "@/hooks/use-toast"; // Use hook from correct path
import { format } from 'date-fns';
import AddFoodDonationForm from '@/components/dashboard/AddFoodDonationForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Import Avatar
import { Badge } from "@/components/ui/badge"; // Import Badge

const db = getFirestore(app);

// Update FoodDonation interface (if not already done in Volunteer.tsx)
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
    volunteerName?: string; // For displaying who claimed
    claimedAt?: Timestamp; // For displaying when claimed
    volunteerPickupNotes?: string; // For displaying volunteer notes
}

// Interface for NGO Requests (keep as is)
interface FoodRequest {
    id: string;
    ngoId: string;
    foodType: string;
    quantity: number;
    description: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: Timestamp;
    ngoName?: string;
}

// Helper to get initials
const getInitials = (name?: string | null): string => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
};

const RestaurantDashboard = () => {
    const { user, userRole, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [foodRequests, setFoodRequests] = useState<FoodRequest[]>([]); // NGO Requests
    const [myDonations, setMyDonations] = useState<FoodDonation[]>([]); // All donations by this restaurant
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [loadingDonations, setLoadingDonations] = useState(true); // Loading state for own donations
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [ngoNames, setNgoNames] = useState<{ [id: string]: string }>({}); // Keep NGO names state

    // Fetch NGO names function (keep as is)
    const fetchNgoNames = async (ngoIds: string[]) => {
         const names: { [id: string]: string } = {};
         const uniqueNgoIds = [...new Set(ngoIds)].filter(id => !ngoNames[id]); // Only fetch if not already fetched

         if (uniqueNgoIds.length === 0) return;

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
        setNgoNames(prev => ({ ...prev, ...names }));
    };

    // Fetch Pending NGO Food Requests (keep mostly as is, adjust loading state name)
    useEffect(() => {
        const fetchRequests = async () => {
            if (userRole !== 'restaurant') return;
            setLoadingRequests(true);
            try {
                const q = query(collection(db, "food_requests"), where("status", "==", "pending"), orderBy("createdAt", "desc"), limit(10));
                const snapshot = await getDocs(q);
                const requests: FoodRequest[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FoodRequest));
                setFoodRequests(requests);

                const ngoIds = requests.map(req => req.ngoId).filter(id => id);
                if (ngoIds.length > 0) {
                    fetchNgoNames(ngoIds);
                }
            } catch (error: any) {
                toast({ title: "Error", description: "Failed to load food requests.", variant: "destructive" });
                console.error("Error fetching food requests:", error);
            } finally {
                setLoadingRequests(false);
            }
        };
        if (!authLoading) fetchRequests();
    }, [authLoading, userRole, toast]); // Removed db from deps as it's stable

    // Fetch Restaurant's Donations (Available and Claimed)
    useEffect(() => {
         const fetchMyDonations = async () => {
            if (!user || userRole !== 'restaurant') return;
            setLoadingDonations(true);
            try {
                const q = query(
                    collection(db, "food_donations"),
                    where("restaurantId", "==", user.uid),
                    orderBy("createdAt", "desc"),
                    limit(30) // Fetch more of own donations
                );
                const snapshot = await getDocs(q);
                const donations: FoodDonation[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FoodDonation));
                setMyDonations(donations);
            } catch (error: any) {
                 toast({ title: "Error", description: "Failed to load your listed donations.", variant: "destructive" });
                 console.error("Error fetching restaurant donations:", error);
            } finally {
                setLoadingDonations(false);
            }
        };
         if (!authLoading) fetchMyDonations();
    }, [authLoading, user, userRole, toast]); // Added user dependency

    // Handle Verification (Accept/Reject NGO Requests - keep as is)
     const handleVerification = async (requestId: string, status: 'accepted' | 'rejected') => {
         if (!user) return;
         setUpdatingId(requestId);
         try {
             const requestRef = doc(db, "food_requests", requestId);
             await updateDoc(requestRef, {
                  status,
                  restaurantId: user.uid, // Record which restaurant accepted/rejected
                  restaurantName: user.displayName || user.email || 'Restaurant', // Add restaurant name
                  updatedAt: serverTimestamp()
                });
             setFoodRequests(prev => prev.filter(req => req.id !== requestId)); // Remove from pending list
             toast({ title: `Request ${status}`, description: `Food request has been ${status}.` });
         } catch (error: any) {
             toast({ title: "Update Failed", description: error.message, variant: "destructive" });
         } finally {
             setUpdatingId(null);
         }
    };

    // Filter donations for display
    const availableDonations = myDonations.filter(d => d.status === 'available');
    const claimedDonations = myDonations.filter(d => d.status === 'claimed');

    // Loading/Access Denied states (keep as is)
    if (authLoading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /><span className="ml-4 text-muted-foreground">Loading...</span></div>;
    }
    if (userRole !== 'restaurant') {
         return ( /* ... Access Denied view ... */
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow flex items-center justify-center text-center p-4">
                    <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
                    <p className="text-muted-foreground">Only restaurants can access this page.</p>
                    <Button onClick={() => navigate('/')} className="mt-4">Go Home</Button>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow pt-24 pb-16">
                <section>
                    <div className="container mx-auto px-4">
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">Restaurant Dashboard</h1>
                        <p className="text-muted-foreground mb-8">Add surplus food donations and manage incoming requests.</p>

                        {/* Add Food Donation Form Section (keep as is) */}
                        <AddFoodDonationForm restaurantId={user!.uid} restaurantName={user?.displayName || user?.email || 'Restaurant'} />

                         {/* Tabs for My Donations and NGO Requests */}
                         <Tabs defaultValue="my-donations" className="w-full mt-12">
                             <TabsList className="mb-6 grid grid-cols-2 md:grid-cols-3 gap-2">
                                 <TabsTrigger value="my-donations">My Listed Donations ({availableDonations.length})</TabsTrigger>
                                 <TabsTrigger value="claimed-donations">Claimed By Volunteers ({claimedDonations.length})</TabsTrigger>
                                 <TabsTrigger value="ngo-requests">Incoming NGO Requests ({foodRequests.length})</TabsTrigger>
                             </TabsList>

                              {/* My Listed Donations Tab */}
                             <TabsContent value="my-donations">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Your Available Food Donations</CardTitle>
                                        <CardDescription>Food you have listed that is currently available for pickup.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {loadingDonations && <div className="flex justify-center p-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
                                        {!loadingDonations && availableDonations.length === 0 && <p className="text-muted-foreground text-center py-8">You have no available donations listed currently.</p>}
                                        {!loadingDonations && availableDonations.length > 0 && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                                                {availableDonations.map(donation => (
                                                    <Card key={donation.id} className="bg-background/50 border">
                                                        <CardHeader className="pb-2">
                                                            <CardTitle className="text-base">{donation.foodType}</CardTitle>
                                                            <CardDescription className="text-xs pt-1">Listed: {format(donation.createdAt.toDate(), "PPp")}</CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="text-sm space-y-1 pb-3">
                                                            <p><strong>Quantity:</strong> {donation.quantity}</p>
                                                            <p><strong>Pickup Location:</strong> {donation.pickupLocation}</p>
                                                            {donation.pickupInstructions && <p><strong>Instructions:</strong> {donation.pickupInstructions}</p>}
                                                            {donation.bestBefore && <p><strong>Best Before:</strong> {format(donation.bestBefore.toDate(), "PPp")}</p>}
                                                            <Badge variant="teal" className="mt-2 inline-block bg-green-100 text-green-800 border-green-300">Available</Badge>
                                                        </CardContent>
                                                        {/* Optional: Add button to mark as unavailable/delete */}
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
                                        <CardTitle>Donations Claimed by Volunteers</CardTitle>
                                        <CardDescription>History of your donations that have been picked up.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                         {loadingDonations && <div className="flex justify-center p-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
                                        {!loadingDonations && claimedDonations.length === 0 && <p className="text-muted-foreground text-center py-8">No donations have been claimed yet.</p>}
                                        {!loadingDonations && claimedDonations.length > 0 && (
                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                                                {claimedDonations.map(donation => (
                                                    <Card key={donation.id} className="bg-card border">
                                                         <CardHeader className="pb-2">
                                                            <CardTitle className="text-base">{donation.foodType}</CardTitle>
                                                             <CardDescription className="text-xs pt-1 flex items-center">
                                                                <PackageCheck className="h-4 w-4 mr-1 text-blue-600"/> Claimed on: {donation.claimedAt ? format(donation.claimedAt.toDate(), "PPp") : 'N/A'}
                                                            </CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="text-sm space-y-2 pb-3">
                                                            <div className="flex items-center gap-2">
                                                                <User className="h-4 w-4 text-muted-foreground"/>
                                                                <span>Claimed by: <strong>{donation.volunteerName || 'Volunteer'}</strong></span>
                                                            </div>
                                                             {donation.volunteerPickupNotes && (
                                                                <div className="flex items-start gap-2 pt-1 border-t mt-2">
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

                            {/* Incoming NGO Requests Tab (keep as is) */}
                            <TabsContent value="ngo-requests">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Incoming Food Requests from NGOs</CardTitle>
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
                                                            <p className="text-xs text-muted-foreground pt-1">Requested: {format(req.createdAt.toDate(), "PPp")}</p>
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
                </section>
            </main>
            <Footer />
        </motion.div>
    );
};

export default RestaurantDashboard;