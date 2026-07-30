import { useEffect, useRef, useState } from "react";
import {
  useListServices,
  getListServicesQueryKey,
  useCreateService,
  useUpdateService,
  useDeleteService,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatPrice } from "@/lib/utils";
import { Plus, Edit2, Trash2, Image as ImageIcon, Video } from "lucide-react";
import { MediaUploader } from "@/components/MediaUploader";

// ---------------------------------------------------------------------------
// Helpers — identical to the pattern used in AdminTestimonials
// ---------------------------------------------------------------------------

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

function RichTextField({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
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
      onPaste={(e) => {
        setTimeout(() => {
          if (ref.current) {
            const clean = sanitizeHtml(ref.current.innerHTML);
            if (clean !== ref.current.innerHTML) ref.current.innerHTML = clean;
            onChange(ref.current.innerHTML);
          }
        }, 0);
      }}
      onInput={() => {
        if (ref.current) onChange(ref.current.innerHTML);
      }}
      className="min-h-[120px] w-full rounded-md border bg-background px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary"
    />
  );
}

function HtmlSourceField({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      className="min-h-[160px] w-full rounded-md border bg-background px-3 py-2 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary"
      placeholder="<h2>Heading</h2>&#10;<p>Paragraph text...</p>"
    />
  );
}

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

const emptyForm = {
  name: "",
  description: "",
  guestPrice: 0,
  memberPrice: 0,
  commissionPct: 10,
  photoUrls: [] as string[],
  videoUrls: [] as string[],
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminServices() {
  const { data: services, isLoading } = useListServices({
    query: { queryKey: getListServicesQueryKey() },
  });
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const deleteMutation = useDeleteService();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formKey, setFormKey] = useState(0);
  const [textMode, setTextMode] = useState<"paste" | "html">("paste");

  const openCreate = () => {
    setEditingId(null);
    setFormData({ ...emptyForm, photoUrls: [], videoUrls: [] });
    setFormKey((k) => k + 1);
    setTextMode("paste");
    setIsModalOpen(true);
  };

  const openEdit = (service: any) => {
    setEditingId(service.id);
    setFormData({
      name: service.name,
      description: service.description,
      guestPrice: service.guestPrice,
      memberPrice: service.memberPrice,
      commissionPct: service.commissionPct,
      photoUrls: service.photoUrls?.length
        ? service.photoUrls
        : service.imageUrl
        ? [service.imageUrl]
        : [],
      videoUrls: service.videoUrls?.length ? service.videoUrls : [],
    });
    setFormKey((k) => k + 1);
    setTextMode("paste");
    setIsModalOpen(true);
  };

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        void invalidate();
        toast({ title: "Service deleted" });
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit = {
      name: formData.name,
      description: sanitizeHtml(formData.description),
      guestPrice: formData.guestPrice,
      memberPrice: formData.memberPrice,
      commissionPct: formData.commissionPct,
      photoUrls: formData.photoUrls,
      videoUrls: formData.videoUrls,
      imageUrl: formData.photoUrls[0] ?? null,
    };
    const onSuccess = () => {
      void invalidate();
      setIsModalOpen(false);
      toast({ title: editingId ? "Service updated" : "Service created" });
    };
    if (editingId) updateMutation.mutate({ id: editingId, data: dataToSubmit }, { onSuccess });
    else createMutation.mutate({ data: dataToSubmit }, { onSuccess });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-3xl font-serif">Services</h1>
          <p className="text-muted-foreground">Manage consultations and their pricing.</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} /> Add Service
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Guest Price</TableHead>
              <TableHead className="text-right">Member Price</TableHead>
              <TableHead className="text-right">Commission</TableHead>
              <TableHead>Media</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center">Loading...</TableCell>
              </TableRow>
            ) : !services?.length ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No services found</TableCell>
              </TableRow>
            ) : (
              services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    {service.imageUrl ? (
                      <div className="h-10 w-10 overflow-hidden rounded bg-muted">
                        <img src={service.imageUrl} alt={service.name} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-muted-foreground">
                        <ImageIcon size={16} />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell className="text-right">{formatPrice(service.guestPrice)}</TableCell>
                  <TableCell className="text-right font-medium text-primary">{formatPrice(service.memberPrice)}</TableCell>
                  <TableCell className="text-right">{service.commissionPct}%</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {service.photoUrls?.length || (service.imageUrl ? 1 : 0)} photo(s),{" "}
                    {service.videoUrls?.length || 0} video(s)
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(service)}>
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[620px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Service" : "Add Service"}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Name */}
              <div className="grid gap-2">
                <Label htmlFor="svc-name">Name</Label>
                <Input
                  id="svc-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Description — rich text */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Description</Label>
                  <div className="flex rounded-full border bg-muted p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setTextMode("paste")}
                      className={`rounded-full px-3 py-1 font-medium transition-colors ${
                        textMode === "paste" ? "bg-background shadow-sm" : "text-muted-foreground"
                      }`}
                    >
                      Paste formatted text
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextMode("html")}
                      className={`rounded-full px-3 py-1 font-medium transition-colors ${
                        textMode === "html" ? "bg-background shadow-sm" : "text-muted-foreground"
                      }`}
                    >
                      Paste HTML code
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {textMode === "paste"
                    ? "Paste ready-made text from Word, Google Docs, or AI tools — formatting like bold, italic, and color will be kept."
                    : 'Paste raw HTML code (e.g. <h2>, <ul><li>, style="color:...") and it will render as real headings, lists, and colors.'}
                </p>
                {textMode === "paste" ? (
                  <RichTextField
                    key={`rich-${formKey}`}
                    value={formData.description}
                    onChange={(html) => setFormData((prev) => ({ ...prev, description: html }))}
                  />
                ) : (
                  <>
                    <HtmlSourceField
                      key={`html-${formKey}`}
                      value={formData.description}
                      onChange={(html) => setFormData((prev) => ({ ...prev, description: html }))}
                    />
                    <div className="grid gap-1.5">
                      <span className="text-xs font-medium text-muted-foreground">Live preview</span>
                      <div
                        className="min-h-[80px] rounded-md border bg-card p-4 text-sm leading-relaxed [&_h2]:font-serif [&_h2]:text-xl [&_h3]:font-serif [&_h3]:text-lg [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1"
                        dangerouslySetInnerHTML={{
                          __html:
                            sanitizeHtml(formData.description) ||
                            '<span class="text-muted-foreground">Nothing to preview yet…</span>',
                        }}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="svc-guest">Guest Price ($)</Label>
                  <Input
                    id="svc-guest"
                    type="number"
                    step="0.01"
                    value={formData.guestPrice}
                    onChange={(e) => setFormData({ ...formData, guestPrice: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="svc-member">Member Price ($)</Label>
                  <Input
                    id="svc-member"
                    type="number"
                    step="0.01"
                    value={formData.memberPrice}
                    onChange={(e) => setFormData({ ...formData, memberPrice: parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>

              {/* Commission */}
              <div className="grid gap-2">
                <Label htmlFor="svc-commission">Referral Commission (%)</Label>
                <Input
                  id="svc-commission"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.commissionPct}
                  onChange={(e) => setFormData({ ...formData, commissionPct: parseFloat(e.target.value) })}
                  required
                />
              </div>

              {/* Photos & Videos */}
              <div className="grid gap-2">
                <Label>
                  <Video size={15} className="mr-1 inline" /> Photos and videos
                </Label>
                <MediaUploader
                  key={formKey}
                  imageUrls={formData.photoUrls}
                  videoUrls={formData.videoUrls}
                  onImagesChange={(photoUrls) => setFormData({ ...formData, photoUrls })}
                  onVideosChange={(videoUrls) => setFormData({ ...formData, videoUrls })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Service"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
