import { useState } from "react";
import { 
  useListBookings, 
  getListBookingsQueryKey, 
  useListBookingSlots,
  getListBookingSlotsQueryKey,
  useCreateBookingSlot,
  useDeleteBookingSlot,
  useCancelBooking
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Video, CalendarX2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminBookings() {
  const { data: bookings, isLoading: bookingsLoading } = useListBookings({ query: { queryKey: getListBookingsQueryKey() } });
  const { data: slots, isLoading: slotsLoading } = useListBookingSlots({ query: { queryKey: getListBookingSlotsQueryKey() } });
  
  const createSlotMutation = useCreateBookingSlot();
  const deleteSlotMutation = useDeleteBookingSlot();
  const cancelBookingMutation = useCancelBooking();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [newSlotDate, setNewSlotDate] = useState("");
  const [newSlotTime, setNewSlotTime] = useState("");

  const handleCreateSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotDate || !newSlotTime) return;

    createSlotMutation.mutate({ data: { date: newSlotDate, time: newSlotTime } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBookingSlotsQueryKey() });
        setNewSlotTime("");
        toast({ title: "Slot created" });
      },
      onError: (err: any) => {
        toast({ title: "Failed to create slot", description: err.error, variant: "destructive" });
      }
    });
  };

  const handleDeleteSlot = (id: number) => {
    if (!confirm("Delete this availability slot?")) return;
    deleteSlotMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBookingSlotsQueryKey() });
        toast({ title: "Slot deleted" });
      }
    });
  };

  const handleCancelBooking = (id: number) => {
    if (!confirm("Cancel this booking? The slot will be freed up.")) return;
    cancelBookingMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListBookingSlotsQueryKey() });
        toast({ title: "Booking cancelled" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif mb-1">Bookings</h1>
        <p className="text-muted-foreground">Manage consultations and availability slots.</p>
      </div>

      <Tabs defaultValue="bookings" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="bookings">Upcoming Bookings</TabsTrigger>
          <TabsTrigger value="slots">Availability Slots</TabsTrigger>
        </TabsList>
        
        <TabsContent value="bookings">
          <div className="bg-card border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Zoom Link</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookingsLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : bookings?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No bookings found</TableCell></TableRow>
                ) : (
                  bookings?.map(booking => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div className="font-medium">{booking.name}</div>
                        <div className="text-sm text-muted-foreground">{booking.email}</div>
                        {booking.phone && <div className="text-sm text-muted-foreground">{booking.phone}</div>}
                      </TableCell>
                      <TableCell>
                        {booking.slotDate && booking.slotTime ? (
                          <>
                            <div className="font-medium">{new Date(booking.slotDate + "T00:00:00").toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                            <div className="text-sm text-muted-foreground">{booking.slotTime}</div>
                          </>
                        ) : (
                          <span className="text-muted-foreground italic">Slot unavailable</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {booking.zoomLink ? (
                          <a href={booking.zoomLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                            <Video size={14} /> Join Meeting
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={booking.status === 'booked' ? 'default' : booking.status === 'completed' ? 'secondary' : 'destructive'} className="capitalize">
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {booking.status === 'booked' && (
                          <Button variant="ghost" size="sm" className="text-destructive h-8" onClick={() => handleCancelBooking(booking.id)}>
                            <CalendarX2 size={14} className="mr-2" /> Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="slots" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add Availability Slot</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSlot} className="flex items-end gap-4">
                <div className="grid gap-2 flex-1">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" value={newSlotDate} onChange={e => setNewSlotDate(e.target.value)} required />
                </div>
                <div className="grid gap-2 flex-1">
                  <Label htmlFor="time">Time</Label>
                  <Input id="time" type="time" value={newSlotTime} onChange={e => setNewSlotTime(e.target.value)} required />
                </div>
                <Button type="submit" className="gap-2" disabled={createSlotMutation.isPending}>
                  <Plus size={16} /> Add Slot
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="bg-card border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slotsLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : slots?.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No slots available</TableCell></TableRow>
                ) : (
                  slots?.sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()).map(slot => (
                    <TableRow key={slot.id}>
                      <TableCell className="font-medium">
                        {new Date(slot.date + "T00:00:00").toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </TableCell>
                      <TableCell>{slot.time}</TableCell>
                      <TableCell>
                        {slot.isBooked ? (
                          <Badge variant="secondary">Booked</Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Available</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!slot.isBooked && (
                          <div className="flex justify-end">
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteSlot(slot.id)}>
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
