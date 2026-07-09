import { useState } from "react";
import { useListBookingSlots, getListBookingSlotsQueryKey, useCreateBooking } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays, Clock, CheckCircle2, User, Mail, Phone } from "lucide-react";
import { useLocation } from "wouter";

export default function BookCall() {
  const { data: slots, isLoading } = useListBookingSlots({ query: { queryKey: getListBookingSlotsQueryKey() } });
  const createBooking = useCreateBooking();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [isSuccess, setIsSuccess] = useState(false);

  // Group slots by date, only unbooked
  const availableSlots = slots?.filter(s => !s.isBooked) || [];
  const slotsByDate = availableSlots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, typeof availableSlots>);

  const dates = Object.keys(slotsByDate).sort();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotId) return;

    createBooking.mutate({
      data: {
        slotId: selectedSlotId,
        ...formData
      }
    }, {
      onSuccess: () => {
        setIsSuccess(true);
      },
      onError: (err: any) => {
        toast({
          title: "Booking failed",
          description: err.error || "Please try again",
          variant: "destructive"
        });
      }
    });
  };

  if (isSuccess) {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center">
        <Card className="w-full max-w-lg text-center p-8 border-border">
          <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-serif mb-4">Request Received</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Thank you, {formData.name}. We've received your booking request. 
            A confirmation email will be sent to {formData.email} shortly.
          </p>
          <Button onClick={() => setLocation("/")} size="lg">Return Home</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-24">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-serif mb-4">Book a Consultation</h1>
        <p className="text-lg text-muted-foreground">
          Schedule a private, one-on-one session with our wellness experts. Select a time below to begin.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-6xl mx-auto">
        {/* Step 1: Select Time */}
        <div className="lg:col-span-7">
          <h2 className="text-2xl font-serif mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-sans">1</span>
            Select Date & Time
          </h2>
          
          <Card className="border-border">
            <CardContent className="p-0 divide-y">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading available times...</div>
              ) : dates.length === 0 ? (
                <div className="p-12 text-center">
                  <CalendarDays size={48} className="mx-auto text-muted mb-4" />
                  <h3 className="text-lg font-medium mb-2">No slots available right now</h3>
                  <p className="text-muted-foreground">Please check back later as we regularly update our schedule.</p>
                </div>
              ) : (
                dates.map(date => {
                  const dateObj = new Date(date + "T00:00:00");
                  return (
                    <div key={date} className="p-6">
                      <h3 className="font-medium text-lg mb-4 text-foreground flex items-center gap-2">
                        <CalendarDays size={18} className="text-primary" />
                        {dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </h3>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {slotsByDate[date].map(slot => (
                          <button
                            key={slot.id}
                            onClick={() => setSelectedSlotId(slot.id)}
                            className={`py-2 px-3 text-sm rounded-md border font-medium transition-all ${
                              selectedSlotId === slot.id 
                                ? 'bg-primary border-primary text-primary-foreground shadow-md ring-2 ring-primary ring-offset-2 ring-offset-background' 
                                : 'bg-background hover:border-primary hover:text-primary'
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Step 2: Your Details */}
        <div className="lg:col-span-5">
          <h2 className="text-2xl font-serif mb-6 flex items-center gap-2">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-sans transition-colors ${selectedSlotId ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>2</span>
            Your Details
          </h2>
          
          <Card className={`border-border transition-opacity duration-300 ${!selectedSlotId ? 'opacity-50 pointer-events-none' : ''}`}>
            <CardContent className="p-6 md:p-8">
              {selectedSlotId ? (
                <div className="mb-6 p-4 bg-muted/50 rounded-lg flex items-start gap-3 border">
                  <Clock size={20} className="text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">Selected Time</div>
                    <div className="text-sm text-muted-foreground">
                      {(() => {
                        const slot = availableSlots.find(s => s.id === selectedSlotId);
                        if (!slot) return null;
                        const dateObj = new Date(slot.date + "T00:00:00");
                        return `${dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} at ${slot.time}`;
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6 text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
                  Please select a time slot first.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-3 text-muted-foreground" />
                    <Input 
                      id="name" 
                      required 
                      className="pl-10" 
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-3 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      required 
                      className="pl-10"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-3 text-muted-foreground" />
                    <Input 
                      id="phone" 
                      type="tel" 
                      className="pl-10"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base mt-4" 
                  disabled={!selectedSlotId || createBooking.isPending}
                >
                  {createBooking.isPending ? "Confirming..." : "Confirm Booking"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
