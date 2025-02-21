import { useState } from "react";
import { Task } from "@shared/schema";
import TaskList from "@/components/task-list";
import AiChat from "@/components/ai-chat";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { MessageSquare } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Dashboard() {
  const { user, logoutMutation } = useAuth();
  const [showAiChat, setShowAiChat] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <span className="text-sm text-muted-foreground">
              Welcome back, {user?.username}
            </span>
          </div>
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
        <TaskList />
      </main>
    </div>
  );
}
