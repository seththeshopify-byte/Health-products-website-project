import { useState } from "react";
import { useListServices, getListServicesQueryKey, useCreateService, useUpdateService, useDeleteService } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatPrice } from "@/lib/utils";
import { Plus, Edit2, Trash2, Image as ImageIcon } from "lucide-react";

export default function AdminServices() {
  const { data: services, isLoading } = useListServices({ query: { queryKey: getListServicesQueryKey() } });
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const deleteMutation = useDeleteService();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    guestPrice: 0,
    memberPrice: 0,
    commissionPct: 10,
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ name: "", description: "", imageUrl: "", guestPrice: 0, memberPrice: 0, commissionPct: 10 });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (service: any) => {
    setEditingId(service.id);
    setFormData({
      name: service.name,
      description: service.description,
      imageUrl: service.imageUrl || "",
      guestPrice: service.guestPrice,
      memberPrice: service.memberPrice,
      commissionPct: service.commissionPct,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
        toast({ title: "Service deleted" });
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      imageUrl: formData.imageUrl || null
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: dataToSubmit }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
          setIsModalOpen(false);
          toast({ title: "Service updated" });
        }
      });
    } else {
      createMutation.mutate({ data: dataToSubmit }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
          setIsModalOpen(false);
          toast({ title: "Service created" });
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif mb-1">Services</h1>
          <p className="text-muted-foreground">Manage consultations and their pricing.</p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus size={16} /> Add Service
        </Button>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Guest Price</TableHead>
              <TableHead className="text-right">Member Price</TableHead>
              <TableHead className="text-right">Commission</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : services?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No services found</TableCell></TableRow>
            ) : (
              services?.map(service => (
                <TableRow key={service.id}>
                  <TableCell>
                    {service.imageUrl ? (
                      <div className="w-10 h-10 rounded bg-muted overflow-hidden">
                        <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-muted-foreground">
                        <ImageIcon size={16} />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell className="text-right">{formatPrice(service.guestPrice)}</TableCell>
                  <TableCell className="text-right font-medium text-primary">{formatPrice(service.memberPrice)}</TableCell>
                  <TableCell className="text-right">{service.commissionPct}%</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(service)}>
                        <Edit2 size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(service.id)}>
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
              <DialogTitle>{editingId ? "Edit Service" : "Add Service"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input id="imageUrl" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="guestPrice">Guest Price ($)</Label>
                  <Input id="guestPrice" type="number" step="0.01" value={formData.guestPrice} onChange={e => setFormData({...formData, guestPrice: parseFloat(e.target.value)})} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="memberPrice">Member Price ($)</Label>
                  <Input id="memberPrice" type="number" step="0.01" value={formData.memberPrice} onChange={e => setFormData({...formData, memberPrice: parseFloat(e.target.value)})} required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="commissionPct">Referral Commission (%)</Label>
                <Input id="commissionPct" type="number" min="0" max="100" value={formData.commissionPct} onChange={e => setFormData({...formData, commissionPct: parseFloat(e.target.value)})} required />
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
