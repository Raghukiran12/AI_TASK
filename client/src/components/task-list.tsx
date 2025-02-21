import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Task, insertTaskSchema, taskStatusEnum, taskPriorityEnum } from "@shared/schema";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getPriorityRecommendation, getTaskSuggestions } from "@/lib/openai";
import { Loader2, Plus, MessageCircle, Bell, Edit, Trash, ListChecks, Clock, Timer, CheckCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import AiChat from "@/components/ai-chat"; // Fixed import path


type AlertDialogState = {
  show: boolean;
  taskId: number | null;
};

type AIAssistantDialogState = {
  show: boolean;
  taskId: number | null;
  suggestions: string[];
  steps: string[];
  estimatedTime: string;
};

export default function TaskList() {
  const { toast } = useToast();
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [alertDialog, setAlertDialog] = useState<AlertDialogState>({
    show: false,
    taskId: null,
  });
  const [aiAssistantDialog, setAIAssistantDialog] = useState<AIAssistantDialogState>({
    show: false,
    taskId: null,
    suggestions: [],
    steps: [],
    estimatedTime: "",
  });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [alertType, setAlertType] = useState<"minutes" | "hours" | "days">("minutes");
  const [alertValue, setAlertValue] = useState<string>("");

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const form = useForm({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      dueDate: null,
      dueTime: null,
      alertBefore: null,
    },
  });

  const editForm = useForm({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      dueDate: null,
      dueTime: null,
      alertBefore: null,
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

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<Task>) => {
      const res = await apiRequest("PATCH", `/api/tasks/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setShowEditDialog(false);
      setSelectedTask(null);
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
      const formattedData = {
        ...data,
        dueDate: data.dueDate || null,
        dueTime: data.dueTime || null,
        alertBefore: data.alertBefore ? parseInt(data.alertBefore) : null,
      };

      try {
        const recommendation = await getPriorityRecommendation(data.description);
        formattedData.priority = recommendation.priority || formattedData.priority;
      } catch (error) {
        console.error("Failed to get priority recommendation:", error);
      }

      createTaskMutation.mutate(formattedData);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const onEdit = async (data: any) => {
    if (!selectedTask) return;
    try {
      const formattedData = {
        ...data,
        id: selectedTask.id,
        dueDate: data.dueDate || null,
        dueTime: data.dueTime || null,
        alertBefore: data.alertBefore ? parseInt(data.alertBefore) : null,
      };
      updateTaskMutation.mutate(formattedData);
    } catch (error) {
      console.error("Edit submission error:", error);
    }
  };

  const handleSetAlert = () => {
    if (!alertDialog.taskId || !alertValue) return;

    let minutes = parseInt(alertValue);
    switch (alertType) {
      case "hours":
        minutes *= 60;
        break;
      case "days":
        minutes *= 1440; // 24 * 60
        break;
    }

    updateTaskMutation.mutate({
      id: alertDialog.taskId,
      alertBefore: minutes,
    }, {
      onSuccess: () => {
        toast({
          title: "Alert set successfully",
          description: `You will be reminded ${alertValue} ${alertType} before the task is due.`,
        });
        setAlertDialog({ show: false, taskId: null });
        setAlertValue("");
      }
    });
  };

  const formatAlertTime = (minutes: number) => {
    if (minutes >= 1440) {
      const days = Math.floor(minutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} before`;
    } else if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} before`;
    }
    return `${minutes} minute${minutes > 1 ? 's' : ''} before`;
  };

  const checkAndShowReminder = (task: Task) => {
    if (!task.dueDate || !task.alertBefore || !task.dueTime) return;

    const dueDate = new Date(task.dueDate);
    const [hours, minutes] = task.dueTime.toString().split(':');
    dueDate.setHours(parseInt(hours), parseInt(minutes));

    const alertTime = new Date(dueDate.getTime() - task.alertBefore * 60 * 1000);
    const now = new Date();

    if (Math.abs(alertTime.getTime() - now.getTime()) < 60000) { // Within 1 minute
      toast({
        title: "Task Reminder",
        description: `Reminder: ${task.title} is due ${task.dueTime ? 'at ' + task.dueTime : 'today'}`,
      });
    }
  };

  useEffect(() => {
    if (!tasks) return;

    const interval = setInterval(() => {
      tasks.forEach(checkAndShowReminder);
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [tasks]);

  const handleGetAIAssistance = async (task: Task) => {
    try {
      const response = await getTaskSuggestions(
        `Task: ${task.title}\nDescription: ${task.description || ""}`
      );
      setSelectedTask(task); 
      setAIAssistantDialog({
        show: true,
        taskId: task.id,
        ...response,
      });
    } catch (error) {
      console.error("Failed to get AI assistance:", error);
    }
  };

  const getTaskStats = () => {
    if (!tasks) return { total: 0, dueToday: 0, inProgress: 0, completed: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueToday = tasks.filter(task => {
      if (!task.dueDate || task.completed) return false;
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() === today.getTime();
    }).length;

    const inProgress = tasks.filter(task => 
      task.status === "in_progress" && !task.completed
    ).length;

    const completed = tasks.filter(task => 
      task.completed || task.status === "completed"
    ).length;

    return {
      total: tasks.length,
      dueToday,
      inProgress,
      completed
    };
  };

  const stats = getTaskStats();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <ListChecks className="h-5 w-5 text-gray-600" />
            </div>
            <CardDescription className="text-2xl font-bold">{stats.total}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Due Today</CardTitle>
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <CardDescription className="text-2xl font-bold text-yellow-600">{stats.dueToday}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Timer className="h-5 w-5 text-blue-600" />
            </div>
            <CardDescription className="text-2xl font-bold text-blue-600">{stats.inProgress}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <CardDescription className="text-2xl font-bold text-green-600">{stats.completed}</CardDescription>
          </CardHeader>
        </Card>
      </div>

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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    onValueChange={(value) => form.setValue("status", value)}
                    defaultValue={form.getValues("status")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {taskStatusEnum.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    onValueChange={(value) => form.setValue("priority", value)}
                    defaultValue={form.getValues("priority")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {taskPriorityEnum.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    {...form.register("dueDate")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueTime">Due Time</Label>
                  <Input
                    id="dueTime"
                    type="time"
                    {...form.register("dueTime")}
                  />
                </div>
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

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input id="edit-title" {...editForm.register("title")} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                {...editForm.register("description")}
                className="min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  onValueChange={(value) => editForm.setValue("status", value)}
                  defaultValue={editForm.getValues("status")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskStatusEnum.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <Select
                  onValueChange={(value) => editForm.setValue("priority", value)}
                  defaultValue={editForm.getValues("priority")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskPriorityEnum.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-dueDate">Due Date</Label>
                <Input
                  id="edit-dueDate"
                  type="date"
                  {...editForm.register("dueDate")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dueTime">Due Time</Label>
                <Input
                  id="edit-dueTime"
                  type="time"
                  {...editForm.register("dueTime")}
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={updateTaskMutation.isPending}
            >
              {updateTaskMutation.isPending ? "Updating..." : "Update Task"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog */}
      <AlertDialog open={alertDialog.show} onOpenChange={(open) => setAlertDialog({ show: open, taskId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set Alert</AlertDialogTitle>
            <AlertDialogDescription>
              Choose when you want to be alerted before the task is due.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                min="1"
                placeholder="Enter time"
                value={alertValue}
                onChange={(e) => setAlertValue(e.target.value)}
              />
              <Select onValueChange={(value: any) => setAlertType(value)} defaultValue={alertType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSetAlert}>Set Alert</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AI Assistant Dialog */}
      <Dialog
        open={aiAssistantDialog.show}
        onOpenChange={(open) => setAIAssistantDialog(prev => ({ ...prev, show: open }))}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>AI Task Assistant</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <AiChat
              taskTitle={selectedTask.title}
              taskDescription={selectedTask.description || ""}
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {tasks?.map((task) => (
          <Card key={task.id}>
            <CardHeader className="py-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={(checked) =>
                      updateTaskMutation.mutate({
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
                    <div className="flex gap-2 mt-2">
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        task.priority === "high"
                          ? "bg-red-100 text-red-800"
                          : task.priority === "medium"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </span>
                      <span className="text-sm px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                        {task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('_', ' ')}
                      </span>
                      {task.alertBefore && (
                        <span className="text-sm px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                          Alert: {formatAlertTime(task.alertBefore)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setAlertDialog({ show: true, taskId: task.id });
                    }}
                  >
                    <Bell className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setSelectedTask(task);
                      setAIAssistantDialog(prev => ({
                        ...prev,
                        show: true,
                        taskId: task.id
                      }));
                    }}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setSelectedTask(task);
                      editForm.reset({
                        title: task.title,
                        description: task.description || "",
                        status: task.status,
                        priority: task.priority,
                        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : null,
                        dueTime: task.dueTime || null,
                        alertBefore: task.alertBefore || null,
                      });
                      setShowEditDialog(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => deleteTaskMutation.mutate(task.id)}
                    disabled={deleteTaskMutation.isPending}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}