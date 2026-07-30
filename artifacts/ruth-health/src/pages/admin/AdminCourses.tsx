import { useEffect, useRef, useState } from "react";
import {
  useListCourses,
  getListCoursesQueryKey,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  contentUrl: "",
  contentBody: "",
  photoUrls: [] as string[],
  videoUrls: [] as string[],
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminCourses() {
  const { data: courses, isLoading } = useListCourses({
    query: { queryKey: getListCoursesQueryKey() },
  });
  const createMutation = useCreateCourse();
  const updateMutation = useUpdateCourse();
  const deleteMutation = useDeleteCourse();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formKey, setFormKey] = useState(0);
  const [descMode, setDescMode] = useState<"paste" | "html">("paste");
  const [bodyMode, setBodyMode] = useState<"paste" | "html">("paste");

  const openCreate = () => {
    setEditingId(null);
    setFormData({ ...emptyForm, photoUrls: [], videoUrls: [] });
    setFormKey((k) => k + 1);
    setDescMode("paste");
    setBodyMode("paste");
    setIsModalOpen(true);
  };

  const openEdit = (course: any) => {
    setEditingId(course.id);
    setFormData({
      name: course.name,
      description: course.description,
      contentUrl: course.contentUrl || "",
      contentBody: course.contentBody || "",
      photoUrls: course.photoUrls?.length
        ? course.photoUrls
        : course.imageUrl
        ? [course.imageUrl]
        : [],
      videoUrls: course.videoUrls?.length ? course.videoUrls : [],
    });
    setFormKey((k) => k + 1);
    setDescMode("paste");
    setBodyMode("paste");
    setIsModalOpen(true);
  };

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey() });

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        void invalidate();
        toast({ title: "Course deleted" });
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit = {
      name: formData.name,
      description: sanitizeHtml(formData.description),
      contentUrl: formData.contentUrl || null,
      contentBody: formData.contentBody || null,
      photoUrls: formData.photoUrls,
      videoUrls: formData.videoUrls,
      imageUrl: formData.photoUrls[0] ?? null,
    };
    const onSuccess = () => {
      void invalidate();
      setIsModalOpen(false);
      toast({ title: editingId ? "Course updated" : "Course created" });
    };
    if (editingId) updateMutation.mutate({ id: editingId, data: dataToSubmit }, { onSuccess });
    else createMutation.mutate({ data: dataToSubmit }, { onSuccess });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-3xl font-serif">Courses</h1>
          <p className="text-muted-foreground">Manage educational content and materials.</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} /> Add Course
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Resource URL</TableHead>
              <TableHead>Media</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center">Loading...</TableCell>
              </TableRow>
            ) : !courses?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No courses found</TableCell>
              </TableRow>
            ) : (
              courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>
                    {course.imageUrl ? (
                      <div className="h-10 w-10 overflow-hidden rounded bg-muted">
                        <img src={course.imageUrl} alt={course.name} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-muted-foreground">
                        <ImageIcon size={16} />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{course.name}</div>
                    <div className="line-clamp-1 text-sm text-muted-foreground">{course.description}</div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {course.contentUrl || "-"}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {course.photoUrls?.length || (course.imageUrl ? 1 : 0)} photo(s),{" "}
                    {course.videoUrls?.length || 0} video(s)
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(course)}>
                        <Edit2 size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(course.id)}>
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
              <DialogTitle>{editingId ? "Edit Course" : "Add Course"}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Name */}
              <div className="grid gap-2">
                <Label htmlFor="crs-name">Course Title</Label>
                <Input
                  id="crs-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Short description — rich text */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Short Description</Label>
                  <div className="flex rounded-full border bg-muted p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setDescMode("paste")}
                      className={`rounded-full px-3 py-1 font-medium transition-colors ${
                        descMode === "paste" ? "bg-background shadow-sm" : "text-muted-foreground"
                      }`}
                    >
                      Paste formatted text
                    </button>
                    <button
                      type="button"
                      onClick={() => setDescMode("html")}
                      className={`rounded-full px-3 py-1 font-medium transition-colors ${
                        descMode === "html" ? "bg-background shadow-sm" : "text-muted-foreground"
                      }`}
                    >
                      Paste HTML code
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {descMode === "paste"
                    ? "Paste ready-made text from Word, Google Docs, or AI tools — formatting like bold, italic, and color will be kept."
                    : 'Paste raw HTML code (e.g. <h2>, <ul><li>, style="color:...") and it will render as real headings, lists, and colors.'}
                </p>
                {descMode === "paste" ? (
                  <RichTextField
                    key={`desc-rich-${formKey}`}
                    value={formData.description}
                    onChange={(html) => setFormData((prev) => ({ ...prev, description: html }))}
                  />
                ) : (
                  <>
                    <HtmlSourceField
                      key={`desc-html-${formKey}`}
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

              {/* Video / External resource URL */}
              <div className="grid gap-2">
                <Label htmlFor="crs-contentUrl">Video / External Resource URL</Label>
                <Input
                  id="crs-contentUrl"
                  value={formData.contentUrl}
                  onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
                  placeholder="https://youtube.com/..."
                />
              </div>

              {/* Detailed content — rich text */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Detailed Content</Label>
                  <div className="flex rounded-full border bg-muted p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setBodyMode("paste")}
                      className={`rounded-full px-3 py-1 font-medium transition-colors ${
                        bodyMode === "paste" ? "bg-background shadow-sm" : "text-muted-foreground"
                      }`}
                    >
                      Paste formatted text
                    </button>
                    <button
                      type="button"
                      onClick={() => setBodyMode("html")}
                      className={`rounded-full px-3 py-1 font-medium transition-colors ${
                        bodyMode === "html" ? "bg-background shadow-sm" : "text-muted-foreground"
                      }`}
                    >
                      Paste HTML code
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {bodyMode === "paste"
                    ? "Paste ready-made text from Word, Google Docs, or AI tools — formatting like bold, italic, and color will be kept."
                    : 'Paste raw HTML code (e.g. <h2>, <ul><li>, style="color:...") and it will render as real headings, lists, and colors.'}
                </p>
                {bodyMode === "paste" ? (
                  <RichTextField
                    key={`body-rich-${formKey}`}
                    value={formData.contentBody}
                    onChange={(html) => setFormData((prev) => ({ ...prev, contentBody: html }))}
                  />
                ) : (
                  <>
                    <HtmlSourceField
                      key={`body-html-${formKey}`}
                      value={formData.contentBody}
                      onChange={(html) => setFormData((prev) => ({ ...prev, contentBody: html }))}
                    />
                    <div className="grid gap-1.5">
                      <span className="text-xs font-medium text-muted-foreground">Live preview</span>
                      <div
                        className="min-h-[80px] rounded-md border bg-card p-4 text-sm leading-relaxed [&_h2]:font-serif [&_h2]:text-xl [&_h3]:font-serif [&_h3]:text-lg [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1"
                        dangerouslySetInnerHTML={{
                          __html:
                            sanitizeHtml(formData.contentBody) ||
                            '<span class="text-muted-foreground">Nothing to preview yet…</span>',
                        }}
                      />
                    </div>
                  </>
                )}
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
                {isSaving ? "Saving..." : "Save Course"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
