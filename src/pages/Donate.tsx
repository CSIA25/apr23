"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { loadStripe } from "@stripe/stripe-js";
import { Heart } from "lucide-react";
import { useState } from "react";
import { Navbar } from "@/components/layout/navbar"; // Import Navbar

const stripePromise = loadStripe("pk_test_51RA7IB07ioGuItlZN19yfermdJcMDLtRQ68aChMs2XEshctI2sDhYopOgFfoSovBi2eBnTqkWYTLuAsU5Lee4KZV00gJir2o4D"); 

const priceIdMap: { [key: string]: string } = {
  "25": "price_1RAuDU07ioGuItlZk7NGaBCp",
  "50": "price_1RAuDp07ioGuItlZIHm0bsyJ",
  "100": "price_1RAuE707ioGuItlZIBeuxrfj",
  "250": "price_1RAuEM07ioGuItlZ8DhnbHxv",
  "500": "price_1RAuEg07ioGuItlZ3IxZIUGY",
};

const DonatePage = () => {
  const [donationType, setDonationType] = useState<"one-time" | "monthly">("one-time");
  const [donationAmount, setDonationAmount] = useState("25");
  const [financialLoading, setFinancialLoading] = useState(false);

  const handleFinancialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFinancialLoading(true);

    const stripe = await stripePromise;

    if (!stripe) {
      toast({ title: "Error", description: "Stripe failed to load.", variant: "destructive" });
      setFinancialLoading(false);
      return;
    }

    const priceId = priceIdMap[donationAmount];

    if (!priceId) {
      toast({
        title: "Invalid Amount",
        description: "The selected donation amount is invalid.",
        variant: "destructive",
      });
      setFinancialLoading(false);
      return;
    }

    try {
      const { error } = await stripe.redirectToCheckout({
        lineItems: [{ price: priceId, quantity: 1 }],
        mode: donationType === "monthly" ? "subscription" : "payment",
        successUrl: `${window.location.origin}/success`,
        cancelUrl: `${window.location.origin}/donate`,
      });

      if (error) throw error;
    } catch (err: any) {
      toast({
        title: "Stripe Error",
        description: err.message || "An error occurred during checkout.",
        variant: "destructive",
      });
      console.error("Stripe Checkout Error:", err);
    } finally {
      setFinancialLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Include Navbar */}
      <Navbar />
      
      {/* Add padding to account for fixed navbar */}
      <div className="pt-20 px-4 md:px-8 lg:px-24 flex items-center justify-center min-h-[calc(100vh-5rem)]">
        <Card className="w-full max-w-2xl shadow-2xl rounded-2xl border border-border">
          <CardContent className="p-8">
            <form onSubmit={handleFinancialSubmit}>
              <h2 className="text-3xl font-bold text-center mb-6 flex items-center justify-center gap-2">
                <Heart className="text-pink-500 w-8 h-8" />
                Support Our Mission
              </h2>
              <p className="text-center text-muted-foreground mb-8">
                Your generous donation helps us keep our platform running and support important causes.
              </p>

              <Tabs defaultValue="one-time" onValueChange={(val: "one-time" | "monthly") => setDonationType(val)} className="w-full">
                <TabsList className="grid grid-cols-2 mb-6">
                  <TabsTrigger value="one-time">One-Time</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                </TabsList>

                <TabsContent value="one-time">
                  <DonationAmountSelector
                    selectedAmount={donationAmount}
                    onAmountChange={setDonationAmount}
                  />
                </TabsContent>

                <TabsContent value="monthly">
                  <DonationAmountSelector
                    selectedAmount={donationAmount}
                    onAmountChange={setDonationAmount}
                  />
                </TabsContent>
              </Tabs>

              <Button
                type="submit"
                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors mt-6"
                disabled={financialLoading}
              >
                {financialLoading ? "Processing..." : "Donate"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const DonationAmountSelector = ({
  selectedAmount,
  onAmountChange,
}: {
  selectedAmount: string;
  onAmountChange: (amount: string) => void;
}) => {
  const predefinedAmounts = ["25", "50", "100", "250", "500"];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {predefinedAmounts.map((amount) => (
        <button
          key={amount}
          type="button"
          onClick={() => onAmountChange(amount)}
          className={`py-3 px-4 rounded-xl border font-medium text-lg transition-colors ${
            selectedAmount === amount
              ? "bg-pink-600 text-white border-transparent"
              : "bg-white text-gray-800 border-gray-300 hover:bg-pink-50"
          }`}
        >
          ${amount}
        </button>
      ))}
    </div>
  );
};

export default DonatePage;