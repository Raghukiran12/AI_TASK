import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Task, insertTaskSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getPriorityRecommendation } from "@/lib/openai";
import { Loader2, Plus } from "lucide-react";

export default function TaskList() {
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const form = useForm({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: 1,
      dueDate: null,
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/tasks", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setShowNewTaskDialog(false);
      form.reset();
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      const res = await apiRequest("PATCH", `/api/tasks/${id}`, { completed });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const onSubmit = async (data: any) => {
    try {
      const recommendation = await getPriorityRecommendation(data.description);
      data.priority = recommendation.priority;
      createTaskMutation.mutate(data);
    } catch (error) {
      console.error("Failed to get priority recommendation:", error);
      createTaskMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">My Tasks</h2>
        <Dialog open={showNewTaskDialog} onOpenChange={setShowNewTaskDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" {...form.register("title")} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  className="min-h-[100px]"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createTaskMutation.isPending}
              >
                {createTaskMutation.isPending ? "Creating..." : "Create Task"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {tasks?.map((task) => (
          <Card key={task.id}>
            <CardHeader className="py-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={(checked) =>
                      toggleTaskMutation.mutate({
                        id: task.id,
                        completed: !!checked,
                      })
                    }
                  />
                  <div>
                    <CardTitle
                      className={`text-lg ${
                        task.completed ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {task.title}
                    </CardTitle>
                    {task.description && (
                      <CardDescription className="mt-1">
                        {task.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTaskMutation.mutate(task.id)}
                  disabled={deleteTaskMutation.isPending}
                >
                  Delete
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
