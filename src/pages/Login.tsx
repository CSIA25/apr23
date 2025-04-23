// src/pages/Login.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { User, Mail, Lock, EyeOff, Eye, Key, Building, Phone, Globe, MapPin, Hash, Utensils } from "lucide-react";

import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { app } from "../firebase";

const auth = getAuth(app);
const db = getFirestore(app);

const IMGBB_API_KEY = "1775a875652ad9cea7ef7e7418f774f1";

const focusAreasOptions = [
    "environment", "social welfare", "education", "healthcare", "animal welfare",
    "disaster relief", "community development", "human rights", "technology",
    "arts & culture", "other"
];

const Login = () => {
    const { toast } = useToast();
    const [showPassword, setShowPassword] = useState(false);
    const [loadingLogin, setLoadingLogin] = useState(false);
    const [loadingRegister, setLoadingRegister] = useState(false);

    const [registerName, setRegisterName] = useState("");
    const [registerEmail, setRegisterEmail] = useState("");
    const [registerPassword, setRegisterPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [registerRole, setRegisterRole] = useState<"volunteer" | "ngo" | "restaurant">("volunteer");

    // NGO Specific State
    const [orgName, setOrgName] = useState("");
    const [orgDescription, setOrgDescription] = useState("");
    const [orgAddress, setOrgAddress] = useState("");
    const [orgContactEmail, setOrgContactEmail] = useState("");
    const [orgContactPhone, setOrgContactPhone] = useState("");
    const [orgWebsite, setOrgWebsite] = useState("");
    const [orgFocusAreas, setOrgFocusAreas] = useState<string[]>([]);
    const [orgRegistrationNumber, setOrgRegistrationNumber] = useState("");
    const [registrationDoc, setRegistrationDoc] = useState<File | null>(null);

    // Restaurant Specific State
    const [restName, setRestName] = useState("");
    const [restAddress, setRestAddress] = useState("");
    const [restContactEmail, setRestContactEmail] = useState("");
    const [restContactPhone, setRestContactPhone] = useState("");
    const [restWebsite, setRestWebsite] = useState("");
    const [restLicenseNumber, setRestLicenseNumber] = useState("");
    const [restDoc, setRestDoc] = useState<File | null>(null);

    const navigate = useNavigate();

    const handleFocusAreaChange = (area: string) => {
        setOrgFocusAreas((prev) =>
            prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
        );
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setDoc: (file: File | null) => void) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type !== "application/pdf") {
                toast({ title: "Invalid File", description: "Please upload a PDF file.", variant: "destructive" });
                return;
            }
            if (file.size > 32 * 1024 * 1024) {
                toast({ title: "File Too Large", description: "Please upload a file smaller than 32MB.", variant: "destructive" });
                return;
            }
            setDoc(file);
        }
    };

    const uploadToImgBB = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("key", IMGBB_API_KEY);
        const response = await fetch("https://api.imgbb.com/1/upload", { method: "POST", body: formData });
        const data = await response.json();
        if (!data.success) throw new Error(data.error.message || "Failed to upload to ImgBB");
        return data.data.url;
    };

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoadingLogin(true);
        const email = (e.target as HTMLFormElement).email.value;
        const password = (e.target as HTMLFormElement).password.value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast({ title: "Login Successful", description: "Welcome back!" });
            navigate("/");
        } catch (error: any) {
            toast({ title: "Login Failed", description: error.message, variant: "destructive" });
        } finally {
            setLoadingLogin(false);
        }
    };

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoadingRegister(true);

        const fullName = registerName;
        const email = registerEmail;
        const password = registerPassword;

        if (password !== confirmPassword) {
            toast({ title: "Registration Failed", description: "Passwords do not match.", variant: "destructive" });
            setLoadingRegister(false);
            return;
        }

        if (registerRole === "ngo") {
            if (!orgName || !orgDescription || !orgAddress || !orgContactEmail || orgFocusAreas.length === 0 || !registrationDoc) {
                toast({ title: "Missing Information", description: "Please fill all required (*) NGO details and upload a registration document.", variant: "destructive" });
                setLoadingRegister(false);
                return;
            }
        } else if (registerRole === "restaurant") {
            if (!restName || !restAddress || !restContactEmail) {
                toast({ title: "Missing Information", description: "Please fill all required (*) restaurant details.", variant: "destructive" });
                setLoadingRegister(false);
                return;
            }
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await updateProfile(user, { displayName: fullName });

            const userDocRef = doc(db, "users", user.uid);
            await setDoc(userDocRef, { name: fullName, email: email, role: registerRole, createdAt: serverTimestamp() });

            if (registerRole === "ngo" && registrationDoc) {
                const pdfUrl = await uploadToImgBB(registrationDoc);
                const ngoProfileRef = doc(db, "ngo_profiles", user.uid);
                await setDoc(ngoProfileRef, {
                    userId: user.uid,
                    orgName, description: orgDescription, address: orgAddress,
                    contactEmail: orgContactEmail, contactPhone: orgContactPhone,
                    website: orgWebsite, focusAreas: orgFocusAreas,
                    orgRegistrationNumber, registrationDocURL: pdfUrl,
                    verificationStatus: "pending", submittedAt: serverTimestamp(),
                });
                toast({ title: "NGO Registration Submitted", description: "Your application is under review.", duration: 7000 });
            } else if (registerRole === "restaurant") {
                const restDocUrl = restDoc ? await uploadToImgBB(restDoc) : null;
                const restProfileRef = doc(db, "restaurant_profiles", user.uid);
                await setDoc(restProfileRef, {
                    userId: user.uid,
                    restName, address: restAddress,
                    contactEmail: restContactEmail, contactPhone: restContactPhone,
                    website: restWebsite, licenseNumber: restLicenseNumber,
                    registrationDocURL: restDocUrl,
                    verificationStatus: "pending", submittedAt: serverTimestamp(),
                });
                toast({ title: "Restaurant Registration Submitted", description: "Your application is under review.", duration: 7000 });
            } else {
                toast({ title: "Registration Successful", description: "Welcome to Mero Samaj!" });
            }

            navigate("/");
        } catch (error: any) {
            toast({ title: "Registration Failed", description: error.code === "auth/email-already-in-use" ? "Email already registered." : error.message, variant: "destructive" });
        } finally {
            setLoadingRegister(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow pt-24 md:pt-32 pb-16">
                <section>
                    <div className="container mx-auto px-4">
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }} className="max-w-lg mx-auto bg-card rounded-xl shadow-lg overflow-hidden border">
                            <div className="p-6 md:p-8">
                                <div className="text-center mb-8">
                                    <h1 className="text-2xl font-bold text-foreground">Welcome to Mero Samaj</h1>
                                    <p className="text-muted-foreground">Sign in or create your account</p>
                                </div>
                                <Tabs defaultValue="login" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 mb-6">
                                        <TabsTrigger value="login">Login</TabsTrigger>
                                        <TabsTrigger value="register">Register</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="login">
                                        <form onSubmit={handleLogin} className="space-y-4">
                                            <div className="space-y-1">
                                                <Label htmlFor="email">Email</Label>
                                                <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="email" type="email" name="email" placeholder="your@email.com" className="pl-10" required /></div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between items-center"><Label htmlFor="password">Password</Label><Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot?</Link></div>
                                                <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="password" type={showPassword ? "text" : "password"} name="password" placeholder="••••••••" className="pl-10 pr-10" required /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></div>
                                            </div>
                                            <div className="flex items-center justify-between"><div className="flex items-center space-x-2"><Checkbox id="remember" /><Label htmlFor="remember" className="text-sm font-normal">Remember me</Label></div></div>
                                            <Button type="submit" className="w-full btn-gradient" disabled={loadingLogin}>{loadingLogin ? "Signing in..." : "Sign In"}</Button>
                                        </form>
                                    </TabsContent>
                                    <TabsContent value="register">
                                        <form onSubmit={handleRegister} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Registering as *</Label>
                                                <Select value={registerRole} onValueChange={(value) => setRegisterRole(value as "volunteer" | "ngo" | "restaurant")} required>
                                                    <SelectTrigger className="w-full"><SelectValue placeholder="Select your role..." /></SelectTrigger>
                                                    <SelectContent><SelectItem value="volunteer">Volunteer</SelectItem><SelectItem value="ngo">Non-Governmental Organization (NGO)</SelectItem><SelectItem value="restaurant">Restaurant</SelectItem></SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1"><Label htmlFor="reg-name">Full Name *</Label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="reg-name" placeholder="Your Full Name" className="pl-10" required value={registerName} onChange={(e) => setRegisterName(e.target.value)} /></div></div>
                                            <div className="space-y-1"><Label htmlFor="reg-email">Email Address *</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="reg-email" type="email" placeholder="your@email.com" className="pl-10" required value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} /></div></div>
                                            <div className="space-y-1"><Label htmlFor="reg-password">Create Password *</Label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="reg-password" type={showPassword ? "text" : "password"} placeholder="Create a strong password" className="pl-10 pr-10" required value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></div></div>
                                            <div className="space-y-1"><Label htmlFor="confirm-password">Confirm Password *</Label><div className="relative"><Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="confirm-password" type={showPassword ? "text" : "password"} placeholder="Confirm your password" className="pl-10" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div></div>

                                            {registerRole === "ngo" && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.3 }} className="space-y-4 border-t pt-4 mt-4">
                                                    <h3 className="text-lg font-medium text-center text-primary">NGO Information</h3>
                                                    <div className="space-y-1"><Label htmlFor="orgName">Organization Name *</Label><div className="relative"><Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="orgName" placeholder="Official Name" className="pl-10" value={orgName} onChange={(e) => setOrgName(e.target.value)} required /></div></div>
                                                    <div className="space-y-1"><Label htmlFor="orgDescription">Description *</Label><Textarea id="orgDescription" placeholder="Mission, goals, activities..." value={orgDescription} onChange={(e) => setOrgDescription(e.target.value)} required /></div>
                                                    <div className="space-y-1"><Label htmlFor="orgAddress">Full Address *</Label><div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="orgAddress" placeholder="Street, City, District" className="pl-10" value={orgAddress} onChange={(e) => setOrgAddress(e.target.value)} required /></div></div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-1"><Label htmlFor="orgContactEmail">Contact Email *</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="orgContactEmail" type="email" placeholder="info@org.com" className="pl-10" value={orgContactEmail} onChange={(e) => setOrgContactEmail(e.target.value)} required /></div></div>
                                                        <div className="space-y-1"><Label htmlFor="orgContactPhone">Contact Phone</Label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="orgContactPhone" type="tel" placeholder="Optional phone number" className="pl-10" value={orgContactPhone} onChange={(e) => setOrgContactPhone(e.target.value)} /></div></div>
                                                    </div>
                                                    <div className="space-y-1"><Label htmlFor="orgWebsite">Website (Optional)</Label><div className="relative"><Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="orgWebsite" placeholder="https://your-org.org" className="pl-10" value={orgWebsite} onChange={(e) => setOrgWebsite(e.target.value)} /></div></div>
                                                    <div className="space-y-2"><Label>Focus Areas * (Select all that apply)</Label><div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 max-h-40 overflow-y-auto border rounded p-3 bg-background">{focusAreasOptions.map((area) => (<div key={area} className="flex items-center space-x-2"><Checkbox id={`focus-${area}`} checked={orgFocusAreas.includes(area)} onCheckedChange={() => handleFocusAreaChange(area)} /><Label htmlFor={`focus-${area}`} className="text-sm font-normal cursor-pointer">{area}</Label></div>))}</div>{orgFocusAreas.length === 0 && <p className="text-xs text-destructive">Please select at least one focus area.</p>}</div>
                                                    <div className="space-y-1"><Label htmlFor="orgRegistrationNumber">Registration Number (Optional)</Label><div className="relative"><Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="orgRegistrationNumber" placeholder="e.g., Reg-12345" className="pl-10" value={orgRegistrationNumber} onChange={(e) => setOrgRegistrationNumber(e.target.value)} /></div></div>
                                                    <div className="space-y-1"><Label htmlFor="registrationDoc">Registration Document (PDF) *</Label><Input id="registrationDoc" type="file" accept="application/pdf" onChange={(e) => handleFileChange(e, setRegistrationDoc)} required /><p className="text-xs text-muted-foreground mt-1">Upload a PDF file (max 32MB). This will be reviewed by an admin.</p>{!registrationDoc && <p className="text-xs text-destructive">Document is required for NGOs.</p>}</div>
                                                </motion.div>
                                            )}
                                            {registerRole === "restaurant" && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.3 }} className="space-y-4 border-t pt-4 mt-4">
                                                    <h3 className="text-lg font-medium text-center text-primary">Restaurant Information</h3>
                                                    <div className="space-y-1"><Label htmlFor="restName">Restaurant Name *</Label><div className="relative"><Utensils className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="restName" placeholder="Official Name" className="pl-10" value={restName} onChange={(e) => setRestName(e.target.value)} required /></div></div>
                                                    <div className="space-y-1"><Label htmlFor="restAddress">Full Address *</Label><div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="restAddress" placeholder="Street, City, District" className="pl-10" value={restAddress} onChange={(e) => setRestAddress(e.target.value)} required /></div></div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-1"><Label htmlFor="restContactEmail">Contact Email *</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="restContactEmail" type="email" placeholder="info@rest.com" className="pl-10" value={restContactEmail} onChange={(e) => setRestContactEmail(e.target.value)} required /></div></div>
                                                        <div className="space-y-1"><Label htmlFor="restContactPhone">Contact Phone</Label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="restContactPhone" type="tel" placeholder="Optional phone number" className="pl-10" value={restContactPhone} onChange={(e) => setRestContactPhone(e.target.value)} /></div></div>
                                                    </div>
                                                    <div className="space-y-1"><Label htmlFor="restWebsite">Website (Optional)</Label><div className="relative"><Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="restWebsite" placeholder="https://your-rest.com" className="pl-10" value={restWebsite} onChange={(e) => setRestWebsite(e.target.value)} /></div></div>
                                                    <div className="space-y-1"><Label htmlFor="restLicenseNumber">License Number (Optional)</Label><div className="relative"><Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="restLicenseNumber" placeholder="e.g., Lic-12345" className="pl-10" value={restLicenseNumber} onChange={(e) => setRestLicenseNumber(e.target.value)} /></div></div>
                                                    <div className="space-y-1"><Label htmlFor="restDoc">Business Document (PDF, Optional)</Label><Input id="restDoc" type="file" accept="application/pdf" onChange={(e) => handleFileChange(e, setRestDoc)} /><p className="text-xs text-muted-foreground mt-1">Upload a PDF file (max 32MB) if available.</p></div>
                                                </motion.div>
                                            )}
                                            <div className="flex items-start space-x-2 pt-2"><Checkbox id="terms" required /><Label htmlFor="terms" className="text-xs font-normal leading-snug">I agree to the Mero Samaj<Link to="/terms-of-service" className="text-primary hover:underline ml-1">Terms</Link> and<Link to="/privacy-policy" className="text-primary hover:underline ml-1">Privacy Policy</Link>.</Label></div>
                                            <Button type="submit" variant="gradient" className="w-full" disabled={loadingRegister}>{loadingRegister ? "Submitting..." : "Create Account"}</Button>
                                        </form>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </main>
            <Footer />
        </motion.div>
    );
};

export default Login;