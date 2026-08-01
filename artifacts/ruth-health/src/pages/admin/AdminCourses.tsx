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
// API helpers — prefixed with /api
// ---------------------------------------------------------------------------

async function apiFetch(url: string, opts?: RequestInit) {
  const baseUrl = import.meta.env.VITE_API_URL ?? "";
  const token = localStorage.getItem("ruth_health_token");
  const res = await fetch(`${baseUrl}/api${url}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

function postModuleMedia(courseId: number, moduleId: number, type: "image" | "video", url: string, orderIndex?: number) {
  return apiFetch(`/courses/${courseId}/modules/${moduleId}/media`, { method: "POST", body: JSON.stringify({ type, url, orderIndex: orderIndex ?? 0 }) });
}

function deleteModuleMedia(courseId: number, moduleId: number, mediaId: number) {
  return apiFetch(`/courses/${courseId}/modules/${moduleId}/media/${mediaId}`, { method: "DELETE" });
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
  const [quizSaving, setQuizSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("content");

  const [title, setTitle] = useState(mod.title);
  const [introduction, setIntroduction] = useState(mod.introduction || "");
  const [contentBody, setContentBody] = useState(mod.contentBody || "");
  const [introMode, setIntroMode] = useState<"paste" | "html">("paste");
  const [bodyMode, setBodyMode] = useState<"paste" | "html">("paste");

  const [mediaUrls, setMediaUrls] = useState<{ imageUrls: string[]; videoUrls: string[] }>({
    imageUrls: mod.media?.filter((m) => m.type === "image").map((m) => m.url) || [],
    videoUrls: mod.media?.filter((m) => m.type === "video").map((m) => m.url) || [],
  });

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
      const oldMedia = mod.media || [];
      const newImageUrls = mediaUrls.imageUrls;
      const newVideoUrls = mediaUrls.videoUrls;

      for (const old of oldMedia) {
        const stillExists = old.type === "image" ? newImageUrls.includes(old.url) : newVideoUrls.includes(old.url);
        if (!stillExists) {
          await deleteModuleMedia(courseId, mod.id, old.id);
        }
      }

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
    for (const q of questions) {
      if (!q.questionHtml?.trim()) {
        toast({ title: "Error", description: "All questions must have text.", variant: "destructive" });
        return;
      }
      if (!q.options || q.options.length < 2) {
        toast({ title: "Error", description: "Each question needs at least 2 options.", variant: "destructive" });
        return;
      }
      if (!q.options.some((o) => o.isCorrect)) {
        toast({ title: "Error", description: "Each question needs one correct answer.", variant: "destructive" });
        return;
      }
      if (q.options.some((o) => !o.text.trim())) {
        toast({ title: "Error", description: "All options must have text.", variant: "destructive" });
        return;
      }
    }

    setQuizSaving(true);
    try {
      const existingIds = questions.filter((q) => q.id).map((q) => q.id!);
      const currentQuestions = await fetchModuleQuizQuestions(courseId, mod.id);
      for (const existing of currentQuestions) {
        if (!existingIds.includes(existing.id)) {
          await deleteModuleQuizQuestion(courseId, mod.id, existing.id);
        }
      }

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const payload = {
          questionHtml: q.questionHtml!,
          options: q.options!,
          orderIndex: i,
        };
        if (q.id) {
          await updateModuleQuizQuestion(courseId, mod.id, q.id, payload);
        } else {
          await createModuleQuizQuestion(courseId, mod.id, payload);
        }
      }

      toast({ title: "Quiz saved" });
      loadQuiz();
    } catch (err: any) {
      toast({ title: "Error saving quiz", description: err.message, variant: "destructive" });
    } finally {
      setQuizSaving(false);
    }
  };

  const addImageUrl = () => setMediaUrls((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, ""] }));
  const addVideoUrl = () => setMediaUrls((prev) => ({ ...prev, videoUrls: [...prev.videoUrls, ""] }));
  const removeImageUrl = (idx: number) => setMediaUrls((prev) => ({ ...prev, imageUrls: prev.imageUrls.filter((_, i) => i !== idx) }));
  const removeVideoUrl = (idx: number) => setMediaUrls((prev) => ({ ...prev, videoUrls: prev.videoUrls.filter((_, i) => i !== idx) }));
  const setImageUrl = (idx: number, url: string) => setMediaUrls((prev) => ({ ...prev, imageUrls: prev.imageUrls.map((u, i) => (i === idx ? url : u)) }));
  const setVideoUrl = (idx: number, url: string) => setMediaUrls((prev) => ({ ...prev, videoUrls: prev.videoUrls.map((u, i) => (i === idx ? url : u)) }));

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center gap-3 p-4">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={index === 0} onClick={onMoveUp}>
            <ChevronUp size={14} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={index === total - 1} onClick={onMoveDown}>
            <ChevronDown size={14} />
          </Button>
        </div>
        <div className="flex-1">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-8 font-medium" />
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Collapse" : "Expand"}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={handleDeleteModule}>
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="quiz">Quiz</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Introduction</Label>
                <div className="flex rounded-full border bg-muted p-0.5 text-xs w-fit mb-2">
                  <button type="button" onClick={() => setIntroMode("paste")} className={`rounded-full px-3 py-1 font-medium transition-colors ${introMode === "paste" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Paste text</button>
                  <button type="button" onClick={() => setIntroMode("html")} className={`rounded-full px-3 py-1 font-medium transition-colors ${introMode === "html" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>HTML code</button>
                </div>
                {introMode === "paste" ? (
                  <RichTextField value={introduction} onChange={setIntroduction} />
                ) : (
                  <HtmlSourceField value={introduction} onChange={setIntroduction} />
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Main Content</Label>
                <div className="flex rounded-full border bg-muted p-0.5 text-xs w-fit mb-2">
                  <button type="button" onClick={() => setBodyMode("paste")} className={`rounded-full px-3 py-1 font-medium transition-colors ${bodyMode === "paste" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Paste text</button>
                  <button type="button" onClick={() => setBodyMode("html")} className={`rounded-full px-3 py-1 font-medium transition-colors ${bodyMode === "html" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>HTML code</button>
                </div>
                {bodyMode === "paste" ? (
                  <RichTextField value={contentBody} onChange={setContentBody} />
                ) : (
                  <HtmlSourceField value={contentBody} onChange={setContentBody} />
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveModule} disabled={saving} size="sm">
                  <Save size={14} className="mr-2" />
                  {saving ? "Saving..." : "Save Module"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="quiz" className="space-y-4 mt-4">
              {quizLoading ? (
                <p className="text-sm text-muted-foreground">Loading quiz questions...</p>
              ) : (
                <>
                  <div className="space-y-3">
                    {questions.map((q, idx) => (
                      <QuestionEditor
                        key={idx}
                        question={q}
                        onChange={(updated) => setQuestions((prev) => prev.map((qq, i) => (i === idx ? updated : qq)))}
                        onDelete={() => setQuestions((prev) => prev.filter((_, i) => i !== idx))}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button onClick={addQuestion} variant="outline" size="sm">
                      <Plus size={14} className="mr-2" /> Add Question
                    </Button>
                    {questions.length > 0 && (
                      <Button onClick={saveQuestions} disabled={quizSaving} size="sm">
                        <CheckCircle2 size={14} className="mr-2" />
                        {quizSaving ? "Saving..." : "Save Quiz"}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="media" className="space-y-4 mt-4">
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <ImageIcon size={14} /> Images
                </Label>
                {mediaUrls.imageUrls.map((url, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input value={url} onChange={(e) => setImageUrl(idx, e.target.value)} placeholder="https://example.com/image.jpg" className="flex-1" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeImageUrl(idx)}>
                      <X size={14} />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addImageUrl}>
                  <Plus size={14} className="mr-2" /> Add Image URL
                </Button>
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Video size={14} /> Videos
                </Label>
                {mediaUrls.videoUrls.map((url, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input value={url} onChange={(e) => setVideoUrl(idx, e.target.value)} placeholder="https://example.com/video.mp4" className="flex-1" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeVideoUrl(idx)}>
                      <X size={14} />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addVideoUrl}>
                  <Plus size={14} className="mr-2" /> Add Video URL
                </Button>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveModule} disabled={saving} size="sm">
                  <Save size={14} className="mr-2" />
                  {saving ? "Saving..." : "Save Media"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Admin Courses Page
// ---------------------------------------------------------------------------

export default function AdminCourses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: courses, isLoading } = useListCourses();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [contentBody, setContentBody] = useState("");

  const [modules, setModules] = useState<CourseModule[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);

  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();

  const resetForm = () => {
    setName("");
    setDescription("");
    setImageUrl("");
    setContentUrl("");
    setContentBody("");
    setModules([]);
    setSelectedCourse(null);
  };

  const openNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = async (course: any) => {
    setSelectedCourse(course);
    setName(course.name || "");
    setDescription(course.description || "");
    setImageUrl(course.imageUrl || "");
    setContentUrl(course.contentUrl || "");
    setContentBody(course.contentBody || "");
    setModules([]);
    setDialogOpen(true);
    if (course.id) {
      await loadModules(course.id);
    }
  };

  const loadModules = async (courseId: number) => {
    setModulesLoading(true);
    try {
      const data = await fetchModules(courseId);
      setModules(data);
    } catch (err: any) {
      toast({ title: "Error loading modules", description: err.message, variant: "destructive" });
    } finally {
      setModulesLoading(false);
    }
  };

  const handleAddModule = async () => {
    if (!selectedCourse) return;
    try {
      await createModule(selectedCourse.id, {
        title: `Part ${modules.length + 1}`,
        orderIndex: modules.length,
      });
      toast({ title: "Module added" });
      await loadModules(selectedCourse.id);
    } catch (err: any) {
      toast({ title: "Error adding module", description: err.message, variant: "destructive" });
    }
  };

  const handleMoveModule = async (idx: number, direction: "up" | "down") => {
    if (!selectedCourse) return;
    const newIndex = direction === "up" ? idx - 1 : idx + 1;
    if (newIndex < 0 || newIndex >= modules.length) return;
    const newModules = [...modules];
    const [moved] = newModules.splice(idx, 1);
    newModules.splice(newIndex, 0, moved);
    setModules(newModules);
    try {
      for (let i = 0; i < newModules.length; i++) {
        if (newModules[i].orderIndex !== i) {
          await updateModule(selectedCourse.id, newModules[i].id, { orderIndex: i });
          newModules[i].orderIndex = i;
        }
      }
      setModules([...newModules]);
    } catch (err: any) {
      toast({ title: "Error reordering", description: err.message, variant: "destructive" });
      await loadModules(selectedCourse.id);
    }
  };

  const handleSaveCourse = async () => {
    if (!name.trim()) {
      toast({ title: "Course Name is required", description: "Please enter a name before saving.", variant: "destructive" });
      return;
    }
    if (!description.trim()) {
      toast({ title: "Description is required", description: "Please enter a description before saving.", variant: "destructive" });
      return;
    }
    try {
      const payload = { name, description, imageUrl, contentUrl, contentBody };
      if (selectedCourse) {
        await updateCourse.mutateAsync({ id: selectedCourse.id, data: payload });
        toast({ title: "Course updated" });
      } else {
        await createCourse.mutateAsync({ data: payload });
        toast({ title: "Course created" });
      }
      queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey() });
      setDialogOpen(false);
      resetForm();
    } catch (err: any) {
      toast({ title: "Error saving course", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteCourse = async (id: number) => {
    if (!confirm("Delete this course? This cannot be undone.")) return;
    try {
      await deleteCourse.mutateAsync({ id });
      toast({ title: "Course deleted" });
      queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey() });
    } catch (err: any) {
      toast({ title: "Error deleting course", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
        <Button onClick={openNew}>
          <Plus size={16} className="mr-2" /> Add Course
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading courses...</p>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses && courses.length > 0 ? (
                courses.map((course: any) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.name}</TableCell>
                    <TableCell className="max-w-md truncate">{course.description}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(course)}>
                          <Edit2 size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteCourse(course.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    No courses yet. Click "Add Course" to create one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCourse ? "Edit Course" : "New Course"}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Course Details</TabsTrigger>
              <TabsTrigger value="modules">Modules & Quizzes</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Course Name <span className="text-destructive">*</span></Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Introduction to Healthcode" />
              </div>
              <div className="space-y-2">
                <Label>Description <span className="text-destructive">*</span></Label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Short description shown on the course card..."
                />
              </div>
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Content URL (legacy)</Label>
                <Input value={contentUrl} onChange={(e) => setContentUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Content Body (legacy)</Label>
                <HtmlSourceField value={contentBody} onChange={setContentBody} />
              </div>
            </TabsContent>

            <TabsContent value="modules" className="space-y-4 mt-4">
              {selectedCourse ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Modules</h3>
                    <Button onClick={handleAddModule} size="sm">
                      <Plus size={16} className="mr-2" /> Add Module
                    </Button>
                  </div>

                  {modulesLoading ? (
                    <p className="text-sm text-muted-foreground">Loading modules...</p>
                  ) : modules.length === 0 ? (
                    <div className="rounded-lg border bg-muted p-6 text-center">
                      <p className="text-sm text-muted-foreground">No modules yet.</p>
                      <p className="text-xs text-muted-foreground mt-1">Click "Add Module" to create the first part of this course.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {modules.map((mod, idx) => (
                        <ModuleEditor
                          key={mod.id}
                          courseId={selectedCourse.id}
                          module={mod}
                          onRefresh={() => loadModules(selectedCourse.id)}
                          index={idx}
                          total={modules.length}
                          onMoveUp={() => handleMoveModule(idx, "up")}
                          onMoveDown={() => handleMoveModule(idx, "down")}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-lg border bg-muted p-6 text-center">
                  <p className="text-sm text-muted-foreground">Save the course first before adding modules.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleSaveCourse} disabled={createCourse.isPending || updateCourse.isPending}>
              {createCourse.isPending || updateCourse.isPending ? "Saving..." : selectedCourse ? "Update Course" : "Create Course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
