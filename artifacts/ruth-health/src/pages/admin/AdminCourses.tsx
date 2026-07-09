import { useState } from "react";
import { useListCourses, getListCoursesQueryKey, useCreateCourse, useUpdateCourse, useDeleteCourse } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Image as ImageIcon } from "lucide-react";

export default function AdminCourses() {
  const { data: courses, isLoading } = useListCourses({ query: { queryKey: getListCoursesQueryKey() } });
  const createMutation = useCreateCourse();
  const updateMutation = useUpdateCourse();
  const deleteMutation = useDeleteCourse();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    contentUrl: "",
    contentBody: "",
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ name: "", description: "", imageUrl: "", contentUrl: "", contentBody: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (course: any) => {
    setEditingId(course.id);
    setFormData({
      name: course.name,
      description: course.description,
      imageUrl: course.imageUrl || "",
      contentUrl: course.contentUrl || "",
      contentBody: course.contentBody || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey() });
        toast({ title: "Course deleted" });
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      imageUrl: formData.imageUrl || null,
      contentUrl: formData.contentUrl || null,
      contentBody: formData.contentBody || null,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: dataToSubmit }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey() });
          setIsModalOpen(false);
          toast({ title: "Course updated" });
        }
      });
    } else {
      createMutation.mutate({ data: dataToSubmit }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey() });
          setIsModalOpen(false);
          toast({ title: "Course created" });
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif mb-1">Courses</h1>
          <p className="text-muted-foreground">Manage educational content and materials.</p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus size={16} /> Add Course
        </Button>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Resource URL</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : courses?.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No courses found</TableCell></TableRow>
            ) : (
              courses?.map(course => (
                <TableRow key={course.id}>
                  <TableCell>
                    {course.imageUrl ? (
                      <div className="w-10 h-10 rounded bg-muted overflow-hidden">
                        <img src={course.imageUrl} alt={course.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-muted-foreground">
                        <ImageIcon size={16} />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{course.name}</div>
                    <div className="text-sm text-muted-foreground line-clamp-1">{course.description}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {course.contentUrl || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(course)}>
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
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Course" : "Add Course"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Course Title</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Short Description</Label>
                <Textarea id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="imageUrl">Cover Image URL</Label>
                <Input id="imageUrl" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://..." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contentUrl">Video / External Resource URL</Label>
                <Input id="contentUrl" value={formData.contentUrl} onChange={e => setFormData({...formData, contentUrl: e.target.value})} placeholder="https://youtube.com/..." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contentBody">Detailed Content (HTML allowed)</Label>
                <Textarea 
                  id="contentBody" 
                  value={formData.contentBody} 
                  onChange={e => setFormData({...formData, contentBody: e.target.value})} 
                  className="min-h-[150px] font-mono text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
