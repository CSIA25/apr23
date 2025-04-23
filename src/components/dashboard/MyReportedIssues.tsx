// src/components/dashboard/MyReportedIssues.tsx
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { app } from "@/firebase";
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Megaphone } from 'lucide-react';
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
    status?: 'pending' | 'in-progress' | 'resolved'; // Made optional
}

const MyReportedIssues = () => {
    const { user } = useAuth();
    const [myIssues, setMyIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchMyIssues = async () => {
            setLoading(true);
            setError(null);
            const db = getFirestore(app);
            console.log("MyReportedIssues: Fetching issues for user", user.uid);
            try {
                const q = query(
                    collection(db, "issues"),
                    where("reporterId", "==", user.uid),
                    orderBy("timestamp", "desc")
                );
                const querySnapshot = await getDocs(q);
                const issues: Issue[] = [];
                querySnapshot.forEach((doc) => {
                    issues.push({ id: doc.id, ...doc.data() } as Issue);
                });
                setMyIssues(issues);
                console.log(`MyReportedIssues: Found ${issues.length} issues reported by user.`);
            } catch (err: any) {
                console.error("MyReportedIssues: Error fetching user's issues:", err);
                if (err.code === 'failed-precondition' && err.message.includes('index')) {
                    setError("Database index missing. Please contact support or try again later.");
                } else {
                    setError("Could not load your reported issues: " + err.message);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchMyIssues();
    }, [user]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><Megaphone className="mr-2 h-5 w-5 text-primary"/>My Reported Issues</CardTitle>
            </CardHeader>
            <CardContent>
                {loading && (
                    <div className="flex justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                )}
                {error && (
                    <div className="text-destructive bg-destructive/10 p-3 rounded-md text-sm flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" /> {error}
                    </div>
                )}
                {!loading && !error && myIssues.length === 0 && (
                    <p className="text-muted-foreground text-center py-4 text-sm">You haven't reported any issues yet.</p>
                )}
                {!loading && !error && myIssues.length > 0 && (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {myIssues.map((issue) => (
                            <div key={issue.id} className="border p-3 rounded-md bg-background">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-medium text-sm">{issue.title}</h4>
                                    <Badge
                                        variant={
                                            issue.status === 'pending' ? 'purple' :
                                            issue.status === 'in-progress' ? 'teal' :
                                            issue.status === 'resolved' ? 'default' :
                                            'outline' // Fallback for undefined or unexpected status
                                        }
                                        className="capitalize text-xs"
                                    >
                                        {issue.status ? issue.status.replace('-', ' ') : 'Unknown'}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">{issue.location}</p>
                                <p className="text-xs text-muted-foreground">
                                    Reported: {issue.timestamp instanceof Timestamp ? format(issue.timestamp.toDate(), 'PP') : 'Unknown'}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default MyReportedIssues;