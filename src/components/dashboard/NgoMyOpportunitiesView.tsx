// src/components/dashboard/NgoMyOpportunitiesView.tsx
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, Timestamp, orderBy } from "firebase/firestore";
import { app } from "@/firebase";
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Users, UserCheck } from 'lucide-react';
import { format } from 'date-fns';

interface Opportunity {
    id: string;
    title: string;
    date: string | Timestamp;
    spots: number;
    signedUpVolunteers?: string[];
    status: 'open' | 'full' | 'closed';
}

interface VolunteerProfile {
    id: string;
    name: string;
    email?: string;
    photoURL?: string | null;
}

interface NgoMyOpportunitiesViewProps {
    ngoId: string;
}

const NgoMyOpportunitiesView: React.FC<NgoMyOpportunitiesViewProps> = ({ ngoId }) => {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [volunteerDetails, setVolunteerDetails] = useState<{ [uid: string]: VolunteerProfile }>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getInitials = (name?: string | null): string => {
        if (!name) return "??";
        const names = name.trim().split(" ");
        return names.length > 1
            ? `${names[0][0]}${names[names.length - 1][0]}`
            : names[0].slice(0, 2).toUpperCase();
    };

    useEffect(() => {
        const fetchOpportunitiesAndVolunteers = async () => {
            setLoading(true);
            setError(null);
            const db = getFirestore(app);
            const fetchedOpps: Opportunity[] = [];
            const volunteerIdsToFetch = new Set<string>();

            try {
                console.log("[NgoMyOps] Fetching opportunities for NGO:", ngoId);
                const q = query(
                    collection(db, "opportunities"),
                    where("orgId", "==", ngoId),
                    orderBy("createdAt", "desc")
                );
                const oppsSnapshot = await getDocs(q);
                oppsSnapshot.forEach((doc) => {
                    const data = doc.data();
                    const opp = { id: doc.id, ...data } as Opportunity;
                    fetchedOpps.push(opp);
                    opp.signedUpVolunteers?.forEach(uid => volunteerIdsToFetch.add(uid));
                });
                console.log(`[NgoMyOps] Found ${fetchedOpps.length} opportunities. Need details for ${volunteerIdsToFetch.size} volunteers.`);
                setOpportunities(fetchedOpps);

                if (volunteerIdsToFetch.size > 0) {
                    const idsArray = Array.from(volunteerIdsToFetch);
                    const fetchedVolunteers: { [uid: string]: VolunteerProfile } = {};
                    const userPromises = idsArray.map(async (uid) => {
                        try {
                            const userRef = doc(db, "users", uid);
                            const userSnap = await getDoc(userRef);
                            if (userSnap.exists()) {
                                const userData = userSnap.data();
                                fetchedVolunteers[uid] = {
                                    id: uid,
                                    name: userData.name || 'Unknown Volunteer',
                                    email: userData.email,
                                    photoURL: userData.photoURL
                                };
                            } else {
                                console.warn(`[NgoMyOps] Volunteer profile not found for UID: ${uid}`);
                                fetchedVolunteers[uid] = { id: uid, name: `Unknown (${uid.substring(0, 5)}...)` };
                            }
                        } catch (userErr) {
                            console.error(`[NgoMyOps] Error fetching volunteer ${uid}:`, userErr);
                            fetchedVolunteers[uid] = { id: uid, name: `Error loading (${uid.substring(0, 5)}...)` };
                        }
                    });
                    await Promise.all(userPromises);
                    setVolunteerDetails(fetchedVolunteers);
                    console.log("[NgoMyOps] Fetched volunteer details:", fetchedVolunteers);
                }
            } catch (err: any) {
                console.error("[NgoMyOps] Error fetching data:", err);
                setError("Failed to load your opportunities or volunteer details.");
            } finally {
                setLoading(false);
            }
        };

        if (ngoId) {
            fetchOpportunitiesAndVolunteers();
        } else {
            setError("NGO ID missing.");
            setLoading(false);
        }
    }, [ngoId]);

    const formatDate = (dateInput: string | Timestamp | undefined): string => {
        if (!dateInput) return "Date not specified";
        if (dateInput instanceof Timestamp) {
            try {
                return format(dateInput.toDate(), "PPP");
            } catch (e) {
                console.error("Error formatting timestamp:", e);
                return "Invalid Date";
            }
        }
        if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
            try {
                return format(new Date(dateInput + 'T00:00:00'), "PPP");
            } catch (e) {
                console.error("Error formatting date string:", e);
                return dateInput;
            }
        }
        return String(dateInput);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><UserCheck className="mr-2 h-5 w-5 text-indigo-500" />Your Volunteer Opportunities</CardTitle>
                <CardDescription>View details and see who has signed up for your events.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading && (<div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>)}
                {error && (<div className="text-destructive bg-destructive/10 p-3 rounded-md text-sm">{error}</div>)}
                {!loading && !error && opportunities.length === 0 && (<p className="text-muted-foreground text-center py-6 text-sm">You haven't created any opportunities yet.</p>)}
                {!loading && !error && opportunities.length > 0 && (
                    <Accordion type="single" collapsible className="w-full space-y-2">
                        {opportunities.map(opp => (
                            <AccordionItem value={opp.id} key={opp.id} className="border rounded-md px-4 bg-background/50">
                                <AccordionTrigger className="py-3 hover:no-underline">
                                    <div className="flex justify-between items-center w-full pr-2">
                                        <span className="font-medium text-left truncate mr-4">{opp.title}</span>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <Badge variant="outline">{formatDate(opp.date)}</Badge>
                                            <Badge 
                                                variant={
                                                    opp.status === 'open' ? 'default' : // Changed 'success' to 'default'
                                                    opp.status === 'full' ? 'destructive' : 
                                                    'secondary'
                                                } 
                                                className="capitalize"
                                            >
                                                {opp.status} ({opp.signedUpVolunteers?.length || 0}/{opp.spots})
                                            </Badge>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 pb-4">
                                    <h5 className="font-semibold mb-2 text-sm">Signed Up Volunteers ({opp.signedUpVolunteers?.length || 0}):</h5>
                                    {(!opp.signedUpVolunteers || opp.signedUpVolunteers.length === 0) && <p className="text-xs text-muted-foreground italic">No volunteers signed up yet.</p>}
                                    {opp.signedUpVolunteers && opp.signedUpVolunteers.length > 0 && (
                                        <ul className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2 bg-muted/50">
                                            {opp.signedUpVolunteers.map(uid => {
                                                const volunteer = volunteerDetails[uid];
                                                return (
                                                    <li key={uid} className="flex items-center justify-between text-sm p-1.5 bg-background rounded shadow-sm">
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-6 w-6">
                                                                <AvatarImage src={volunteer?.photoURL || undefined} alt={volunteer?.name} />
                                                                <AvatarFallback className="text-xs">{getInitials(volunteer?.name)}</AvatarFallback>
                                                            </Avatar>
                                                            <span className="truncate">{volunteer?.name || 'Loading...'}</span>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground truncate">{volunteer?.email || ''}</span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </CardContent>
        </Card>
    );
};

export default NgoMyOpportunitiesView;