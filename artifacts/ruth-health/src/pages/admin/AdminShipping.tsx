import { useState } from "react";
import { useListShippingZones, getListShippingZonesQueryKey, useCreateShippingZone, useUpdateShippingZone, useDeleteShippingZone } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { formatPrice } from "@/lib/utils";
import { Plus, Edit2, Trash2, Check, X } from "lucide-react";

export default function AdminShipping() {
  const { data: zones, isLoading } = useListShippingZones({ query: { queryKey: getListShippingZonesQueryKey() } });
  const createMutation = useCreateShippingZone();
  const updateMutation = useUpdateShippingZone();
  const deleteMutation = useDeleteShippingZone();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    country: "",
    regionOrPostalPrefix: "",
    feeAmount: 0,
    isFree: false,
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ country: "", regionOrPostalPrefix: "", feeAmount: 0, isFree: false });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (zone: any) => {
    setEditingId(zone.id);
    setFormData({
      country: zone.country,
      regionOrPostalPrefix: zone.regionOrPostalPrefix || "",
      feeAmount: zone.feeAmount,
      isFree: zone.isFree,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this shipping zone?")) return;
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListShippingZonesQueryKey() });
        toast({ title: "Shipping zone deleted" });
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      regionOrPostalPrefix: formData.regionOrPostalPrefix || null,
      feeAmount: formData.isFree ? 0 : formData.feeAmount
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: dataToSubmit }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListShippingZonesQueryKey() });
          setIsModalOpen(false);
          toast({ title: "Shipping zone updated" });
        }
      });
    } else {
      createMutation.mutate({ data: dataToSubmit }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListShippingZonesQueryKey() });
          setIsModalOpen(false);
          toast({ title: "Shipping zone created" });
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif mb-1">Shipping Zones</h1>
          <p className="text-muted-foreground">Manage shipping rules and rates.</p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus size={16} /> Add Zone
        </Button>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Country</TableHead>
              <TableHead>Region / Prefix</TableHead>
              <TableHead className="text-right">Fee</TableHead>
              <TableHead className="text-center">Free Shipping</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : zones?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No shipping zones defined. (Fallback flat rate will apply)</TableCell></TableRow>
            ) : (
              zones?.map(zone => (
                <TableRow key={zone.id}>
                  <TableCell className="font-medium">{zone.country}</TableCell>
                  <TableCell>
                    {zone.regionOrPostalPrefix ? (
                      <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{zone.regionOrPostalPrefix}</span>
                    ) : (
                      <span className="text-muted-foreground italic text-sm">All regions</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {zone.isFree ? (
                      <span className="text-muted-foreground line-through">{formatPrice(zone.feeAmount)}</span>
                    ) : (
                      formatPrice(zone.feeAmount)
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      {zone.isFree ? <Check size={18} className="text-green-600" /> : <X size={18} className="text-muted-foreground/50" />}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(zone)}>
                        <Edit2 size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(zone.id)}>
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
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Shipping Zone" : "Add Shipping Zone"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} required placeholder="e.g. Nigeria" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="region">Region / Postal Prefix (Optional)</Label>
                <Input id="region" value={formData.regionOrPostalPrefix} onChange={e => setFormData({...formData, regionOrPostalPrefix: e.target.value})} placeholder="e.g. ON, BC, or M5V" />
                <p className="text-xs text-muted-foreground">Leave blank to apply to the entire country.</p>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <Checkbox 
                  id="isFree" 
                  checked={formData.isFree} 
                  onCheckedChange={(checked) => setFormData({...formData, isFree: checked === true})} 
                />
                <Label htmlFor="isFree" className="font-normal cursor-pointer">Offer free shipping for this zone</Label>
              </div>
              {!formData.isFree && (
                <div className="grid gap-2">
                  <Label htmlFor="feeAmount">Flat Fee ($)</Label>
                  <Input id="feeAmount" type="number" step="0.01" min="0" value={formData.feeAmount} onChange={e => setFormData({...formData, feeAmount: parseFloat(e.target.value)})} required />
                </div>
              )}
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
