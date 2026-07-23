import { useState } from "react";
import {
  useListTestimonials,
  getListTestimonialsQueryKey,
  useCreateTestimonial,
  useUpdateTestimonial,
  useDeleteTestimonial,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, User, Video } from "lucide-react";
import { MediaUploader } from "@/components/MediaUploader";

const emptyForm = {
  name: "",
  text: "",
  category: "product" as "product" | "business",
  photoUrls: [] as string[],
  videoUrls: [] as string[],
};

export default function AdminTestimonials() {
  const { data: testimonials, isLoading } = useListTestimonials(undefined, {
    query: { queryKey: getListTestimonialsQueryKey() },
  });
  const createMutation = useCreateTestimonial();
  const updateMutation = useUpdateTestimonial();
  const deleteMutation = useDeleteTestimonial();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const openCreate = () => {
    setEditingId(null);
    setFormData({ ...emptyForm, photoUrls: [], videoUrls: [] });
    setIsModalOpen(true);
  };

  const openEdit = (testimonial: any) => {
    setEditingId(testimonial.id);
    setFormData({
      name: testimonial.name,
      text: testimonial.text,
      category: testimonial.category === "business" ? "business" : "product",
      photoUrls: testimonial.photoUrls?.length ? testimonial.photoUrls : testimonial.photoUrl ? [testimonial.photoUrl] : [],
      videoUrls: testimonial.videoUrls?.length ? testimonial.videoUrls : testimonial.videoUrl ? [testimonial.videoUrl] : [],
    });
    setIsModalOpen(true);
  };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListTestimonialsQueryKey() });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const data = {
      name: formData.name,
      text: formData.text,
      category: formData.category,
      photoUrls: formData.photoUrls,
      videoUrls: formData.videoUrls,
      photoUrl: formData.photoUrls[0] ?? null,
      videoUrl: formData.videoUrls[0] ?? null,
    };
    const onSuccess = () => {
      void invalidate();
      setIsModalOpen(false);
      toast({ title: editingId ? "Story updated" : "Story created" });
    };
    if (editingId) updateMutation.mutate({ id: editingId, data }, { onSuccess });
    else createMutation.mutate({ data }, { onSuccess });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this story?")) return;
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        void invalidate();
        toast({ title: "Story deleted" });
      },
    });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-3xl font-serif">Testimonials & Events</h1>
          <p className="text-muted-foreground">Manage Product Users and Business Success Stories.</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus size={16} /> Add Story</Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Photo</TableHead><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Media</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center">Loading...</TableCell></TableRow>
            ) : !testimonials?.length ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No stories found</TableCell></TableRow>
            ) : testimonials.map((testimonial) => (
              <TableRow key={testimonial.id}>
                <TableCell>
                  {testimonial.photoUrl ? <img src={testimonial.photoUrl} alt={testimonial.name} className="h-10 w-10 rounded-full object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted"><User size={16} /></div>}
                </TableCell>
                <TableCell className="font-medium">{testimonial.name}</TableCell>
                <TableCell>{testimonial.category === "business" ? "Business Success" : "Product User"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {(testimonial.photoUrls?.length || (testimonial.photoUrl ? 1 : 0))} photo(s),{" "}
                  {(testimonial.videoUrls?.length || (testimonial.videoUrl ? 1 : 0))} video(s)
                </TableCell>
                <TableCell><div className="flex justify-end gap-2"><Button variant="ghost" size="icon" onClick={() => openEdit(testimonial)}><Edit2 size={16} /></Button><Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(testimonial.id)}><Trash2 size={16} /></Button></div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[620px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader><DialogTitle>{editingId ? "Edit Story" : "Add Story"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label htmlFor="story-name">Name</Label><Input id="story-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
              <div className="grid gap-2"><Label htmlFor="story-text">Story</Label><Textarea id="story-text" value={formData.text} onChange={(e) => setFormData({ ...formData, text: e.target.value })} required className="min-h-[120px]" /></div>
              <div className="grid gap-2"><Label htmlFor="story-category">Category</Label><select id="story-category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value as "product" | "business" })} className="h-10 rounded-md border bg-background px-3 text-sm"><option value="product">Product User</option><option value="business">Business Success Story</option></select></div>
              <div className="grid gap-2"><Label><Video size={15} className="mr-1 inline" /> Photos and videos</Label><MediaUploader imageUrls={formData.photoUrls} videoUrls={formData.videoUrls} onImagesChange={(photoUrls) => setFormData({ ...formData, photoUrls })} onVideosChange={(videoUrls) => setFormData({ ...formData, videoUrls })} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Story"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
