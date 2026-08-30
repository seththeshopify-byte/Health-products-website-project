import { useEffect, useRef, useState } from "react";
import { useListRooms, getListRoomsQueryKey, useCreateRoom, useUpdateRoom, useDeleteRoom } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatPrice } from "@/lib/utils";
import { Plus, Edit2, Trash2, Image as ImageIcon, Sparkles } from "lucide-react";

function sanitizeHtml(html: string): string {
  const container = document.createElement("div");
  container.innerHTML = html;
  const stripDangerous = (node: Element) => {
    Array.from(node.children).forEach((child) => stripDangerous(child));
    if (["SCRIPT", "IFRAME", "OBJECT", "EMBED", "STYLE"].includes(node.tagName)) {
      node.remove();
      return;
    }
    Array.from(node.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value.toLowerCase();
      if (name.startsWith("on") || (name === "href" && value.startsWith("javascript:"))) {
        node.removeAttribute(attr.name);
      }
    });
  };
  Array.from(container.children).forEach((child) => stripDangerous(child));
  return container.innerHTML;
}

function RichTextField({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current && ref.current) {
      ref.current.innerHTML = value;
      initialized.current = true;
    }
  }, [value]);
  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onPaste={() => {
        setTimeout(() => {
          if (ref.current) {
            const clean = sanitizeHtml(ref.current.innerHTML);
            if (clean !== ref.current.innerHTML) ref.current.innerHTML = clean;
            onChange(ref.current.innerHTML);
          }
        }, 0);
      }}
      onInput={() => { if (ref.current) onChange(ref.current.innerHTML); }}
      className="min-h-[110px] w-full rounded-md border bg-background px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary"
    />
  );
}

function HtmlSourceField({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      spellCheck={false}
      className="min-h-[140px] w-full rounded-md border bg-background px-3 py-2 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary"
      placeholder="<h2>Heading</h2>&#10;<ul><li>Benefit one</li></ul>"
    />
  );
}

export default function AdminRooms() {
  const { data: rooms, isLoading } = useListRooms({ query: { queryKey: getListRoomsQueryKey() } });
  const createMutation = useCreateRoom();
  const updateMutation = useUpdateRoom();
  const deleteMutation = useDeleteRoom();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [keywords, setKeywords] = useState("");
  const [formKey, setFormKey] = useState(0);
  const [textMode, setTextMode] = useState<"paste" | "html">("paste");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    guestPrice: 0,
    memberPrice: 0,
    commissionPct: 10,
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
        setFormData(prev => ({ ...prev, imageUrl: json.secure_url }));
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

  const handleImagePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) uploadImageFile(file);
        break;
      }
    }
  };

  const generateDescription = () => {
    const name = formData.name.trim() || "This room";
    const benefits = keywords.split(",").map(b => b.trim()).filter(Boolean);
    if (benefits.length === 0) {
      setFormData(prev => ({ ...prev, description: `<p>${name} — a premium wellness space for your rejuvenation.</p>` }));
      return;
    }
    const bulletList = benefits.map(b => `<li>${b.charAt(0).toUpperCase() + b.slice(1)}</li>`).join("");
    setFormData(prev => ({ ...prev, description: `<p>${name}</p><ul>${bulletList}</ul>` }));
    setTextMode("html");
    setFormKey((key) => key + 1);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ name: "", description: "", imageUrl: "", guestPrice: 0, memberPrice: 0, commissionPct: 10 });
    setKeywords("");
    setFormKey((key) => key + 1);
    setTextMode("paste");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (room: any) => {
    setEditingId(room.id);
    setFormData({
      name: room.name,
      description: room.description,
      imageUrl: room.imageUrl || "",
      guestPrice: room.guestPrice,
      memberPrice: room.memberPrice,
      commissionPct: room.commissionPct,
    });
    setKeywords("");
    setFormKey((key) => key + 1);
    setTextMode("paste");
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRoomsQueryKey() });
        toast({ title: "Room deleted" });
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      description: sanitizeHtml(formData.description),
      imageUrl: formData.imageUrl || null
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: dataToSubmit }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListRoomsQueryKey() });
          setIsModalOpen(false);
          toast({ title: "Room updated" });
        }
      });
    } else {
      createMutation.mutate({ data: dataToSubmit }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListRoomsQueryKey() });
          setIsModalOpen(false);
          toast({ title: "Room created" });
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif mb-1">Rooms</h1>
          <p className="text-muted-foreground">Manage wellness rooms and pricing.</p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus size={16} /> Add Room
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
            ) : rooms?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No rooms found</TableCell></TableRow>
            ) : (
              rooms?.map(room => (
                <TableRow key={room.id}>
                  <TableCell>
                    {room.imageUrl ? (
                      <div className="w-10 h-10 rounded bg-muted overflow-hidden">
                        <img src={room.imageUrl} alt={room.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-muted-foreground">
                        <ImageIcon size={16} />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{room.name}</TableCell>
                  <TableCell className="text-right">{formatPrice(room.guestPrice)}</TableCell>
                  <TableCell className="text-right font-medium text-primary">{formatPrice(room.memberPrice)}</TableCell>
                  <TableCell className="text-right">{room.commissionPct}%</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(room)}>
                        <Edit2 size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(room.id)}>
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
              <DialogTitle>{editingId ? "Edit Room" : "Add Room"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="keywords">Key Features (comma-separated, optional)</Label>
                <Input id="keywords" value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="e.g. private sauna, massage table, sound therapy" />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Description</Label>
                  <Button type="button" variant="outline" size="sm" className="gap-1" onClick={generateDescription}>
                    <Sparkles size={14} /> Generate Description
                  </Button>
                </div>
                <div className="flex items-center justify-end">
                  <div className="flex rounded-full border bg-muted p-0.5 text-xs">
                    <button type="button" onClick={() => setTextMode("paste")} className={`rounded-full px-3 py-1 font-medium transition-colors ${textMode === "paste" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Paste formatted text</button>
                    <button type="button" onClick={() => setTextMode("html")} className={`rounded-full px-3 py-1 font-medium transition-colors ${textMode === "html" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Paste HTML code</button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {textMode === "paste"
                    ? "Paste ready-made text from Word, Google Docs, or AI tools — formatting like bold, italic, and color will be kept."
                    : "Paste raw HTML code (e.g. <h2>, <ul><li>, style=\"color:...\") and it will render as real headings, lists, and colors."}
                </p>
                {textMode === "paste" ? (
                  <RichTextField key={`rich-${formKey}`} value={formData.description} onChange={(html) => setFormData((prev) => ({ ...prev, description: html }))} />
                ) : (
                  <>
                    <HtmlSourceField key={`html-${formKey}`} value={formData.description} onChange={(html) => setFormData((prev) => ({ ...prev, description: html }))} />
                    <div className="grid gap-1.5">
                      <span className="text-xs font-medium text-muted-foreground">Live preview</span>
                      <div
                        className="min-h-[80px] rounded-md border bg-card p-4 text-sm leading-relaxed [&_h2]:font-serif [&_h2]:text-xl [&_h3]:font-serif [&_h3]:text-lg [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(formData.description) || "<span class=\"text-muted-foreground\">Nothing to preview yet…</span>" }}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="imageUpload">Room Photo</Label>
                <Input id="imageUpload" type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                <div
                  tabIndex={0}
                  onPaste={handleImagePaste}
                  className="border-2 border-dashed rounded p-4 text-center text-sm text-muted-foreground cursor-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  Click here, then press Ctrl+V (or Cmd+V) to paste a copied image
                </div>
                {isUploading && <p className="text-sm text-muted-foreground">Uploading photo...</p>}
                {formData.imageUrl && !isUploading && (
                  <img src={formData.imageUrl} alt="Preview" className="w-24 h-24 object-cover rounded border" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="guestPrice">Guest Price (₦)</Label>
                  <Input id="guestPrice" type="number" step="0.01" value={formData.guestPrice} onChange={e => setFormData({...formData, guestPrice: parseFloat(e.target.value)})} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="memberPrice">Member Price (₦)</Label>
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
