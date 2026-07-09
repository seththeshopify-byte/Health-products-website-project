import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useGetMemberDashboard, getGetMemberDashboardQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Gift, TrendingUp, Users, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      setLocation("/login");
    }
  }, [authLoading, isLoggedIn, setLocation]);

  const { data: dashboard, isLoading: dashboardLoading } = useGetMemberDashboard({
    query: { enabled: isLoggedIn, queryKey: getGetMemberDashboardQueryKey() }
  });

  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (dashboard?.referralLink) {
      navigator.clipboard.writeText(dashboard.referralLink);
      setCopied(true);
      toast({ title: "Copied!", description: "Referral link copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (authLoading || dashboardLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center">Loading dashboard...</div>;
  }

  if (!dashboard) return null;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-serif mb-2">Member Dashboard</h1>
        <p className="text-muted-foreground">Manage your referrals and view your earned commissions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card className="bg-primary text-primary-foreground border-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-primary-foreground/80 text-sm font-medium uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={16} /> Total Commission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-serif">{formatPrice(dashboard.totalCommission)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium uppercase tracking-wider flex items-center gap-2">
              <Gift size={16} /> Sales Commission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif text-foreground">{formatPrice(dashboard.salesCommission)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium uppercase tracking-wider flex items-center gap-2">
              <Users size={16} /> Referral Commission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif text-foreground">{formatPrice(dashboard.referralCommission)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-10 border-border bg-card">
        <CardHeader>
          <CardTitle className="font-serif">Your Referral Kit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-sm font-medium mb-2">Personal Referral Link</p>
              <div className="flex gap-2">
                <Input readOnly value={dashboard.referralLink} className="bg-muted font-mono text-sm" />
                <Button variant="secondary" onClick={handleCopyLink} className="shrink-0 w-24">
                  {copied ? <CheckCircle2 size={16} /> : <Copy size={16} className="mr-2" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Share this link to automatically apply your code.</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Your Promo Code</p>
              <div className="text-2xl font-mono tracking-widest text-primary p-4 bg-primary/5 rounded-lg border border-primary/20 inline-block">
                {dashboard.promoCode}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="events" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="events">Commission History</TabsTrigger>
          <TabsTrigger value="network">Referred Network</TabsTrigger>
        </TabsList>
        
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {dashboard.commissionEvents.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  No commission events yet. Share your code to start earning!
                </div>
              ) : (
                <div className="divide-y">
                  {dashboard.commissionEvents.map(event => (
                    <div key={event.id} className="p-6 flex items-center justify-between">
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <span className="capitalize">{event.type}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${event.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {event.status}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {new Date(event.createdAt).toLocaleDateString()}
                          {event.referringMemberName && ` • From ${event.referringMemberName}`}
                        </div>
                      </div>
                      <div className="text-xl font-medium text-primary">
                        +{formatPrice(event.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="network">
          <Card>
            <CardContent className="p-0">
              {dashboard.referredMembers.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  You haven't referred anyone yet.
                </div>
              ) : (
                <div className="divide-y">
                  {dashboard.referredMembers.map(member => (
                    <div key={member.id} className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-serif font-medium">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-muted-foreground">Joined {new Date(member.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
