import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MapPin, Upload, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc, getDocs, collection, query, where } from "firebase/firestore";
import { app } from "../firebase";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";

const ReportIssue = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    image: null,
  });

  const [ngosWithMatchingInterests, setNgosWithMatchingInterests] = useState([]);
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value) => {
    setFormData((prev) => ({ ...prev, category: value }));
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFile(file);
      setFormData((prev) => ({ ...prev, image: file.name }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const auth = getAuth();
    const user = auth.currentUser;
    const db = getFirestore(app);

    if (!user) {
      toast({
        title: "Not Authenticated",
        description: "Please log in to report an issue.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      let uploadedImageUrl = null;

      if (file) {
        // Prepare FormData for Cloudinary upload
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "merosamaj"); // Using your preset name: merosamaj

        // Upload to Cloudinary
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/doracgsym/image/upload`, // Your Cloud Name: doracgsym
          {
            method: "POST",
            body: formData,
          }
        );
        const data = await response.json();
        if (!data.secure_url) {
          throw new Error("Image upload failed: " + (data.error?.message || "Unknown error"));
        }
        uploadedImageUrl = data.secure_url;
        setImageUrl(uploadedImageUrl);
      }

      const issueData = {
        ...formData,
        imageUrl: uploadedImageUrl,
        reporterId: user.uid,
        timestamp: new Date(),
        ngosToNotify: ngosWithMatchingInterests,
      };

      console.log("Adding issue to Firestore:", issueData);
      await setDoc(doc(collection(db, "issues")), issueData);
      console.log("Issue added to Firestore successfully");

      toast({
        title: "Issue Reported",
        description: "Your issue has been successfully reported. Thank you for your contribution!",
      });
      setFormData({
        title: "",
        description: "",
        category: "",
        location: "",
        image: null,
      });
      setFile(null);
      setImageUrl(null);
    } catch (error) {
      console.error("Error in try block:", error);
      toast({
        title: "Report Failed",
        description: error.message || "An error occurred while submitting your report.",
        variant: "destructive",
      });
    } finally {
      console.log("Finally block reached");
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchNgos = async () => {
      const db = getFirestore(app);
      const q = query(
        collection(db, "users"),
        where("role", "==", "ngo"),
        where("interests", "array-contains", formData.category)
      );

      const querySnapshot = await getDocs(q);
      const ngoIds = [];
      querySnapshot.forEach((doc) => {
        ngoIds.push(doc.id);
      });
      setNgosWithMatchingInterests(ngoIds);
    };

    if (formData.category) {
      fetchNgos();
    }
  }, [formData.category]);

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData((prev) => ({
            ...prev,
            location: `Latitude: ${latitude}, Longitude: ${longitude}`,
          }));
          toast({
            title: "Location Acquired",
            description: "Your current location has been added to the report.",
          });
        },
        (error) => {
          toast({
            title: "Location Error",
            description: `Error getting location: ${error.message}`,
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Geolocation Not Supported",
        description: "Geolocation is not supported by your browser.",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col"
    >
      <Navbar />
      <main className="flex-grow pt-20">
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl mx-auto text-center mb-12"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Report an Issue</h1>
              <p className="text-muted-foreground">
                Help us make our community better by reporting issues that need attention.
                Your contribution is valuable in creating positive change.
              </p>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="max-w-2xl mx-auto bg-background rounded-xl shadow-lg p-6 md:p-8"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Issue Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="E.g., Broken street light, Garbage pile-up"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={handleSelectChange} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="infrastructure">Infrastructure</SelectItem>
                      <SelectItem value="environment">Environment</SelectItem>
                      <SelectItem value="safety">Safety & Security</SelectItem>
                      <SelectItem value="health">Public Health</SelectItem>
                      <SelectItem value="social">Social Welfare</SelectItem>
                      <SelectItem value="animal welfare">Animal Welfare</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Please describe the issue in detail..."
                    value={formData.description}
                    onChange={handleChange}
                    className="min-h-[120px]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <Input
                      id="location"
                      name="location"
                      placeholder="Enter the location address"
                      value={formData.location}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                    <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-2"
                    onClick={handleGetCurrentLocation}
                  >
                    <MapPin className="mr-2 h-4 w-4" /> Use My Current Location
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Upload Image (Optional)</Label>
                  <div
                    {...getRootProps()}
                    className={cn(
                      "border-2 border-dashed border-muted-foreground/20 rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors",
                      isDragActive && "ring-2 ring-primary ring-offset-1"
                    )}
                  >
                    <input {...getInputProps()} />
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {isDragActive ? "Drop the image here..." : "Drag and drop an image or click to browse"}
                    </p>
                  </div>
                  {file && (
                    <div className="mt-2">
                      <p className="text-sm">Selected File: {file.name}</p>
                    </div>
                  )}
                  {imageUrl && (
                    <div className="mt-2">
                      <p className="text-sm">Uploaded Image Preview:</p>
                      <img src={imageUrl} alt="Uploaded" className="max-w-full h-auto rounded-md" />
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-sm text-yellow-700">
                    All reports are reviewed by our team. Please provide accurate information to help us address the
                    issue effectively.
                  </p>
                </div>

                <Button type="submit" className="w-full" variant="gradient" disabled={loading}>
                  {loading ? "Submitting..." : "Submit Report"}
                </Button>
              </form>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </motion.div>
  );
};

export default ReportIssue;