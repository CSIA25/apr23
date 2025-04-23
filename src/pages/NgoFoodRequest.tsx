// src/pages/NgoFoodRequest.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from '@/context/AuthContext';
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { app } from "@/firebase";
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const db = getFirestore(app);

const NgoFoodRequest = () => {
    const { user, userRole, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [foodType, setFoodType] = useState("");
    const [quantity, setQuantity] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    if (authLoading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /><span className="ml-4 text-muted-foreground">Loading...</span></div>;
    }
    if (userRole !== 'ngo') {
        return <div className="min-h-screen flex flex-col"><Navbar /><main className="flex-grow flex items-center justify-center text-center p-4"><h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1><p className="text-muted-foreground">Only NGOs can access this page.</p><Button onClick={() => navigate('/')} className="mt-4">Go Home</Button></main><Footer /></div>;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!foodType || !quantity) {
            toast({ title: "Missing Information", description: "Please fill all required fields.", variant: "destructive" });
            return;
        }
        setLoading(true);
        try {
            await addDoc(collection(db, "food_requests"), {
                ngoId: user!.uid,
                foodType,
                quantity: parseInt(quantity),
                description,
                status: "pending",
                createdAt: serverTimestamp(),
            });
            toast({ title: "Request Submitted", description: "Your food request has been submitted." });
            navigate("/dashboard");
        } catch (error: any) {
            toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow pt-24 pb-16">
                <section>
                    <div className="container mx-auto px-4">
                        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">Submit Food Request</h1>
                        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="foodType">Food Type *</Label>
                                <Input id="foodType" placeholder="e.g., Rice, Bread" value={foodType} onChange={(e) => setFoodType(e.target.value)} required />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="quantity">Quantity (in kg or units) *</Label>
                                <Input id="quantity" type="number" placeholder="e.g., 10" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" placeholder="Additional details..." value={description} onChange={(e) => setDescription(e.target.value)} />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Request"}
                            </Button>
                        </form>
                    </div>
                </section>
            </main>
            <Footer />
        </motion.div>
    );
};

export default NgoFoodRequest;