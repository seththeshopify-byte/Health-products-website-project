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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit2, Trash2, Image as ImageIcon, Video, GripVertical, ChevronDown, ChevronUp, Save, X, CheckCircle2 } from "lucide-react";
import { MediaUploader } from "@/components/MediaUploader";

// ---------------------------------------------------------------------------
// Helpers
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
      className="min-h-[120px] w-full rounded-md border bg-background px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary"
    />
  );
}

function HtmlSourceField({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      className="min-h-[200px] w-full rounded-md border bg-background px-3 py-2 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary"
      placeholder="<h2>Heading</h2>&#10;<p>Paragraph text...</p>"
    />
  );
}

// ---------------------------------------------------------------------------
// API helpers (new endpoints)
// ---------------------------------------------------------------------------

async function apiFetch(url: string, opts?: RequestInit) {
  const res = await fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts?.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

function fetchModules(courseId: number) {
  return apiFetch(`/courses/${courseId}/modules`);
}

function createModule(courseId: number, data: { title: string; introduction?: string; contentBody?: string; orderIndex?: number }) {
  return apiFetch(`/courses/${courseId}/modules`, { method: "POST", body: JSON.stringify(data) });
}

function updateModule(courseId: number, moduleId: number, data: Partial<{ title: string; introduction: string; contentBody: string; orderIndex: number }>) {
  return apiFetch(`/courses/${courseId}/modules/${moduleId}`, { method: "PATCH", body: JSON.stringify(data) });
}

function deleteModule(courseId: number, moduleId: number) {
  return apiFetch(`/courses/${courseId}/modules/${moduleId}`, { method: "DELETE" });
}

function createModuleMedia(moduleId: number, type: "image" | "video", url: string, orderIndex?: number) {
  // We need courseId for the URL path, but the backend uses moduleId. 
  // Since our route is /courses/:id/modules/:moduleId/media, we need the courseId.
  // We'll handle this in the component by storing courseId with the call.
  return { moduleId, type, url, orderIndex: orderIndex ?? 0 };
}

function deleteModuleMedia(courseId: number, moduleId: number, mediaId: number) {
  return apiFetch(`/courses/${courseId}/modules/${moduleId}/media/${mediaId}`, { method: "DELETE" });
}

function postModuleMedia(courseId: number, moduleId: number, type: "image" | "video", url: string, orderIndex?: number) {
  return apiFetch(`/courses/${courseId}/modules/${moduleId}/media`, { method: "POST", body: JSON.stringify({ type, url, orderIndex: orderIndex ?? 0 }) });
}

function fetchModuleQuizQuestions(courseId: number, moduleId: number) {
  return apiFetch(`/courses/${courseId}/modules/${moduleId}/quiz/questions`);
}

function createModuleQuizQuestion(courseId: number, moduleId: number, data: { questionHtml: string; options: Array<{ text: string; isCorrect: boolean }>; orderIndex?: number }) {
  return apiFetch(`/courses/${courseId}/modules/${moduleId}/quiz/questions`, { method: "POST", body: JSON.stringify(data) });
}

function updateModuleQuizQuestion(courseId: number, moduleId: number, questionId: number, data: Partial<{ questionHtml: string; options: Array<{ text: string; isCorrect: boolean }>; orderIndex: number }>) {
  return apiFetch(`/courses/${courseId}/modules/${moduleId}/quiz/questions/${questionId}`, { method: "PATCH", body: JSON.stringify(data) });
}

function deleteModuleQuizQuestion(courseId: number, moduleId: number, questionId: number) {
  return apiFetch(`/courses/${courseId}/modules/${moduleId}/quiz/questions/${questionId}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ModuleMedia {
  id: number;
  moduleId: number;
  type: "image" | "video";
  url: string;
  orderIndex: number;
}

interface QuizOption {
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: number;
  courseId: number;
  moduleId: number;
  questionHtml: string;
  options: QuizOption[];
  orderIndex: number;
}

interface CourseModule {
  id: number;
  courseId: number;
  title: string;
  introduction: string | null;
  contentBody: string | null;
  orderIndex: number;
  media: ModuleMedia[];
}

// ---------------------------------------------------------------------------
// Quiz Question Editor
// ---------------------------------------------------------------------------

function QuestionEditor({
  question,
  onChange,
  onDelete,
}: {
  question: Partial<QuizQuestion>;
  onChange: (q: Partial<QuizQuestion>) => void;
  onDelete: () => void;
}) {
  const [mode, setMode] = useState<"paste" | "html">("paste");
  const options = question.options || [
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ];

  const setOptionText = (idx: number, text: string) => {
    const next = options.map((o, i) => (i === idx ? { ...o, text } : o));
    onChange({ ...question, options: next });
  };

  const setCorrect = (idx: number) => {
    const next = options.map((o, i) => ({ ...o, isCorrect: i === idx }));
    onChange({ ...question, options: next });
  };

  const correctIndex = options.findIndex((o) => o.isCorrect);

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Question</span>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
          <Trash2 size={14} />
        </Button>
      </div>
      <div className="flex rounded-full border bg-muted p-0.5 text-xs w-fit">
        <button type="button" onClick={() => setMode("paste")} className={`rounded-full px-3 py-1 font-medium transition-colors ${mode === "paste" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Paste text</button>
        <button type="button" onClick={() => setMode("html")} className={`rounded-full px-3 py-1 font-medium transition-colors ${mode === "html" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>HTML code</button>
      </div>
      {mode === "paste" ? (
        <RichTextField value={question.questionHtml || ""} onChange={(html) => onChange({ ...question, questionHtml: html })} />
      ) : (
        <HtmlSourceField value={question.questionHtml || ""} onChange={(html) => onChange({ ...question, questionHtml: html })} />
      )}

      <div className="space-y-2">
        {options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <input
              type="radio"
              name={`correct-${question.id || "new"}`}
              checked={opt.isCorrect}
              onChange={() => setCorrect(idx)}
              className="h-4 w-4 text-primary"
            />
            <Input
              value={opt.text}
              onChange={(e) => setOptionText(idx, e.target.value)}
              placeholder={`Option ${String.fromCharCode(65 + idx)}`}
              className="flex-1"
            />
          </div>
        ))}
      </div>
      {correctIndex === -1 && <p className="text-xs text-destructive">Select one correct answer.</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Module Editor
// ---------------------------------------------------------------------------

function ModuleEditor({
  courseId,
  module: mod,
  onRefresh,
  index,
  total,
  onMoveUp,
  onMoveDown,
}: {
  courseId: number;
  module: CourseModule;
  onRefresh: () => void;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(index === 0);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("content");

  // Local form state
  const [title, setTitle] = useState(mod.title);
  const [introduction, setIntroduction] = useState(mod.introduction || "");
  const [contentBody, setContentBody] = useState(mod.contentBody || "");
  const [introMode, setIntroMode] = useState<"paste" | "html">("paste");
  const [bodyMode, setBodyMode] = useState<"paste" | "html">("paste");

  // Media state
  const [mediaUrls, setMediaUrls] = useState<{ imageUrls: string[]; videoUrls: string[] }>({
    imageUrls: mod.media?.filter((m) => m.type === "image").map((m) => m.url) || [],
    videoUrls: mod.media?.filter((m) => m.type === "video").map((m) => m.url) || [],
  });

  // Quiz state
  const [questions, setQuestions] = useState<Partial<QuizQuestion>[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);

  const loadQuiz = async () => {
    setQuizLoading(true);
    try {
      const qs = await fetchModuleQuizQuestions(courseId, mod.id);
      setQuestions(qs.length ? qs : []);
    } catch {
      setQuestions([]);
    } finally {
      setQuizLoading(false);
    }
  };

  useEffect(() => {
    if (expanded && activeTab === "quiz" && questions.length === 0) {
      loadQuiz();
    }
  }, [expanded, activeTab]);

  const handleSaveModule = async () => {
    setSaving(true);
    try {
      await updateModule(courseId, mod.id, { title, introduction, contentBody });
      // Sync media: delete old, create new
      const oldMedia = mod.media || [];
      const newImageUrls = mediaUrls.imageUrls;
      const newVideoUrls = mediaUrls.videoUrls;

      // Delete removed media
      for (const old of oldMedia) {
        const stillExists = old.type === "image" ? newImageUrls.includes(old.url) : newVideoUrls.includes(old.url);
        if (!stillExists) {
          await deleteModuleMedia(courseId, mod.id, old.id);
        }
      }

      // Add new media
      const oldImageUrls = oldMedia.filter((m) => m.type === "image").map((m) => m.url);
      const oldVideoUrls = oldMedia.filter((m) => m.type === "video").map((m) => m.url);

      for (const url of newImageUrls) {
        if (!oldImageUrls.includes(url)) {
          await postModuleMedia(courseId, mod.id, "image", url);
        }
      }
      for (const url of newVideoUrls) {
        if (!oldVideoUrls.includes(url)) {
          await postModuleMedia(courseId, mod.id, "video", url);
        }
      }

      toast({ title: "Module saved" });
      onRefresh();
    } catch (err: any) {
      toast({ title: "Error saving module", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModule = async () => {
    if (!confirm("Delete this module and all its content?")) return;
    try {
      await deleteModule(courseId, mod.id);
      toast({ title: "Module deleted" });
      onRefresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const addQuestion = () => {
    if (questions.length >= 10) {
      toast({ title: "Maximum 10 questions per module", variant: "destructive" });
      return;
    }
    setQuestions((prev) => [
      ...prev,
      {
        questionHtml: "",
        options: [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
        orderIndex: prev.length,
      },
    ]);
  };

  const saveQuestions = async () => {
    // Validate
    for (const q of questions) {
      if (!q.questionHtml?.trim()) {
        toast({ title: "All questions must have text", variant: "destructive" });
        return;
      }
      if (!q.options || q.options.some((o) => !o.text.trim())) {
        toast({ title: "All options must have text", variant: "destructive" });
        return;
      }
      if (!q.options.some((o) => o.isCorrect)) {
        toast({ title: "Each question needs one correct answer", variant: "destructive" });
        return;
      }
    }

    try {
      // Fetch existing questions to know which to update vs create
      const existing = await fetchModuleQuizQuestions(courseId, mod.id);
      const existingIds = new Set(existing.map((q: QuizQuestion) => q.id));

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const payload = {
          questionHtml: q.questionHtml!,
          options: q.options!,
          orderIndex: i,
        };
        if (q.id && existingIds.has(q.id)) {
          await updateModuleQuizQuestion(courseId, mod.id, q.id, payload);
        } else {
          await createModuleQuizQuestion(courseId, mod.id, payload);
        }
      }

      // Delete removed questions
      const newIds = new Set(questions.filter((q) => q.id).map((q) => q.id!));
      for (const old of existing) {
        if (!newIds.has(old.id)) {
          await deleteModuleQuizQuestion(courseId, mod.id, old.id);
        }
      }

      toast({ title: "Quiz saved" });
      await loadQuiz();
    } catch (err: any) {
      toast({ title: "Error saving quiz", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/40">
        <GripVertical size={16} className="text-muted-foreground shrink-0" />
        <span className="text-sm font-medium flex-1 truncate">
          Part {index + 1}: {title || "Untitled Module"}
        </span>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={index === 0} onClick={onMoveUp} title="Move up">
            <ChevronDown size={14} className="rotate-180" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={index === total - 1} onClick={onMoveDown} title="Move down">
            <ChevronDown size={14} />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={handleDeleteModule} title="Delete module">
            <Trash2 size={14} />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded((v) => !v)}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="quiz">Quiz ({questions.length}/10)</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              <div className="grid gap-2">
                <Label>Module Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Introduction, Lesson 1..." />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Introduction</Label>
                  <div className="flex rounded-full border bg-muted p-0.5 text-xs">
                    <button type="button" onClick={() => setIntroMode("paste")} className={`rounded-full px-3 py-1 font-medium transition-colors ${introMode === "paste" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Paste text</button>
                    <button type="button" onClick={() => setIntroMode("html")} className={`rounded-full px-3 py-1 font-medium transition-colors ${introMode === "html" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>HTML code</button>
                  </div>
                </div>
                {introMode === "paste" ? (
                  <RichTextField value={introduction} onChange={setIntroduction} />
                ) : (
                  <HtmlSourceField value={introduction} onChange={setIntroduction} />
                )}
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Main Content</Label>
                  <div className="flex rounded-full border bg-muted p-0.5 text-xs">
                    <button type="button" onClick={() => setBodyMode("paste")} className={`rounded-full px-3 py-1 font-medium transition-colors ${bodyMode === "paste" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Paste text</button>
                    <button type="button" onClick={() => setBodyMode("html")} className={`rounded-full px-3 py-1 font-medium transition-colors ${bodyMode === "html" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>HTML code</button>
                  </div>
                </div>
                {bodyMode === "paste" ? (
                  <RichTextField value={contentBody} onChange={setContentBody} />
                ) : (
                  <HtmlSourceField value={contentBody} onChange={setContentBody} />
                )}
              </div>

              <Button onClick={handleSaveModule} disabled={saving} className="gap-2">
                <Save size={14} /> {saving ? "Saving..." : "Save Module Content"}
              </Button>
            </TabsContent>

            <TabsContent value="media" className="space-y-4">
              <Label>Photos & Videos</Label>
              <p className="text-xs text-muted-foreground">Upload images and videos below. They will appear in this module for members to view.</p>
              <MediaUploader
                imageUrls={mediaUrls.imageUrls}
                videoUrls={mediaUrls.videoUrls}
                onImagesChange={(urls) => setMediaUrls((prev) => ({ ...prev, imageUrls: urls }))}
                onVideosChange={(urls) => setMediaUrls((prev) => ({ ...prev, videoUrls: urls }))}
              />
              <Button onClick={handleSaveModule} disabled={saving} className="gap-2">
                <Save size={14} /> {saving ? "Saving..." : "Save Media"}
              </Button>
            </TabsContent>

            <TabsContent value="quiz" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Module Quiz</Label>
                  <p className="text-xs text-muted-foreground">Exactly 10 questions required. Members must score 70% to pass.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addQuestion} disabled={questions.length >= 10} className="gap-1">
                  <Plus size={14} /> Add Question
                </Button>
              </div>

              {quizLoading ? (
                <p className="text-sm text-muted-foreground">Loading questions...</p>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div key={idx} className="relative">
                      <span className="absolute -left-3 -top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {idx + 1}
                      </span>
                      <QuestionEditor
                        question={q}
                        onChange={(updated) => setQuestions((prev) => prev.map((qq, i) => (i === idx ? updated : qq)))}
                        onDelete={() => setQuestions((prev) => prev.filter((_, i) => i !== idx))}
                      />
                    </div>
                  ))}
                  {questions.length === 0 && (
                    <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
                      No questions yet. Click "Add Question" to begin.
                    </div>
                  )}
                </div>
              )}

              {questions.length > 0 && (
                <Button onClick={saveQuestions} className="gap-2">
                  <CheckCircle2 size={14} /> Save Quiz
                </Button>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const emptyForm = {
  name: "",
  description: "",
  contentUrl: "",
  photoUrls: [] as string[],
  videoUrls: [] as string[],
};

export default function AdminCourses() {
  const { data: courses, isLoading } = useListCourses({ query: { queryKey: getListCoursesQueryKey() } });
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

  // Modules state
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState("details");

  const openCreate = () => {
    setEditingId(null);
    setFormData({ ...emptyForm, photoUrls: [], videoUrls: [] });
    setFormKey((k) => k + 1);
    setDescMode("paste");
    setModules([]);
    setActiveModalTab("details");
    setIsModalOpen(true);
  };

  const openEdit = async (course: any) => {
    setEditingId(course.id);
    setFormData({
      name: course.name,
      description: course.description,
      contentUrl: course.contentUrl || "",
      photoUrls: course.photoUrls?.length ? course.photoUrls : course.imageUrl ? [course.imageUrl] : [],
      videoUrls: course.videoUrls?.length ? course.videoUrls : [],
    });
    setFormKey((k) => k + 1);
    setDescMode("paste");
    setActiveModalTab("details");

    // Load modules
    setModulesLoading(true);
    try {
      const mods = await fetchModules(course.id);
      setModules(mods);
    } catch {
      setModules([]);
    } finally {
      setModulesLoading(false);
    }

    setIsModalOpen(true);
  };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey() });

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    deleteMutation.mutate({ id }, {
      onSuccess: () => { void invalidate(); toast({ title: "Course deleted" }); },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit = {
      name: formData.name,
      description: sanitizeHtml(formData.description),
      contentUrl: formData.contentUrl || null,
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

  const addModule = async () => {
    if (!editingId) {
      toast({ title: "Save the course first before adding modules", variant: "destructive" });
      return;
    }
    try {
      const mod = await createModule(editingId, {
        title: `Part ${modules.length + 1}`,
        introduction: "",
        contentBody: "",
        orderIndex: modules.length,
      });
      setModules((prev) => [...prev, { ...mod, media: [] }]);
      toast({ title: "Module added" });
    } catch (err: any) {
      toast({ title: "Error adding module", description: err.message, variant: "destructive" });
    }
  };

  const moveModule = (index: number, direction: "up" | "down") => {
    setModules((prev) => {
      const next = [...prev];
      const swapWith = direction === "up" ? index - 1 : index + 1;
      [next[index], next[swapWith]] = [next[swapWith], next[index]];
      // Update orderIndex on server
      Promise.all([
        updateModule(editingId!, next[index].id, { orderIndex: index }),
        updateModule(editingId!, next[swapWith].id, { orderIndex: swapWith }),
      ]).catch(() => {});
      return next;
    });
  };

  const refreshModules = async () => {
    if (!editingId) return;
    const mods = await fetchModules(editingId);
    setModules(mods);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-3xl font-serif">Courses</h1>
          <p className="text-muted-foreground">Manage educational content, modules, and quizzes.</p>
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
              <TableHead>Modules</TableHead>
              <TableHead>Resource URL</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center">Loading...</TableCell></TableRow>
            ) : !courses?.length ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No courses found</TableCell></TableRow>
            ) : (
              courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>
                    {course.imageUrl ? (
                      <div className="h-10 w-10 overflow-hidden rounded bg-muted">
                        <img src={course.imageUrl} alt={course.name} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-muted-foreground"><ImageIcon size={16} /></div>
                    )}
                  </TableCell>
                  <TableCell><div className="font-medium">{course.name}</div></TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {course.contentBody?.includes("__subpages__") ? "Legacy subpages" : "Standard"}
                    </span>
                  </TableCell>
                  <TableCell><div className="max-w-[200px] truncate text-sm text-muted-foreground">{course.contentUrl || "-"}</div></TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(course)}><Edit2 size={16} /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(course.id)}><Trash2 size={16} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[720px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Course" : "Add Course"}</DialogTitle>
            </DialogHeader>

            <Tabs value={activeModalTab} onValueChange={setActiveModalTab} className="mt-4">
              <TabsList>
                <TabsTrigger value="details">Course Details</TabsTrigger>
                {editingId && <TabsTrigger value="modules">Modules & Quizzes</TabsTrigger>}
              </TabsList>

              <TabsContent value="details" className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="crs-name">Course Title</Label>
                  <Input id="crs-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label>Short Description</Label>
                    <div className="flex rounded-full border bg-muted p-0.5 text-xs">
                      <button type="button" onClick={() => setDescMode("paste")} className={`rounded-full px-3 py-1 font-medium transition-colors ${descMode === "paste" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Paste formatted text</button>
                      <button type="button" onClick={() => setDescMode("html")} className={`rounded-full px-3 py-1 font-medium transition-colors ${descMode === "html" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Paste HTML code</button>
                    </div>
                  </div>
                  {descMode === "paste" ? (
                    <RichTextField key={`desc-rich-${formKey}`} value={formData.description} onChange={(html) => setFormData((prev) => ({ ...prev, description: html }))} />
                  ) : (
                    <>
                      <HtmlSourceField key={`desc-html-${formKey}`} value={formData.description} onChange={(html) => setFormData((prev) => ({ ...prev, description: html }))} />
                      <div className="grid gap-1.5">
                        <span className="text-xs font-medium text-muted-foreground">Live preview</span>
                        <div className="min-h-[60px] rounded-md border bg-card p-4 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeHtml(formData.description) || '<span class="text-muted-foreground">Nothing to preview yet…</span>' }} />
                      </div>
                    </>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="crs-contentUrl">Video / External Resource URL</Label>
                  <Input id="crs-contentUrl" value={formData.contentUrl} onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })} placeholder="https://youtube.com/..." />
                </div>

                <div className="grid gap-2">
                  <Label><Video size={15} className="mr-1 inline" /> Course Cover Image</Label>
                  <MediaUploader
                    key={formKey}
                    imageUrls={formData.photoUrls}
                    videoUrls={formData.videoUrls}
                    onImagesChange={(urls) => setFormData((prev) => ({ ...prev, photoUrls: urls }))}
                    onVideosChange={(urls) => setFormData((prev) => ({ ...prev, videoUrls: urls }))}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Course"}</Button>
                </DialogFooter>
              </TabsContent>

              <TabsContent value="modules" className="py-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Course Modules</h3>
                    <p className="text-xs text-muted-foreground">Add parts. Each part has content, media, and a 10-question quiz.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addModule} className="gap-1">
                    <Plus size={14} /> Add Module
                  </Button>
                </div>

                {modulesLoading ? (
                  <p className="text-sm text-muted-foreground">Loading modules...</p>
                ) : modules.length === 0 ? (
                  <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
                    No modules yet. Click "Add Module" to create the first part of this course.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {modules.map((mod, index) => (
                      <ModuleEditor
                        key={mod.id}
                        courseId={editingId!}
                        module={mod}
                        onRefresh={refreshModules}
                        index={index}
                        total={modules.length}
                        onMoveUp={() => moveModule(index, "up")}
                        onMoveDown={() => moveModule(index, "down")}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
