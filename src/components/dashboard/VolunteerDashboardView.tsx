import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { Megaphone, Gift } from 'lucide-react';

interface VolunteerDashboardViewProps {
   user: any; // Use a more specific type if available from AuthContext
}

const VolunteerDashboardView: React.FC<VolunteerDashboardViewProps> = ({ user }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Welcome, Volunteer!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p>Thank you for being a part of Mero Samaj.</p>
                {/* Placeholder for Volunteer specific content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <Card className="hover:shadow-md transition-shadow">
                         <CardHeader>
                            <CardTitle className="text-lg flex items-center"><Megaphone className="mr-2 h-5 w-5 text-primary"/> My Reported Issues</CardTitle>
                        </CardHeader>
                         <CardContent>
                             <p className="text-muted-foreground text-sm mb-3">View the status of issues you've reported.</p>
                             <Button variant="outline" size="sm" asChild><Link to="/my-reports">View Reports</Link></Button> {/* Link to future page */}
                         </CardContent>
                     </Card>
                      <Card className="hover:shadow-md transition-shadow">
                         <CardHeader>
                            <CardTitle className="text-lg flex items-center"><Gift className="mr-2 h-5 w-5 text-green-500"/> My Donations</CardTitle>
                        </CardHeader>
                         <CardContent>
                             <p className="text-muted-foreground text-sm mb-3">Track your past food or financial donations.</p>
                             <Button variant="outline" size="sm" asChild><Link to="/my-donations">View Donations</Link></Button> {/* Link to future page */}
                         </CardContent>
                     </Card>
                </div>
                {/* Add more volunteer-specific data or links here */}
                 <div className="mt-6 flex gap-4">
                    <Button asChild><Link to="/volunteer">Find Opportunities</Link></Button>
                    <Button variant="secondary" asChild><Link to="/report">Report New Issue</Link></Button>
                 </div>
            </CardContent>
        </Card>
    );
};

export default VolunteerDashboardView;