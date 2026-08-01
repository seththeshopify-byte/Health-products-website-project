import { useState, useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { AppImage } from "@/components/ui/app-image";
import {
  ArrowLeft,
  PlayCircle,
  CheckCircle2,
  ChevronRight,
  Trophy,
  RotateCcw,
  BookOpen,
  LogIn,
} from "lucide-react";
import {
  useGetCourse,
  getGetCourseQueryKey,
  useEnrollCourse,
  useListCourses,
  getListCoursesQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";

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
}

interface QuizQuestion {
  id: number;
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

interface QuizResult {
  score: number;
  total: number;
  passed: boolean;
}

// ---------------------------------------------------------------------------
// API helpers (direct fetch for new module endpoints)
// ---------------------------------------------------------------------------

async function authFetch(url: string, opts?: RequestInit) {
  const baseUrl = import.meta.env.VITE_API_URL ?? "";
  const token = localStorage.getItem("ruth_health_token");
  const res = await fetch(`${baseUrl}${url}`, {
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

// ---------------------------------------------------------------------------
// Module Quiz Component
// ---------------------------------------------------------------------------

function ModuleQuiz({
  courseId,
  moduleId,
  isLoggedIn,
  onPass,
}: {
  courseId: number;
  moduleId: number;
  isLoggedIn: boolean;
  onPass: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: questions, isLoading } = useQuery<QuizQuestion[]>({
    queryKey: ["moduleQuiz", courseId, moduleId],
    queryFn: () => authFetch(`/api/courses/${courseId}/modules/${moduleId}/quiz`),
    enabled: !!moduleId && isLoggedIn,
  });

  const { data: existingResult } = useQuery<QuizResult>({
    queryKey: ["moduleQuizResult", courseId, moduleId],
    queryFn: () => authFetch(`/api/courses/${courseId}/modules/${moduleId}/quiz/result`),
    enabled: !!moduleId && isLoggedIn,
  });

  const submitMutation = useMutation({
    mutationFn: (answers: Array<{ questionId: number; selectedOptionIndex: number }>) =>
      authFetch(`/api/courses/${courseId}/modules/${moduleId}/quiz/submit`, {
        method: "POST",
        body: JSON.stringify({ answers }),
      }),
    onSuccess: (data: QuizResult) => {
      void queryClient.invalidateQueries({ queryKey: ["moduleQuizResult", courseId, moduleId] });
      if (data.passed) onPass();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit quiz. Please try again.", variant: "destructive" });
    },
  });

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<QuizResult | null>(existingResult?.passed ? existingResult : null);
  const [submitted, setSubmitted] = useState(existingResult?.passed ?? false);

  useEffect(() => {
    if (existingResult) {
      setResult(existingResult);
      setSubmitted(existingResult.passed);
    }
  }, [existingResult]);

  const handleSelect = (questionId: number, optionIndex: number) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = () => {
    if (!questions?.length) return;
    const unanswered = questions.filter((q) => selectedAnswers[q.id] === undefined);
    if (unanswered.length > 0) {
      toast({ title: "Please answer all questions", description: `${unanswered.length} question(s) still unanswered.`, variant: "destructive" });
      return;
    }
    const answers = questions.map((q) => ({
      questionId: q.id,
      selectedOptionIndex: selectedAnswers[q.id],
    }));
    submitMutation.mutate(answers, {
      onSuccess: (data) => {
        setResult(data);
        setSubmitted(true);
      },
    });
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setResult(null);
    setSubmitted(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="py-10 text-center space-y-4">
        <p className="text-muted-foreground">Sign in to take this quiz and save your progress.</p>
        <Link href="/login">
          <Button className="gap-2"><LogIn size={16} /> Sign In</Button>
        </Link>
      </div>
    );
  }

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Loading quiz...</div>;
  if (!questions?.length) return <div className="py-8 text-center text-muted-foreground italic">No quiz available for this module yet.</div>;

  if (submitted && result) {
    const percentage = Math.round((result.score / result.total) * 100);
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className={`rounded-2xl border p-8 text-center ${result.passed ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800" : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"}`}>
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${result.passed ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"}`}>
            {result.passed ? <Trophy size={32} className="text-green-600 dark:text-green-400" /> : <RotateCcw size={32} className="text-red-500 dark:text-red-400" />}
          </div>
          <h3 className="text-2xl font-serif mb-2">{result.passed ? "Congratulations! You passed!" : "Not quite — try again"}</h3>
          <p className="text-4xl font-bold mb-1">{result.score}/{result.total}</p>
          <p className="text-muted-foreground mb-6">{percentage}% — pass mark is 70%</p>
          {!result.passed && (
            <Button onClick={handleRetry} variant="outline" className="gap-2"><RotateCcw size={16} /> Try Again</Button>
          )}
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(selectedAnswers).length;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{answeredCount}/{questions.length} answered</p>
        <div className="h-2 flex-1 mx-4 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
        </div>
      </div>
      {questions.map((q, qIdx) => (
        <div key={q.id} className="rounded-xl border bg-card p-6 space-y-4">
          <div className="flex gap-3">
            <span className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">{qIdx + 1}</span>
            <div className="text-base font-medium leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: q.questionHtml }} />
          </div>
          <div className="space-y-2 ml-10">
            {q.options.map((opt, oIdx) => {
              const isSelected = selectedAnswers[q.id] === oIdx;
              return (
                <button key={oIdx} type="button" onClick={() => handleSelect(q.id, oIdx)}
                  className={`w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-sm text-left transition-all duration-150 ${isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40 hover:bg-muted/50"}`}>
                  <span className={`flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full border text-xs font-medium transition-colors ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"}`}>
                    {String.fromCharCode(65 + oIdx)}
                  </span>
                  {opt.text}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <Button onClick={handleSubmit} disabled={submitMutation.isPending || answeredCount < questions.length} className="w-full h-12 text-base">
        {submitMutation.isPending ? "Submitting..." : answeredCount < questions.length ? `Answer all questions (${answeredCount}/${questions.length})` : "Submit Quiz"}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Media Gallery
// ---------------------------------------------------------------------------

function MediaGallery({ media }: { media: ModuleMedia[] }) {
  const images = media.filter((m) => m.type === "image");
  const videos = media.filter((m) => m.type === "video");

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div className={`grid gap-3 ${images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3"}`}>
          {images.map((img) => (
            <div key={img.id} className="rounded-xl overflow-hidden border bg-muted aspect-video">
              <img src={img.url} alt="" className="w-full h-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      )}
      {videos.map((vid) => (
        <div key={vid.id} className="rounded-xl overflow-hidden border bg-black aspect-video">
          {vid.url.includes("youtube") || vid.url.includes("vimeo") ? (
            <iframe src={vid.url} className="w-full h-full" allowFullScreen />
          ) : (
            <video src={vid.url} controls className="w-full h-full" />
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function CourseDetail() {
  const [, params] = useRoute("/courses/:id");
  const id = parseInt(params?.id || "0", 10);
  const { isLoggedIn } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: course, isLoading } = useGetCourse(id, {
    query: { enabled: !!id, queryKey: getGetCourseQueryKey(id) },
  });
  const { data: allCourses } = useListCourses({
    query: { queryKey: getListCoursesQueryKey() },
  });

  const enrollMutation = useEnrollCourse();

  // Module state
  const [activeModuleId, setActiveModuleId] = useState<number | null>(null);
  const [passedModules, setPassedModules] = useState<Set<number>>(new Set());

  const { data: modules, isLoading: modulesLoading } = useQuery<CourseModule[]>({
    queryKey: ["courseModules", id],
    queryFn: () => authFetch(`/api/courses/${id}/modules`),
    enabled: !!id,
  });

  // Load quiz results for all modules to show checkmarks
  const { data: moduleResults } = useQuery<Record<number, QuizResult>>({
    queryKey: ["moduleResults", id],
    queryFn: async () => {
      if (!modules?.length) return {};
      const results: Record<number, QuizResult> = {};
      await Promise.all(
        modules.map(async (mod) => {
          try {
            const res = await authFetch(`/api/courses/${id}/modules/${mod.id}/quiz/result`);
            results[mod.id] = res;
          } catch {
            results[mod.id] = { score: 0, total: 0, passed: false };
          }
        })
      );
      return results;
    },
    enabled: !!modules?.length && isLoggedIn,
  });

  useEffect(() => {
    if (moduleResults) {
      const passed = new Set<number>();
      Object.entries(moduleResults).forEach(([modId, res]) => {
        if (res.passed) passed.add(Number(modId));
      });
      setPassedModules(passed);
    }
  }, [moduleResults]);

  useEffect(() => {
    if (modules?.length && activeModuleId === null) {
      setActiveModuleId(modules[0].id);
    }
  }, [modules, activeModuleId]);

  // Track enrollment quietly in the background for logged-in visitors —
  // no longer used to gate access to the content itself.
  useEffect(() => {
    if (isLoggedIn && course && !course.isEnrolled) {
      enrollMutation.mutate({ id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, course?.id, course?.isEnrolled]);

  const activeModule = modules?.find((m) => m.id === activeModuleId);

  const nextCourse = allCourses?.filter((c) => c.id > id).sort((a, b) => a.id - b.id)[0] ?? null;

  const hasModules = !!modules && modules.length > 0;
  const allModulesPassed = hasModules && modules.every((m) => passedModules.has(m.id));

  const handleContinue = () => {
    if (hasModules) {
      const next = modules.find((m) => !passedModules.has(m.id));
      setActiveModuleId(next ? next.id : modules[0].id);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (!isLoggedIn) {
      toast({ title: "Sign in to save your progress", description: "You can read every lesson for free — sign in to track completions and quizzes." });
    }
  };

  if (isLoading) return <div className="min-h-[50vh] flex items-center justify-center">Loading...</div>;
  if (!course) return <div className="min-h-[50vh] flex items-center justify-center">Course not found</div>;

  return (
    <div className="container mx-auto px-4 py-12 md:py-24">
      <Link href="/courses" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 gap-2 transition-colors">
        <ArrowLeft size={16} /> Back to Courses
      </Link>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">Educational Resource</div>
          <h1 className="text-4xl md:text-5xl font-serif mb-6 text-foreground">{course.name}</h1>
          <div className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto prose prose-neutral" dangerouslySetInnerHTML={{ __html: course.description }} />
        </div>

        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Progress + action bar */}
          <div className="bg-card border rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 shadow-sm">
            <div className="w-full sm:flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {hasModules ? `${passedModules.size}/${modules.length} parts completed` : "Course progress"}
                </span>
                {hasModules && (
                  <span className="text-sm text-muted-foreground">
                    {Math.round((passedModules.size / modules.length) * 100)}%
                  </span>
                )}
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: hasModules ? `${(passedModules.size / modules.length) * 100}%` : allModulesPassed ? "100%" : "0%" }}
                />
              </div>
            </div>
            <Button onClick={handleContinue} className="w-full sm:w-auto shrink-0 gap-2 h-12 px-6">
              {allModulesPassed ? (
                <><Trophy size={16} /> Review Course</>
              ) : passedModules.size > 0 ? (
                <><PlayCircle size={16} /> Continue</>
              ) : (
                <><PlayCircle size={16} /> Start Course</>
              )}
            </Button>
          </div>

          {/* Course-level video */}
          {course.contentUrl && (
            <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-lg border border-border">
              {course.contentUrl.includes("youtube") || course.contentUrl.includes("vimeo") ? (
                <iframe src={course.contentUrl} className="w-full h-full" allowFullScreen />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-muted relative">
                  <AppImage src={course.imageUrl || undefined} fallbackType="course" className="absolute inset-0 opacity-20" />
                  <PlayCircle size={64} className="text-primary mb-4 z-10" />
                  <a href={course.contentUrl} target="_blank" rel="noreferrer" className="z-10 text-primary hover:underline font-medium">Open Resource Link</a>
                </div>
              )}
            </div>
          )}

          {/* MODULES VIEW */}
          {hasModules ? (
            <div className="grid lg:grid-cols-[260px_1fr] gap-8 items-start">
              {/* Sidebar */}
              <div className="lg:sticky lg:top-24 space-y-2">
                <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground">
                  <BookOpen size={16} /> Course Contents
                </div>
                <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
                  {modules.map((mod, idx) => {
                    const isActive = mod.id === activeModuleId;
                    const isPassed = passedModules.has(mod.id);
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => { setActiveModuleId(mod.id); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition-colors whitespace-nowrap ${isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-muted-foreground"}`}
                      >
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-medium ${isPassed ? "bg-green-500 text-white" : "bg-muted"}`}>
                          {isPassed ? <CheckCircle2 size={12} /> : idx + 1}
                        </span>
                        <span className="truncate">{mod.title}</span>
                      </button>
                    );
                  })}
                </div>
                {allModulesPassed && (
                  <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-800 text-center">
                    <Trophy size={16} className="text-green-600 mx-auto mb-1" />
                    <p className="text-xs text-green-700 font-medium">All parts completed!</p>
                  </div>
                )}
              </div>

              {/* Active module content */}
              <div className="space-y-8 min-w-0">
                {activeModule && (
                  <>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-serif mb-4">{activeModule.title}</h2>
                    </div>

                    {/* Introduction */}
                    {activeModule.introduction && (
                      <div className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
                        <div className="prose prose-neutral max-w-none" dangerouslySetInnerHTML={{ __html: activeModule.introduction }} />
                      </div>
                    )}

                    {/* Media */}
                    {activeModule.media && activeModule.media.length > 0 && <MediaGallery media={activeModule.media} />}

                    {/* Content Body */}
                    {activeModule.contentBody && (
                      <div className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
                        <div className="prose prose-lg prose-neutral max-w-none" dangerouslySetInnerHTML={{ __html: activeModule.contentBody }} />
                      </div>
                    )}

                    {/* Module Quiz */}
                    <div className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <BookOpen size={24} className="text-primary" />
                        <h2 className="text-2xl font-serif">Knowledge Check</h2>
                        {passedModules.has(activeModule.id) && (
                          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-medium px-3 py-1">
                            <Trophy size={12} /> Passed
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-6">Answer all questions and score at least 70% to pass this part.</p>
                      <ModuleQuiz
                        courseId={id}
                        moduleId={activeModule.id}
                        isLoggedIn={isLoggedIn}
                        onPass={() => {
                          setPassedModules((prev) => new Set(prev).add(activeModule.id));
                          void queryClient.invalidateQueries({ queryKey: ["moduleResults", id] });
                          toast({ title: "Quiz passed!", description: "You can proceed to the next part." });
                        }}
                      />
                    </div>

                    {/* Prev / Next navigation */}
                    <div className="flex justify-between pt-4">
                      {modules.findIndex((m) => m.id === activeModule.id) > 0 && (
                        <Button variant="outline" onClick={() => {
                          const idx = modules.findIndex((m) => m.id === activeModule.id);
                          setActiveModuleId(modules[idx - 1].id);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}>← Previous Part</Button>
                      )}
                      {modules.findIndex((m) => m.id === activeModule.id) < modules.length - 1 && (
                        <Button className="ml-auto" onClick={() => {
                          const idx = modules.findIndex((m) => m.id === activeModule.id);
                          setActiveModuleId(modules[idx + 1].id);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}>Next Part →</Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* LEGACY SINGLE-PAGE VIEW */
            <>
              {course.contentBody ? (
                <div className="bg-card border rounded-2xl p-8 md:p-12 shadow-sm">
                  <div className="prose prose-lg prose-neutral max-w-none" dangerouslySetInnerHTML={{ __html: course.contentBody }} />
                </div>
              ) : (
                <div className="bg-card border rounded-2xl p-8 md:p-12 shadow-sm">
                  <p className="text-muted-foreground italic">No additional reading material provided for this course.</p>
                </div>
              )}
            </>
          )}

          {/* Next Course (only when all modules passed or legacy course) */}
          {(allModulesPassed || !hasModules) && nextCourse && (
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <p className="text-sm text-primary font-medium mb-1">Up next</p>
                <h3 className="text-xl font-serif">{nextCourse.name}</h3>
              </div>
              <Link href={`/courses/${nextCourse.id}`}>
                <Button className="gap-2 h-12 px-6 shrink-0">Next Course <ChevronRight size={18} /></Button>
              </Link>
            </div>
          )}

          {(allModulesPassed || !hasModules) && !nextCourse && hasModules && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-2xl p-8 text-center animate-in fade-in duration-500">
              <Trophy size={40} className="text-green-600 mx-auto mb-3" />
              <h3 className="text-xl font-serif mb-1">You've completed all courses!</h3>
              <p className="text-muted-foreground">Congratulations on finishing the full curriculum.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
