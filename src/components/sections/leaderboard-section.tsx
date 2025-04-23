
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { app } from '@/firebase'; 
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Loader2 } from 'lucide-react';
import { Badge } from '../ui/badge';

interface Donor {
    id: string;
    name: string;
    photoURL?: string | null; 
    totalDonated: number;
}

export const DonationLeaderboardSection = () => {
    const [topDonors, setTopDonors] = useState<Donor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTopDonors = async () => {
            setLoading(true);
            setError(null);
            const db = getFirestore(app);
            try {
                
                const q = query(
                    collection(db, "users"),
                    orderBy("totalDonated", "desc"),
                    limit(5) 
                );
                const querySnapshot = await getDocs(q);
                const donors: Donor[] = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    
                    if (data.totalDonated && data.totalDonated > 0) {
                        donors.push({
                            id: doc.id,
                            name: data.name || 'Anonymous Donor', 
                            photoURL: data.photoURL, 
                            totalDonated: data.totalDonated
                        });
                    }
                });
                setTopDonors(donors);
            } catch (err: any) {
                console.error("Error fetching top donors:", err);
                setError("Could not load leaderboard.");
            } finally {
                setLoading(false);
            }
        };
        fetchTopDonors();
    }, []);

    const getInitials = (name?: string | null): string => {
         if (!name) return '?';
         const names = name.split(' ');
         if (names.length === 1) return names[0][0].toUpperCase();
         return (names[0][0] + names[names.length - 1][0]).toUpperCase();
     };

    return (
        <section className="py-20 bg-muted/30">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true, margin: "-100px" }}
                    className="text-center mb-12"
                >
                    <h2 className="text-4xl font-bold mb-4">Top Community Supporters</h2>
                    <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
                        Recognizing the generous donors fueling positive change.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    viewport={{ once: true, margin: "-100px" }}
                >
                    <Card className="max-w-2xl mx-auto shadow-lg border">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-center text-2xl">
                                <Trophy className="h-6 w-6 mr-2 text-yellow-500" />
                                Donation Leaderboard
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading && <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
                            {error && <p className="text-center text-destructive py-4">{error}</p>}
                            {!loading && !error && topDonors.length === 0 && <p className="text-center text-muted-foreground py-4">No donations recorded yet.</p>}
                            {!loading && !error && topDonors.length > 0 && (
                                <ul className="space-y-4">
                                    {topDonors.map((donor, index) => (
                                        <motion.li
                                            key={donor.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="flex items-center justify-between p-3 bg-background rounded-md border"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`font-bold text-lg w-6 text-center ${index < 3 ? 'text-yellow-600' : 'text-muted-foreground'}`}>#{index + 1}</span>
                                                 <Avatar className="h-9 w-9">
                                                     <AvatarImage src={donor.photoURL || undefined} alt={donor.name} />
                                                     <AvatarFallback>{getInitials(donor.name)}</AvatarFallback>
                                                 </Avatar>
                                                <span className="font-medium truncate">{donor.name}</span>
                                            </div>
                                            <Badge variant={index === 0 ? "default" : index === 1 ? "secondary" : "outline"} className="font-mono text-sm">
                                                ${donor.totalDonated.toLocaleString()}
                                            </Badge>
                                        </motion.li>    
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </section>
    );
};