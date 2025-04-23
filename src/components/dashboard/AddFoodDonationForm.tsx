// src/components/dashboard/AddFoodDonationForm.tsx
import React, { useState } from 'react';
import { getFirestore, collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { app } from "@/firebase"; // Adjust path if needed
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast"; // Use the hook from the correct location
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Utensils, PlusCircle, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils"; // Import cn if needed for Calendar styling

interface AddFoodDonationFormProps {
    restaurantId: string;
    restaurantName: string;
}

const AddFoodDonationForm: React.FC<AddFoodDonationFormProps> = ({ restaurantId, restaurantName }) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [bestBeforeDate, setBestBeforeDate] = useState<Date | undefined>(undefined);
    const [formData, setFormData] = useState({
        foodType: "",
        quantity: "",
        pickupLocation: "",
        pickupInstructions: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.foodType || !formData.quantity || !formData.pickupLocation) {
            toast({ title: "Missing Information", description: "Please fill Food Type, Quantity, and Pickup Location.", variant: "destructive" });
            return;
        }
        setLoading(true);
        const db = getFirestore(app);

        try {
            const donationData = {
                ...formData,
                restaurantId: restaurantId,
                restaurantName: restaurantName,
                bestBefore: bestBeforeDate ? Timestamp.fromDate(bestBeforeDate) : null,
                createdAt: serverTimestamp(),
                status: 'available', // Default status
            };

            await addDoc(collection(db, "food_donations"), donationData);

            toast({
                title: "Food Donation Listed",
                description: "Your surplus food donation is now visible to volunteers.",
            });
            // Reset form
            setFormData({ foodType: "", quantity: "", pickupLocation: "", pickupInstructions: "" });
            setBestBeforeDate(undefined);

        } catch (error: any) {
            console.error("Error adding food donation:", error);
            toast({
                title: "Listing Failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="mt-8 mb-8"> {/* Added margin */}
            <CardHeader>
                <CardTitle className="flex items-center">
                    <PlusCircle className="mr-2 h-5 w-5 text-green-600" />
                    List Surplus Food Donation
                </CardTitle>
                <CardDescription>Make your extra food available for volunteers to pick up.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="foodType">Food Type / Description *</Label>
                            <Input id="foodType" name="foodType" placeholder="e.g., Leftover Rice & Curry (veg)" value={formData.foodType} onChange={handleChange} required />
                        </div>
                         <div className="space-y-1">
                            <Label htmlFor="quantity">Approx. Quantity *</Label>
                            <Input id="quantity" name="quantity" placeholder="e.g., Serves 10 people, 5 loaves" value={formData.quantity} onChange={handleChange} required />
                        </div>
                    </div>

                     <div className="space-y-1">
                        <Label htmlFor="pickupLocation">Pickup Location *</Label>
                        <Input id="pickupLocation" name="pickupLocation" placeholder="Your restaurant address or specific pickup point" value={formData.pickupLocation} onChange={handleChange} required />
                    </div>

                     <div className="space-y-1">
                        <Label htmlFor="pickupInstructions">Pickup Instructions (Optional)</Label>
                        <Textarea id="pickupInstructions" name="pickupInstructions" placeholder="e.g., Available after 9 PM, ask for Manager" value={formData.pickupInstructions} onChange={handleChange} />
                    </div>

                    <div className="space-y-1">
                         <Label htmlFor="bestBefore">Best Before (Optional)</Label>
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !bestBeforeDate && "text-muted-foreground"
                                  )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {bestBeforeDate ? format(bestBeforeDate, "PPP") : <span>Pick best before date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={bestBeforeDate}
                                    onSelect={setBestBeforeDate}
                                    initialFocus
                                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} // Disable past dates
                                />
                            </PopoverContent>
                        </Popover>
                    </div>


                    <Button type="submit" variant="default" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Utensils className="h-4 w-4 mr-2"/>}
                        {loading ? "Listing Donation..." : "List Food Donation"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default AddFoodDonationForm;