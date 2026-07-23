import { useState } from "react";
import { useListEvents, getListEventsQueryKey, useCreateEvent, useUpdateEvent, useDeleteEvent } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CalendarPlus, Edit2, Trash2, Video } from "lucide-react";
import { MediaUploader } from "@/components/MediaUploader";

const emptyForm = { title: "", description: "", location: "", eventDate: "", imageUrls: [] as string[], videoUrls: [] as string[] };

export default function AdminEvents() {
  const { data: events, isLoading } = useListEvents({ query: { queryKey: getListEventsQueryKey() } });
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const deleteMutation = useDeleteEvent();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const openCreate = () => { setEditingId(null); setFormData({ ...emptyForm, imageUrls: [], videoUrls: [] }); setOpen(true); };
  const openEdit = (event: any) => {
    setEditingId(event.id);
    setFormData({
      title: event.title,
      description: event.description || "",
      location: event.location || "",
      eventDate: new Date(event.eventDate).toISOString().slice(0, 16),
      imageUrls: event.imageUrls?.length ? event.imageUrls : event.imageUrl ? [event.imageUrl] : [],
      videoUrls: event.videoUrls || [],
    });
    setOpen(true);
  };
  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const data = { title: formData.title, description: formData.description || null, location: formData.location || null, eventDate: new Date(formData.eventDate).toISOString(), imageUrls: formData.imageUrls, videoUrls: formData.videoUrls, imageUrl: formData.imageUrls[0] ?? null };
    const onSuccess = () => { void invalidate(); setOpen(false); toast({ title: editingId ? "Event updated" : "Event created" }); };
    if (editingId) updateMutation.mutate({ id: editingId, data }, { onSuccess });
    else createMutation.mutate({ data }, { onSuccess });
  };
  const handleDelete = (id: number) => {
    if (!confirm("Delete this event?")) return;
    deleteMutation.mutate({ id }, { onSuccess: () => { void invalidate(); toast({ title: "Event deleted" }); } });
  };
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="mb-1 text-3xl font-serif">Company Events</h1><p className="text-muted-foreground">Manage upcoming and past events, photos, and videos.</p></div><Button onClick={openCreate} className="gap-2"><CalendarPlus size={16} /> Add Event</Button></div>
      <div className="overflow-hidden rounded-lg border bg-card"><Table><TableHeader><TableRow><TableHead>Event</TableHead><TableHead>Date</TableHead><TableHead>Media</TableHead><TableHead /></TableRow></TableHeader><TableBody>
        {isLoading ? <TableRow><TableCell colSpan={4} className="py-8 text-center">Loading...</TableCell></TableRow> : !events?.length ? <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No events found</TableCell></TableRow> : events.map((event) => <TableRow key={event.id}><TableCell><div className="font-medium">{event.title}</div><div className="text-sm text-muted-foreground">{event.location}</div></TableCell><TableCell>{new Date(event.eventDate).toLocaleDateString("en-NG")}</TableCell><TableCell className="text-sm text-muted-foreground">{event.imageUrls?.length || (event.imageUrl ? 1 : 0)} photo(s), {event.videoUrls?.length || 0} video(s)</TableCell><TableCell><div className="flex justify-end gap-2"><Button variant="ghost" size="icon" onClick={() => openEdit(event)}><Edit2 size={16} /></Button><Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(event.id)}><Trash2 size={16} /></Button></div></TableCell></TableRow>)}
      </TableBody></Table></div>
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[620px]"><form onSubmit={handleSubmit}><DialogHeader><DialogTitle>{editingId ? "Edit Event" : "Add Company Event"}</DialogTitle></DialogHeader><div className="grid gap-4 py-4">
        <div className="grid gap-2"><Label htmlFor="event-title">Title</Label><Input id="event-title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></div>
        <div className="grid gap-2"><Label htmlFor="event-date">Date and time</Label><Input id="event-date" type="datetime-local" value={formData.eventDate} onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })} required /></div>
        <div className="grid gap-2"><Label htmlFor="event-location">Location</Label><Input id="event-location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} /></div>
        <div className="grid gap-2"><Label htmlFor="event-description">Description</Label><Textarea id="event-description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="min-h-[100px]" /></div>
        <div className="grid gap-2"><Label><Video size={15} className="mr-1 inline" /> Event photos and videos</Label><MediaUploader imageUrls={formData.imageUrls} videoUrls={formData.videoUrls} onImagesChange={(imageUrls) => setFormData({ ...formData, imageUrls })} onVideosChange={(videoUrls) => setFormData({ ...formData, videoUrls })} /></div>
      </div><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Event"}</Button></DialogFooter></form></DialogContent></Dialog>
    </div>
  );
}