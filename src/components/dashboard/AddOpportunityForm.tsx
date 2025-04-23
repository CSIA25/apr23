import React, { useState } from 'react';
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { app } from "@/firebase"; // Adjust path if needed
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from 'lucide-react';

interface AddOpportunityFormProps {
    ngoId: string;
    ngoName: string;
}

const AddOpportunityForm: React.FC<AddOpportunityFormProps> = ({ ngoId, ngoName }) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "",
        location: "",
        date: "",
        time: "",
        spots: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (value: string) => {
        setFormData((prev) => ({ ...prev, category: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const db = getFirestore(app);

        try {
            const opportunityData = {
                ...formData,
                spots: parseInt(formData.spots, 10) || 0, // Convert spots to number
                orgId: ngoId,
                orgName: ngoName,
                createdAt: serverTimestamp(),
                status: 'open', // Default status
            };

            await addDoc(collection(db, "opportunities"), opportunityData);

            toast({
                title: "Opportunity Added",
                description: "The new volunteering opportunity has been listed.",
            });
            // Reset form
            setFormData({ title: "", description: "", category: "", location: "", date: "", time: "", spots: "" });

        } catch (error: any) {
            console.error("Error adding opportunity:", error);
            toast({
                title: "Adding Failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Add New Volunteer Opportunity
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="title">Opportunity Title *</Label>
                            <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
                        </div>
                         <div className="space-y-1">
                            <Label htmlFor="category">Category *</Label>
                            <Select value={formData.category} onValueChange={handleSelectChange} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="environment">Environment</SelectItem>
                                    <SelectItem value="social welfare">Social Welfare</SelectItem>
                                    <SelectItem value="education">Education</SelectItem>
                                    <SelectItem value="healthcare">Healthcare</SelectItem>
                                    <SelectItem value="animal welfare">Animal Welfare</SelectItem>
                                    <SelectItem value="event support">Event Support</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                     <div className="space-y-1">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea id="description" name="description" value={formData.description} onChange={handleChange} required />
                    </div>


                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <Label htmlFor="location">Location *</Label>
                            <Input id="location" name="location" value={formData.location} onChange={handleChange} required />
                        </div>
                         <div className="space-y-1">
                            <Label htmlFor="date">Date *</Label>
                            <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} required />
                        </div>
                         <div className="space-y-1">
                            <Label htmlFor="time">Time *</Label>
                            <Input id="time" name="time" type="time" value={formData.time} onChange={handleChange} required />
                        </div>
                     </div>
                     <div className="space-y-1">
                         <Label htmlFor="spots">Number of Spots Available *</Label>
                         <Input id="spots" name="spots" type="number" min="1" value={formData.spots} onChange={handleChange} required />
                     </div>


                    <Button type="submit" variant="default" disabled={loading}>
                        {loading ? "Adding..." : "Add Opportunity"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default AddOpportunityForm;