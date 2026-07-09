import { useState } from "react";
import { useListTestimonials, getListTestimonialsQueryKey, useCreateTestimonial, useUpdateTestimonial, useDeleteTestimonial } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, User } from "lucide-react";

export default function AdminTestimonials() {
  const { data: testimonials, isLoading } = useListTestimonials({ query: { queryKey: getListTestimonialsQueryKey() } });
  const createMutation = useCreateTestimonial();
  const updateMutation = useUpdateTestimonial();
  const deleteMutation = useDeleteTestimonial();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    text: "",
    photoUrl: "",
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ name: "", text: "", photoUrl: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (testimonial: any) => {
    setEditingId(testimonial.id);
    setFormData({
      name: testimonial.name,
      text: testimonial.text,
      photoUrl: testimonial.photoUrl || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTestimonialsQueryKey() });
        toast({ title: "Testimonial deleted" });
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      photoUrl: formData.photoUrl || null,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: dataToSubmit }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTestimonialsQueryKey() });
          setIsModalOpen(false);
          toast({ title: "Testimonial updated" });
        }
      });
    } else {
      createMutation.mutate({ data: dataToSubmit }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTestimonialsQueryKey() });
          setIsModalOpen(false);
          toast({ title: "Testimonial created" });
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif mb-1">Testimonials</h1>
          <p className="text-muted-foreground">Manage patient stories and reviews.</p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus size={16} /> Add Testimonial
        </Button>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Photo</TableHead>
              <TableHead className="w-48">Name</TableHead>
              <TableHead>Testimonial</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : testimonials?.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No testimonials found</TableCell></TableRow>
            ) : (
              testimonials?.map(testimonial => (
                <TableRow key={testimonial.id}>
                  <TableCell>
                    {testimonial.photoUrl ? (
                      <div className="w-10 h-10 rounded-full bg-muted overflow-hidden border">
                        <img src={testimonial.photoUrl} alt={testimonial.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground border">
                        <User size={16} />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{testimonial.name}</TableCell>
                  <TableCell>
                    <p className="text-sm text-muted-foreground line-clamp-2 italic">"{testimonial.text}"</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(testimonial)}>
                        <Edit2 size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(testimonial.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Testimonial" : "Add Testimonial"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Patient Name</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="text">Testimonial Text</Label>
                <Textarea id="text" value={formData.text} onChange={e => setFormData({...formData, text: e.target.value})} required className="min-h-[100px]" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="photoUrl">Photo URL (Optional)</Label>
                <Input id="photoUrl" value={formData.photoUrl} onChange={e => setFormData({...formData, photoUrl: e.target.value})} placeholder="https://..." />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
