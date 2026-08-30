import { useEffect, useRef, useState } from "react";
import { useListMenuItems, getListMenuItemsQueryKey, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { Plus, Edit2, Trash2, Image as ImageIcon, X } from "lucide-react";

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

function RichTextField({ value, onChange, minHeight = "110px" }: { value: string; onChange: (html: string) => void; minHeight?: string }) {
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
      style={{ minHeight }}
      className="w-full rounded-md border bg-background px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary"
    />
  );
}

function HtmlSourceField({ value, onChange, minHeight = "140px" }: { value: string; onChange: (html: string) => void; minHeight?: string }) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      spellCheck={false}
      style={{ minHeight }}
      className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary"
      placeholder="<b>Bold name</b>"
    />
  );
}

function TextModeToggle({ mode, onChange }: { mode: "paste" | "html"; onChange: (mode: "paste" | "html") => void }) {
  return (
    <div className="flex items-center justify-end">
      <div className="flex rounded-full border bg-muted p-0.5 text-xs">
        <button type="button" onClick={() => onChange("paste")} className={`rounded-full px-3 py-1 font-medium transition-colors ${mode === "paste" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Paste formatted text</button>
        <button type="button" onClick={() => onChange("html")} className={`rounded-full px-3 py-1 font-medium transition-colors ${mode === "html" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Paste HTML code</button>
      </div>
    </div>
  );
}

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/djzigoye/image/upload";
const CLOUDINARY_PRESET = "ruth_health_products";

async function uploadToCloudinary(file: File): Promise<string | null> {
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", CLOUDINARY_PRESET);
  const res = await fetch(CLOUDINARY_URL, { method: "POST", body: data });
  const json = await res.json();
  return json.secure_url ?? null;
}

export default function AdminMenuItems() {
  const { data: items, isLoading } = useListMenuItems(undefined, { query: { queryKey: getListMenuItemsQueryKey() } });
  const createMutation = useCreateMenuItem();
  const updateMutation = useUpdateMenuItem();
  const deleteMutation = useDeleteMenuItem();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [nameMode, setNameMode] = useState<"paste" | "html">("paste");
  const [descMode, setDescMode] = useState<"paste" | "html">("paste");
  const [videoInput, setVideoInput] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    imageUrls: [] as string[],
    videoUrls: [] as string[],
    type: "food" as "food" | "drink",
    category: "",
    guestPrice: "",
    memberPrice: "",
    commissionPct: 10,
  });

  const existingCategories = Array.from(new Set((items ?? []).map((i) => i.category))).sort();

  const uploadPrimaryImage = async (file: File) => {
    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      if (url) setFormData((prev) => ({ ...prev, imageUrl: url }));
      else alert("Image upload failed. Please try again.");
    } catch {
      alert("Image upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const uploadExtraImage = async (file: File) => {
    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      if (url) setFormData((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, url] }));
      else alert("Image upload failed. Please try again.");
    } catch {
      alert("Image upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePrimaryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadPrimaryImage(file);
  };

  const handleExtraImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadExtraImage(file);
  };

  const handleImagePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const clipItems = e.clipboardData?.items;
    if (!clipItems) return;
    for (let i = 0; i < clipItems.length; i++) {
      if (clipItems[i].type.startsWith("image/")) {
        const file = clipItems[i].getAsFile();
        if (file) uploadPrimaryImage(file);
        break;
      }
    }
  };

  const removeExtraImage = (url: string) => {
    setFormData((prev) => ({ ...prev, imageUrls: prev.imageUrls.filter((u) => u !== url) }));
  };

  const addVideoUrl = () => {
    const trimmed = videoInput.trim();
    if (!trimmed) return;
    setFormData((prev) => ({ ...prev, videoUrls: [...prev.videoUrls, trimmed] }));
    setVideoInput("");
  };

  const removeVideoUrl = (url: string) => {
    setFormData((prev) => ({ ...prev, videoUrls: prev.videoUrls.filter((u) => u !== url) }));
  };

  const resetForm = () => {
    setFormData({
      name: "", description: "", imageUrl: "", imageUrls: [], videoUrls: [],
      type: "food", category: "", guestPrice: "", memberPrice: "", commissionPct: 10,
    });
    setVideoInput("");
    setNameMode("paste");
    setDescMode("paste");
    setFormKey((k) => k + 1);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl || "",
      imageUrls: item.imageUrls || [],
      videoUrls: item.videoUrls || [],
      type: item.type,
      category: item.category,
      guestPrice: item.guestPrice == null ? "" : String(item.guestPrice),
      memberPrice: item.memberPrice == null ? "" : String(item.memberPrice),
      commissionPct: item.commissionPct,
    });
    setVideoInput("");
    setNameMode("paste");
    setDescMode("paste");
    setFormKey((k) => k + 1);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return;
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMenuItemsQueryKey() });
        toast({ title: "Menu item deleted" });
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit = {
      name: sanitizeHtml(formData.name),
      description: sanitizeHtml(formData.description),
      imageUrl: formData.imageUrl || null,
      imageUrls: formData.imageUrls,
      videoUrls: formData.videoUrls,
      type: formData.type,
      category: formData.category,
      guestPrice: formData.guestPrice === "" ? null : parseFloat(formData.guestPrice),
      memberPrice: formData.memberPrice === "" ? null : parseFloat(formData.memberPrice),
      commissionPct: formData.commissionPct,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: dataToSubmit }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMenuItemsQueryKey() });
          setIsModalOpen(false);
          toast({ title: "Menu item updated" });
        }
      });
    } else {
      createMutation.mutate({ data: dataToSubmit }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMenuItemsQueryKey() });
          setIsModalOpen(false);
          toast({ title: "Menu item created" });
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif mb-1">Food &amp; Drinks</h1>
          <p className="text-muted-foreground">Manage your menu items, categories, and pricing.</p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus size={16} /> Add Item
        </Button>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Guest Price</TableHead>
              <TableHead className="text-right">Member Price</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : items?.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No menu items found</TableCell></TableRow>
            ) : (
              items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.imageUrl ? (
                      <div className="w-10 h-10 rounded bg-muted overflow-hidden">
                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-muted-foreground">
                        <ImageIcon size={16} />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <span dangerouslySetInnerHTML={{ __html: item.name }} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.type === "drink" ? "secondary" : "outline"}>{item.type}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.category}</TableCell>
                  <TableCell className="text-right">{item.guestPrice == null ? "Ask staff" : formatPrice(item.guestPrice)}</TableCell>
                  <TableCell className="text-right font-medium text-primary">{item.memberPrice == null ? "Ask staff" : formatPrice(item.memberPrice)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(item)}>
                        <Edit2 size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(item.id)}>
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
        <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">

              <div className="grid gap-2">
                <Label>Type</Label>
                <div className="flex rounded-full border bg-muted p-0.5 text-xs w-fit">
                  <button type="button" onClick={() => setFormData((p) => ({ ...p, type: "food" }))} className={`rounded-full px-4 py-1.5 font-medium transition-colors ${formData.type === "food" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Food</button>
                  <button type="button" onClick={() => setFormData((p) => ({ ...p, type: "drink" }))} className={`rounded-full px-4 py-1.5 font-medium transition-colors ${formData.type === "drink" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Drink</button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  list="category-suggestions"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Rice, Bar, Soup"
                  required
                />
                <datalist id="category-suggestions">
                  {existingCategories.map((cat) => <option key={cat} value={cat} />)}
                </datalist>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Name</Label>
                  <TextModeToggle mode={nameMode} onChange={setNameMode} />
                </div>
                {nameMode === "paste" ? (
                  <RichTextField key={`name-rich-${formKey}`} value={formData.name} onChange={(html) => setFormData((p) => ({ ...p, name: html }))} minHeight="46px" />
                ) : (
                  <HtmlSourceField key={`name-html-${formKey}`} value={formData.name} onChange={(html) => setFormData((p) => ({ ...p, name: html }))} minHeight="60px" />
                )}
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Description</Label>
                  <TextModeToggle mode={descMode} onChange={setDescMode} />
                </div>
                {descMode === "paste" ? (
                  <RichTextField key={`desc-rich-${formKey}`} value={formData.description} onChange={(html) => setFormData((p) => ({ ...p, description: html }))} />
                ) : (
                  <>
                    <HtmlSourceField key={`desc-html-${formKey}`} value={formData.description} onChange={(html) => setFormData((p) => ({ ...p, description: html }))} />
                    <div className="grid gap-1.5">
                      <span className="text-xs font-medium text-muted-foreground">Live preview</span>
                      <div
                        className="min-h-[80px] rounded-md border bg-card p-4 text-sm leading-relaxed [&_h2]:font-serif [&_h2]:text-xl [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(formData.description) || "<span class=\"text-muted-foreground\">Nothing to preview yet…</span>" }}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="imageUpload">Primary Photo</Label>
                <Input id="imageUpload" type="file" accept="image/*" onChange={handlePrimaryImageChange} disabled={isUploading} />
                <div
                  tabIndex={0}
                  onPaste={handleImagePaste}
                  className="border-2 border-dashed rounded p-4 text-center text-sm text-muted-foreground cursor-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  Click here, then press Ctrl+V (or Cmd+V) to paste a copied image
                </div>
                {isUploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
                {formData.imageUrl && !isUploading && (
                  <img src={formData.imageUrl} alt="Preview" className="w-24 h-24 object-cover rounded border" />
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="extraImageUpload">Additional Photos (optional)</Label>
                <Input id="extraImageUpload" type="file" accept="image/*" onChange={handleExtraImageChange} disabled={isUploading} />
                {formData.imageUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.imageUrls.map((url) => (
                      <div key={url} className="relative">
                        <img src={url} alt="" className="w-16 h-16 object-cover rounded border" />
                        <button type="button" onClick={() => removeExtraImage(url)} className="absolute -top-1.5 -right-1.5 bg-background border rounded-full p-0.5 text-muted-foreground hover:text-destructive">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="videoUrl">Video Links (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="videoUrl"
                    value={videoInput}
                    onChange={(e) => setVideoInput(e.target.value)}
                    placeholder="Paste a video link (e.g. YouTube)"
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addVideoUrl(); } }}
                  />
                  <Button type="button" variant="outline" onClick={addVideoUrl}>Add</Button>
                </div>
                {formData.videoUrls.length > 0 && (
                  <ul className="space-y-1">
                    {formData.videoUrls.map((url) => (
                      <li key={url} className="flex items-center justify-between text-xs bg-muted rounded px-2 py-1.5">
                        <span className="truncate">{url}</span>
                        <button type="button" onClick={() => removeVideoUrl(url)} className="text-muted-foreground hover:text-destructive ml-2 shrink-0">
                          <X size={12} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="guestPrice">Guest Price (₦)</Label>
                  <Input id="guestPrice" type="number" step="0.01" value={formData.guestPrice} onChange={(e) => setFormData({ ...formData, guestPrice: e.target.value })} placeholder="Leave blank for 'Ask staff'" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="memberPrice">Member Price (₦)</Label>
                  <Input id="memberPrice" type="number" step="0.01" value={formData.memberPrice} onChange={(e) => setFormData({ ...formData, memberPrice: e.target.value })} placeholder="Leave blank for 'Ask staff'" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="commissionPct">Referral Commission (%)</Label>
                <Input id="commissionPct" type="number" min="0" max="100" value={formData.commissionPct} onChange={(e) => setFormData({ ...formData, commissionPct: parseFloat(e.target.value) })} required />
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
