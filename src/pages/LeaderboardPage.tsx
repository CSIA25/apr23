// src/pages/LeaderboardPage.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Trophy, Utensils, HandCoins } from 'lucide-react';
import { getFirestore, collection, query, where, getDocs, orderBy, limit, doc, getDoc } from "firebase/firestore";
import { app } from "@/firebase";

const db = getFirestore(app);

interface RestaurantLeaderboardEntry {
    id: string; // restaurantId (user UID)
    name: string;
    donationCount: number;
    photoURL?: string | null; // Fetch from user profile
}

interface DonorLeaderboardEntry {
    id: string; // userId
    name: string;
    totalDonated: number; // Assuming this field exists and tracks financial donations
    photoURL?: string | null; // Fetch from user profile
}

// Helper to get initials (same as in Navbar)
const getInitials = (name?: string | null): string => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
};


const LeaderboardPage = () => {
    const [restaurantLeaderboard, setRestaurantLeaderboard] = useState<RestaurantLeaderboardEntry[]>([]);
    const [donorLeaderboard, setDonorLeaderboard] = useState<DonorLeaderboardEntry[]>([]);
    const [loadingRestaurants, setLoadingRestaurants] = useState(true);
    const [loadingDonors, setLoadingDonors] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Fetch Restaurant Leaderboard Data ---
    useEffect(() => {
        const fetchRestaurantData = async () => {
            setLoadingRestaurants(true);
            setError(null); // Reset error specifically for this fetch
            try {
                // 1. Fetch claimed donations
                const claimedDonationsQuery = query(
                    collection(db, "food_donations"),
                    where("status", "==", "claimed")
                );
                const donationsSnapshot = await getDocs(claimedDonationsQuery);

                // 2. Aggregate counts per restaurant
                const restaurantCounts: { [id: string]: number } = {};
                donationsSnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.restaurantId) {
                        restaurantCounts[data.restaurantId] = (restaurantCounts[data.restaurantId] || 0) + 1;
                    }
                });

                // 3. Get IDs with counts > 0
                const restaurantIds = Object.keys(restaurantCounts);

                if (restaurantIds.length === 0) {
                    setRestaurantLeaderboard([]);
                    setLoadingRestaurants(false);
                    return;
                }

                // 4. Fetch restaurant profile data (names, potentially photoURL from users collection)
                const leaderboardEntries: RestaurantLeaderboardEntry[] = [];
                const profilePromises = restaurantIds.map(async (id) => {
                    try {
                        // Fetch restaurant profile for name
                        const restProfileRef = doc(db, "restaurant_profiles", id);
                        // Fetch user profile for potential photoURL
                        const userProfileRef = doc(db, "users", id);

                        const [restProfileSnap, userProfileSnap] = await Promise.all([
                            getDoc(restProfileRef),
                            getDoc(userProfileRef)
                        ]);

                        const restName = restProfileSnap.exists() ? restProfileSnap.data()?.restName : `Restaurant (${id.substring(0, 5)}...)`;
                        const photoURL = userProfileSnap.exists() ? userProfileSnap.data()?.photoURL : null;

                        leaderboardEntries.push({
                            id: id,
                            name: restName,
                            donationCount: restaurantCounts[id],
                            photoURL: photoURL
                        });
                    } catch (profileError) {
                        console.error(`Error fetching profile for restaurant ${id}:`, profileError);
                        // Add entry with fallback name if profile fetch fails
                        leaderboardEntries.push({
                            id: id,
                            name: `Restaurant (${id.substring(0, 5)}...)`,
                            donationCount: restaurantCounts[id],
                            photoURL: null
                        });
                    }
                });

                await Promise.all(profilePromises);

                // 5. Sort by donation count descending and take top N (e.g., 10)
                leaderboardEntries.sort((a, b) => b.donationCount - a.donationCount);
                setRestaurantLeaderboard(leaderboardEntries.slice(0, 10)); // Limit to top 10

            } catch (err: any) {
                console.error("Error fetching restaurant leaderboard:", err);
                setError(prevError => prevError || "Failed to load restaurant leaderboard."); // Set error only if not already set
            } finally {
                setLoadingRestaurants(false);
            }
        };

        fetchRestaurantData();
    }, [db]); // Dependency on db

    // --- Fetch Financial Donor Leaderboard Data ---
    useEffect(() => {
        const fetchDonorData = async () => {
            setLoadingDonors(true);
             setError(null); // Reset error specifically for this fetch
            try {
                 // Query users collection, filter by totalDonated > 0, order descending, limit
                const q = query(
                    collection(db, "users"),
                    where("totalDonated", ">", 0), // Assuming 'totalDonated' field tracks financial donations
                    orderBy("totalDonated", "desc"),
                    limit(10) // Limit to top 10
                );
                const querySnapshot = await getDocs(q);
                const donors: DonorLeaderboardEntry[] = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                     // Ensure name exists, fallback to email or generic
                     const name = data.name || data.email || `User (${doc.id.substring(0, 5)}...)`;
                     donors.push({
                        id: doc.id,
                        name: name,
                        totalDonated: data.totalDonated,
                        photoURL: data.photoURL // Get photoURL if available
                    });
                });
                setDonorLeaderboard(donors);
            } catch (err: any) {
                console.error("Error fetching donor leaderboard:", err);
                if (err.code === 'failed-precondition' && err.message.includes('index')) {
                    setError(prevError => prevError || "Database index needed for donor leaderboard.");
                } else {
                    setError(prevError => prevError || "Failed to load donor leaderboard.");
                }
            } finally {
                setLoadingDonors(false);
            }
        };

        fetchDonorData();
    }, [db]); // Dependency on db

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col bg-muted/20" // Slightly off-white background
        >
            <Navbar />
            <main className="flex-grow pt-24 pb-16">
                <section>
                    <div className="container mx-auto px-4">
                        {/* Header */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="text-center mb-12"
                        >
                             <Trophy className="h-12 w-12 mx-auto text-yellow-500 mb-3" />
                            <h1 className="text-4xl md:text-5xl font-bold mb-3">Community Leaderboards</h1>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                Celebrating the top contributors making a difference in Mero Samaj.
                            </p>
                        </motion.div>

                         {/* Error Display */}
                        {error && (
                            <div className="flex items-center text-destructive bg-destructive/10 p-4 rounded-md mb-6 max-w-3xl mx-auto">
                                <AlertCircle className="h-5 w-5 mr-2" /> {error}
                            </div>
                        )}

                        {/* Leaderboard Sections */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">

                            {/* Restaurant Leaderboard Card */}
                            <motion.div
                                initial={{ x: -50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.2, duration: 0.6 }}
                            >
                                <Card className="shadow-lg border h-full"> {/* Ensure consistent height */}
                                    <CardHeader>
                                        <CardTitle className="flex items-center text-xl">
                                            <Utensils className="mr-2 h-5 w-5 text-green-600" />
                                            Top Restaurants (by Food Donations)
                                        </CardTitle>
                                        <CardDescription>Based on number of claimed donations.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="min-h-[200px] flex items-center justify-center"> {/* Min height for loading */}
                                        {loadingRestaurants ? (
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        ) : restaurantLeaderboard.length === 0 ? (
                                            <p className="text-muted-foreground text-center">No restaurant donation data yet.</p>
                                        ) : (
                                            <ol className="space-y-3 w-full">
                                                {restaurantLeaderboard.map((entry, index) => (
                                                    <li key={entry.id} className="flex items-center justify-between p-2 bg-background rounded-md border">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`font-bold text-lg w-6 text-center ${index < 3 ? 'text-yellow-600' : 'text-muted-foreground'}`}>#{index + 1}</span>
                                                            <Avatar className="h-8 w-8"> {/* Slightly smaller avatar */}
                                                                <AvatarImage src={entry.photoURL || undefined} alt={entry.name} />
                                                                <AvatarFallback className="text-xs">{getInitials(entry.name)}</AvatarFallback>
                                                            </Avatar>
                                                            <span className="font-medium truncate text-sm">{entry.name}</span>
                                                        </div>
                                                        <Badge variant="secondary" className="font-mono text-xs">
                                                            {entry.donationCount} {entry.donationCount === 1 ? 'Donation' : 'Donations'}
                                                        </Badge>
                                                    </li>
                                                ))}
                                            </ol>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Financial Donor Leaderboard Card */}
                            <motion.div
                                initial={{ x: 50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.4, duration: 0.6 }}
                            >
                                <Card className="shadow-lg border h-full"> {/* Ensure consistent height */}
                                    <CardHeader>
                                        <CardTitle className="flex items-center text-xl">
                                            <HandCoins className="mr-2 h-5 w-5 text-blue-600" />
                                            Top Financial Donors
                                        </CardTitle>
                                        <CardDescription>Based on total recorded donations.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="min-h-[200px] flex items-center justify-center"> {/* Min height for loading */}
                                        {loadingDonors ? (
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        ) : donorLeaderboard.length === 0 ? (
                                            <p className="text-muted-foreground text-center">No financial donation data yet.</p>
                                        ) : (
                                             <ol className="space-y-3 w-full">
                                                {donorLeaderboard.map((entry, index) => (
                                                    <li key={entry.id} className="flex items-center justify-between p-2 bg-background rounded-md border">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`font-bold text-lg w-6 text-center ${index < 3 ? 'text-yellow-600' : 'text-muted-foreground'}`}>#{index + 1}</span>
                                                            <Avatar className="h-8 w-8"> {/* Slightly smaller avatar */}
                                                                <AvatarImage src={entry.photoURL || undefined} alt={entry.name} />
                                                                <AvatarFallback className="text-xs">{getInitials(entry.name)}</AvatarFallback>
                                                            </Avatar>
                                                            <span className="font-medium truncate text-sm">{entry.name}</span>
                                                        </div>
                                                        <Badge variant="default" className="font-mono text-xs">
                                                            ${entry.totalDonated.toLocaleString()} {/* Format amount */}
                                                        </Badge>
                                                    </li>
                                                ))}
                                            </ol>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>

                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </motion.div>
    );
};

export default LeaderboardPage;