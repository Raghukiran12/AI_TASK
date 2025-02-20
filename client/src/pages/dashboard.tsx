
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TaskList from "@/components/task-list";
import AiChat from "@/components/ai-chat";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { MessageSquare } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Dashboard() {
  const { user, logoutMutation } = useAuth();
  const { data: tasks } = useQuery({ queryKey: ["/api/tasks"] });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <AiChat />
              </SheetContent>
            </Sheet>
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Tasks</CardTitle>
              <CardDescription>{tasks?.length || 0}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Due Today</CardTitle>
              <CardDescription>
                {tasks?.filter(t => {
                  const today = new Date();
                  const dueDate = new Date(t.dueDate);
                  return dueDate.toDateString() === today.toDateString();
                }).length || 0}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">In Progress</CardTitle>
              <CardDescription>
                {tasks?.filter(t => t.status === "in_progress").length || 0}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Completed</CardTitle>
              <CardDescription>
                {tasks?.filter(t => t.status === "completed").length || 0}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
        <TaskList />
      </main>
    </div>
  );
}
