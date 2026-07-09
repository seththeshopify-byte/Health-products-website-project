import { useRoute, useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { AppImage } from "@/components/ui/app-image";
import { ArrowLeft, PlayCircle, ShieldCheck, Lock, CheckCircle2 } from "lucide-react";
import { useGetCourse, getGetCourseQueryKey, useEnrollCourse } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function CourseDetail() {
  const [, params] = useRoute("/courses/:id");
  const id = parseInt(params?.id || "0", 10);
  const { isLoggedIn } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: course, isLoading } = useGetCourse(id, { 
    query: { enabled: !!id, queryKey: getGetCourseQueryKey(id) } 
  });
  
  const enrollMutation = useEnrollCourse();

  const handleEnroll = () => {
    if (!isLoggedIn) {
      toast({ title: "Sign in required", description: "Please sign in to access this course." });
      setLocation("/login");
      return;
    }

    enrollMutation.mutate({ data: { courseId: id } }, {
      onSuccess: () => {
        toast({ title: "Successfully enrolled", description: "You now have access to this course material." });
        queryClient.invalidateQueries({ queryKey: getGetCourseQueryKey(id) });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.error || "Failed to enroll in course", variant: "destructive" });
      }
    });
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            Educational Resource
          </div>
          <h1 className="text-4xl md:text-5xl font-serif mb-6 text-foreground">{course.name}</h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {course.description}
          </p>
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
            {course.contentUrl && (
              <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-lg border border-border">
                {/* Simulated video player wrapper if it's a URL, or an iframe if it's a youtube embed */}
                {course.contentUrl.includes('youtube') || course.contentUrl.includes('vimeo') ? (
                  <iframe 
                    src={course.contentUrl} 
                    className="w-full h-full"
                    allowFullScreen
                  />
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
            
            <div className="bg-card border rounded-2xl p-8 md:p-12 shadow-sm">
              <div className="flex items-center gap-2 mb-8 pb-8 border-b">
                <CheckCircle2 size={24} className="text-primary" />
                <span className="font-medium">You are enrolled in this course</span>
              </div>
              
              <div className="prose prose-lg prose-neutral max-w-none">
                {course.contentBody ? (
                  <div dangerouslySetInnerHTML={{ __html: course.contentBody }} />
                ) : (
                  <p className="text-muted-foreground italic">No additional reading material provided for this course.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
