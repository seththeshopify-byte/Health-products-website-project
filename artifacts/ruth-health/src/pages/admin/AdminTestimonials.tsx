import { useEffect, useRef, useState } from "react";
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

// Removes potentially dangerous markup (scripts, event handlers, javascript: links)
// while keeping normal formatting tags like <b>, <i>, <span style="...">, <font>, etc.
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

// A contentEditable field that preserves formatting (bold, italic, color, etc.)
// when the admin pastes ready-made text from Word, Google Docs, AI tools, etc.
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
      onPaste={(event) => {
        // Let the browser handle the rich paste naturally (keeps formatting),
        // we just sanitize it right after.
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

// A plain code box for pasting raw HTML source (e.g. <h2>, <ul><li>, style="color:...").
// Unlike RichTextField, this treats the pasted text as literal HTML code rather than
// as already-formatted content, so tags in the pasted text become real elements.
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
      onChange={(event) => onChange(event.target.value)}
      spellCheck={false}
      className="min-h-[160px] w-full rounded-md border bg-background px-3 py-2 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary"
      placeholder="<h2>Heading</h2>&#10;<p>Paragraph text...</p>"
    />
  );
}

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
  const [formKey, setFormKey] = useState(0);
  const [textMode, setTextMode] = useState<"paste" | "html">("paste");

  const openCreate = () => {
    setEditingId(null);
    setFormData({ ...emptyForm, photoUrls: [], videoUrls: [] });
    setFormKey((key) => key + 1);
    setTextMode("paste");
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
    setFormKey((key) => key + 1);
    setTextMode("paste");
    setIsModalOpen(true);
  };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListTestimonialsQueryKey() });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const data = {
      name: formData.name,
      text: sanitizeHtml(formData.text),
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
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="story-text">Story</Label>
                  <div className="flex rounded-full border bg-muted p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setTextMode("paste")}
                      className={`rounded-full px-3 py-1 font-medium transition-colors ${textMode === "paste" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
                    >
                      Paste formatted text
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextMode("html")}
                      className={`rounded-full px-3 py-1 font-medium transition-colors ${textMode === "html" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
                    >
                      Paste HTML code
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {textMode === "paste"
                    ? "Paste ready-made text from Word, Google Docs, or AI tools — formatting like bold, italic, and color will be kept."
                    : "Paste raw HTML code (e.g. <h2>, <ul><li>, style=\"color:...\") and it will render as real headings, lists, and colors."}
                </p>
                {textMode === "paste" ? (
                  <RichTextField key={`rich-${formKey}`} value={formData.text} onChange={(html) => setFormData((prev) => ({ ...prev, text: html }))} />
                ) : (
                  <>
                    <HtmlSourceField key={`html-${formKey}`} value={formData.text} onChange={(html) => setFormData((prev) => ({ ...prev, text: html }))} />
                    <div className="grid gap-1.5">
                      <span className="text-xs font-medium text-muted-foreground">Live preview</span>
                      <div
                        className="min-h-[80px] rounded-md border bg-card p-4 text-sm leading-relaxed [&_h2]:font-serif [&_h2]:text-xl [&_h3]:font-serif [&_h3]:text-lg [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(formData.text) || "<span class=\"text-muted-foreground\">Nothing to preview yet…</span>" }}
                      />
                    </div>
                  </>
                )}
              </div>
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
