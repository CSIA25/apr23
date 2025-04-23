
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs, orderBy, doc, updateDoc, Timestamp, limit, getDoc } from "firebase/firestore";
import { app } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; 
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckSquare } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

interface Issue {
    id: string;
    title: string;
    description: string;
    category: string;
    location: string;
    imageUrl?: string;
    reporterId: string;
    timestamp: Timestamp;
    status: 'pending' | 'in-progress' | 'resolved';
}

interface NgoProfileData {
    focusAreas?: string[];
    orgName?: string; 
}

interface NgoIssuesViewProps {
    ngoId: string;
}

const NgoIssuesView: React.FC<NgoIssuesViewProps> = ({ ngoId }) => {
    const { toast } = useToast();
    const [issues, setIssues] = useState<Issue[]>([]);
    const [ngoProfile, setNgoProfile] = useState<NgoProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingIssueId, setUpdatingIssueId] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            const db = getFirestore(app);
            let fetchedFocusAreas: string[] = [];

            try {
                
                console.log("[NgoIssuesView] Fetching profile for NGO ID:", ngoId);
                const ngoProfileRef = doc(db, "ngo_profiles", ngoId);
                const profileSnap = await getDoc(ngoProfileRef);

                if (profileSnap.exists()) {
                    const profileData = profileSnap.data() as NgoProfileData;
                    setNgoProfile(profileData);
                    fetchedFocusAreas = profileData.focusAreas || [];
                    console.log("[NgoIssuesView] NGO Profile Data:", profileData); 
                    console.log("[NgoIssuesView] Extracted Focus Areas:", fetchedFocusAreas);
                } else {
                    console.error("[NgoIssuesView] NGO profile NOT FOUND for ID:", ngoId);
                    setError("Your NGO profile could not be found.");
                    setLoading(false);
                    return;
                }

                
                if (fetchedFocusAreas.length === 0) {
                     console.log("[NgoIssuesView] No focus areas defined for this NGO. No issues will be fetched based on category.");
                     setIssues([]);
                     setLoading(false);
                     return;
                }

                let areasToQuery = fetchedFocusAreas;
                if (areasToQuery.length > 30) {
                     console.warn("[NgoIssuesView] Slicing focus areas to 30 for Firestore 'in' query limit.");
                     areasToQuery = areasToQuery.slice(0, 30);
                }

                const targetStatuses = ["pending", "in-progress"];

                
                console.log("[NgoIssuesView] PRE-QUERY CHECK:");
                console.log("  - Querying collection: 'issues'");
                console.log("  - Filter 1: 'category' IN", areasToQuery);
                console.log("  - Filter 2: 'status' IN", targetStatuses);
                console.log("  - Ordering by: 'timestamp' DESC");
                

                const q = query(
                    collection(db, "issues"),
                    where("category", "in", areasToQuery),
                    where("status", "in", targetStatuses),
                    orderBy("timestamp", "desc"),
                    limit(30) 
                );

                const querySnapshot = await getDocs(q);
                const fetchedIssues: Issue[] = [];
                querySnapshot.forEach((doc) => {
                    
                    console.log(`[NgoIssuesView] Document ${doc.id} raw data:`, doc.data());
                    fetchedIssues.push({ id: doc.id, ...doc.data() } as Issue);
                });
                setIssues(fetchedIssues);
                 console.log(`[NgoIssuesView] Query completed. Found ${fetchedIssues.length} matching issues.`);

            } catch (err: any) {
                console.error("[NgoIssuesView] Firestore Query Error:", err);
                
                if (err.code === 'failed-precondition' && err.message.includes('index')) {
                     setError("Database requires an index for this query. Please check the Firebase console for index creation suggestions.");
                } else {
                    setError("Failed to load relevant issues. " + err.message);
                }
            } finally {
                setLoading(false);
            }
        };

        if (ngoId) {
            fetchData();
        } else {
             setError("NGO ID not provided.");
             setLoading(false);
        }
    }, [ngoId]); 

    const handleMarkResolved = async (issueId: string) => { };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Relevant Community Issues</CardTitle>
                 <CardDescription>
                     {ngoProfile?.focusAreas && ngoProfile.focusAreas.length > 0
                        ? `Showing issues matching your focus areas: ${ngoProfile.focusAreas.join(', ')}`
                        : "No focus areas set in your profile."}
                 </CardDescription>
            </CardHeader>
            <CardContent>
                {loading && ( <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div> )}
                {error && ( <div className="text-destructive bg-destructive/10 p-4 rounded-md text-sm">{error}</div> )}
                {!loading && !error && issues.length === 0 && (
                    <p className="text-muted-foreground text-center py-6 text-sm">
                        No pending or in-progress issues found matching your focus areas at this time.
                    </p>
                )}
                {!loading && !error && issues.length > 0 && (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 border-t pt-4">
                        {issues.map((issue) => (
                            <div key={issue.id} className="border p-4 rounded-lg bg-background hover:shadow-md transition-shadow relative group">
                                {/* ... keep existing card content display logic ... */}
                                 <div className="absolute top-2 right-2">
                                    <Badge variant={issue.status === 'pending' ? 'purple' : 'teal'} className="capitalize text-xs">{issue.status.replace('-', ' ')}</Badge>
                                </div>
                                <h3 className="font-semibold mb-1 pr-20">{issue.title}</h3>
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{issue.description}</p>
                                <div className="text-xs text-muted-foreground space-y-1">
                                    <div><span className="font-medium">Category:</span> <Badge variant="secondary" className="ml-1">{issue.category}</Badge></div>
                                    <div><span className="font-medium">Location:</span> {issue.location}</div>
                                     <div><span className="font-medium">Reported:</span> {issue.timestamp instanceof Timestamp ? format(issue.timestamp.toDate(), 'PP') : 'Unknown'}</div>
                                </div>
                                {issue.imageUrl && (<img src={issue.imageUrl} alt={issue.title} className="mt-2 max-h-32 w-auto rounded-md object-contain cursor-pointer" onClick={()=>window.open(issue.imageUrl, '_blank')}/> )}
                                <div className="mt-3 text-right">
                                    <Button size="sm" variant="outline" onClick={() => handleMarkResolved(issue.id)} disabled={updatingIssueId === issue.id} className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800">
                                        {updatingIssueId === issue.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin"/> : <CheckSquare className="h-4 w-4 mr-1"/>} Mark Resolved
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default NgoIssuesView;