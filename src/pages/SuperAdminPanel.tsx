// src/pages/SuperAdminPanel.tsx
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, Timestamp, orderBy } from "firebase/firestore";
import { app } from "@/firebase";
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, ExternalLink, Mail, Phone, Hash, Link as LinkIcon, Ban, Globe } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NgoProfile {
    id: string;
    orgName: string;
    description: string;
    address: string;
    contactEmail: string;
    contactPhone?: string;
    website?: string;
    focusAreas: string[];
    orgRegistrationNumber?: string;
    registrationDocURL?: string;
    verificationStatus: 'pending' | 'approved' | 'rejected' | 'revoked';
    userId: string;
    submittedAt: Timestamp;
}

interface RestaurantProfile {
    id: string;
    restName: string;
    address: string;
    contactEmail: string;
    contactPhone?: string;
    website?: string;
    licenseNumber?: string;
    registrationDocURL?: string;
    verificationStatus: 'pending' | 'approved' | 'rejected' | 'revoked';
    userId: string;
    submittedAt: Timestamp;
}

const SuperAdminPanel = () => {
    const { userRole, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [pendingNgos, setPendingNgos] = useState<NgoProfile[]>([]);
    const [approvedNgos, setApprovedNgos] = useState<NgoProfile[]>([]);
    const [pendingRestaurants, setPendingRestaurants] = useState<RestaurantProfile[]>([]);
    const [approvedRestaurants, setApprovedRestaurants] = useState<RestaurantProfile[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const db = getFirestore(app);

    useEffect(() => {
        const fetchData = async () => {
            if (userRole !== 'superadmin') return;
            setLoadingData(true);
            setError(null);
            try {
                const ngoPendingQuery = query(collection(db, "ngo_profiles"), where("verificationStatus", "==", "pending"));
                const ngoApprovedQuery = query(collection(db, "ngo_profiles"), where("verificationStatus", "==", "approved"), orderBy("orgName"));
                const [ngoPendingSnapshot, ngoApprovedSnapshot] = await Promise.all([getDocs(ngoPendingQuery), getDocs(ngoApprovedQuery)]);
                const pendingNgosList: NgoProfile[] = ngoPendingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NgoProfile));
                const approvedNgosList: NgoProfile[] = ngoApprovedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NgoProfile));
                setPendingNgos(pendingNgosList);
                setApprovedNgos(approvedNgosList);

                const restPendingQuery = query(collection(db, "restaurant_profiles"), where("verificationStatus", "==", "pending"));
                const restApprovedQuery = query(collection(db, "restaurant_profiles"), where("verificationStatus", "==", "approved"), orderBy("restName"));
                const [restPendingSnapshot, restApprovedSnapshot] = await Promise.all([getDocs(restPendingQuery), getDocs(restApprovedQuery)]);
                const pendingRestsList: RestaurantProfile[] = restPendingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RestaurantProfile));
                const approvedRestsList: RestaurantProfile[] = restApprovedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RestaurantProfile));
                setPendingRestaurants(pendingRestsList);
                setApprovedRestaurants(approvedRestsList);
            } catch (err: any) {
                console.error("Error fetching data:", err);
                setError("Failed to load data.");
            } finally {
                setLoadingData(false);
            }
        };
        if (!authLoading) fetchData();
    }, [db, userRole, authLoading]);

    const handleNgoVerification = async (ngoId: string, orgName: string, newStatus: 'approved' | 'rejected') => {
        setUpdatingId(ngoId);
        const ngoProfileRef = doc(db, "ngo_profiles", ngoId);
        const userRef = doc(db, "users", ngoId);
        try {
            await updateDoc(ngoProfileRef, { verificationStatus: newStatus });
            if (newStatus === 'approved') {
                await updateDoc(userRef, { role: 'ngo' });
            }
            toast({ title: `NGO ${newStatus}`, description: `Application for ${orgName} has been ${newStatus}.`, variant: newStatus === 'approved' ? 'default' : 'destructive' });
            const updatedNgo = pendingNgos.find(n => n.id === ngoId);
            setPendingNgos(prev => prev.filter(ngo => ngo.id !== ngoId));
            if (newStatus === 'approved' && updatedNgo) {
                setApprovedNgos(prev => [
                    ...prev,
                    { ...updatedNgo, verificationStatus: newStatus } // Explicitly set verificationStatus with newStatus
                ].sort((a, b) => a.orgName.localeCompare(b.orgName)));
            }
        } catch (err: any) {
            toast({ title: "Update Failed", description: err.message, variant: "destructive" });
        } finally {
            setUpdatingId(null);
        }
    };

    const handleRestaurantVerification = async (restId: string, restName: string, newStatus: 'approved' | 'rejected') => {
        setUpdatingId(restId);
        const restProfileRef = doc(db, "restaurant_profiles", restId);
        const userRef = doc(db, "users", restId);
        try {
            await updateDoc(restProfileRef, { verificationStatus: newStatus });
            if (newStatus === 'approved') {
                await updateDoc(userRef, { role: 'restaurant' });
            }
            toast({ title: `Restaurant ${newStatus}`, description: `Application for ${restName} has been ${newStatus}.`, variant: newStatus === 'approved' ? 'default' : 'destructive' });
            const updatedRest = pendingRestaurants.find(r => r.id === restId);
            setPendingRestaurants(prev => prev.filter(rest => rest.id !== restId));
            if (newStatus === 'approved' && updatedRest) {
                setApprovedRestaurants(prev => [
                    ...prev,
                    { ...updatedRest, verificationStatus: newStatus } // Explicitly set verificationStatus with newStatus
                ].sort((a, b) => a.restName.localeCompare(b.restName)));
            }
        } catch (err: any) {
            toast({ title: "Update Failed", description: err.message, variant: "destructive" });
        } finally {
            setUpdatingId(null);
        }
    };

    const handleNgoRevoke = async (ngoId: string, orgName: string) => {
        setUpdatingId(ngoId);
        const ngoProfileRef = doc(db, "ngo_profiles", ngoId);
        const userRef = doc(db, "users", ngoId);
        try {
            await updateDoc(ngoProfileRef, { verificationStatus: 'revoked' });
            await updateDoc(userRef, { role: null });
            toast({ title: "NGO Approval Revoked", description: `Approval for ${orgName} has been revoked.`, variant: "destructive" });
            setApprovedNgos(prev => prev.filter(ngo => ngo.id !== ngoId));
        } catch (err: any) {
            toast({ title: "Revoke Failed", description: err.message, variant: "destructive" });
        } finally {
            setUpdatingId(null);
        }
    };

    const handleRestaurantRevoke = async (restId: string, restName: string) => {
        setUpdatingId(restId);
        const restProfileRef = doc(db, "restaurant_profiles", restId);
        const userRef = doc(db, "users", restId);
        try {
            await updateDoc(restProfileRef, { verificationStatus: 'revoked' });
            await updateDoc(userRef, { role: null });
            toast({ title: "Restaurant Approval Revoked", description: `Approval for ${restName} has been revoked.`, variant: "destructive" });
            setApprovedRestaurants(prev => prev.filter(rest => rest.id !== restId));
        } catch (err: any) {
            toast({ title: "Revoke Failed", description: err.message, variant: "destructive" });
        } finally {
            setUpdatingId(null);
        }
    };

    if (authLoading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /><span className="ml-4 text-muted-foreground">Verifying Access...</span></div>;
    }
    if (userRole !== 'superadmin') {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow flex items-center justify-center text-center p-4">
                    <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
                    <p className="text-muted-foreground">You do not have permission.</p>
                    <Button asChild className="mt-4"><Link to="/">Go Home</Link></Button>
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
                        <h1 className="text-3xl md:text-4xl font-bold mb-8">Super Admin Panel</h1>
                        <Tabs defaultValue="pending-ngos" className="w-full">
                            <TabsList className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-2">
                                <TabsTrigger value="pending-ngos">Pending NGOs ({pendingNgos.length})</TabsTrigger>
                                <TabsTrigger value="approved-ngos">Approved NGOs ({approvedNgos.length})</TabsTrigger>
                                <TabsTrigger value="pending-restaurants">Pending Restaurants ({pendingRestaurants.length})</TabsTrigger>
                                <TabsTrigger value="approved-restaurants">Approved Restaurants ({approvedRestaurants.length})</TabsTrigger>
                            </TabsList>

                            <TabsContent value="pending-ngos">
                                {loadingData && <div className="flex justify-center p-16"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}
                                {error && <div className="text-destructive bg-destructive/10 p-4 rounded-md mb-6">{error}</div>}
                                {!loadingData && !error && pendingNgos.length === 0 && <p className="text-muted-foreground text-center py-8">No pending NGO applications.</p>}
                                {!loadingData && !error && pendingNgos.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {pendingNgos.map(ngo => (
                                            <Card key={ngo.id} className="flex flex-col bg-card border">
                                                <CardHeader>
                                                    <CardTitle>{ngo.orgName}</CardTitle>
                                                    <CardDescription>{ngo.address || 'Address not provided'}</CardDescription>
                                                </CardHeader>
                                                <CardContent className="flex-grow space-y-3 text-sm">
                                                    <p><strong>Desc:</strong> {ngo.description || 'N/A'}</p>
                                                    <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground"/> <span>{ngo.contactEmail}</span></div>
                                                    {ngo.contactPhone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground"/> <span>{ngo.contactPhone}</span></div>}
                                                    {ngo.website && <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground"/> <a href={ngo.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{ngo.website}</a></div>}
                                                    {ngo.orgRegistrationNumber && <div className="flex items-center gap-2"><Hash className="h-4 w-4 text-muted-foreground"/> <span>{ngo.orgRegistrationNumber}</span></div>}
                                                    <div><strong className="font-medium block mb-1">Focus Areas:</strong><div className="flex flex-wrap gap-1">{ngo.focusAreas?.map(area => <Badge key={area} variant="secondary">{area}</Badge>) || <span className="text-muted-foreground text-xs">None</span>}</div></div>
                                                    <div className="pt-1"><strong className="font-medium block mb-1">Document:</strong>{ngo.registrationDocURL ? <a href={ngo.registrationDocURL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all inline-flex items-center text-xs sm:text-sm"><LinkIcon className="h-4 w-4 mr-1"/> Verify Document <ExternalLink className="h-3 w-3 ml-1"/></a> : <span className="text-muted-foreground italic">No document</span>}</div>
                                                    <p className="text-xs text-muted-foreground pt-2">Submitted: {format(ngo.submittedAt.toDate(), "PPp")}</p>
                                                </CardContent>
                                                <CardFooter className="flex justify-end gap-2 border-t pt-4">
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="outline" size="sm" disabled={updatingId === ngo.id} className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive">
                                                                {updatingId === ngo.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <XCircle className="h-4 w-4 mr-1"/>}Reject
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader><AlertDialogTitle>Confirm Rejection</AlertDialogTitle><AlertDialogDescription>Reject application for "{ngo.orgName}"?</AlertDialogDescription></AlertDialogHeader>
                                                            <AlertDialogFooter><AlertDialogCancel disabled={updatingId === ngo.id}>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleNgoVerification(ngo.id, ngo.orgName, 'rejected')} disabled={updatingId === ngo.id} className={buttonVariants({variant: "destructive"})}>Confirm Reject</AlertDialogAction></AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                    <Button variant="default" size="sm" onClick={() => handleNgoVerification(ngo.id, ngo.orgName, 'approved')} disabled={updatingId === ngo.id} className="bg-green-600 hover:bg-green-700 text-white">
                                                        {updatingId === ngo.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle className="h-4 w-4 mr-1"/>}Approve
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="approved-ngos">
                                {loadingData && <div className="flex justify-center p-16"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}
                                {error && <div className="text-destructive bg-destructive/10 p-4 rounded-md mb-6">{error}</div>}
                                {!loadingData && !error && approvedNgos.length === 0 && <p className="text-muted-foreground text-center py-8">No approved NGOs.</p>}
                                {!loadingData && !error && approvedNgos.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {approvedNgos.map(ngo => (
                                            <Card key={ngo.id} className="flex flex-col bg-card border">
                                                <CardHeader>
                                                    <CardTitle>{ngo.orgName}</CardTitle>
                                                    <CardDescription>{ngo.address || 'Address not provided'}</CardDescription>
                                                </CardHeader>
                                                <CardContent className="flex-grow space-y-3 text-sm">
                                                    <p><strong>Desc:</strong> {ngo.description || 'N/A'}</p>
                                                    <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground"/> <span>{ngo.contactEmail}</span></div>
                                                    {ngo.contactPhone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground"/> <span>{ngo.contactPhone}</span></div>}
                                                    {ngo.website && <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground"/> <a href={ngo.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{ngo.website}</a></div>}
                                                    {ngo.orgRegistrationNumber && <div className="flex items-center gap-2"><Hash className="h-4 w-4 text-muted-foreground"/> <span>{ngo.orgRegistrationNumber}</span></div>}
                                                    <div><strong className="font-medium block mb-1">Focus Areas:</strong><div className="flex flex-wrap gap-1">{ngo.focusAreas?.map(area => <Badge key={area} variant="secondary">{area}</Badge>) || <span className="text-muted-foreground text-xs">None</span>}</div></div>
                                                    {ngo.registrationDocURL && <div className="pt-1"><strong className="font-medium block mb-1">Document:</strong><a href={ngo.registrationDocURL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all inline-flex items-center text-xs sm:text-sm"><LinkIcon className="h-4 w-4 mr-1"/> View Document <ExternalLink className="h-3 w-3 ml-1"/></a></div>}
                                                </CardContent>
                                                <CardFooter className="flex justify-end gap-2 border-t pt-4">
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="destructive" size="sm" disabled={updatingId === ngo.id}>
                                                                {updatingId === ngo.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Ban className="h-4 w-4 mr-1"/>}Revoke Approval
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader><AlertDialogTitle>Confirm Revocation</AlertDialogTitle><AlertDialogDescription>Revoke approval for "{ngo.orgName}"?</AlertDialogDescription></AlertDialogHeader>
                                                            <AlertDialogFooter><AlertDialogCancel disabled={updatingId === ngo.id}>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleNgoRevoke(ngo.id, ngo.orgName)} disabled={updatingId === ngo.id} className={buttonVariants({variant: "destructive"})}>Confirm Revoke</AlertDialogAction></AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </CardFooter>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="pending-restaurants">
                                {loadingData && <div className="flex justify-center p-16"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}
                                {error && <div className="text-destructive bg-destructive/10 p-4 rounded-md mb-6">{error}</div>}
                                {!loadingData && !error && pendingRestaurants.length === 0 && <p className="text-muted-foreground text-center py-8">No pending restaurant applications.</p>}
                                {!loadingData && !error && pendingRestaurants.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {pendingRestaurants.map(rest => (
                                            <Card key={rest.id} className="flex flex-col bg-card border">
                                                <CardHeader>
                                                    <CardTitle>{rest.restName}</CardTitle>
                                                    <CardDescription>{rest.address || 'Address not provided'}</CardDescription>
                                                </CardHeader>
                                                <CardContent className="flex-grow space-y-3 text-sm">
                                                    <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground"/> <span>{rest.contactEmail}</span></div>
                                                    {rest.contactPhone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground"/> <span>{rest.contactPhone}</span></div>}
                                                    {rest.website && <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground"/> <a href={rest.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{rest.website}</a></div>}
                                                    {rest.licenseNumber && <div className="flex items-center gap-2"><Hash className="h-4 w-4 text-muted-foreground"/> <span>{rest.licenseNumber}</span></div>}
                                                    <div className="pt-1"><strong className="font-medium block mb-1">Document:</strong>{rest.registrationDocURL ? <a href={rest.registrationDocURL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all inline-flex items-center text-xs sm:text-sm"><LinkIcon className="h-4 w-4 mr-1"/> Verify Document <ExternalLink className="h-3 w-3 ml-1"/></a> : <span className="text-muted-foreground italic">No document</span>}</div>
                                                    <p className="text-xs text-muted-foreground pt-2">Submitted: {format(rest.submittedAt.toDate(), "PPp")}</p>
                                                </CardContent>
                                                <CardFooter className="flex justify-end gap-2 border-t pt-4">
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="outline" size="sm" disabled={updatingId === rest.id} className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive">
                                                                {updatingId === rest.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <XCircle className="h-4 w-4 mr-1"/>}Reject
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader><AlertDialogTitle>Confirm Rejection</AlertDialogTitle><AlertDialogDescription>Reject application for "{rest.restName}"?</AlertDialogDescription></AlertDialogHeader>
                                                            <AlertDialogFooter><AlertDialogCancel disabled={updatingId === rest.id}>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleRestaurantVerification(rest.id, rest.restName, 'rejected')} disabled={updatingId === rest.id} className={buttonVariants({variant: "destructive"})}>Confirm Reject</AlertDialogAction></AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                    <Button variant="default" size="sm" onClick={() => handleRestaurantVerification(rest.id, rest.restName, 'approved')} disabled={updatingId === rest.id} className="bg-green-600 hover:bg-green-700 text-white">
                                                        {updatingId === rest.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle className="h-4 w-4 mr-1"/>}Approve
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="approved-restaurants">
                                {loadingData && <div className="flex justify-center p-16"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}
                                {error && <div className="text-destructive bg-destructive/10 p-4 rounded-md mb-6">{error}</div>}
                                {!loadingData && !error && approvedRestaurants.length === 0 && <p className="text-muted-foreground text-center py-8">No approved restaurants.</p>}
                                {!loadingData && !error && approvedRestaurants.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {approvedRestaurants.map(rest => (
                                            <Card key={rest.id} className="flex flex-col bg-card border">
                                                <CardHeader>
                                                    <CardTitle>{rest.restName}</CardTitle>
                                                    <CardDescription>{rest.address || 'Address not provided'}</CardDescription>
                                                </CardHeader>
                                                <CardContent className="flex-grow space-y-3 text-sm">
                                                    <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground"/> <span>{rest.contactEmail}</span></div>
                                                    {rest.contactPhone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground"/> <span>{rest.contactPhone}</span></div>}
                                                    {rest.website && <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground"/> <a href={rest.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{rest.website}</a></div>}
                                                    {rest.licenseNumber && <div className="flex items-center gap-2"><Hash className="h-4 w-4 text-muted-foreground"/> <span>{rest.licenseNumber}</span></div>}
                                                    {rest.registrationDocURL && <div className="pt-1"><strong className="font-medium block mb-1">Document:</strong><a href={rest.registrationDocURL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all inline-flex items-center text-xs sm:text-sm"><LinkIcon className="h-4 w-4 mr-1"/> View Document <ExternalLink className="h-3 w-3 ml-1"/></a></div>}
                                                </CardContent>
                                                <CardFooter className="flex justify-end gap-2 border-t pt-4">
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="destructive" size="sm" disabled={updatingId === rest.id}>
                                                                {updatingId === rest.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Ban className="h-4 w-4 mr-1"/>}Revoke Approval
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader><AlertDialogTitle>Confirm Revocation</AlertDialogTitle><AlertDialogDescription>Revoke approval for "{rest.restName}"?</AlertDialogDescription></AlertDialogHeader>
                                                            <AlertDialogFooter><AlertDialogCancel disabled={updatingId === rest.id}>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleRestaurantRevoke(rest.id, rest.restName)} disabled={updatingId === rest.id} className={buttonVariants({variant: "destructive"})}>Confirm Revoke</AlertDialogAction></AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </CardFooter>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                </section>
            </main>
            <Footer />
        </motion.div>
    );
};

export default SuperAdminPanel;