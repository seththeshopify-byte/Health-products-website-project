import { Link } from "wouter";
import { useListCourses, getListCoursesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppImage } from "@/components/ui/app-image";
import { PlayCircle, Lock } from "lucide-react";

export default function Courses() {
  const { data: courses, isLoading } = useListCourses({ query: { queryKey: getListCoursesQueryKey() } });

  return (
    <div className="container mx-auto px-4 py-12 md:py-24">
      <div className="mb-12 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-serif mb-4">Educational Resources</h1>
        <p className="text-xl text-muted-foreground">
          Empower yourself with evidence-based knowledge. Our free courses are designed to help you take control of your long-term health.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex flex-col gap-4">
              <div className="bg-muted aspect-video rounded-xl" />
              <div className="h-6 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses?.map(course => (
            <Link key={course.id} href={`/courses/${course.id}`} className="group block h-full">
              <Card className="h-full border-transparent shadow-none hover:shadow-lg transition-all duration-300 overflow-hidden bg-card border-border">
                <div className="aspect-video bg-muted w-full overflow-hidden relative">
                  <AppImage 
                    src={course.imageUrl || undefined} 
                    fallbackType="course"
                    alt={course.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                    <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">Free Course</Badge>
                    <div className="w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-sm">
                      {course.isEnrolled ? <PlayCircle size={20} /> : <Lock size={18} />}
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="font-serif text-xl mb-3 group-hover:text-primary transition-colors">{course.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
