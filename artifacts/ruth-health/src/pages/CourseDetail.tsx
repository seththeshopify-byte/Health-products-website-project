import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { AppImage } from "@/components/ui/app-image";
import {
  ArrowLeft,
  PlayCircle,
  ShieldCheck,
  Lock,
  CheckCircle2,
  ChevronRight,
  Trophy,
  RotateCcw,
  BookOpen,
} from "lucide-react";
import {
  useGetCourse,
  getGetCourseQueryKey,
  useEnrollCourse,
  useListCourses,
  getListCoursesQueryKey,
  useGetCourseQuiz,
  getGetCourseQuizQueryKey,
  useSubmitCourseQuiz,
  useGetCourseQuizResult,
  getGetCourseQuizResultQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

// ---------------------------------------------------------------------------
// Detect full HTML documents (so we render them in an iframe, not a div)
// ---------------------------------------------------------------------------

function isFullHtmlDocument(html: string): boolean {
  const trimmed = html.trimStart().toLowerCase();
  return trimmed.startsWith("<!doctype") || trimmed.startsWith("<html");
}

/** Strip internal side padding from a full HTML doc so it fills the iframe edge-to-edge. */
function injectIframeStyles(html: string): string {
  const css = `<style>
    body { padding-left: 0 !important; padding-right: 0 !important; margin-left: 0 !important; margin-right: 0 !important; }
    .container, [class*="container"] { max-width: 100% !important; padding-left: 12px !important; padding-right: 12px !important; }
    section, .section { padding-left: 12px !important; padding-right: 12px !important; }
  </style>`;
  return html.includes("</head>")
    ? html.replace("</head>", `${css}</head>`)
    : css + html;
}

// ---------------------------------------------------------------------------
// Quiz component
// ---------------------------------------------------------------------------

type QuizOption = { text: string };
type QuizQuestion = { id: number; questionHtml: string; options: QuizOption[]; orderIndex: number };

function CourseQuiz({
  courseId,
  onPass,
}: {
  courseId: number;
  onPass: () => void;
}) {
  const { data: questions, isLoading } = useGetCourseQuiz(courseId, {
    query: { queryKey: getGetCourseQuizQueryKey(courseId) },
  });
  const { data: existingResult } = useGetCourseQuizResult(courseId, {
    query: { queryKey: getGetCourseQuizResultQueryKey(courseId) },
  });
  const submitMutation = useSubmitCourseQuiz();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<{ score: number; total: number; passed: boolean } | null>(
    existingResult?.passed ? existingResult : null
  );
  const [submitted, setSubmitted] = useState(existingResult?.passed ?? false);

  const handleSelect = (questionId: number, optionIndex: number) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = () => {
    if (!questions?.length) return;
    const unanswered = questions.filter((q) => selectedAnswers[q.id] === undefined);
    if (unanswered.length > 0) {
      toast({
        title: "Please answer all questions",
        description: `${unanswered.length} question(s) still unanswered.`,
        variant: "destructive",
      });
      return;
    }
    const answers = questions.map((q) => ({
      questionId: q.id,
      selectedOptionIndex: selectedAnswers[q.id],
    }));
    submitMutation.mutate(
      { id: courseId, data: { answers } },
      {
        onSuccess: (data) => {
          setResult(data);
          setSubmitted(true);
          void queryClient.invalidateQueries({ queryKey: getGetCourseQuizResultQueryKey(courseId) });
          if (data.passed) onPass();
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to submit quiz. Please try again.", variant: "destructive" });
        },
      }
    );
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setResult(null);
    setSubmitted(false);
  };

  if (isLoading) {
    return <div className="py-12 text-center text-muted-foreground">Loading quiz...</div>;
  }

  if (!questions?.length) {
    return (
      <div className="py-8 text-center text-muted-foreground italic">
        No quiz available for this course yet.
      </div>
    );
  }

  if (submitted && result) {
    const percentage = Math.round((result.score / result.total) * 100);
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className={`rounded-2xl border p-8 text-center ${result.passed ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800" : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"}`}>
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${result.passed ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"}`}>
            {result.passed ? (
              <Trophy size={32} className="text-green-600 dark:text-green-400" />
            ) : (
              <RotateCcw size={32} className="text-red-500 dark:text-red-400" />
            )}
          </div>
          <h3 className="text-2xl font-serif mb-2">
            {result.passed ? "Congratulations! You passed!" : "Not quite — try again"}
          </h3>
          <p className="text-4xl font-bold mb-1">{result.score}/{result.total}</p>
          <p className="text-muted-foreground mb-6">{percentage}% — pass mark is 70%</p>
          {!result.passed && (
            <Button onClick={handleRetry} variant="outline" className="gap-2">
              <RotateCcw size={16} /> Try Again
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {questions.map((q, qIdx) => {
            const selected = selectedAnswers[q.id];
            return (
              <div key={q.id} className="rounded-xl border bg-card p-6">
                <div className="flex gap-3 mb-4">
                  <span className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-muted text-sm font-medium">
                    {qIdx + 1}
                  </span>
                  <div
                    className="text-base font-medium leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: q.questionHtml }}
                  />
                </div>
                <div className="space-y-2 ml-10">
                  {q.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
                        selected === oIdx
                          ? "border-primary/50 bg-primary/5"
                          : "border-transparent bg-muted/30"
                      }`}
                    >
                      <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full border text-xs font-medium">
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span>{opt.text}</span>
                      {selected === oIdx && (
                        <span className="ml-auto text-xs text-muted-foreground">Your answer</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {answeredCount}/{questions.length} answered
        </p>
        <div className="h-2 flex-1 mx-4 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {questions.map((q, qIdx) => (
        <div key={q.id} className="rounded-xl border bg-card p-6 space-y-4">
          <div className="flex gap-3">
            <span className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
              {qIdx + 1}
            </span>
            <div
              className="text-base font-medium leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: q.questionHtml }}
            />
          </div>
          <div className="space-y-2 ml-10">
            {q.options.map((opt, oIdx) => {
              const isSelected = selectedAnswers[q.id] === oIdx;
              return (
                <button
                  key={oIdx}
                  type="button"
                  onClick={() => handleSelect(q.id, oIdx)}
                  className={`w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-sm text-left transition-all duration-150 ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/40 hover:bg-muted/50"
                  }`}
                >
                  <span
                    className={`flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full border text-xs font-medium transition-colors ${
                      isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                    }`}
                  >
                    {String.fromCharCode(65 + oIdx)}
                  </span>
                  {opt.text}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <Button
        onClick={handleSubmit}
        disabled={submitMutation.isPending || answeredCount < questions.length}
        className="w-full h-12 text-base"
      >
        {submitMutation.isPending
          ? "Submitting..."
          : answeredCount < questions.length
          ? `Answer all questions to submit (${answeredCount}/${questions.length})`
          : "Submit Quiz"}
      </Button>
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
  const { data: quizResult } = useGetCourseQuizResult(id, {
    query: { enabled: !!id && isLoggedIn, queryKey: getGetCourseQuizResultQueryKey(id) },
  });

  const enrollMutation = useEnrollCourse();

  const [quizPassed, setQuizPassed] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  const hasPassed = quizPassed || (quizResult?.passed ?? false);

  const nextCourse = allCourses
    ?.filter((c) => c.id > id)
    .sort((a, b) => a.id - b.id)[0] ?? null;

  const handleEnroll = () => {
    if (!isLoggedIn) {
      toast({ title: "Sign in required", description: "Please sign in to access this course." });
      setLocation("/login");
      return;
    }
    enrollMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Successfully enrolled", description: "You now have access to this course material." });
          queryClient.invalidateQueries({ queryKey: getGetCourseQueryKey(id) });
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err.error || "Failed to enroll in course", variant: "destructive" });
        },
      }
    );
  };

  if (isLoading) return <div className="min-h-[50vh] flex items-center justify-center">Loading...</div>;
  if (!course) return <div className="min-h-[50vh] flex items-center justify-center">Course not found</div>;

  const contentIsFullHtml = !!course.contentBody && isFullHtmlDocument(course.contentBody);

  return (
    <div className="container mx-auto px-4 py-12 md:py-24">
      <Link
        href="/courses"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 gap-2 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Courses
      </Link>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            Educational Resource
          </div>
          <h1 className="text-4xl md:text-5xl font-serif mb-6 text-foreground">{course.name}</h1>
          <div
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto prose prose-neutral [&_h2]:font-serif [&_h2]:text-2xl [&_h3]:font-serif [&_h3]:text-xl [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1"
            dangerouslySetInnerHTML={{ __html: course.description }}
          />
        </div>

        {!course.isEnrolled ? (
          <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
            <div className="aspect-video relative bg-muted group cursor-pointer" onClick={handleEnroll}>
              <AppImage
                src={course.imageUrl || undefined}
                fallbackType="course"
                alt={course.name}
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                <div className="w-20 h-20 rounded-full bg-background/90 text-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Lock size={32} />
                </div>
              </div>
            </div>
            <div className="p-8 text-center max-w-lg mx-auto">
              <ShieldCheck size={32} className="text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-serif mb-2">Member-Only Content</h3>
              <p className="text-muted-foreground mb-8">
                This educational resource is available for free to all Ruth Health members. Create an account or sign in to start learning.
              </p>
              <Button
                onClick={handleEnroll}
                disabled={enrollMutation.isPending}
                className="h-14 px-8 text-lg w-full sm:w-auto"
              >
                {enrollMutation.isPending ? "Enrolling..." : "Access Free Course"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Video */}
            {course.contentUrl && (
              <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-lg border border-border">
                {course.contentUrl.includes("youtube") || course.contentUrl.includes("vimeo") ? (
                  <iframe src={course.contentUrl} className="w-full h-full" allowFullScreen />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-muted relative">
                    <AppImage src={course.imageUrl || undefined} fallbackType="course" className="absolute inset-0 opacity-20" />
                    <PlayCircle size={64} className="text-primary mb-4 z-10" />
                    <a href={course.contentUrl} target="_blank" rel="noreferrer" className="z-10 text-primary hover:underline font-medium">
                      Open Resource Link
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Course content body */}
            {course.contentBody && (
              contentIsFullHtml ? (
                <div className="-mx-4 sm:-mx-6 md:-mx-8 lg:-mx-16 xl:-mx-24 rounded-2xl overflow-hidden shadow-sm border border-border">
                  <div className="flex items-center gap-2 px-6 py-4 border-b bg-card">
                    <CheckCircle2 size={20} className="text-primary" />
                    <span className="font-medium text-sm">You are enrolled in this course</span>
                  </div>
                  <iframe
                    srcDoc={injectIframeStyles(course.contentBody)}
                    title={course.name}
                    className="w-full border-0 block"
                    style={{ minHeight: "90vh" }}
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
                    onLoad={(e) => {
                      try {
                        const iframe = e.currentTarget;
                        const doc = iframe.contentDocument || iframe.contentWindow?.document;
                        if (doc) {
                          const height = doc.documentElement.scrollHeight;
                          if (height > 0) iframe.style.height = height + "px";
                        }
                      } catch {
                        // cross-origin fallback — min-height keeps it usable
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="bg-card border rounded-2xl p-8 md:p-12 shadow-sm">
                  <div className="flex items-center gap-2 mb-8 pb-8 border-b">
                    <CheckCircle2 size={24} className="text-primary" />
                    <span className="font-medium">You are enrolled in this course</span>
                  </div>
                  <div className="prose prose-lg prose-neutral max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: course.contentBody }} />
                  </div>
                </div>
              )
            )}

            {!course.contentBody && (
              <div className="bg-card border rounded-2xl p-8 md:p-12 shadow-sm">
                <div className="flex items-center gap-2 mb-8 pb-8 border-b">
                  <CheckCircle2 size={24} className="text-primary" />
                  <span className="font-medium">You are enrolled in this course</span>
                </div>
                <p className="text-muted-foreground italic">No additional reading material provided for this course.</p>
              </div>
            )}

            {/* Quiz section */}
            <div className="bg-card border rounded-2xl p-8 md:p-12 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen size={24} className="text-primary" />
                <h2 className="text-2xl font-serif">Knowledge Check</h2>
                {hasPassed && (
                  <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-medium px-3 py-1">
                    <Trophy size={12} /> Passed
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mb-8">
                Answer all questions and score at least 70% to pass and unlock the next course.
              </p>

              {!showQuiz && !hasPassed ? (
                <Button onClick={() => setShowQuiz(true)} className="gap-2">
                  <BookOpen size={16} /> Start Quiz
                </Button>
              ) : (
                <CourseQuiz
                  courseId={id}
                  onPass={() => {
                    setQuizPassed(true);
                    toast({ title: "Quiz passed!", description: "You can now proceed to the next course." });
                  }}
                />
              )}
            </div>

            {/* Next Course button */}
            {hasPassed && nextCourse && (
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <p className="text-sm text-primary font-medium mb-1">Up next</p>
                  <h3 className="text-xl font-serif">{nextCourse.name}</h3>
                </div>
                <Link href={`/courses/${nextCourse.id}`}>
                  <Button className="gap-2 h-12 px-6 shrink-0">
                    Next Course <ChevronRight size={18} />
                  </Button>
                </Link>
              </div>
            )}

            {hasPassed && !nextCourse && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-2xl p-8 text-center animate-in fade-in duration-500">
                <Trophy size={40} className="text-green-600 mx-auto mb-3" />
                <h3 className="text-xl font-serif mb-1">You've completed all courses!</h3>
                <p className="text-muted-foreground">Congratulations on finishing the full curriculum.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
