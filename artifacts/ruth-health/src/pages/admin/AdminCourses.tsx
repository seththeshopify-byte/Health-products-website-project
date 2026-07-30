import { useEffect, useRef, useState } from "react";
import {
  useListCourses,
  getListCoursesQueryKey,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
  useListCourseQuizQuestions,
  getListCourseQuizQuestionsQueryKey,
  useCreateCourseQuizQuestion,
  useUpdateCourseQuizQuestion,
  useDeleteCourseQuizQuestion,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Image as ImageIcon, Video, BookOpen, ChevronLeft } from "lucide-react";
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
      onPaste={() => {
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
// Course form state
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
// Quiz question form state
// ---------------------------------------------------------------------------

const emptyQuestionForm = {
  questionHtml: "",
  options: [
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ],
};

// ---------------------------------------------------------------------------
// Quiz Manager sub-component
// ---------------------------------------------------------------------------

function QuizManager({ courseId, courseName }: { courseId: number; courseName: string }) {
  const { data: questions, isLoading } = useListCourseQuizQuestions(courseId, {
    query: { queryKey: getListCourseQuizQuestionsQueryKey(courseId) },
  });
  const createMutation = useCreateCourseQuizQuestion();
  const updateMutation = useUpdateCourseQuizQuestion();
  const deleteMutation = useDeleteCourseQuizQuestion();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [questionForm, setQuestionForm] = useState(emptyQuestionForm);
  const [questionMode, setQuestionMode] = useState<"paste" | "html">("paste");
  const [formKey, setFormKey] = useState(0);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListCourseQuizQuestionsQueryKey(courseId) });

  const openCreate = () => {
    setEditingQuestionId(null);
    setQuestionForm(emptyQuestionForm);
    setFormKey((k) => k + 1);
    setQuestionMode("paste");
    setIsModalOpen(true);
  };

  const openEdit = (q: any) => {
    setEditingQuestionId(q.id);
    setQuestionForm({
      questionHtml: q.questionHtml,
      options: q.options.length >= 4
        ? q.options
        : [
            ...q.options,
            ...Array(4 - q.options.length).fill({ text: "", isCorrect: false }),
          ],
    });
    setFormKey((k) => k + 1);
    setQuestionMode("paste");
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this question?")) return;
    deleteMutation.mutate(
      { id: courseId, questionId: id },
      {
        onSuccess: () => {
          void invalidate();
          toast({ title: "Question deleted" });
        },
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctCount = questionForm.options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      toast({ title: "Validation error", description: "Exactly one option must be marked as correct.", variant: "destructive" });
      return;
    }
    const filledOptions = questionForm.options.filter((o) => o.text.trim());
    if (filledOptions.length < 2) {
      toast({ title: "Validation error", description: "At least 2 answer options are required.", variant: "destructive" });
      return;
    }
    const payload = {
      questionHtml: sanitizeHtml(questionForm.questionHtml),
      options: filledOptions,
      orderIndex: editingQuestionId ? undefined : (questions?.length ?? 0),
    };
    const onSuccess = () => {
      void invalidate();
      setIsModalOpen(false);
      toast({ title: editingQuestionId ? "Question updated" : "Question added" });
    };
    if (editingQuestionId) {
      updateMutation.mutate({ id: courseId, questionId: editingQuestionId, data: payload }, { onSuccess });
    } else {
      createMutation.mutate({ id: courseId, data: payload }, { onSuccess });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const setOptionText = (index: number, text: string) => {
    setQuestionForm((prev) => {
      const options = [...prev.options];
      options[index] = { ...options[index], text };
      return { ...prev, options };
    });
  };

  const setCorrectOption = (index: number) => {
    setQuestionForm((prev) => ({
      ...prev,
      options: prev.options.map((o, i) => ({ ...o, isCorrect: i === index })),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif">Quiz — {courseName}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {questions?.length ?? 0} question(s) · Pass mark: 70% (7 out of 10)
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2" disabled={(questions?.length ?? 0) >= 10}>
          <Plus size={16} /> Add Question
        </Button>
      </div>

      {(questions?.length ?? 0) >= 10 && (
        <p className="text-sm text-muted-foreground italic">Maximum of 10 questions reached.</p>
      )}

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Question</TableHead>
              <TableHead>Options</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center">Loading...</TableCell>
              </TableRow>
            ) : !questions?.length ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  No questions yet. Add your first question to enable the quiz.
                </TableCell>
              </TableRow>
            ) : (
              questions.map((q, idx) => (
                <TableRow key={q.id}>
                  <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell>
                    <div
                      className="line-clamp-2 text-sm [&_*]:inline"
                      dangerouslySetInnerHTML={{ __html: q.questionHtml }}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {(q.options as any[]).length} options ·{" "}
                    <span className="text-green-600 font-medium">
                      ✓ {(q.options as any[]).find((o: any) => o.isCorrect)?.text?.slice(0, 20) ?? "?"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(q)}>
                        <Edit2 size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(q.id)}>
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingQuestionId ? "Edit Question" : "Add Question"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-5 py-4">
              {/* Question text */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Question Text</Label>
                  <div className="flex rounded-full border bg-muted p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setQuestionMode("paste")}
                      className={`rounded-full px-3 py-1 font-medium transition-colors ${questionMode === "paste" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
                    >
                      Paste formatted
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuestionMode("html")}
                      className={`rounded-full px-3 py-1 font-medium transition-colors ${questionMode === "html" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
                    >
                      Paste HTML
                    </button>
                  </div>
                </div>
                {questionMode === "paste" ? (
                  <RichTextField
                    key={`q-rich-${formKey}`}
                    value={questionForm.questionHtml}
                    onChange={(html) => setQuestionForm((prev) => ({ ...prev, questionHtml: html }))}
                  />
                ) : (
                  <>
                    <HtmlSourceField
                      key={`q-html-${formKey}`}
                      value={questionForm.questionHtml}
                      onChange={(html) => setQuestionForm((prev) => ({ ...prev, questionHtml: html }))}
                    />
                    <div className="grid gap-1.5">
                      <span className="text-xs font-medium text-muted-foreground">Preview</span>
                      <div
                        className="min-h-[60px] rounded-md border bg-card p-3 text-sm"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(questionForm.questionHtml) || '<span class="text-muted-foreground">Nothing yet…</span>' }}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Answer options */}
              <div className="grid gap-3">
                <Label>Answer Options <span className="text-muted-foreground font-normal">(tick the correct one)</span></Label>
                {questionForm.options.map((option, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={option.isCorrect}
                      onChange={() => setCorrectOption(idx)}
                      className="h-4 w-4 accent-primary flex-shrink-0"
                      title="Mark as correct answer"
                    />
                    <Input
                      value={option.text}
                      onChange={(e) => setOptionText(idx, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      className="flex-1"
                    />
                    {option.isCorrect && (
                      <span className="text-xs text-green-600 font-medium flex-shrink-0">Correct</span>
                    )}
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">Click the radio button on the left to mark an option as the correct answer.</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Question"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
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
  const [quizCourse, setQuizCourse] = useState<{ id: number; name: string } | null>(null);

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
      photoUrls: course.photoUrls?.length ? course.photoUrls : course.imageUrl ? [course.imageUrl] : [],
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

  // Show quiz manager when a course is selected
  if (quizCourse) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setQuizCourse(null)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft size={16} /> Back to Courses
        </button>
        <QuizManager courseId={quizCourse.id} courseName={quizCourse.name} />
      </div>
    );
  }

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
              <TableHead>Quiz</TableHead>
              <TableHead className="w-32" />
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
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {course.contentUrl || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setQuizCourse({ id: course.id, name: course.name })}
                    >
                      <BookOpen size={14} /> Manage Quiz
                    </Button>
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

              {/* Short description */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Short Description</Label>
                  <div className="flex rounded-full border bg-muted p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setDescMode("paste")}
                      className={`rounded-full px-3 py-1 font-medium transition-colors ${descMode === "paste" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
                    >
                      Paste formatted text
                    </button>
                    <button
                      type="button"
                      onClick={() => setDescMode("html")}
                      className={`rounded-full px-3 py-1 font-medium transition-colors ${descMode === "html" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
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
                          __html: sanitizeHtml(formData.description) || '<span class="text-muted-foreground">Nothing to preview yet…</span>',
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

              {/* Detailed content */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Detailed Content</Label>
                  <div className="flex rounded-full border bg-muted p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setBodyMode("paste")}
                      className={`rounded-full px-3 py-1 font-medium transition-colors ${bodyMode === "paste" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
                    >
                      Paste formatted text
                    </button>
                    <button
                      type="button"
                      onClick={() => setBodyMode("html")}
                      className={`rounded-full px-3 py-1 font-medium transition-colors ${bodyMode === "html" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
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
                          __html: sanitizeHtml(formData.contentBody) || '<span class="text-muted-foreground">Nothing to preview yet…</span>',
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
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
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
