import { useState } from "react";
import {
  useListAmenities,
  getListAmenitiesQueryKey,
  useCreateAmenity,
  useUpdateAmenity,
  useDeleteAmenity,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Image as ImageIcon } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  complimentary: "Complimentary",
  included: "Included With Stay",
  "on-request": "Available on Request",
};

export default function AdminAmenities() {
  const { data: amenities, isLoading } = useListAmenities({ query: { queryKey: getListAmenitiesQueryKey() } });
  const createMutation = useCreateAmenity();
  const updateMutation = useUpdateAmenity();
  const deleteMutation = useDeleteAmenity();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "complimentary",
    note: "",
    imageUrl: "",
  });

  const uploadImageFile = async (file: File) => {
    setIsUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "ruth_health_products");
      const res = await fetch("https://api.cloudinary.com/v1_1/djzigoye/image/upload", {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (json.secure_url) {
        setFormData((prev) => ({ ...prev, imageUrl: json.secure_url }));
      } else {
        alert("Image upload failed. Please try again.");
      }
    } catch (err) {
      alert("Image upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadImageFile(file);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ title: "", description: "", category: "complimentary", note: "", imageUrl: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (amenity: any) => {
    setEditingId(amenity.id);
    setFormData({
      title: amenity.title,
      description: amenity.description,
      category: amenity.category,
      note: amenity.note || "",
      imageUrl: amenity.imageUrl || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this amenity?")) return;
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAmenitiesQueryKey() });
          toast({ title: "Amenity deleted" });
        },
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      note: formData.note || null,
      imageUrl: formData.imageUrl || null,
    };
    if (editingId) {
      updateMutation.mutate(
        { id: editingId, data: dataToSubmit },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListAmenitiesQueryKey() });
            setIsModalOpen(false);
            toast({ title: "Amenity updated" });
          },
        }
      );
    } else {
      createMutation.mutate(
        { data: dataToSubmit },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListAmenitiesQueryKey() });
            setIsModalOpen(false);
            toast({ title: "Amenity created" });
          },
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif mb-1">Amenities</h1>
          <p className="text-muted-foreground">Manage hotel amenities and guest services.</p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus size={16} /> Add Amenity
        </Button>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : amenities?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No amenities found</TableCell>
              </TableRow>
            ) : (
              amenities?.map((amenity) => (
                <TableRow key={amenity.id}>
                  <TableCell>
                    {amenity.imageUrl ? (
                      <div className="w-10 h-10 rounded bg-muted overflow-hidden">
                        <img src={amenity.imageUrl} alt={amenity.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-muted-foreground">
                        <ImageIcon size={16} />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{amenity.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {CATEGORY_LABELS[amenity.category] || amenity.category}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(amenity)}>
                        <Edit2 size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(amenity.id)}>
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
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Amenity" : "Add Amenity"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Complimentary Wi-Fi"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="complimentary">Complimentary</SelectItem>
                    <SelectItem value="included">Included With Stay</SelectItem>
                    <SelectItem value="on-request">Available on Request</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="A short, refined description of this amenity."
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="note">Note (optional)</Label>
                <Input
                  id="note"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="e.g. Additional charges may apply"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="imageUpload">Photo (optional)</Label>
                <Input id="imageUpload" type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                {isUploading && <p className="text-sm text-muted-foreground">Uploading photo...</p>}
                {formData.imageUrl && !isUploading && (
                  <img src={formData.imageUrl} alt="Preview" className="w-24 h-24 object-cover rounded border" />
                )}
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
